-- ==========================================================
-- Village Management System: Migration V2
-- ระบบอนุมัติผู้ใช้โดย Super Admin + 18 หมู่บ้าน + เบอร์โทร
-- รันโค้ดนี้ใน Supabase SQL Editor ได้ทันที
-- ==========================================================

-- 1. เพิ่มคอลัมน์ status, village_name, phone ในตาราง profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS village_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- เพิ่ม Constraint ตรวจสอบสถานะ (pending, approved, rejected)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_status_check 
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 2. ปรับให้ผู้ใช้เดิมทั้งหมดในระบบมีสถานะ 'approved' (อนุมัติแล้ว) เพื่อไม่ให้กระทบผู้ใช้เดิม
UPDATE public.profiles
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

-- 3. ฟังก์ชัน Helper ตรวจสอบว่าผู้ใช้ปัจจุบันเป็น Super Admin หรือไม่ (Security Definer ป้องกัน RLS Recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. ปรับปรุง Trigger handle_new_user() สำหรับสมาชิกใหม่
-- - ผู้ใช้คนแรกของระบบ = super_admin และ approved อัตโนมัติ
-- - ผู้ใช้คนถัดไป = role 'user' และ status 'pending' (รอแอดมินอนุมัติ)
-- - ดึง village_name และ phone จาก metadata ที่ส่งมาจากหน้าลงทะเบียน
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- ตรวจสอบว่ามีผู้ใช้ใน profiles แล้วหรือยัง
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    village_name,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN is_first_user THEN 'super_admin'
      ELSE 'user'
    END,
    CASE
      WHEN is_first_user THEN 'approved'
      ELSE 'pending'
    END,
    COALESCE(NEW.raw_user_meta_data->>'village_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Trigger สำหรับ Auto-confirm Email อัตโนมัติในระดับ Database
-- (ช่วยปิดระบบยืนยันทางอีเมล เพื่อให้ผู้ใช้สามารถล็อกอินรอแอดมินอนุมัติได้ทันทีโดยไม่ต้องรอกดลิงก์ในเมล)
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user_email();

-- 6. ตรวจสอบและอัปเดต RLS Policies สำหรับตาราง profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- ผู้ใช้ที่ล็อกอินแล้วสามารถดูโปรไฟล์ได้ (เพื่อการแสดงผลในระบบ)
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- ผู้ใช้สามารถอัปเดตโปรไฟล์ของตนเองได้
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Super Admin สามารถอัปเดตโปรไฟล์ของใครก็ได้ (รวมถึงการอนุมัติ status และแก้ไข village_name)
CREATE POLICY "Super admin can update any profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- อนุญาตให้ Super Admin ลบผู้ใช้ที่ปฏิเสธหรือไม่ต้องการได้
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (public.is_super_admin());

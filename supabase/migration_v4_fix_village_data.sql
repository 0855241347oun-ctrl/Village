-- ============================================
-- Fix Village Separation (Remove NULL loop-hole)
-- ============================================

-- 1. อัปเดตข้อมูลเก่าทั้งหมดที่ไม่มีหมู่บ้าน (NULL) ให้ไปอยู่ "หมู่ที่ 1 บ้านบัว" เป็นค่าเริ่มต้น
-- (หรือถ้าเป็นข้อมูลทดสอบ สามารถลบทิ้งได้ แต่เพื่อความปลอดภัยเราจะจับยัดเข้าหมู่ 1 ก่อน)
UPDATE zones SET village_name = 'หมู่ที่ 1 บ้านบัว' WHERE village_name IS NULL;
UPDATE houses SET village_name = 'หมู่ที่ 1 บ้านบัว' WHERE village_name IS NULL;
UPDATE residents SET village_name = 'หมู่ที่ 1 บ้านบัว' WHERE village_name IS NULL;

-- 2. บังคับให้คอลัมน์ village_name ห้ามเป็น NULL อีกต่อไปในอนาคต (ข้อมูลใหม่ต้องมีหมู่บ้านเสมอ)
ALTER TABLE zones ALTER COLUMN village_name SET NOT NULL;
ALTER TABLE houses ALTER COLUMN village_name SET NOT NULL;
ALTER TABLE residents ALTER COLUMN village_name SET NOT NULL;

-- 3. อัปเดต RLS Policies ใหม่ (ลบเงื่อนไข OR village_name IS NULL ออก เพื่อป้องกันไม่ให้ข้อมูลเก่าหลุดไปแสดง)

-- Drop policies เดิม
DROP POLICY IF EXISTS "Users view zones in their village" ON zones;
DROP POLICY IF EXISTS "Users view houses in their village" ON houses;
DROP POLICY IF EXISTS "Users view residents in their village" ON residents;

-- Create policies ใหม่ที่เข้มงวดขึ้น
CREATE POLICY "Users view zones in their village" ON zones 
  FOR SELECT TO authenticated 
  USING (is_same_village(village_name));

CREATE POLICY "Users view houses in their village" ON houses 
  FOR SELECT TO authenticated 
  USING (is_same_village(village_name));

CREATE POLICY "Users view residents in their village" ON residents 
  FOR SELECT TO authenticated 
  USING (is_same_village(village_name));

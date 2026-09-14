-- ============================================
-- Village Resident Management System
-- Supabase Migration Script
-- ============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  village_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Zones table
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Houses table
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  house_number TEXT NOT NULL,
  address_detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(zone_id, house_number)
);

-- 4. Residents table
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  id_card TEXT,
  date_of_birth DATE,
  education TEXT,
  marital_status TEXT,
  phone TEXT,
  notes TEXT,
  is_head_of_house BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Super admin can update any profile" ON profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Enable insert for auth trigger" ON profiles FOR INSERT WITH CHECK (true);

-- Zones policies
CREATE POLICY "Anyone authenticated can view zones" ON zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin can insert zones" ON zones FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Super admin can update zones" ON zones FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Super admin can delete zones" ON zones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Houses policies
CREATE POLICY "Anyone authenticated can view houses" ON houses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert houses" ON houses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update houses" ON houses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete houses" ON houses FOR DELETE TO authenticated USING (true);

-- Residents policies
CREATE POLICY "Anyone authenticated can view residents" ON residents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert residents" ON residents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update residents" ON residents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete residents" ON residents FOR DELETE TO authenticated USING (true);

-- ============================================
-- Trigger: auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Trigger: auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS residents_updated_at ON residents;
CREATE TRIGGER residents_updated_at
  BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Seed Data: Default Zones
-- ============================================

INSERT INTO zones (name, description) VALUES
  ('โซน A', 'โซน A - ทิศเหนือ'),
  ('โซน B', 'โซน B - ทิศตะวันออก'),
  ('โซน C', 'โซน C - ทิศใต้'),
  ('โซน D', 'โซน D - ทิศตะวันตก')
ON CONFLICT (name) DO NOTHING;

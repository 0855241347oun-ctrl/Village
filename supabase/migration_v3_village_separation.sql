-- ============================================
-- Village Separation (Multi-tenancy) Migration
-- ============================================

-- 1. Add village_name column to existing tables
ALTER TABLE zones ADD COLUMN IF NOT EXISTS village_name TEXT;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS village_name TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS village_name TEXT;

-- 2. Create trigger function to automatically set village_name on insert
CREATE OR REPLACE FUNCTION public.set_village_name_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_village_name TEXT;
BEGIN
  -- Get the village_name of the user making the insert
  SELECT village_name INTO v_village_name FROM profiles WHERE id = auth.uid();
  
  -- Set the village_name on the new row
  IF NEW.village_name IS NULL THEN
    NEW.village_name := v_village_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply triggers to tables
DROP TRIGGER IF EXISTS tr_zones_village_name ON zones;
CREATE TRIGGER tr_zones_village_name 
  BEFORE INSERT ON zones 
  FOR EACH ROW EXECUTE FUNCTION public.set_village_name_on_insert();

DROP TRIGGER IF EXISTS tr_houses_village_name ON houses;
CREATE TRIGGER tr_houses_village_name 
  BEFORE INSERT ON houses 
  FOR EACH ROW EXECUTE FUNCTION public.set_village_name_on_insert();

DROP TRIGGER IF EXISTS tr_residents_village_name ON residents;
CREATE TRIGGER tr_residents_village_name 
  BEFORE INSERT ON residents 
  FOR EACH ROW EXECUTE FUNCTION public.set_village_name_on_insert();

-- 4. Helper function to check if user has access to a village
CREATE OR REPLACE FUNCTION public.is_same_village(target_village TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND village_name = target_village
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Row Level Security Policies
-- Drop old policies first
DROP POLICY IF EXISTS "Anyone authenticated can view zones" ON zones;
DROP POLICY IF EXISTS "Super admin can insert zones" ON zones;
DROP POLICY IF EXISTS "Super admin can update zones" ON zones;
DROP POLICY IF EXISTS "Super admin can delete zones" ON zones;

DROP POLICY IF EXISTS "Anyone authenticated can view houses" ON houses;
DROP POLICY IF EXISTS "Authenticated users can insert houses" ON houses;
DROP POLICY IF EXISTS "Authenticated users can update houses" ON houses;
DROP POLICY IF EXISTS "Authenticated users can delete houses" ON houses;

DROP POLICY IF EXISTS "Anyone authenticated can view residents" ON residents;
DROP POLICY IF EXISTS "Authenticated users can insert residents" ON residents;
DROP POLICY IF EXISTS "Authenticated users can update residents" ON residents;
DROP POLICY IF EXISTS "Authenticated users can delete residents" ON residents;

-- Create new policies for zones (restricted by village_name)
CREATE POLICY "Users view zones in their village" ON zones 
  FOR SELECT TO authenticated 
  USING (is_same_village(village_name) OR village_name IS NULL);

CREATE POLICY "Super admin insert zones" ON zones 
  FOR INSERT TO authenticated 
  WITH CHECK (is_super_admin() AND is_same_village(village_name));

CREATE POLICY "Super admin update zones" ON zones 
  FOR UPDATE TO authenticated 
  USING (is_super_admin() AND is_same_village(village_name));

CREATE POLICY "Super admin delete zones" ON zones 
  FOR DELETE TO authenticated 
  USING (is_super_admin() AND is_same_village(village_name));

-- Create new policies for houses (restricted by village_name)
CREATE POLICY "Users view houses in their village" ON houses 
  FOR SELECT TO authenticated 
  USING (is_same_village(village_name) OR village_name IS NULL);

CREATE POLICY "Users insert houses" ON houses 
  FOR INSERT TO authenticated 
  WITH CHECK (is_same_village(village_name));

CREATE POLICY "Users update houses" ON houses 
  FOR UPDATE TO authenticated 
  USING (is_same_village(village_name));

CREATE POLICY "Users delete houses" ON houses 
  FOR DELETE TO authenticated 
  USING (is_same_village(village_name));

-- Create new policies for residents (restricted by village_name)
CREATE POLICY "Users view residents in their village" ON residents 
  FOR SELECT TO authenticated 
  USING (is_same_village(village_name) OR village_name IS NULL);

CREATE POLICY "Users insert residents" ON residents 
  FOR INSERT TO authenticated 
  WITH CHECK (is_same_village(village_name));

CREATE POLICY "Users update residents" ON residents 
  FOR UPDATE TO authenticated 
  USING (is_same_village(village_name));

CREATE POLICY "Users delete residents" ON residents 
  FOR DELETE TO authenticated 
  USING (is_same_village(village_name));

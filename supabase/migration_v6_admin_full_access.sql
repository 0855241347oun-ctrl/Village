-- ============================================
-- V6: Admin Full Access (Bypass Village Check)
-- ============================================

-- Drop old policies that restricted everyone to their own village
DROP POLICY IF EXISTS "Users view zones in their village" ON zones;
DROP POLICY IF EXISTS "Users insert zones" ON zones;
DROP POLICY IF EXISTS "Users update zones" ON zones;
DROP POLICY IF EXISTS "Users delete zones" ON zones;

DROP POLICY IF EXISTS "Users view houses in their village" ON houses;
DROP POLICY IF EXISTS "Users insert houses" ON houses;
DROP POLICY IF EXISTS "Users update houses" ON houses;
DROP POLICY IF EXISTS "Users delete houses" ON houses;

DROP POLICY IF EXISTS "Users view residents in their village" ON residents;
DROP POLICY IF EXISTS "Users insert residents" ON residents;
DROP POLICY IF EXISTS "Users update residents" ON residents;
DROP POLICY IF EXISTS "Users delete residents" ON residents;

-- --------------------------------------------------------
-- Create new policies allowing super_admin to bypass checks
-- --------------------------------------------------------

-- ZONES
CREATE POLICY "Zones SELECT Policy" ON zones 
  FOR SELECT TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Zones INSERT Policy" ON zones 
  FOR INSERT TO authenticated 
  WITH CHECK (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Zones UPDATE Policy" ON zones 
  FOR UPDATE TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Zones DELETE Policy" ON zones 
  FOR DELETE TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

-- HOUSES
CREATE POLICY "Houses SELECT Policy" ON houses 
  FOR SELECT TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Houses INSERT Policy" ON houses 
  FOR INSERT TO authenticated 
  WITH CHECK (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Houses UPDATE Policy" ON houses 
  FOR UPDATE TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Houses DELETE Policy" ON houses 
  FOR DELETE TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

-- RESIDENTS
CREATE POLICY "Residents SELECT Policy" ON residents 
  FOR SELECT TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Residents INSERT Policy" ON residents 
  FOR INSERT TO authenticated 
  WITH CHECK (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Residents UPDATE Policy" ON residents 
  FOR UPDATE TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

CREATE POLICY "Residents DELETE Policy" ON residents 
  FOR DELETE TO authenticated 
  USING (is_super_admin() OR is_same_village(village_name));

-- ============================================
-- Fix Zone Permissions (Allow Users to Manage Zones)
-- ============================================

-- Drop old zones policies which restricted inserts/updates to super_admin only
DROP POLICY IF EXISTS "Super admin insert zones" ON zones;
DROP POLICY IF EXISTS "Super admin update zones" ON zones;
DROP POLICY IF EXISTS "Super admin delete zones" ON zones;

-- Create new policies for zones allowing regular users to manage zones in their village
CREATE POLICY "Users insert zones" ON zones 
  FOR INSERT TO authenticated 
  WITH CHECK (is_same_village(village_name));

CREATE POLICY "Users update zones" ON zones 
  FOR UPDATE TO authenticated 
  USING (is_same_village(village_name));

CREATE POLICY "Users delete zones" ON zones 
  FOR DELETE TO authenticated 
  USING (is_same_village(village_name));

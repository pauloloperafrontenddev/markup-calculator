-- Drop ALL recursive policies that query user_profiles from within user_profiles RLS,
-- and replace them with the is_super_user() SECURITY DEFINER function.

-- ── user_profiles ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_users_manage_all"  ON user_profiles;
DROP POLICY IF EXISTS "super_users_read_all"    ON user_profiles;
DROP POLICY IF EXISTS "super_user_all"          ON user_profiles;
DROP POLICY IF EXISTS "read_own_profile"        ON user_profiles;
DROP POLICY IF EXISTS "users_read_own"          ON user_profiles;

CREATE POLICY "read_own"      ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "super_user_all" ON user_profiles FOR ALL TO authenticated
  USING (public.is_super_user());

-- ── quota_override_log ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_users_read"    ON quota_override_log;

CREATE POLICY "super_users_read" ON quota_override_log FOR SELECT TO authenticated
  USING (public.is_super_user());

-- ── global_settings ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_users_write"  ON global_settings;

CREATE POLICY "super_users_write" ON global_settings FOR ALL TO authenticated
  USING (public.is_super_user());

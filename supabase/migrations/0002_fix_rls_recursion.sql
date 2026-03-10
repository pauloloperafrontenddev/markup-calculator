-- Fix infinite recursion in user_profiles RLS policies.
-- The super_user_all policy was querying user_profiles to check the role,
-- which triggered the policy again → infinite recursion.
-- Solution: SECURITY DEFINER function that runs as owner (bypasses RLS).

CREATE OR REPLACE FUNCTION public.is_super_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'super_user'
  );
$$;

-- Drop the recursive policy and replace it
DROP POLICY IF EXISTS "super_user_all" ON user_profiles;

CREATE POLICY "super_user_all" ON user_profiles FOR ALL TO authenticated
  USING (public.is_super_user());

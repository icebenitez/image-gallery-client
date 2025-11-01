-- 002_rls_and_policies.sql
-- Enable RLS and create per-table policies

-- Enable RLS on images
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Select policy: users can SELECT only their own rows
CREATE POLICY images_user_select_policy ON public.images
  FOR SELECT
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

-- Insert policy: users can INSERT only rows where user_id matches their auth.uid()
CREATE POLICY images_user_insert_policy ON public.images
  FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT auth.uid()) = user_id );

-- (Optional) Update policy: allow users to update their own rows
CREATE POLICY images_user_update_policy ON public.images
  FOR UPDATE
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id )
  WITH CHECK ( (SELECT auth.uid()) = user_id );

-- (Optional) Delete policy: allow users to delete their own rows
CREATE POLICY images_user_delete_policy ON public.images
  FOR DELETE
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

-- Enable RLS on image_metadata
ALTER TABLE public.image_metadata ENABLE ROW LEVEL SECURITY;

-- Select policy for image_metadata
CREATE POLICY image_metadata_user_select_policy ON public.image_metadata
  FOR SELECT
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

-- Insert policy for image_metadata
CREATE POLICY image_metadata_user_insert_policy ON public.image_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT auth.uid()) = user_id );

-- Update policy for image_metadata
CREATE POLICY image_metadata_user_update_policy ON public.image_metadata
  FOR UPDATE
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id )
  WITH CHECK ( (SELECT auth.uid()) = user_id );

-- Delete policy for image_metadata
CREATE POLICY image_metadata_user_delete_policy ON public.image_metadata
  FOR DELETE
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

-- Helpful grants: ensure authenticated role has needed privileges on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_metadata TO authenticated;

-- Ensure owners/roles (run as owner) preserve privileges for service_role or admin roles as needed:
GRANT SELECT, INSERT, UPDATE, DELETE ON public.images TO supabase_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_metadata TO supabase_admin;
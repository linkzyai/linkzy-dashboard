
-- Fix RLS policy for placement_opportunities to allow service role inserts
DROP POLICY IF EXISTS "service_role_all_opportunities" ON public.placement_opportunities;
CREATE POLICY "service_role_all_opportunities" ON public.placement_opportunities FOR ALL 
USING (auth.role() = 'service_role');

-- Also allow users to insert their own opportunities  
CREATE POLICY "opportunities_insert_own" ON public.placement_opportunities FOR INSERT 
WITH CHECK (auth.uid() = source_user_id OR auth.uid() = target_user_id);


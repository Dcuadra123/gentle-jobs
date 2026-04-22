
-- Helper: comprobar si el usuario tiene cualquiera de varios roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- BUILDINGS
CREATE POLICY "Encargados insert buildings" ON public.buildings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'encargado'));

CREATE POLICY "Encargados update buildings" ON public.buildings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'encargado'));

-- LOCATIONS
CREATE POLICY "Encargados insert locations" ON public.locations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'encargado'));

CREATE POLICY "Encargados update locations" ON public.locations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'encargado'));

-- WORK_ORDERS: reemplazar policy de update para incluir encargados
DROP POLICY IF EXISTS "Admins update work orders" ON public.work_orders;
CREATE POLICY "Admins or encargados update work orders" ON public.work_orders
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','encargado']::app_role[]));

-- PREVENTIVE_TASKS
DROP POLICY IF EXISTS "Admins update preventive" ON public.preventive_tasks;
CREATE POLICY "Admins or encargados update preventive" ON public.preventive_tasks
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','encargado']::app_role[]));

-- PROFILES: encargados pueden ver todos los perfiles para asignar
CREATE POLICY "Encargados view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'encargado'));

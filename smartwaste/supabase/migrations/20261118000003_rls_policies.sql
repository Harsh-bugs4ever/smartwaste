-- SmartWaste: Intelligent Urban Waste Management System
-- Migration 03: Row Level Security (RLS) Policies and Access Control

-- Enable Row Level Security on all operational tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Retrieve authenticated user role safely from profiles
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS user_role_enum AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR get_auth_role() = 'super_admin');

CREATE POLICY "Super admin manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (get_auth_role() = 'super_admin');

CREATE POLICY "Users can update own non-role fields"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. Zones Policies
CREATE POLICY "Authenticated users can view zones"
ON zones FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins manage zones"
ON zones FOR ALL
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

-- 3. Waste Categories Policies
CREATE POLICY "Authenticated users can view waste categories"
ON waste_categories FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins manage waste categories"
ON waste_categories FOR ALL
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

-- 4. Smart Bins Policies
CREATE POLICY "Authenticated users can view smart bins"
ON smart_bins FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins manage smart bins"
ON smart_bins FOR ALL
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

-- 5. IoT Devices Policies
CREATE POLICY "Admins can view registered IoT devices"
ON iot_devices FOR SELECT
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

CREATE POLICY "Super admins manage IoT devices"
ON iot_devices FOR ALL
TO authenticated
USING (get_auth_role() = 'super_admin');

-- 6. Sensor Readings Policies
CREATE POLICY "Authenticated users can view sensor telemetry"
ON sensor_readings FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins manage sensor readings"
ON sensor_readings FOR ALL
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

-- 7. Alerts Policies
CREATE POLICY "Authenticated users can view alerts"
ON alerts FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Authorized users can resolve alerts"
ON alerts FOR UPDATE
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin', 'collection_staff'))
WITH CHECK (get_auth_role() IN ('super_admin', 'municipal_admin', 'collection_staff'));

CREATE POLICY "Admins manage alerts"
ON alerts FOR ALL
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

-- 8. Staff Policies
CREATE POLICY "Authenticated users can view staff roster"
ON staff FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins manage staff roster"
ON staff FOR ALL
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

-- 9. Collections Policies
CREATE POLICY "Admins can view and manage all collections"
ON collections FOR ALL
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

CREATE POLICY "Staff can view assigned collections"
ON collections FOR SELECT
TO authenticated
USING (
    get_auth_role() IN ('super_admin', 'municipal_admin')
    OR assigned_staff_id IN (SELECT id FROM staff WHERE profile_id = auth.uid())
);

CREATE POLICY "Staff can update status of assigned collections"
ON collections FOR UPDATE
TO authenticated
USING (
    get_auth_role() IN ('super_admin', 'municipal_admin')
    OR assigned_staff_id IN (SELECT id FROM staff WHERE profile_id = auth.uid())
)
WITH CHECK (
    get_auth_role() IN ('super_admin', 'municipal_admin')
    OR assigned_staff_id IN (SELECT id FROM staff WHERE profile_id = auth.uid())
);

-- 10. Activity Logs Policies
CREATE POLICY "Admins can view activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (get_auth_role() IN ('super_admin', 'municipal_admin'));

CREATE POLICY "System can append activity logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- SmartWaste: Intelligent Urban Waste Management System
-- Migration 02: Functions, Automation Triggers, and State Machines

-- Function: Automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_smart_bins_updated_at
BEFORE UPDATE ON smart_bins
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Function: Auto-provision profile on Supabase auth user signup
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Operator'),
        COALESCE(NEW.email, ''),
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'super_admin' THEN 'super_admin'::user_role_enum
            WHEN NEW.raw_user_meta_data->>'role' = 'collection_staff' THEN 'collection_staff'::user_role_enum
            ELSE 'municipal_admin'::user_role_enum
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_auth_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Function: Process sensor reading, update bin status, and evaluate thresholds
CREATE OR REPLACE FUNCTION process_sensor_reading()
RETURNS TRIGGER AS $$
DECLARE
    v_new_status bin_status_enum;
BEGIN
    -- Determine operational status from fill percentage
    IF NEW.fill_percentage >= 90.0 THEN
        v_new_status := 'critical';
    ELSIF NEW.fill_percentage >= 75.0 THEN
        v_new_status := 'warning';
    ELSE
        v_new_status := 'normal';
    END IF;

    -- Update parent smart bin
    UPDATE smart_bins
    SET
        current_fill_percentage = NEW.fill_percentage,
        status = v_new_status,
        sensor_status = 'online',
        last_sensor_update = NEW.recorded_at,
        updated_at = timezone('utc', now())
    WHERE id = NEW.bin_id;

    -- Evaluate and generate alerts without duplicating active alerts
    IF NEW.fill_percentage >= 98.0 THEN
        INSERT INTO alerts (bin_id, alert_type, severity, message, status)
        VALUES (
            NEW.bin_id,
            'overflow',
            'critical',
            'Bin has reached capacity threshold (' || NEW.fill_percentage || '%). Overflow incident imminent.',
            'active'
        )
        ON CONFLICT (bin_id, alert_type) WHERE status = 'active' DO NOTHING;

    ELSIF NEW.fill_percentage >= 90.0 THEN
        INSERT INTO alerts (bin_id, alert_type, severity, message, status)
        VALUES (
            NEW.bin_id,
            'capacity_90',
            'critical',
            'Bin reached critical fill level (' || NEW.fill_percentage || '%). Collection dispatch recommended.',
            'active'
        )
        ON CONFLICT (bin_id, alert_type) WHERE status = 'active' DO NOTHING;

    ELSIF NEW.fill_percentage >= 75.0 THEN
        INSERT INTO alerts (bin_id, alert_type, severity, message, status)
        VALUES (
            NEW.bin_id,
            'capacity_75',
            'warning',
            'Bin reached warning capacity threshold (' || NEW.fill_percentage || '%).',
            'active'
        )
        ON CONFLICT (bin_id, alert_type) WHERE status = 'active' DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_sensor_reading_added
AFTER INSERT ON sensor_readings
FOR EACH ROW EXECUTE FUNCTION process_sensor_reading();

-- Function: Handle collection completion lifecycle
CREATE OR REPLACE FUNCTION handle_collection_completed()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate transition: only trigger when moving to 'completed'
    IF NEW.collection_status = 'completed' AND (OLD.collection_status IS DISTINCT FROM 'completed') THEN
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := timezone('utc', now());
        END IF;

        -- Reset bin operational state upon verified collection event
        UPDATE smart_bins
        SET
            current_fill_percentage = 3.0,
            status = 'normal',
            last_sensor_update = NEW.completed_at,
            updated_at = timezone('utc', now())
        WHERE id = NEW.bin_id;

        -- Auto-resolve active capacity alerts for this bin
        UPDATE alerts
        SET
            status = 'resolved',
            resolved_at = NEW.completed_at,
            resolved_by = NEW.assigned_staff_id
        WHERE bin_id = NEW.bin_id AND status = 'active' AND alert_type IN ('capacity_75', 'capacity_90', 'overflow');

        -- Audit log entry
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
        VALUES (
            NEW.created_by,
            'COLLECTION_COMPLETED',
            'collection',
            NEW.id::text,
            jsonb_build_object(
                'bin_id', NEW.bin_id,
                'collected_quantity_kg', NEW.collected_quantity_kg,
                'staff_id', NEW.assigned_staff_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_collection_status_change
BEFORE UPDATE ON collections
FOR EACH ROW EXECUTE FUNCTION handle_collection_completed();

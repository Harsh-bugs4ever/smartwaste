-- Run this in your Supabase SQL Editor to ensure smooth user sign-up
-- Fixes search_path and safe enum casting for the auth trigger

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
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
    -- Fallback so user registration is never blocked
    RAISE WARNING 'handle_new_auth_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

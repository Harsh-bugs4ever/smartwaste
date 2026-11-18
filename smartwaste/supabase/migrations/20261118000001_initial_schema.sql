-- SmartWaste: Intelligent Urban Waste Management System
-- Migration 01: Core Relational Schema, Tables, Constraints, and Indexes

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'municipal_admin', 'collection_staff');
CREATE TYPE waste_category_enum AS ENUM ('wet', 'dry', 'plastic', 'paper', 'e_waste');
CREATE TYPE bin_status_enum AS ENUM ('normal', 'warning', 'critical', 'offline');
CREATE TYPE sensor_status_enum AS ENUM ('online', 'offline');
CREATE TYPE alert_type_enum AS ENUM ('capacity_75', 'capacity_90', 'overflow', 'sensor_disconnected', 'collection_overdue');
CREATE TYPE alert_severity_enum AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_status_enum AS ENUM ('active', 'resolved');
CREATE TYPE collection_status_enum AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role_enum NOT NULL DEFAULT 'municipal_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Municipal Zones Table
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name TEXT UNIQUE NOT NULL,
    description TEXT,
    area TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Waste Categories Table
CREATE TABLE waste_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code waste_category_enum UNIQUE NOT NULL,
    description TEXT
);

-- 4. Smart Bins Table
CREATE TABLE smart_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bin_code VARCHAR(32) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    waste_category_id UUID REFERENCES waste_categories(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 6) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10, 6) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    capacity_liters INTEGER NOT NULL CHECK (capacity_liters > 0),
    current_fill_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (current_fill_percentage >= 0.0 AND current_fill_percentage <= 100.0),
    status bin_status_enum NOT NULL DEFAULT 'normal',
    sensor_status sensor_status_enum NOT NULL DEFAULT 'online',
    last_sensor_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. IoT Devices Table
CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code VARCHAR(64) UNIQUE NOT NULL,
    bin_id UUID REFERENCES smart_bins(id) ON DELETE SET NULL,
    device_type VARCHAR(64) NOT NULL DEFAULT 'ESP32_ULTRASONIC',
    secret_hash TEXT,
    last_seen_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Sensor Readings Table (Telemetry Logs)
CREATE TABLE sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
    bin_id UUID NOT NULL REFERENCES smart_bins(id) ON DELETE CASCADE,
    measured_distance_cm NUMERIC(6, 2) NOT NULL CHECK (measured_distance_cm >= 0),
    fill_percentage NUMERIC(5, 2) NOT NULL CHECK (fill_percentage >= 0.0 AND fill_percentage <= 100.0),
    battery_percentage NUMERIC(5, 2) CHECK (battery_percentage >= 0.0 AND battery_percentage <= 100.0),
    temperature_c NUMERIC(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Alerts Table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bin_id UUID NOT NULL REFERENCES smart_bins(id) ON DELETE CASCADE,
    alert_type alert_type_enum NOT NULL,
    severity alert_severity_enum NOT NULL DEFAULT 'warning',
    message TEXT NOT NULL,
    status alert_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Partial Unique Index to prevent duplicate active alerts for the same bin and condition
CREATE UNIQUE INDEX idx_unique_active_alert_per_bin_type
ON alerts (bin_id, alert_type)
WHERE status = 'active';

-- 8. Staff Table (Collection Personnel)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    employee_code VARCHAR(32) UNIQUE NOT NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. Collections Table (Pickup Operations)
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bin_id UUID NOT NULL REFERENCES smart_bins(id) ON DELETE CASCADE,
    assigned_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    collected_quantity_kg NUMERIC(8, 2) CHECK (collected_quantity_kg IS NULL OR collected_quantity_kg >= 0),
    collection_status collection_status_enum NOT NULL DEFAULT 'pending',
    remarks TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. Activity Logs Table (Audit Trail)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Performance Indexes
CREATE INDEX idx_smart_bins_bin_code ON smart_bins(bin_code);
CREATE INDEX idx_smart_bins_zone_id ON smart_bins(zone_id);
CREATE INDEX idx_smart_bins_status ON smart_bins(status);
CREATE INDEX idx_smart_bins_category ON smart_bins(waste_category_id);
CREATE INDEX idx_sensor_readings_bin_time ON sensor_readings(bin_id, recorded_at DESC);
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings(recorded_at DESC);
CREATE INDEX idx_alerts_status_created ON alerts(status, created_at DESC);
CREATE INDEX idx_alerts_bin_id ON alerts(bin_id);
CREATE INDEX idx_collections_status ON collections(collection_status);
CREATE INDEX idx_collections_scheduled ON collections(scheduled_at);
CREATE INDEX idx_collections_staff ON collections(assigned_staff_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

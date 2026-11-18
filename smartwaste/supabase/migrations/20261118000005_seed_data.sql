-- SmartWaste: Intelligent Urban Waste Management System
-- Migration 05: Initial Seed Data for Mumbai Metropolitan Region (MMR)

-- 1. Waste Categories
INSERT INTO waste_categories (id, name, code, description) VALUES
('11111111-1111-1111-1111-111111111101', 'Wet Waste', 'wet', 'Biodegradable kitchen, organic, and food waste.'),
('11111111-1111-1111-1111-111111111102', 'Dry Waste', 'dry', 'Non-biodegradable recyclable packaging, metals, and cloth.'),
('11111111-1111-1111-1111-111111111103', 'Plastic Waste', 'plastic', 'Single-use and rigid recyclable polymers (PET, HDPE).'),
('11111111-1111-1111-1111-111111111104', 'Paper Waste', 'paper', 'Cardboard, newspapers, office stationary, and clean pulp.'),
('11111111-1111-1111-1111-111111111105', 'E-Waste', 'e_waste', 'Batteries, spent electronics, PCB scrap, and consumer IoT.')
ON CONFLICT (code) DO NOTHING;

-- 2. Municipal Zones
INSERT INTO zones (id, zone_name, description, area) VALUES
('22222222-2222-2222-2222-222222222201', 'Zone A – Island City', 'South Mumbai administrative wards (Colaba, Fort, Marine Lines, Dadar, Worli)', 'South Mumbai'),
('22222222-2222-2222-2222-222222222202', 'Zone B – Western Suburbs', 'Bandra, Juhu, Andheri, Goregaon, Malad, Borivali coastal belt', 'Western Mumbai'),
('22222222-2222-2222-2222-222222222203', 'Zone C – Eastern Suburbs', 'Kurla, BKC, Ghatkopar, Powai, Mulund industrial corridor', 'Eastern Mumbai'),
('22222222-2222-2222-2222-222222222204', 'Zone D – Navi Mumbai', 'Vashi, Nerul, Belapur, APMC wholesale commercial hub', 'Navi Mumbai')
ON CONFLICT (zone_name) DO NOTHING;

-- 3. Smart Bins
INSERT INTO smart_bins (id, bin_code, name, zone_id, waste_category_id, latitude, longitude, capacity_liters, current_fill_percentage, status, sensor_status, last_sensor_update) VALUES
('33333333-3333-3333-3333-333333333301', 'BIN-1001', 'Colaba Causeway', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 18.9217, 72.8332, 240, 34.0, 'normal', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333302', 'BIN-1002', 'Gateway of India Promenade', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 18.9220, 72.8347, 240, 82.0, 'warning', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333303', 'BIN-1003', 'CSMT Station Road', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 18.9398, 72.8355, 360, 93.0, 'critical', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333304', 'BIN-1004', 'Marine Drive – Chowpatty', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 18.9543, 72.8143, 360, 58.0, 'normal', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333305', 'BIN-1005', 'Crawford Market', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 18.9473, 72.8337, 480, 96.0, 'critical', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333306', 'BIN-1006', 'Dadar Flower Market', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 19.0178, 72.8416, 480, 88.0, 'warning', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333307', 'BIN-1007', 'Worli Sea Face', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 19.0096, 72.8156, 240, 22.0, 'normal', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333308', 'BIN-1008', 'Bandra Linking Road', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103', 19.0657, 72.8347, 240, 79.0, 'warning', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333309', 'BIN-1009', 'Juhu Beach Entrance', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103', 19.0988, 72.8265, 360, 91.0, 'critical', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333310', 'BIN-1010', 'Andheri Station West', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 19.1197, 72.8464, 480, 74.0, 'normal', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333311', 'BIN-1011', 'Versova Market', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 19.1316, 72.8153, 360, 0.0, 'offline', 'offline', timezone('utc', now() - interval '6 hours')),
('33333333-3333-3333-3333-333333333312', 'BIN-1012', 'BKC Diamond Bourse', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111104', 19.0674, 72.8689, 360, 48.0, 'normal', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333313', 'BIN-1013', 'Vashi APMC Market', '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 19.0722, 73.0102, 600, 92.0, 'critical', 'online', timezone('utc', now())),
('33333333-3333-3333-3333-333333333314', 'BIN-1014', 'Belapur CBD', '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111105', 19.0176, 73.0386, 120, 63.0, 'normal', 'online', timezone('utc', now()))
ON CONFLICT (bin_code) DO NOTHING;

-- 4. IoT Devices
INSERT INTO iot_devices (device_code, bin_id, device_type, secret_hash, is_active) VALUES
('ESP32-1001', '33333333-3333-3333-3333-333333333301', 'ESP32_ULTRASONIC_V2', 'esp32-secure-secret-token', TRUE),
('ESP32-1002', '33333333-3333-3333-3333-333333333302', 'ESP32_ULTRASONIC_V2', 'esp32-secure-secret-token', TRUE),
('ESP32-1003', '33333333-3333-3333-3333-333333333303', 'ESP32_ULTRASONIC_V2', 'esp32-secure-secret-token', TRUE),
('ESP32-1005', '33333333-3333-3333-3333-333333333305', 'ESP32_ULTRASONIC_V2', 'esp32-secure-secret-token', TRUE)
ON CONFLICT (device_code) DO NOTHING;

-- 5. Staff Roster
INSERT INTO staff (id, employee_code, zone_id, availability_status) VALUES
('44444444-4444-4444-4444-444444444401', 'STF-201', '22222222-2222-2222-2222-222222222201', 'active'),
('44444444-4444-4444-4444-444444444402', 'STF-202', '22222222-2222-2222-2222-222222222201', 'active'),
('44444444-4444-4444-4444-444444444403', 'STF-203', '22222222-2222-2222-2222-222222222202', 'active'),
('44444444-4444-4444-4444-444444444404', 'STF-204', '22222222-2222-2222-2222-222222222203', 'active'),
('44444444-4444-4444-4444-444444444405', 'STF-205', '22222222-2222-2222-2222-222222222204', 'active')
ON CONFLICT (employee_code) DO NOTHING;

-- 6. Initial Active Alerts
INSERT INTO alerts (bin_id, alert_type, severity, message, status, created_at) VALUES
('33333333-3333-3333-3333-333333333305', 'overflow', 'critical', 'BIN-1005 is overflowing at 96%', 'active', timezone('utc', now() - interval '25 minutes')),
('33333333-3333-3333-3333-333333333303', 'capacity_90', 'critical', 'BIN-1003 reached 93% capacity', 'active', timezone('utc', now() - interval '45 minutes')),
('33333333-3333-3333-3333-333333333306', 'capacity_75', 'warning', 'BIN-1006 reached 88% capacity', 'active', timezone('utc', now() - interval '1 hour')),
('33333333-3333-3333-3333-333333333311', 'sensor_disconnected', 'warning', 'BIN-1011 stopped reporting', 'active', timezone('utc', now() - interval '6 hours'))
ON CONFLICT DO NOTHING;

-- 7. Sample Collections
INSERT INTO collections (bin_id, zone_id, assigned_staff_id, scheduled_at, collection_status, collected_quantity_kg) VALUES
('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', timezone('utc', now() + interval '1 hour'), 'in_progress', NULL),
('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444402', timezone('utc', now() + interval '2 hours'), 'assigned', NULL),
('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', timezone('utc', now() - interval '5 hours'), 'completed', 78.5)
ON CONFLICT DO NOTHING;

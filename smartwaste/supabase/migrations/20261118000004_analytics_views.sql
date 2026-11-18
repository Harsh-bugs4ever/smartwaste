-- SmartWaste: Intelligent Urban Waste Management System
-- Migration 04: Analytics SQL Views for Real-Time Dashboard Reporting

-- View 1: Real-time Smart Bin Network Overview
CREATE OR REPLACE VIEW view_bin_overview AS
SELECT
    COUNT(*)::INTEGER AS total_bins,
    COUNT(*) FILTER (WHERE sensor_status = 'online')::INTEGER AS active_bins,
    COUNT(*) FILTER (WHERE sensor_status = 'offline')::INTEGER AS offline_bins,
    COUNT(*) FILTER (WHERE current_fill_percentage >= 90.0)::INTEGER AS critical_bins,
    COUNT(*) FILTER (WHERE current_fill_percentage >= 75.0 AND current_fill_percentage < 90.0)::INTEGER AS warning_bins,
    ROUND(AVG(current_fill_percentage) FILTER (WHERE sensor_status = 'online'), 1) AS average_fill_percentage
FROM smart_bins;

-- View 2: Waste Category Distribution & Aggregates
CREATE OR REPLACE VIEW view_category_distribution AS
SELECT
    wc.id AS category_id,
    wc.name AS category_name,
    wc.code AS category_code,
    COUNT(b.id)::INTEGER AS registered_bins,
    ROUND(COALESCE(AVG(b.current_fill_percentage), 0), 1) AS avg_fill_percentage,
    COALESCE(SUM(b.capacity_liters), 0)::INTEGER AS total_capacity_liters
FROM waste_categories wc
LEFT JOIN smart_bins b ON b.waste_category_id = wc.id
GROUP BY wc.id, wc.name, wc.code;

-- View 3: Municipal Zone-Wise Waste Collection
CREATE OR REPLACE VIEW view_zone_collections AS
SELECT
    z.id AS zone_id,
    z.zone_name,
    z.area,
    COUNT(c.id)::INTEGER AS total_tasks,
    COUNT(c.id) FILTER (WHERE c.collection_status = 'completed')::INTEGER AS completed_tasks,
    COUNT(c.id) FILTER (WHERE c.collection_status IN ('pending', 'assigned', 'in_progress'))::INTEGER AS pending_tasks,
    ROUND(COALESCE(SUM(c.collected_quantity_kg) FILTER (WHERE c.collection_status = 'completed'), 0), 1) AS total_collected_kg
FROM zones z
LEFT JOIN collections c ON c.zone_id = z.id
GROUP BY z.id, z.zone_name, z.area;

-- View 4: Monthly Collection Performance & Fulfillment
CREATE OR REPLACE VIEW view_monthly_performance AS
SELECT
    to_char(scheduled_at, 'Mon YYYY') AS month_label,
    date_trunc('month', scheduled_at) AS sort_month,
    COUNT(*)::INTEGER AS scheduled_count,
    COUNT(*) FILTER (WHERE collection_status = 'completed')::INTEGER AS completed_count,
    ROUND(
        (COUNT(*) FILTER (WHERE collection_status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
        1
    ) AS completion_rate_percentage
FROM collections
GROUP BY to_char(scheduled_at, 'Mon YYYY'), date_trunc('month', scheduled_at)
ORDER BY sort_month ASC;

-- View 5: Overflow Frequency & Incident Analysis
CREATE OR REPLACE VIEW view_overflow_incidents AS
SELECT
    b.id AS bin_id,
    b.bin_code,
    b.name AS location_name,
    z.zone_name,
    COUNT(a.id)::INTEGER AS overflow_count,
    MAX(a.created_at) AS last_overflow_time
FROM smart_bins b
JOIN zones z ON z.id = b.zone_id
JOIN alerts a ON a.bin_id = b.id
WHERE a.alert_type = 'overflow'
GROUP BY b.id, b.bin_code, b.name, z.zone_name
ORDER BY overflow_count DESC;

-- Bakehouse Rewards - Grant Permissions
-- Grant Unity Catalog permissions to app service principal

-- Replace with your actual app service principal
-- Get from: databricks apps get bakehouse-rewards | grep service_principal_name
SET VAR app_sp = 'app-29pbq7 bakehouse-rewards';

-- Grant catalog usage
GRANT USE CATALOG ON CATALOG bakehouse TO `${app_sp}`;

-- Grant schema usage
GRANT USE SCHEMA ON SCHEMA bakehouse.rewards TO `${app_sp}`;

-- Grant SELECT on tables (read-only for OLAP)
GRANT SELECT ON TABLE bakehouse.rewards.customer_rewards TO `${app_sp}`;
GRANT SELECT ON TABLE bakehouse.rewards.transactions TO `${app_sp}`;
GRANT SELECT ON TABLE bakehouse.rewards.redemptions TO `${app_sp}`;

-- Grant MODIFY if app needs to write (e.g. for analytics updates)
-- GRANT MODIFY ON TABLE bakehouse.rewards.customer_rewards TO `${app_sp}`;

-- Verify permissions
SHOW GRANTS ON CATALOG bakehouse;
SHOW GRANTS ON SCHEMA bakehouse.rewards;
SHOW GRANTS ON TABLE bakehouse.rewards.customer_rewards;
-- Bakehouse Rewards - Grant App Permissions (Lakebase PostgreSQL)
-- Run this against your Lakebase PostgreSQL database

-- Create app role if not exists
-- Note: Replace with actual app service principal or role name
CREATE ROLE IF NOT EXISTS bakehouse_app;

-- Grant schema usage
GRANT USAGE ON SCHEMA rewards TO bakehouse_app;

-- Grant SELECT on tables (read access)
GRANT SELECT ON ALL TABLES IN SCHEMA rewards TO bakehouse_app;

-- Grant INSERT, UPDATE, DELETE on redemptions table (write access)
GRANT INSERT, UPDATE, DELETE ON rewards.redemptions TO bakehouse_app;

-- Grant UPDATE on customer_points (to update balances)
GRANT UPDATE ON rewards.customer_points TO bakehouse_app;

-- Grant future privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA rewards 
  GRANT SELECT ON TABLES TO bakehouse_app;

-- Verify grants
\dp rewards.*
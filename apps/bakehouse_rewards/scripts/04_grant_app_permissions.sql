-- ============================================================================
-- Grant Permissions to Bakehouse Rewards App Service Principal
-- ============================================================================
-- This script grants the app service principal permissions to read customer
-- data from the Lakehouse (Unity Catalog).
--
-- Service Principal: app-29pbq7 bakehouse-rewards
-- Service Principal ID: 76446717456885
--
-- Run this script after deploying the app.
-- ============================================================================

-- Grant catalog access
GRANT USE CATALOG ON CATALOG workspace TO `app-29pbq7 bakehouse-rewards`;

-- Grant schema access
GRANT USE SCHEMA ON SCHEMA workspace.bakehouse_demo TO `app-29pbq7 bakehouse-rewards`;

-- Grant read access to customer data table
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_customers TO `app-29pbq7 bakehouse-rewards`;

-- Grant read access to transactions table
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_transactions TO `app-29pbq7 bakehouse-rewards`;

-- Grant read access to customer rewards view
GRANT SELECT ON VIEW workspace.bakehouse_demo.customer_rewards TO `app-29pbq7 bakehouse-rewards`;

-- Verify grants
SHOW GRANTS ON CATALOG workspace;
SHOW GRANTS ON SCHEMA workspace.bakehouse_demo;
SHOW GRANTS ON TABLE workspace.bakehouse_demo.customer_rewards;

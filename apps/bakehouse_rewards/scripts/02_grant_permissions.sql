-- Bakehouse Rewards App - Permissions Setup
-- Grant necessary permissions to the app service principal
-- Note: Replace 'bakehouse-rewards-app-sp' with your actual app service principal name

-- Grant catalog and schema usage
GRANT USE CATALOG ON CATALOG main TO `bakehouse-rewards-app-sp`;
GRANT USE SCHEMA ON SCHEMA main.bakehouse_demo TO `bakehouse-rewards-app-sp`;

-- Grant SELECT on tables and views
GRANT SELECT ON TABLE main.bakehouse_demo.sales_customers TO `bakehouse-rewards-app-sp`;
GRANT SELECT ON TABLE main.bakehouse_demo.sales_transactions TO `bakehouse-rewards-app-sp`;
GRANT SELECT ON VIEW main.bakehouse_demo.customer_rewards TO `bakehouse-rewards-app-sp`;

-- Verify grants
SHOW GRANTS ON SCHEMA main.bakehouse_demo;

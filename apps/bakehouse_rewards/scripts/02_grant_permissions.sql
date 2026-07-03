-- Bakehouse Rewards - Grant Unity Catalog Permissions
/*
The service principal display name is 'app-29pbq7 bakehouse-rewards', but Unity Catalog requires the client ID (with backtick): `49c4a9ad-c912-4341-ad56-ffc6afc0f9aa`
*/


-- Grant permissions to app service principal for workspace.bakehouse_demo schema

-- Grant catalog usage
GRANT USE CATALOG ON CATALOG workspace TO `49c4a9ad-c912-4341-ad56-ffc6afc0f9aa`;

-- Grant schema usage
GRANT USE SCHEMA ON SCHEMA workspace.bakehouse_demo TO `49c4a9ad-c912-4341-ad56-ffc6afc0f9aa`;

-- Grant SELECT on tables (read-only access)
GRANT SELECT ON TABLE workspace.bakehouse_demo.customer_rewards TO `49c4a9ad-c912-4341-ad56-ffc6afc0f9aa`;
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_customers TO `49c4a9ad-c912-4341-ad56-ffc6afc0f9aa`;
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_transactions TO `49c4a9ad-c912-4341-ad56-ffc6afc0f9aa`;

-- Verify permissions
SHOW GRANTS ON CATALOG workspace;
SHOW GRANTS ON SCHEMA workspace.bakehouse_demo;
SHOW GRANTS ON TABLE workspace.bakehouse_demo.customer_rewards;

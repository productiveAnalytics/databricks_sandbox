-- Bakehouse Rewards - Lakehouse (Unity Catalog) Setup
-- Create workspace.bakehouse_demo schema and copy sample data from samples.bakehouse

-- Create schema in workspace catalog
CREATE SCHEMA IF NOT EXISTS workspace.bakehouse_demo
COMMENT 'Bakehouse customer rewards demo data';

-- Copy sales customers from samples
CREATE OR REPLACE TABLE workspace.bakehouse_demo.sales_customers AS
SELECT * FROM samples.bakehouse.sales_customers;

-- Copy sales transactions from samples  
CREATE OR REPLACE TABLE workspace.bakehouse_demo.sales_transactions AS
SELECT * FROM samples.bakehouse.sales_transactions;

-- Create customer rewards view (aggregated from transactions)
CREATE OR REPLACE VIEW workspace.bakehouse_demo.customer_rewards
COMMENT 'Customer rewards summary aggregated from transactions' AS
SELECT 
  c.customerID,
  CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
  c.email_address,
  COALESCE(SUM(FLOOR(t.totalPrice / 10)), 0) AS points_available,
  COALESCE(SUM(t.totalPrice), 0) AS total_spend,
  COUNT(t.transactionID) AS transaction_count,
  MAX(t.dateTime) AS last_purchase_date
FROM workspace.bakehouse_demo.sales_customers c
LEFT JOIN workspace.bakehouse_demo.sales_transactions t
  ON c.customerID = t.customerID
GROUP BY c.customerID, c.first_name, c.last_name, c.email_address;

-- Verify setup
SHOW TABLES IN workspace.bakehouse_demo;
SELECT COUNT(*) AS customer_count FROM workspace.bakehouse_demo.sales_customers;
SELECT COUNT(*) AS transaction_count FROM workspace.bakehouse_demo.sales_transactions;
SELECT COUNT(*) AS rewards_count FROM workspace.bakehouse_demo.customer_rewards;

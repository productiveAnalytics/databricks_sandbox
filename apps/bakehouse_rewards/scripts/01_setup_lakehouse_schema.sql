-- Bakehouse Rewards App - Lakehouse Schema Setup
-- This script creates the managed schema and copies sample data

-- Create the managed schema
CREATE SCHEMA IF NOT EXISTS main.bakehouse_demo
COMMENT 'Managed schema for Bakehouse Rewards demo app';

-- Copy customers table
CREATE OR REPLACE TABLE main.bakehouse_demo.sales_customers AS
SELECT * FROM samples.bakehouse.sales_customers;

-- Copy transactions table
CREATE OR REPLACE TABLE main.bakehouse_demo.sales_transactions AS
SELECT * FROM samples.bakehouse.sales_transactions;

-- Create customer rewards view with pre-computed points
CREATE OR REPLACE VIEW main.bakehouse_demo.customer_rewards AS
SELECT 
  c.customer_id,
  c.customer_name,
  ROUND(SUM(t.transaction_amount) * 10, 0) AS points_available,
  ROUND(SUM(t.transaction_amount), 2) AS total_spend,
  COUNT(*) AS transaction_count,
  MAX(t.transaction_date) AS last_purchase_date
FROM main.bakehouse_demo.sales_transactions t
JOIN main.bakehouse_demo.sales_customers c ON t.customer_id = c.customer_id
GROUP BY c.customer_id, c.customer_name;

-- Verify the setup
SELECT 'Customers count' AS metric, COUNT(*) AS value FROM main.bakehouse_demo.sales_customers
UNION ALL
SELECT 'Transactions count', COUNT(*) FROM main.bakehouse_demo.sales_transactions
UNION ALL
SELECT 'Customers with rewards', COUNT(*) FROM main.bakehouse_demo.customer_rewards;

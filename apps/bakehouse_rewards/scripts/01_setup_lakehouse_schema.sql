-- Bakehouse Rewards App - Lakehouse Schema Setup
-- This script creates the managed schema and copies sample data

-- Create the managed schema in workspace catalog
CREATE SCHEMA IF NOT EXISTS workspace.bakehouse_demo
COMMENT 'Managed schema for Bakehouse Rewards demo app';

-- Copy customers table
CREATE OR REPLACE TABLE workspace.bakehouse_demo.sales_customers AS
SELECT * FROM samples.bakehouse.sales_customers;

-- Copy transactions table
CREATE OR REPLACE TABLE workspace.bakehouse_demo.sales_transactions AS
SELECT * FROM samples.bakehouse.sales_transactions;

-- Create customer rewards view with pre-computed points
-- Points calculation: 10 points per dollar spent
CREATE OR REPLACE VIEW workspace.bakehouse_demo.customer_rewards AS
SELECT 
  c.customerID,
  CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
  c.email_address,
  ROUND(SUM(t.totalPrice) * 10, 0) AS points_available,
  ROUND(SUM(t.totalPrice), 2) AS total_spend,
  COUNT(*) AS transaction_count,
  MAX(t.dateTime) AS last_purchase_date
FROM workspace.bakehouse_demo.sales_transactions t
JOIN workspace.bakehouse_demo.sales_customers c ON t.customerID = c.customerID
GROUP BY c.customerID, c.first_name, c.last_name, c.email_address;

-- Verify the setup
SELECT 'Customers count' AS metric, COUNT(*) AS value 
FROM workspace.bakehouse_demo.sales_customers
UNION ALL
SELECT 'Transactions count', COUNT(*) 
FROM workspace.bakehouse_demo.sales_transactions
UNION ALL
SELECT 'Customers with rewards', COUNT(*) 
FROM workspace.bakehouse_demo.customer_rewards
UNION ALL
SELECT 'Max points available', MAX(points_available)
FROM workspace.bakehouse_demo.customer_rewards;

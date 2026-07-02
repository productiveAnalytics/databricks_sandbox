-- Bakehouse Rewards - Lakehouse (Unity Catalog) Setup
-- OLAP layer for analytics and reporting

-- Create catalog (if not exists)
CREATE CATALOG IF NOT EXISTS bakehouse;

-- Create schema for rewards data
CREATE SCHEMA IF NOT EXISTS bakehouse.rewards
COMMENT 'Bakehouse customer rewards and loyalty data';

USE CATALOG bakehouse;
USE SCHEMA rewards;

-- Customer rewards summary (aggregated from transactions)
CREATE OR REPLACE TABLE customer_rewards (
  customer_email STRING COMMENT 'Customer email address',
  total_points INT COMMENT 'Total loyalty points earned',
  points_redeemed INT COMMENT 'Total points redeemed',
  points_available INT COMMENT 'Points available for redemption',
  total_spent DECIMAL(10,2) COMMENT 'Total amount spent',
  transaction_count INT COMMENT 'Number of transactions',
  last_transaction_date DATE COMMENT 'Date of last transaction',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
USING DELTA
COMMENT 'Customer rewards summary for analytics';

-- Transaction history (OLAP copy for fast analytics)
CREATE OR REPLACE TABLE transactions (
  transaction_id STRING COMMENT 'Unique transaction identifier',
  customer_email STRING COMMENT 'Customer email address',
  transaction_date DATE COMMENT 'Transaction date',
  amount DECIMAL(10,2) COMMENT 'Transaction amount',
  points_earned INT COMMENT 'Loyalty points earned',
  product_category STRING COMMENT 'Product category (Coffee, Pastries, etc)',
  store_location STRING COMMENT 'Store location',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
USING DELTA
PARTITIONED BY (transaction_date)
COMMENT 'Transaction history for analytics';

-- Redemption history (OLAP copy)
CREATE OR REPLACE TABLE redemptions (
  redemption_id STRING COMMENT 'Unique redemption identifier',
  customer_email STRING COMMENT 'Customer email address',
  redemption_date DATE COMMENT 'Redemption date',
  points_redeemed INT COMMENT 'Points redeemed',
  reward_type STRING COMMENT 'Type of reward (Free Coffee, etc)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
USING DELTA
PARTITIONED BY (redemption_date)
COMMENT 'Redemption history for analytics';

-- Insert sample data for testing
INSERT INTO customer_rewards VALUES
  ('alice@example.com', 1250, 500, 750, 5000.00, 42, '2024-01-15', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  ('bob@example.com', 980, 200, 780, 3920.00, 28, '2024-01-14', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO transactions VALUES
  ('TXN001', 'alice@example.com', '2024-01-15', 125.50, 125, 'Pastries', 'Downtown', CURRENT_TIMESTAMP()),
  ('TXN002', 'alice@example.com', '2024-01-10', 45.00, 45, 'Coffee', 'Downtown', CURRENT_TIMESTAMP()),
  ('TXN003', 'bob@example.com', '2024-01-14', 89.00, 89, 'Pastries', 'Uptown', CURRENT_TIMESTAMP());

INSERT INTO redemptions VALUES
  ('RED001', 'alice@example.com', '2024-01-12', 500, 'Free Coffee', CURRENT_TIMESTAMP());

-- Verify tables
SHOW TABLES IN bakehouse.rewards;
SELECT * FROM customer_rewards;
SELECT * FROM transactions;
SELECT * FROM redemptions;
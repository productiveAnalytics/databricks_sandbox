-- Bakehouse Rewards - Lakebase (PostgreSQL) Setup
-- OLTP layer for transactional operations
-- Run this against your Lakebase PostgreSQL database

-- Create schema
CREATE SCHEMA IF NOT EXISTS rewards;

-- Redemptions table (OLTP - real-time writes)
CREATE TABLE IF NOT EXISTS rewards.redemptions (
  redemption_id VARCHAR(50) PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  points_redeemed INTEGER NOT NULL,
  reward_type VARCHAR(100) NOT NULL,
  redemption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_redemptions_customer 
  ON rewards.redemptions(customer_email);

CREATE INDEX IF NOT EXISTS idx_redemptions_date 
  ON rewards.redemptions(redemption_date);

-- Customer points balance (OLTP - real-time updates)
CREATE TABLE IF NOT EXISTS rewards.customer_points (
  customer_email VARCHAR(255) PRIMARY KEY,
  points_available INTEGER NOT NULL DEFAULT 0,
  points_pending INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO rewards.customer_points (customer_email, points_available, points_pending)
VALUES 
  ('alice@example.com', 750, 0),
  ('bob@example.com', 780, 0)
ON CONFLICT (customer_email) DO NOTHING;

INSERT INTO rewards.redemptions (redemption_id, customer_email, points_redeemed, reward_type, redemption_date)
VALUES 
  ('RED001', 'alice@example.com', 500, 'Free Coffee', '2024-01-12')
ON CONFLICT (redemption_id) DO NOTHING;

-- Verify tables
SELECT * FROM rewards.customer_points;
SELECT * FROM rewards.redemptions;
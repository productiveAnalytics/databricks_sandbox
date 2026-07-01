-- Bakehouse Rewards App - Lakebase Database Setup
-- This SQL should be executed against the Lakebase Postgres database
-- after the project and branch are created via SDK

-- Create the redemptions table
CREATE TABLE IF NOT EXISTS reward_redemptions (
  redemption_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  reward_name VARCHAR(100) NOT NULL,
  points_redeemed INTEGER NOT NULL,
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_customer_id ON reward_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_at ON reward_redemptions(redeemed_at DESC);

-- Verify table creation
SELECT 'reward_redemptions' AS table_name, 
       COUNT(*) AS row_count 
FROM reward_redemptions;

# Lakebase Configuration for Bakehouse Rewards App

## Project Details
- **Project Name:** `bakehouse-rewards-app`
- **Project Path:** `projects/bakehouse-rewards-app`
- **Branch:** `production`
- **Postgres Version:** 17

## Endpoint Details
- **Endpoint Name:** `primary`
- **Endpoint Path:** `projects/bakehouse-rewards-app/branches/production/endpoints/primary`
- **Host:** `ep-empty-unit-d8fj291l.database.us-east-2.cloud.databricks.com`
- **Port:** `5432`
- **Database:** `databricks_postgres`

## Tables Created

### reward_redemptions
Table for storing customer reward redemptions.

**Schema:**
```sql
CREATE TABLE reward_redemptions (
  redemption_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  reward_name VARCHAR(100) NOT NULL,
  points_redeemed INTEGER NOT NULL,
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_customer_id` on `customer_id`
- `idx_redeemed_at` on `redeemed_at DESC`

## Connection in AppKit

To connect from the Databricks AppKit application:

1. Generate OAuth credentials using Databricks SDK:
```typescript
const creds = await w.postgres.generateDatabaseCredential({
  endpoint: "projects/bakehouse-rewards-app/branches/production/endpoints/primary"
});
```

2. Connect using a Postgres client:
```typescript
const connString = `postgresql://${creds.postgres_username}:${creds.postgres_password}@${host}:5432/databricks_postgres?sslmode=require`;
```

## Setup Status
- ✓ Project created
- ✓ Branch (production) ready
- ✓ Endpoint (primary) provisioned
- ✓ Database (databricks_postgres) available
- ✓ reward_redemptions table created with indexes

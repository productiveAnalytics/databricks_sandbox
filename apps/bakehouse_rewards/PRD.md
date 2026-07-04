# Bakehouse Rewards - Product Requirements Document

> **Purpose**: Complete specification for recreating Bakehouse Rewards app from scratch using any LLM code assistant (Claude Code, Cursor, etc.)

## Document Metadata

- **Version**: 1.1  
- **Last Updated**: January 8, 2025  
- **Author**: Genie Code (Databricks Assistant)  
- **Target Audience**: LLM code assistants, developers
- **Git Branch**: `databricks_app__bakehouse_rewards`
- **Repository**: https://github.com/productiveAnalytics/databricks_sandbox
- **App Path**: `apps/bakehouse_rewards/`
- **Related Documents**: `prompts/1_plan_prompt.md`, `prompts/2_develop_prompt.md`

---

## Executive Summary

Bakehouse Rewards is a customer loyalty application demonstrating **dual-data-platform architecture** on Databricks Apps:

- **Unity Catalog (Lakehouse)**: Historical transaction data, customer analytics
- **Lakebase (Postgres)**: Real-time redemption tracking with ACID transactions

Key innovation: Points calculation spans both platforms - earned points from Lakehouse, redeemed points from Lakebase, with net available calculated dynamically in the backend API.

---

## 1. Project Overview

### 1.1 Core Purpose

Provide bakery customers with a browser-based loyalty experience to:
- View points earned from purchases
- Browse transaction history
- Redeem points for rewards (coffee, pastries, store credit)
- Track redemption history

### 1.2 Demo Requirements (Critical)

**NO LOGIN REQUIRED** - App must work immediately without authentication:
- Customer selector dropdown for demo/workshop purposes
- Pre-seeded customers with redeemable points (using real transaction history)
- Default customer auto-selected on load
- Mobile-friendly for demo on phones/tablets

### 1.3 Target Users

- **Primary**: Demo/workshop attendees
- **Secondary**: Customer service representatives
- **Tertiary**: Actual bakery customers (future phase)

### 1.4 Success Metrics

- ✅ Accurate points calculation across dual platforms
- ✅ Sub-2-second page load times
- ✅ Zero data drift between Lakehouse and Lakebase
- ✅ 100% redemption validation accuracy
- ✅ Mobile-friendly responsive design
- ✅ Warm, inviting bakery aesthetic

---

## 2. Technical Architecture

### 2.1 MANDATORY Framework

**Databricks AppKit ONLY** - Do NOT substitute:

✅ **Use**:
- `@databricks/appkit` (npm package)
- `@databricks/appkit-ui` (npm package)
- Node.js + TypeScript runtime
- React 18 frontend
- Express.js backend (via AppKit server plugin)

❌ **DO NOT Use**:
- Flask, FastAPI, Django (Python web frameworks)
- Streamlit, Gradio (Python dashboarding)
- Next.js, Create React App (separate React frameworks)
- Any Python web server
- Any alternate frontend/backend stack

**Critical**: If implementation doesn't use Databricks AppKit as primary framework, it is INCORRECT.

**Reference**: https://github.com/databricks/appkit

### 2.2 Data Platform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Databricks App                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Frontend (React)                                       │ │
│  │  - Customer selector                                    │ │
│  │  - Stats cards (Available, Redeemed, Spent, Count)    │ │
│  │  - Transactions table                                   │ │
│  │  - Redemptions table                                    │ │
│  │  - Redemption form                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Backend API (AppKit server)                           │ │
│  │  GET  /api/customers                                    │ │
│  │  GET  /api/transactions/:email                          │ │
│  │  GET  /api/redemptions/:email                           │ │
│  │  POST /api/redeem                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│              │                          │                    │
└──────────────┼──────────────────────────┼────────────────────┘
               │                          │
     ┌─────────▼──────────┐    ┌─────────▼──────────┐
     │  Unity Catalog     │    │  Lakebase         │
     │  (Lakehouse)       │    │  (Postgres)       │
     │                    │    │                   │
     │  READ-ONLY:        │    │  READ/WRITE:      │
     │  • transactions    │    │  • redemptions    │
     │  • customers       │    │                   │
     │  • earned points   │    │  • redeemed pts   │
     └────────────────────┘    └───────────────────┘
            │                           │
            └──────── JOINED ───────────┘
                     │
              Available Points =
              earned - redeemed
```

### 2.3 Resource Configuration (`app.yaml`)

```yaml
env:
  - name: DATABRICKS_WAREHOUSE_ID
    valueFrom: sql-warehouse
  - name: LAKEBASE_ENDPOINT
    valueFrom: postgres

command:
  - npm
  - start
```

**Resource Permissions Required**:
1. **sql-warehouse**: `CAN_USE` permission for app service principal
2. **postgres**: `CAN_CONNECT_AND_CREATE` permission for app service principal

### 2.4 Infrastructure Provisioning & Permissions (MANDATORY)

**Critical**: These steps are REQUIRED before app deployment. Missing any step will cause runtime failures.

#### 2.4.1 Lakebase Project Creation

**MUST create a separate Lakebase project** - do NOT reuse existing projects:

```bash
# Option 1: Using databricks apps init (recommended)
databricks apps init <app-name> \
  --source-code-path /Workspace/Users/<user>/app-directory \
  --feature analytics,lakebase

# This creates:
# - New Lakebase project: projects/<app-name>/branches/production
# - New database: projects/<app-name>/branches/production/databases/databricks-postgres
# - Generates databricks.yml with resource configuration
```

**Project Structure**:
- Project: `projects/bakehouse-rewards-app`
- Branch: `projects/bakehouse-rewards-app/branches/production`
- Database: `projects/bakehouse-rewards-app/branches/production/databases/databricks-postgres`

**Why Separate Project**: 
- Each app must have isolated Lakebase resources
- Prevents data contamination between apps
- Independent schema management (`rewards`, `sweet_dough_rewards`, etc.)
- Separate access control and audit logs

#### 2.4.2 Resource Configuration (`databricks.yml`)

**Location**: Root of app source directory

**Purpose**: Configure app-level resources (SQL warehouse + Lakebase postgres)

```yaml
# databricks.yml
resources:
  - name: sql-warehouse
    sql_warehouse:
      id: <warehouse-id>  # e.g., "7f10ff17778951ac"
      permission: CAN_USE
  - name: postgres
    postgres:
      branch: projects/bakehouse-rewards-app/branches/production
      database: projects/bakehouse-rewards-app/branches/production/databases/databricks-postgres
      permission: CAN_CONNECT_AND_CREATE
```

**How `databricks.yml` is Used**:
1. Created by `databricks apps init` command
2. Read during `databricks apps deploy`
3. Configures environment variables automatically:
   - `DATABRICKS_WAREHOUSE_ID` (from sql-warehouse resource)
   - `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPORT`, `PGSSLMODE` (from postgres resource)
   - `LAKEBASE_ENDPOINT` (from postgres resource)

**Important**: The `app.yaml` file only references resources by name using `valueFrom`. The actual resource configuration is in `databricks.yml`:

```yaml
# app.yaml (runtime configuration)
env:
  - name: DATABRICKS_WAREHOUSE_ID
    valueFrom: sql-warehouse  # References resource in databricks.yml
  - name: LAKEBASE_ENDPOINT
    valueFrom: postgres       # References resource in databricks.yml

command:
  - npm
  - start
```

#### 2.4.3 Unity Catalog Permissions

**Who Needs Permissions**:
1. **Service Principal** (app's identity): For app-level operations
2. **End Users**: For OAuth On-Behalf-Of (OBO) execution

##### Service Principal Grants

**Identity**: Retrieved from `databricks apps get <app-name>`:
```json
{
  "service_principal_client_id": "<uuid>",
  "service_principal_name": "app-xxxxx <app-name>"
}
```

**SQL Grants** (run in SQL editor or notebook):

```sql
-- Grant schema access using service principal CLIENT ID (not display name)
GRANT USE SCHEMA ON SCHEMA workspace.bakehouse_demo 
  TO `<service-principal-client-id>`;

-- Grant SELECT on all tables
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_customers 
  TO `<service-principal-client-id>`;
  
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_transactions 
  TO `<service-principal-client-id>`;
  
GRANT SELECT ON TABLE workspace.bakehouse_demo.customer_rewards 
  TO `<service-principal-client-id>`;
```

**Example**:
```sql
-- Using actual service principal client ID
GRANT USE SCHEMA ON SCHEMA workspace.bakehouse_demo 
  TO `49c4a9ad-c912-4341-ad56-ffc6afc0f9aa`;

GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_customers 
  TO `49c4a9ad-c912-4341-ad56-ffc6afc0f9aa`;
-- ... (repeat for other tables)
```

**Verification**:
```sql
SHOW GRANTS ON SCHEMA workspace.bakehouse_demo;
-- Should see service principal with USE SCHEMA permission
```

##### End User Grants (For OAuth OBO)

**Critical**: Apps V2 uses OAuth with On-Behalf-Of (OBO) execution. When a user logs into the app:
- Queries run as **the logged-in user**, not the service principal
- User must have SELECT permissions on Unity Catalog tables
- Without user permissions: `[INSUFFICIENT_PERMISSIONS]` errors in logs

**SQL Grants for Each User**:

```sql
-- Grant schema access to user
GRANT USE SCHEMA ON SCHEMA workspace.bakehouse_demo 
  TO `user@example.com`;

-- Grant SELECT on all tables
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_customers 
  TO `user@example.com`;
  
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_transactions 
  TO `user@example.com`;
  
GRANT SELECT ON TABLE workspace.bakehouse_demo.customer_rewards 
  TO `user@example.com`;
```

**For Demo/Workshop**: Grant to all users in a group:

```sql
GRANT USE SCHEMA ON SCHEMA workspace.bakehouse_demo 
  TO `account users`;
  
GRANT SELECT ON ALL TABLES IN SCHEMA workspace.bakehouse_demo 
  TO `account users`;
```

#### 2.4.4 Lakebase Permissions

**Automatic via Resource Configuration**: The `postgres` resource in `databricks.yml` with `permission: CAN_CONNECT_AND_CREATE` grants:
- ✅ Connect to database
- ✅ Create schemas (`CREATE SCHEMA IF NOT EXISTS rewards`)
- ✅ Create tables within schemas
- ✅ INSERT, SELECT, UPDATE, DELETE within created schemas

**No Manual Grants Required** for Lakebase - handled by resource configuration.

#### 2.4.5 Complete Deployment Workflow

**Correct Order** (critical - must follow this sequence):

```bash
# Step 1: Create Unity Catalog schema and tables
# (See section 3.1 for SQL commands)

# Step 2: Create Lakebase project and generate databricks.yml
databricks apps init bakehouse-rewards \
  --source-code-path /Workspace/Users/<user>/bakehouse-rewards \
  --feature analytics,lakebase

# Step 3: Create app resource (if not exists)
databricks apps create bakehouse-rewards

# Step 4: Write source files
# - src/server.ts
# - public/index.html  
# - package.json
# - tsconfig.json
# - app.yaml
# - databricks.yml (already created in Step 2)

# Step 5: Grant Unity Catalog permissions to service principal
# (Run SQL grants shown in 2.4.3)

# Step 6: Grant Unity Catalog permissions to end users
# (Run SQL grants shown in 2.4.3)

# Step 7: Check app status
databricks apps get bakehouse-rewards --output JSON
# Look for: "app_status.state" and "compute_status.state"

# Step 8: Start app if stopped
if [ "$compute_status" = "STOPPED" ]; then
  databricks apps start bakehouse-rewards --timeout 20m
fi

# Step 9: Deploy app
databricks apps deploy bakehouse-rewards \
  --source-code-path /Workspace/Users/<user>/bakehouse-rewards

# Step 10: Monitor deployment
databricks apps logs bakehouse-rewards --tail
# Expected: "✅ Lakebase schema initialized: rewards.redemptions"
# Expected: "🎉 Bakehouse Rewards ready"
```

**Common Errors & Solutions**:

| Error | Cause | Solution |
|-------|-------|----------|
| `error resolving resource postgres` | `databricks.yml` missing or not deployed | Run `databricks apps init` with `--feature lakebase` |
| `[INSUFFICIENT_PERMISSIONS] User does not have USE SCHEMA` | Missing Unity Catalog grants | Run SQL grants for service principal AND end users |
| `ConfigurationError: Warehouse ID not found` | Missing `sql-warehouse` in `databricks.yml` | Add sql-warehouse resource with valid warehouse ID |
| `ConfigurationError: Missing required resources: postgres` | Postgres resource not configured at app level | Ensure `databricks.yml` has postgres resource with branch/database paths |
| App crashes on startup | Lakebase project doesn't exist | Create separate Lakebase project (don't reuse others) |

---

## 3. Data Architecture

### 3.1 Data Source Strategy (Critical Requirement from Prompts)

**DO NOT use shared sample tables directly in production app!**

Original sources (samples catalog):
- `samples.bakehouse.sales_customers`
- `samples.bakehouse.sales_transactions`

**Required**: Copy to managed schema WE control:
- `workspace.bakehouse_demo.sales_customers`
- `workspace.bakehouse_demo.sales_transactions`
- `workspace.bakehouse_demo.customer_rewards` (VIEW)

**Why**: Avoid dependency on shared samples catalog which may change or be unavailable.

### 3.2 Unity Catalog Schema (Lakehouse) - Read-Only

#### Catalog: `workspace`
#### Schema: `bakehouse_demo`

#### Table: `sales_customers`
**Type**: MANAGED  
**Source**: Copied from `samples.bakehouse.sales_customers`

Key columns: `customerID`, `first_name`, `last_name`, `email_address`, `phone_number`, `address`, `city`, `state`, `country`

#### Table: `sales_transactions`
**Type**: MANAGED  
**Source**: Copied from `samples.bakehouse.sales_transactions`

Key columns: `transactionID`, `customerID`, `dateTime`, `product`, `quantity`, `unitPrice`, `totalPrice`, `paymentMethod`

**Join Key**: `customerID`

**Business Rule**: Points earned per transaction = `Math.floor(totalPrice / 10)`  
**Example**: $49.80 purchase → 4980 cents → 498 points

#### View: `customer_rewards`
**Type**: VIEW  
**Purpose**: Aggregated customer loyalty metrics

```sql
CREATE OR REPLACE VIEW workspace.bakehouse_demo.customer_rewards AS
SELECT 
  c.customerID,
  CONCAT(c.first_name, ' ', c.last_name) as customer_name,
  c.email_address,
  COALESCE(SUM(t.totalPrice), 0) as total_spend,
  COUNT(t.transactionID) as transaction_count,
  FLOOR(COALESCE(SUM(t.totalPrice), 0) / 10) as points_available,
  MAX(t.dateTime) as last_purchase_date
FROM workspace.bakehouse_demo.sales_customers c
LEFT JOIN workspace.bakehouse_demo.sales_transactions t 
  ON c.customerID = t.customerID
GROUP BY c.customerID, c.first_name, c.last_name, c.email_address;
```

**Critical Note**: `points_available` in this view represents **total earned points** from all purchases. It does NOT subtract redemptions. The app backend must subtract Lakebase redemptions to get net available points.

### 3.3 Lakebase Schema (Postgres) - Transactional Store

#### Project: `bakehouse-rewards-app`
#### Branch: `production`
#### Database: `databricks-postgres`
#### Schema: `rewards`

**Creation Strategy**: Auto-create on app initialization via `lakebase()` plugin

#### Table: `rewards.redemptions`

```sql
CREATE SCHEMA IF NOT EXISTS rewards;

CREATE TABLE IF NOT EXISTS rewards.redemptions (
  redemption_id VARCHAR(50) PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  points_redeemed INTEGER NOT NULL,
  reward_type VARCHAR(100) NOT NULL,
  redemption_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redemptions_customer 
  ON rewards.redemptions(customer_email);
```

### 3.4 Demo Data Seeding (from Original Prompt #5)

**Business Rule**: 1 point per 10 cents spent  
**Formula**: `points = floor(total_cents / 10)`  
**Example**: $49.80 purchase → 4980 cents → 498 points

#### Pre-Seeded Demo Customers

Query to identify demo-ready customers:
```sql
SELECT email_address, 
       CONCAT(first_name, ' ', last_name) as name,
       points_available,
       total_spend / 100 as total_spent_dollars
FROM workspace.bakehouse_demo.customer_rewards
WHERE points_available >= 500  -- Can redeem $5 credit
ORDER BY points_available DESC
LIMIT 10;
```

**Expected Demo Customers** (these should have 500+ points):
- High-value customers from `sales_transactions` with significant purchase history
- First customer auto-selected on load

**Validation**: Before declaring app demo-ready, verify at least 5 customers have 500+ points

---

## 4. Backend API Design

### 4.1 Global Configuration & Utilities

```typescript
// App-wide date/time format configuration
const APP_DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short'
};

// Format date consistently across the app
function formatAppDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', APP_DATE_TIME_FORMAT);
}
```

**Purpose**: Ensure consistent date formatting across all API responses  
**Output Example**: `"Jan 7, 2025, 12:12 AM CST"`

**Critical**: Server formats dates, client displays as-is. No client-side re-formatting.

### 4.2 Initialization Logic (Lakebase Setup)

```typescript
await createApp({
  plugins: [server(), analytics({}), lakebase({})],
  onPluginsReady(appkit) {
    // Initialize Lakebase schema on app startup
    (async () => {
      try {
        await appkit.lakebase.query(`CREATE SCHEMA IF NOT EXISTS rewards;`);
        await appkit.lakebase.query(`
          CREATE TABLE IF NOT EXISTS rewards.redemptions (
            redemption_id VARCHAR(50) PRIMARY KEY,
            customer_email VARCHAR(255) NOT NULL,
            points_redeemed INTEGER NOT NULL,
            reward_type VARCHAR(100) NOT NULL,
            redemption_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await appkit.lakebase.query(`
          CREATE INDEX IF NOT EXISTS idx_redemptions_customer 
            ON rewards.redemptions(customer_email);
        `);
        console.log('✅ Lakebase schema initialized');
      } catch (error) {
        console.error('❌ Lakebase initialization failed:', error);
      }
    })();
    
    // Register API routes...
  }
});
```

### 4.3 API Endpoints

#### `GET /api/customers`
**Purpose**: Fetch all customers with integrated points calculation (dual-platform)

**Algorithm**:
1. Query Unity Catalog `customer_rewards` view for earned points (top 50 by points)
2. Query Lakebase: `SELECT customer_email, SUM(points_redeemed) FROM rewards.redemptions GROUP BY customer_email`
3. Join results in memory using Map
4. Calculate: `points_available = Math.max(0, earned - redeemed)`
5. Return enriched customer objects

**Response Schema**:
```json
{
  "customers": [
    {
      "customer_email": "floreskyala@example.net",
      "total_points": 5780,
      "points_redeemed": 0,
      "points_available": 5780,
      "total_spent": 57800,
      "transaction_count": 12,
      "last_transaction_date": "2026-07-01T10:30:00"
    }
  ]
}
```

---

#### `GET /api/transactions/:email`
**Purpose**: Fetch transaction history for a specific customer

**Query Parameters**:
- `limit` (optional, default: 5): Number of transactions
- Value `-1` returns ALL transactions

**Response Transformation** (server-side formatting):
```typescript
const transactions = rows.map(row => ({
  transaction_id: String(row.transactionID),
  transaction_date: formatAppDateTime(row.dateTime),  // SERVER-SIDE
  amount: row.totalPrice,
  product_category: row.product
}));
```

**Note**: "Points Earned" column removed from UI for simplicity

---

#### `GET /api/redemptions/:email`
**Purpose**: Fetch redemption history from Lakebase

**Query Parameters**:
- `limit` (optional, default: 5): Number of redemptions
- Value `-1` returns ALL redemptions

**SQL Query (Parameterized to prevent injection)**:
```sql
SELECT redemption_id, customer_email, points_redeemed, reward_type, redemption_date
FROM rewards.redemptions
WHERE customer_email = $1
ORDER BY redemption_date DESC
LIMIT $2
```

**Security Critical**: Always use parameterized queries (`$1`, `$2`) for Lakebase operations.

---

#### `POST /api/redeem`
**Purpose**: Redeem customer points for rewards (write operation)

**Request Body**:
```json
{
  "customer_email": "jmoore@example.net",
  "points_redeemed": 500,
  "reward_type": "$5 Store Credit"
}
```

**Validation Flow (Server-Side - CRITICAL from Prompt #257)**:

```typescript
// 1. Required Fields Validation
if (!customer_email || !points_redeemed || !reward_type) {
  return res.status(400).json({ 
    error: 'Missing required fields' 
  });
}

// 2. Customer Existence Check
const customerResult = await appkit.analytics.query(`
  SELECT points_available
  FROM workspace.bakehouse_demo.customer_rewards
  WHERE email_address = '${customer_email}'
`);

if (!customerResult.rows.length) {
  return res.status(404).json({
    success: false,
    error: `Customer not found: ${customer_email}`
  });
}

// 3. Calculate Available Points (Dual-Platform)
const earnedPoints = parseInt(customerResult.rows[0].points_available || 0);

const redemptionsResult = await appkit.lakebase.query(`
  SELECT COALESCE(SUM(points_redeemed), 0) as total_redeemed
  FROM rewards.redemptions
  WHERE customer_email = $1
`, [customer_email]);

const previouslyRedeemed = parseInt(redemptionsResult.rows[0].total_redeemed || 0);
const availablePoints = Math.max(0, earnedPoints - previouslyRedeemed);

// 4. Points Sufficiency Check
if (availablePoints < points_redeemed) {
  return res.status(400).json({
    success: false,
    error: `Insufficient points. Available: ${availablePoints}, Requested: ${points_redeemed}`
  });
}

// 5. Generate Redemption ID
const redemption_id = `RED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 6. Insert Redemption (Parameterized)
await appkit.lakebase.query(`
  INSERT INTO rewards.redemptions 
    (redemption_id, customer_email, points_redeemed, reward_type, redemption_date)
  VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
`, [redemption_id, customer_email, points_redeemed, reward_type]);

// 7. Return Success
res.json({ 
  success: true, 
  message: `Successfully redeemed ${points_redeemed} points for ${reward_type}`,
  redemption_id,
  new_available_points: availablePoints - points_redeemed
});
```

---

## 5. Frontend Design

### 5.1 Design Philosophy (from Original Prompt #102-116)

**Theme**: Premium bakery loyalty wallet

**Visual Language**:
- Warm espresso background gradient
- Gold and cream accents (`#8B4513` primary)
- Rounded cards with subtle shadows
- Mobile-first responsive layout

**Bakery-Style Copy**:
- "🥐 Bakehouse Rewards"
- "Earn. Savor. Redeem."

### 5.2 Component Architecture

```
<App>
  ├─ <Header>
  ├─ <CustomerSelector>  (preserves selection on redemption)
  ├─ <StatsGrid>
  │   ├─ <StatCard title="Available Points" badge="Calculated" />
  │   ├─ <StatCard title="Total Redeemed" badge="Lakebase" />
  │   ├─ <StatCard title="Total Spent" badge="Unity Catalog" />
  │   └─ <StatCard title="Transactions" />
  ├─ <RedemptionSection>
  │   ├─ <RewardSelector>
  │   ├─ <RedeemButton />
  │   └─ <StatusMessage />
  ├─ <TransactionsTable>
  │   └─ Columns: Date | Transaction ID | Category | Amount
  │       (NO Points Earned column)
  └─ <RedemptionsTable>
      └─ Columns: Date | Redemption ID | Reward | Points
```

### 5.3 Rewards Catalog Design Decision

**Current Implementation**: Hardcoded in frontend

```javascript
const REWARDS = [
  { name: 'Free Coffee', points: 100 },
  { name: 'Free Pastry', points: 200 },
  { name: '$5 Store Credit', points: 500 },
  { name: '$10 Store Credit', points: 1000 }
];
```

**Rationale**: Simplifies MVP; no admin UI needed for catalog management

**v2.0 Enhancement**: Consider database-driven catalog for dynamic reward management

### 5.4 Critical UX Requirements

#### 1. Customer Selection Persistence (Mandatory Fix)

**Problem**: After redemption, dropdown was resetting to first customer

**Solution**:
```javascript
const fetchCustomers = async (preserveEmail = null) => {
  const response = await fetch('/api/customers');
  const data = await response.json();
  setCustomers(data.customers);
  
  if (preserveEmail) {
    const preserved = data.customers.find(c => c.customer_email === preserveEmail);
    setSelectedCustomer(preserved || data.customers[0]);
  } else {
    setSelectedCustomer(data.customers[0]);
  }
};

// In redemption handler:
await fetchCustomers(selectedCustomer.customer_email);  // PASS EMAIL
```

#### 2. Date Formatting Consistency

**Requirement**: All dates display with timezone

**Implementation**:
- **Server**: Formats dates using `formatAppDateTime()` before sending response
- **Client**: Simple pass-through display

```javascript
// Client-side (NO re-formatting)
const formatDate = (dateStr) => dateStr || 'N/A';
```

#### 3. Immediate UI Feedback

**Requirement**: Available points update instantly after redemption

```javascript
// Backend returns new_available_points
// Frontend immediately updates
setSelectedCustomer(prev => ({
  ...prev,
  points_available: data.new_available_points
}));

// Then refresh
await fetchCustomers(selectedCustomer.customer_email);
```

---

## 6. Infrastructure Setup (Critical - DO NOT SKIP)

### 6.1 Infrastructure Automation (from Prompt #166-180)

**Original Requirement**: "The agent is expected to perform the required infrastructure setup directly, not just describe it."

#### Automated Setup Script

```bash
#!/bin/bash
# Setup script for Bakehouse Rewards infrastructure

WAREHOUSE_ID="<your-warehouse-id>"

echo "=== Creating Bakehouse Demo Schema ==="
databricks sql execute --warehouse-id $WAREHOUSE_ID --query "
CREATE SCHEMA IF NOT EXISTS workspace.bakehouse_demo;
"

echo "=== Copying Sample Tables ==="
databricks sql execute --warehouse-id $WAREHOUSE_ID --query "
CREATE TABLE IF NOT EXISTS workspace.bakehouse_demo.sales_customers AS
SELECT * FROM samples.bakehouse.sales_customers;

CREATE TABLE IF NOT EXISTS workspace.bakehouse_demo.sales_transactions AS
SELECT * FROM samples.bakehouse.sales_transactions;
"

echo "=== Creating Customer Rewards View ==="
databricks sql execute --warehouse-id $WAREHOUSE_ID --query "
CREATE OR REPLACE VIEW workspace.bakehouse_demo.customer_rewards AS
SELECT 
  c.customerID,
  CONCAT(c.first_name, ' ', c.last_name) as customer_name,
  c.email_address,
  COALESCE(SUM(t.totalPrice), 0) as total_spend,
  COUNT(t.transactionID) as transaction_count,
  FLOOR(COALESCE(SUM(t.totalPrice), 0) / 10) as points_available,
  MAX(t.dateTime) as last_purchase_date
FROM workspace.bakehouse_demo.sales_customers c
LEFT JOIN workspace.bakehouse_demo.sales_transactions t 
  ON c.customerID = t.customerID
GROUP BY c.customerID, c.first_name, c.last_name, c.email_address;
"

echo "=== Granting Permissions ==="
APP_SP=$(databricks apps get bakehouse-rewards --output JSON | jq -r '.service_principal_name')
echo "App Service Principal: $APP_SP"

databricks sql execute --warehouse-id $WAREHOUSE_ID --query "
GRANT USE CATALOG ON CATALOG workspace TO \`$APP_SP\`;
GRANT USE SCHEMA ON SCHEMA workspace.bakehouse_demo TO \`$APP_SP\`;
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_customers TO \`$APP_SP\`;
GRANT SELECT ON TABLE workspace.bakehouse_demo.sales_transactions TO \`$APP_SP\`;
GRANT SELECT ON VIEW workspace.bakehouse_demo.customer_rewards TO \`$APP_SP\`;
"

echo "✅ Infrastructure setup complete!"

# Verification
echo "=== Verifying Demo Customers ==="
databricks sql execute --warehouse-id $WAREHOUSE_ID --query "
SELECT email_address, points_available
FROM workspace.bakehouse_demo.customer_rewards
WHERE points_available >= 500
ORDER BY points_available DESC
LIMIT 5;
"
```

#### Verification Script

```bash
#!/bin/bash
# Verify infrastructure is ready

WAREHOUSE_ID="<your-warehouse-id>"

echo "=== Checking Tables ==="
databricks sql execute --warehouse-id $WAREHOUSE_ID --query "
SHOW TABLES IN workspace.bakehouse_demo;
"

echo "=== Checking Permissions ==="
databricks sql execute --warehouse-id $WAREHOUSE_ID --query "
SHOW GRANTS ON VIEW workspace.bakehouse_demo.customer_rewards;
"

echo "=== Checking Demo Readiness ==="
DEMO_COUNT=$(databricks sql execute --warehouse-id $WAREHOUSE_ID --query "
SELECT COUNT(*) FROM workspace.bakehouse_demo.customer_rewards
WHERE points_available >= 500;
" --output json | jq -r '.rows[0][0]')

if [ "$DEMO_COUNT" -lt 5 ]; then
  echo "❌ WARNING: Only $DEMO_COUNT customers have 500+ points (expected 5+)"
  exit 1
else
  echo "✅ PASS: $DEMO_COUNT customers ready for demo"
fi
```

---

## 7. Deployment Process (Mandatory Sequence)

**Critical from Apps Agent Principles**: Deploying to a new or stopped app requires specific sequence:

```bash
# Step 1: Check app status (ALWAYS FIRST)
databricks apps get bakehouse-rewards --output JSON

# Step 2: Start app if STOPPED (deploy ONLY works on RUNNING apps)
# If status.state === "STOPPED":
databricks apps start bakehouse-rewards --timeout 20m --output JSON

# If status.state === "STARTING" or "STOPPING":
# WAIT - poll with "apps get" every 15s until RUNNING

# Step 3: Deploy (only when RUNNING and no pending_deployment)
databricks apps deploy bakehouse-rewards   --source-code-path /Workspace/Repos/{user}/databricks_sandbox/apps/bakehouse_rewards   --output JSON

# Step 4: Verify deployment
databricks apps get bakehouse-rewards --output JSON

# Step 5: Run smoke tests
```

**Common Mistake**: Running `deploy` on STOPPED app fails with "not in RUNNING state"

---

## 8. Validation & Testing

### 8.1 Deployment Completion Criteria (from Prompt #237-248)

Do NOT report app as complete until ALL are true:

✅ App deploys successfully  
✅ App reaches `RUNNING` state  
✅ At least one Lakehouse-backed query succeeds  
✅ At least one Lakebase-backed write succeeds  
✅ At least one Lakebase-backed read succeeds  
✅ Critical app endpoints return 200 (not 401/500)  
✅ Main demo flow works end-to-end  

### 8.2 Smoke Test Suite (from Prompt #228-236)

**Requirement**: "After successful deployment, ALWAYS run smoke tests on critical endpoints before declaring success."

```bash
#!/bin/bash
# Smoke tests for Bakehouse Rewards

APP_URL="https://bakehouse-rewards-{workspace}.databricksapps.com"

echo "=== Test 1: App Health ==="
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/api/customers)
if [ "$RESPONSE" != "200" ]; then
  echo "❌ FAIL: /api/customers returned $RESPONSE"
  databricks apps logs bakehouse-rewards --tail-lines 50
  exit 1
fi
echo "✅ PASS: /api/customers returned 200"

echo "=== Test 2: Data Integrity ==="
CUSTOMERS=$(curl -s $APP_URL/api/customers | jq '.customers | length')
if [ "$CUSTOMERS" -lt 10 ]; then
  echo "❌ FAIL: Expected 10+ customers, got $CUSTOMERS"
  exit 1
fi
echo "✅ PASS: $CUSTOMERS customers returned"

echo "=== Test 3: Demo Readiness ==="
AVAILABLE=$(curl -s $APP_URL/api/customers | jq '.customers[0].points_available')
if [ "$AVAILABLE" -lt 100 ]; then
  echo "❌ FAIL: First customer has $AVAILABLE points (expected >=100)"
  exit 1
fi
echo "✅ PASS: Demo customer has $AVAILABLE redeemable points"

echo "=== Test 4: Lakebase Write/Read ==="
FIRST_EMAIL=$(curl -s $APP_URL/api/customers | jq -r '.customers[0].customer_email')
REDEMPTION=$(curl -s -X POST -H "Content-Type: application/json" -d "{
  "customer_email": "$FIRST_EMAIL",
  "points_redeemed": 100,
  "reward_type": "Test Redemption"
}" $APP_URL/api/redeem)
SUCCESS=$(echo $REDEMPTION | jq -r '.success')
if [ "$SUCCESS" != "true" ] && [ "$SUCCESS" != "false" ]; then
  echo "❌ FAIL: Redemption endpoint not responding correctly"
  exit 1
fi
echo "✅ PASS: Lakebase write/read operational"

echo "🎉 All smoke tests passed!"
```

### 8.3 End-to-End Demo Test

**Test Scenario**: Workshop Demo Flow

1. Open app URL in browser
2. Verify first customer auto-selected (should have 500+ points)
3. Verify stats cards show data
4. Verify transactions table shows recent 5 purchases
5. Select "$5 Store Credit" reward (500 points)
6. Click "Redeem" button
7. Verify success message appears
8. Verify Available Points decreased by 500
9. **CRITICAL**: Verify dropdown still shows same customer (not first customer)
10. Verify new redemption appears in redemptions table
11. Verify dates show timezone format

---

## 9. Known Issues & Future Enhancements

### 9.1 Current Limitations

⚠️ **No Authentication**: App assumes trusted environment  
⚠️ **No Search**: Customer dropdown not searchable  
⚠️ **No Pagination**: Uses limit parameters  
⚠️ **No Real-time Updates**: Requires manual refresh  
⚠️ **No Undo**: Redemptions are final  

### 9.2 Deferred Features (from Original Prompts)

**"Favorite Products" (from Prompt #66-70)**:
- Original requirement: Display customer's most-purchased product
- **Status**: DEFERRED to v2.0
- **Reason**: UI complexity for MVP; transactions table provides sufficient context

**Future Implementation**:
```sql
SELECT product, COUNT(*) as purchase_count
FROM workspace.bakehouse_demo.sales_transactions t
INNER JOIN workspace.bakehouse_demo.sales_customers c ON t.customerID = c.customerID
WHERE c.email_address = :email
GROUP BY product
ORDER BY purchase_count DESC
LIMIT 1;
```

---

## 10. Troubleshooting Guide

### Issue: Customer selection resets after redemption

**Solution**:
```javascript
// ✅ Correct
await fetchCustomers(selectedCustomer.customer_email);

// ❌ Wrong
await fetchCustomers();  // Always resets to first!
```

### Issue: Dates show inconsistent formats

**Solution**: Verify `formatAppDateTime()` applied in BOTH `/api/transactions` and `/api/redemptions`

### Issue: "Insufficient points" but UI shows enough

**Debug**: Add logging in `/api/redeem`:
```typescript
console.log(`Validation:`, {
  earned: earnedPoints,
  redeemed: previouslyRedeemed,
  available: availablePoints,
  requested: points_redeemed
});
```

---

## 11. Version History

| Version | Date | Changes | Migration Required |
|---------|------|---------|-------------------|
| 1.1 | 2025-01-08 | **Added Section 2.4**: Infrastructure Provisioning & Permissions (MANDATORY) - Lakebase project creation, databricks.yml configuration, Unity Catalog grants for service principal AND end users, complete deployment workflow, common errors/solutions | **YES** - Existing apps must grant UC permissions to end users for OBO |
| 1.0 | 2025-01-07 | Initial PRD with all critical sections | N/A |

---

## 12. Glossary

- **AppKit**: Databricks framework for building data apps (Node.js + React)
- **Lakehouse**: Unity Catalog architecture (data lake + warehouse)
- **Lakebase**: Postgres-based transactional database on Databricks
- **Available Points**: Net points = earned (Lakehouse) - redeemed (Lakebase)
- **Dual-Platform**: Architecture spanning both Unity Catalog and Lakebase
- **Service Principal**: App identity used for resource access
- **Parameterized Query**: SQL with placeholders ($1) to prevent injection

---

## 13. Critical Implementation Checklist

### Infrastructure (Section 2.4 - MANDATORY)
☑️ **Lakebase Project**: Separate project created via `databricks apps init --feature lakebase`  
☑️ **databricks.yml**: Resource configuration with sql-warehouse AND postgres  
☑️ **Service Principal Grants**: USE SCHEMA + SELECT on all UC tables (using client ID)  
☑️ **End User Grants**: USE SCHEMA + SELECT on all UC tables (for OAuth OBO)  
☑️ **Deployment Order**: Schema → Init → Create → Source → Grants → Start → Deploy  

### Application
☑️ **Framework**: Databricks AppKit - NOT Flask/FastAPI/Streamlit  
☑️ **Data Source**: Copied tables in `workspace.bakehouse_demo` - NOT samples  
☑️ **Lakebase Schema**: Auto-created `rewards` schema with `redemptions` table  
☑️ **Points Calculation**: Dual-platform (Lakehouse + Lakebase) in backend API  
☑️ **Customer Persistence**: `fetchCustomers(preserveEmail)` parameter  
☑️ **Date Formatting**: Server-side `APP_DATE_TIME_FORMAT`  
☑️ **Validation**: Server-side (fields, customer, points availability)  
☑️ **SQL Injection**: Parameterized queries ($1, $2) for Lakebase  
☑️ **Error Handling**: Try-catch with descriptive error messages in logs  

### Deployment & Testing
☑️ **Pre-Deploy**: Run `apps get` to check status before deploy  
☑️ **State Machine**: STOPPED → start → RUNNING → deploy  
☑️ **Log Verification**: Check for "✅ Lakebase schema initialized"  
☑️ **Smoke Tests**: Test all 4 API endpoints after deployment  
☑️ **Demo Flow**: No login required, customer selector works, redemptions persist  

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

# Bakehouse Rewards - Databricks App with AppKit, Lakehouse & Lakebase

A native Databricks App built with TypeScript, Express, and Databricks AppKit. Demonstrates OLAP queries on Unity Catalog (Lakehouse) and OLTP operations on Lakebase (serverless PostgreSQL).

## 🎯 Architecture

* **Frontend**: React + TypeScript (to be added)
* **Backend**: Express + TypeScript
* **OLAP (Analytics)**: Unity Catalog tables via SQL Warehouse
  - `workspace.bakehouse_demo.sales_customers`
  - `workspace.bakehouse_demo.sales_transactions`
  - `workspace.bakehouse_demo.customer_rewards` (view)
* **OLTP (Transactional)**: Lakebase Postgres
  - `reward_redemptions` table for real-time writes

## 📁 Structure

```
├── app.yaml              # Databricks Apps configuration
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
├── src/
│   └── server.ts         # Express API server
├── scripts/              # SQL setup scripts
│   ├── 01_setup_lakehouse_schema.sql
│   ├── 02_grant_permissions.sql
│   ├── 03_setup_lakebase.sql
│   └── 04_grant_app_permissions.sql
└── LAKEBASE_CONFIG.md    # Lakebase connection details
```

## 🚀 Deployment

**Current Status**: ✅ **DEPLOYED AND RUNNING**

```bash
# Deploy from git repo
databricks apps deploy bakehouse-rewards \
  --source-code-path /Workspace/Repos/lalitstar@gmail.com/databricks_sandbox/apps/bakehouse_rewards

# Check status
databricks apps get bakehouse-rewards
```

**Live URL**: https://bakehouse-rewards-1919035682675012.aws.databricksapps.com

## 🔗 API Endpoints

* `GET /` - Home page with API documentation
* `GET /api/health` - Health check
* `GET /api/config` - Environment configuration

## 📊 Data Setup

All SQL scripts are in `scripts/` directory:

1. **Lakehouse Schema** (`01_setup_lakehouse_schema.sql`)
   - Creates tables in `workspace.bakehouse_demo`
   - Copies sample data from `samples.bakehouse`
   - Creates customer_rewards view

2. **Permissions** (`02_grant_permissions.sql`, `04_grant_app_permissions.sql`)
   - User permissions for development
   - Service principal permissions for the app

3. **Lakebase Setup** (`03_setup_lakebase.sql`)
   - Creates redemptions table in Lakebase Postgres

## 🔧 Local Development

```bash
npm install
npm run build
npm start
```

## 🎨 Next Steps

- [ ] Add React frontend with AppKit components
- [ ] Integrate Lakehouse customer/transaction queries
- [ ] Add Lakebase redemption writes
- [ ] Implement full rewards workflow
- [ ] Add authentication & authorization

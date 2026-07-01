# Bakehouse Rewards Demo Execution Prompt

Build a simple Databricks App called `Bakehouse Rewards` focused on a customer rewards redemption demo.

## Github
Use branch `databricks_app__bakehouse_rewards` from https://github.com/productiveAnalytics/databricks_sandbox.git 
Use the existing folder structure `apps/bakehouse_rewards/` as the root of the project

## Goal

Create a mobile-friendly browser experience that lets a demo user:

- open the rewards app without logging in
- select a customer from a small demo list
- see available rewards points
- view favorite products and recent purchase context
- redeem a reward
- see redemption history update immediately

Keep the app visually polished, warm, and bakery-themed.

## Core Build Scope

Build only the initial MVP:

- customer rewards home
- reward redemption page
- simple redemption history

Do not build advanced personalization or complex recommendations.

## Execution Assumption

Assume the plan has already been approved.

Proceed directly with implementation.
Do not return a new plan unless blocked.

## Lakebase Setup

Create a Lakebase/Postgres instance for app writeback.

Use it for:

- reward redemptions

Create an app-owned table such as:

- `app.reward_redemptions`

The app should write redemption events to Lakebase and read them back for redemption history.

## Rewards Demo Flow

The app should support a simple demo flow without requiring user login.

### Demo Entry

- open the app directly
- present a customer selector for workshop/demo purposes

### Demo Customer Experience

For the selected customer, show:

- customer name
- points available
- total spend
- favorite product
- recent purchases

### Redemption Flow

Allow the demo user to redeem simple rewards such as:

- Free croissant
- Free coffee
- Pastry box

When a reward is redeemed:

1. validate that the customer has enough points
2. write the redemption to Lakebase
3. update the available points view
4. show the redemption in history

## Seeded Demo State

Set up the demo so some customers already have enough points to redeem rewards.

Use Bakehouse purchase history to calculate points from real sample transactions.

Suggested rule:

- `points = 10 x dollars spent`

Pick a few customers from the copied Bakehouse data whose historical spend gives them enough points for at least one reward.

The app should default to one of these redeemable customers so the demo works immediately.

## UX And Look

Make the app feel like a premium bakery loyalty wallet:

- warm espresso background
- gold and cream accents
- rounded cards
- mobile-first layout
- polished rewards card at the top

Use bakery-style language like:

- `Rewards wallet`
- `Earn. Savor. Redeem.`
- `Baked with love`

## Required Stack

This app must be built as a Databricks AppKit application.

Databricks AppKit is a real, official Databricks Apps framework.
It is a Node.js + React SDK, not a Python package.
Use the npm packages:

- `@databricks/appkit`
- `@databricks/appkit-ui`

## AppKit Reference

Use Databricks AppKit from:

- [https://github.com/databricks/appkit](https://github.com/databricks/appkit)

If uncertain about setup, package names, project structure, or implementation approach, follow the official Databricks AppKit repository and documentation structure.
If an existing AppKit reference implementation is available in the repo, follow that structure closely.

Do not search for AppKit on PyPI.
Do not reinterpret AppKit as Streamlit, Flask, Gradio, or any Python framework.

If the implementation does not use Databricks AppKit as the primary framework, it is incorrect.

Use:
- Databricks AppKit
- `@databricks/appkit`
- `@databricks/appkit-ui`
- React
- TypeScript
- AppKit UI components
- AppKit analytics queries for Lakehouse reads
- Lakebase for redemption writeback

Do not use:
- Flask
- FastAPI
- Streamlit
- Gradio
- Next.js
- Django
- any separate Python web server
- any alternate frontend/backend stack

Build this as a single AppKit-based Databricks App.
Do not substitute another framework.

## Infra Permissions And Setup Requirements

The agent is expected to perform the required infrastructure setup directly, not just describe it.

It must:

- create any required Lakehouse schema, copied tables, and managed sample data structures
- create any required Lakebase project, branch, database, and application tables
- grant all required permissions to the Databricks App service principal
- grant any required permissions to workspace users for demo and testing
- update the app configuration to reference the created resources correctly

Do not stop after code generation if infrastructure is missing.
Do not report success if infrastructure exists only partially.
Do not leave permissions as a manual follow-up unless explicitly blocked by platform limitations.
If blocked, report the exact blocking step and exact command or permission needed.

## Managed Data Requirement

Do not use shared sample tables directly in the final app.

Create app specific Lakebase (Postgres) project. Copy required sample data into the schema we control and point the app to that Lakebase schema.

Use these source tables:

- `samples.bakehouse.sales_customers`
- `samples.bakehouse.sales_transactions`

Suggested managed schema in Lakehouse:

- `bakehouse_demo`

Create:

- `bakehouse_demo.sales_customers`
- `bakehouse_demo.sales_transactions`

Verify that the app service principal has:

- `USE CATALOG`
- `USE SCHEMA`
- `SELECT`

on the copied tables needed by the app.

## Lakebase Requirement

If the app requires reward redemption persistence, creating and configuring Lakebase is part of the required build scope.

Do not replace Lakebase with an in-memory fallback unless explicitly asked to do so.
In-memory fallback is acceptable only for temporary local development, not as the final delivered app behavior.

## Required Access Validation

Before declaring success, verify that:

- the app service principal can read the managed Lakehouse tables
- the app can access the configured SQL warehouse
- the app can connect to the configured Lakebase database
- the app can read analytics data successfully
- the app can write at least one redemption record successfully

## App Deployment Tests

After successful deployment, ALWAYS run smoke tests on critical endpoints before declaring success. 

For data-backed apps, verify:
- API endpoints return 200 (not 401/500)
- At least one data query succeeds
- Resource configurations (SQL warehouse, Lakebase) are accessible
- If smoke tests fail, investigate logs/config and fix before reporting success to the user.

## Deployment Completion Criteria

Do not report the app as complete until all of the following are true:

- the app deploys successfully
- the app reaches `RUNNING` state
- at least one Lakehouse-backed query succeeds from the app
- at least one Lakebase-backed write succeeds from the app
- at least one Lakebase-backed read succeeds from the app
- critical app endpoints return successful responses
- the main demo flow works end-to-end

## Deliverable

Produce a working Databricks App MVP where:

- customer history comes from copied Lakehouse tables in our managed schema
- redemptions are stored in Lakebase tables
- the demo can be shown without login
- at least some demo customers can redeem rewards immediately
- after the successful redemption of rewards, Lakebase database are updated and the UI reflects with revised rewards points
- perform basic run-time validations like redemption is not allowed if there are not enough rewards in the Lakebase database to redeem

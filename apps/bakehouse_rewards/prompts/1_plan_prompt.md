# Bakehouse Rewards Plan-First Prompt

## Github
Use Github branch: `databricks_app__bakehouse_rewards` from https://github.com/productiveAnalytics/databricks_sandbox
Use existing folder structure `apps/bakehouse_rewards/` as the root of this project

## Databricks AppKit

Use Databricks AppKit only.

Databricks AppKit is a real, official Databricks Apps framework.
It is a Node.js + React SDK, not a Python package.
Use the npm packages:

- `@databricks/appkit`
- `@databricks/appkit-ui`

## Databricks AppKit Reference

Use Databricks AppKit from:

- [https://github.com/databricks/appkit](https://github.com/databricks/appkit)

If uncertain about setup, package names, project structure, or implementation approach, follow the official Databricks AppKit repository and documentation structure.
If an existing AppKit reference implementation is available in the repo, follow that structure closely.

Do not search for AppKit on PyPI.
Do not interpret AppKit as Streamlit, Flask, Gradio, or any Python framework.

Do not use:

- Flask
- FastAPI
- Streamlit
- Gradio
- Next.js
- Django
- any separate Python web server
- any alternate frontend/backend stack

If the implementation does not use Databricks AppKit as the primary framework, it is incorrect.

## Task

Plan a simple Databricks App called `Bakehouse Rewards` for a customer rewards redemption demo.

The app should:

- run as a browser-based mobile-friendly rewards experience
- allow demo use without login
- use a customer selector for workshop purposes
- show available rewards points
- show favorite products and recent purchases
- allow reward redemption
- store redemptions in Lakebase

## Data Requirements

The app must use Bakehouse sample data as the source, but must not use the shared sample tables directly in the final app.

Plan to:

- create a managed schema we control
- copy `samples.bakehouse.sales_customers` into that schema
- copy `samples.bakehouse.sales_transactions` into that schema
- point app analytics queries to the copied tables
- grant the Databricks App service principal the required access

## Lakebase Requirement

Plan to create and configure Lakebase for persistent reward redemptions.

Do not use an in-memory fallback as the final delivered behavior.

## Response Format

Before building anything, return a short, workshop-friendly execution plan only.

Keep it concise and practical.

Include:

1. app structure 
2. Lakehouse schema and table copy steps
3. Lakebase setup steps
4. required permissions for the app service principal
5. demo seed/data strategy so some customers can redeem immediately
6. deployment validation and smoke-test steps

Do not start implementation yet.
Do not skip infrastructure or permissions planning.
Do not claim success or completion.
Wait for approval after returning the plan.
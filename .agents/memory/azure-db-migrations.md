---
name: Azure production database migrations
description: The app runs on a self-hosted Azure environment — Replit db:push does not touch that database.
---

# Azure production database migrations

**Rule:** When a new DB table is created (e.g. via direct SQL in Replit dev or via `db:push`), the same SQL must be run manually on the Azure production PostgreSQL database. There is no automatic migration pipeline between Replit dev and Azure.

**Why:** The production database lives in Azure (not Replit). Changes to the Drizzle schema or direct SQL in the dev environment do not propagate to Azure automatically. Missing tables cause 500 errors at runtime (Drizzle queries fail with "relation does not exist").

**How to apply:**
- After adding a new table, provide the user with the `CREATE TABLE IF NOT EXISTS ...` SQL to run on Azure.
- Azure Portal → PostgreSQL resource → Query editor, or via `psql` with the Azure connection string.
- This applies to any schema change: new tables, new columns, new indexes.

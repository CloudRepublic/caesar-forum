---
name: Azure Docker dependency installs
description: Package-manager constraint for container builds on the Azure deployment's GitHub runner.
---

**Rule:** Do not use npm to install project dependencies inside this project's Azure Docker build. Use pnpm instead.

**Why:** Both `npm ci` and `npm install`, across multiple npm 10 versions and with audit/funding disabled, reproducibly crashed after about 72 seconds with npm's internal `Exit handler never called!` error. Changing concurrency and separating build stages did not help.

**How to apply:** Import the existing npm lockfile with pnpm during the builder stage, install from the resulting frozen pnpm lockfile, build and prune there, then copy the production `node_modules` into the runtime stage.
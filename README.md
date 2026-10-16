# Silverstone Frontend

Silverstone is a React Native / Expo mobile application for coordinating mobile-money float exchanges between approved agents.

## Current architecture

- Expo SDK 51 / React Native 0.74
- Express REST API + PostgreSQL backend
- SecureStore-backed authentication and sessions
- Main-agent and sub-agent workflows
- Manual agent approval
- Offline-safe/idempotent request handling
- English / Swahili, light / dark themes

The frontend does not use Firebase at runtime.

## Environment

Set EXPO_PUBLIC_API_URL in the root .env file.

## Install and verify

npm ci
npm test
npm run build:check
npx expo config --json

Node 20.19.4 is the supported runtime.

For detailed setup, local verification, architecture decisions and historical handoffs, see SETUP.md, LOCAL-DEVELOPMENT.md and docs/silverstone/.

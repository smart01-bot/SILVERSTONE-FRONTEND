# Silverstone Frontend Setup

## Requirements

- Node.js 20.19.4
- npm
- Expo / EAS CLI access for cloud builds

The repository includes .nvmrc and .node-version for runtime selection.

## Install

npm ci

## Environment

Create a root .env file containing:

EXPO_PUBLIC_API_URL=https://silverstone-backend.onrender.com/api/v1

Do not add Firebase credentials. The frontend communicates with the Silverstone Express REST API.

## Run locally

npm start

For Android:

npm run android

## Verify

npm test
npm run build:check
npx expo config --json

## Android APK

eas build --platform android --profile preview

See LOCAL-DEVELOPMENT.md and docs/silverstone/ for deeper architecture, verification evidence and phase history.

# Float System Management Platform - Frontend Documentation

![React](https://img.shields.io/badge/React-v18.x-blue)
![Vite](https://img.shields.io/badge/Vite-v5.x-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.x-blue)
![Zustand](https://img.shields.io/badge/Zustand-v4.x-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.x-teal)
![Recharts](https://img.shields.io/badge/Recharts-v2.x-green)

The **Float System Management Platform Frontend** is a production-grade React application for managing mobile money float requests, transfers, and analytics for agents across networks like Vodacom, Tigo, Yas, and Halotel. It provides role-based views for admins, main-agents, and sub-agents — covering a public landing page, multi-step onboarding, an agent self-service portal, and a real-time admin control panel.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Setup Instructions](#setup-instructions)
- [Page & Component Structure](#page--component-structure)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Real-Time Updates (SSE)](#real-time-updates-sse)
- [State Management](#state-management)
- [Testing](#testing)
- [Deployment](#deployment)
- [Error Handling](#error-handling)
- [Security](#security)
- [Future Improvements](#future-improvements)
- [Support](#support)

---

## Overview

This frontend powers the client-side of the mobile money float management system, enabling sub-agents to submit float requests, track transfer status, and manage their profiles — while admins and main-agents access a live analytics dashboard, approve requests from the priority queue, and manage the full agent network. It integrates with the backend via REST and Server-Sent Events (SSE). Key features include:

- Public landing page with network coverage and feature highlights.
- Multi-step agent registration and role-based login.
- Sub-agent self-service portal (mobile-first, card-based UI).
- Admin control panel with live SSE dashboard, request queue management, and agent CRUD.
- Comprehensive charts for performance, revenue, and network analytics.

---

## Architecture

### Components

- **React + Vite**: Handles UI rendering and fast HMR development builds.
- **React Router v6**: Client-side routing with role-protected routes.
- **Zustand**: Global state for auth session, cached API data, and SSE-fed live metrics.
- **Axios (API Client)**: Centralized HTTP client with JWT interceptor for all backend requests.
- **SSE (EventSource)**: Native browser API consuming `/api/sse` for real-time dashboard updates.
- **Recharts**: Declarative chart components for monthly activity, network distribution, and top agents.
- **Pages**: Role-scoped views — `landing/`, `auth/`, `agent/`, `admin/`.
- **Components**: Shared UI primitives, chart wrappers, and domain-specific components (request, transfer, agent).
- **Hooks**: Data-fetching hooks that wrap API calls and write to Zustand stores.
- **Lib**: Pure utilities for formatting, network constants, role guards, and validators.

### Directory Structure

```
svc-frontend/
├── public/
│   ├── favicon.svg
│   └── og-image.png
│
├── src/
│   ├── api/
│   │   ├── client.ts                 # Axios instance, base URL, JWT interceptor
│   │   ├── auth.api.ts               # /api/auth/register, /login, /logout
│   │   ├── agents.api.ts             # /api/agents GET, PUT, DELETE
│   │   ├── requests.api.ts           # /api/requests submit, GET, PUT, DELETE
│   │   ├── transfers.api.ts          # /api/transfers process, GET, PUT, DELETE
│   │   ├── dashboard.api.ts          # /api/dashboard/* all 5 analytics endpoints
│   │   └── sse.ts                    # /api/sse EventSource connection + parser
│   │
│   ├── types/
│   │   ├── agent.types.ts            # Agent, Role, Network
│   │   ├── request.types.ts          # FloatRequest, RequestStatus
│   │   ├── transfer.types.ts         # Transfer, TransferStatus
│   │   └── dashboard.types.ts        # RevenueMetrics, MonthlyCounts, etc.
│   │
│   ├── store/
│   │   ├── auth.store.ts             # session, token, agent profile
│   │   ├── requests.store.ts         # cached requests list + optimistic updates
│   │   ├── transfers.store.ts        # cached transfers list
│   │   └── dashboard.store.ts        # live metrics, SSE-fed updates
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                # login / logout / register
│   │   ├── useRequests.ts            # fetch, submit, update, delete requests
│   │   ├── useTransfers.ts           # fetch, process, update transfers
│   │   ├── useDashboard.ts           # all dashboard endpoint calls
│   │   ├── useSSE.ts                 # SSE subscription + reconnect logic
│   │   └── useAgents.ts              # fetch, register, update, delete agents
│   │
│   ├── lib/
│   │   ├── formatters.ts             # fmtTZS, fmtDate, fmtAgo, fmtPct
│   │   ├── network.ts                # NETWORKS const, NET_COLOR map
│   │   ├── roles.ts                  # ROLES const, role guards
│   │   └── validators.ts             # Phone regex, amount validation
│   │
│   ├── router/
│   │   ├── index.tsx                 # createBrowserRouter, root layout
│   │   ├── ProtectedRoute.tsx        # redirects if no token
│   │   └── RoleRoute.tsx             # redirects if wrong role
│   │
│   ├── layouts/
│   │   ├── RootLayout.tsx
│   │   ├── PublicLayout.tsx
│   │   ├── AgentLayout.tsx           # sidebar + topbar for sub-agents
│   │   └── AdminLayout.tsx           # dark terminal sidebar for admin/main-agent
│   │
│   ├── pages/
│   │   ├── landing/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── NetworksSection.tsx
│   │   │   └── CtaBanner.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── RegisterSteps/
│   │   │       ├── Step1Personal.tsx
│   │   │       ├── Step2Role.tsx
│   │   │       └── Step3Confirm.tsx
│   │   │
│   │   ├── agent/
│   │   │   ├── AgentHomePage.tsx
│   │   │   ├── NewRequestPage.tsx
│   │   │   ├── MyRequestsPage.tsx
│   │   │   └── MyTransfersPage.tsx
│   │   │
│   │   └── admin/
│   │       ├── DashboardPage.tsx
│   │       ├── RequestQueuePage.tsx
│   │       ├── TransfersPage.tsx
│   │       └── AgentsPage.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Spinner.tsx
│   │   │
│   │   ├── charts/
│   │   │   ├── ActivityLineChart.tsx
│   │   │   ├── NetworkBarChart.tsx
│   │   │   ├── NetworkDonutChart.tsx
│   │   │   ├── TopAgentsChart.tsx
│   │   │   └── PerformancePanel.tsx
│   │   │
│   │   ├── stat/
│   │   │   ├── StatCard.tsx
│   │   │   └── StatGrid.tsx
│   │   │
│   │   ├── nav/
│   │   │   ├── PublicNavbar.tsx
│   │   │   ├── AgentSidebar.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── Topbar.tsx
│   │   │
│   │   ├── request/
│   │   │   ├── RequestCard.tsx
│   │   │   ├── RequestTable.tsx
│   │   │   ├── RequestActions.tsx
│   │   │   └── NetworkSelector.tsx
│   │   │
│   │   ├── transfer/
│   │   │   ├── TransferCard.tsx
│   │   │   └── TransferTable.tsx
│   │   │
│   │   └── agent/
│   │       ├── AgentTable.tsx
│   │       └── RegisterAgentModal.tsx
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tokens.css
│   │   └── animations.css
│   │
│   ├── main.tsx
│   └── App.tsx
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

---

## Technologies

- **React**: v18.x for UI rendering and component architecture
- **Vite**: v5.x for fast dev server and production bundling
- **TypeScript**: v5.x for type safety across all layers
- **React Router**: v6.x for client-side routing with nested layouts
- **Zustand**: v4.x for lightweight global state management
- **Axios**: v1.x for HTTP requests with interceptors
- **Recharts**: v2.x for declarative chart components
- **TailwindCSS**: v3.x for utility-first styling
- **EventSource API**: Native browser SSE for real-time dashboard updates
- **Vitest & React Testing Library**: For unit and integration testing

---

## Setup Instructions

### Prerequisites

- **Node.js**: v18.x (`node -v` to verify)
- **Backend Running**: The `svc-backend` must be running or accessible at its deployed URL
- **Git**: For cloning the repository

### Installation

1. **Clone Repository**:

   ```bash
   git clone https://github.com/mixro/svc-frontend
   cd svc-frontend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment**:

   Create `.env` in the root directory:

   ```env
   VITE_API_URL=https://svc-backend-6f2a.onrender.com
   VITE_APP_NAME=FloatSVC
   ```

   - Replace `VITE_API_URL` with your backend's URL (local or deployed).
   - All environment variables must be prefixed with `VITE_` to be accessible in the browser.

4. **Start Dev Server**:

   ```bash
   npm run dev
   ```

   - App runs at `http://localhost:5173`.

---

## Page & Component Structure

The UI is split into four distinct zones based on user role and authentication state.

### 1. Landing (`/`)

Public-facing marketing page. No auth required.

- **HeroSection**: Bold headline, CTA buttons linking to `/register` and `/login`.
- **FeaturesSection**: 6-card grid covering priority queuing, multi-network support, live analytics, role-based access, agent self-service, and automated transfers.
- **HowItWorksSection**: 4-step process (Register → Submit → Approve → Track) with a live queue mock UI.
- **NetworksSection**: Visual cards for Vodacom, Tigo, Yas, Halotel.
- **CtaBanner**: Final conversion section linking to registration.

### 2. Auth (`/login`, `/register`)

Split-screen layout. Left panel is decorative; right panel contains the form.

- **LoginPage**: Posts `{ email, password }` to `POST /api/auth/login`. On success, decodes the JWT role and redirects to `/agent` or `/admin`.
- **RegisterPage**: 3-step wizard:
  - `Step1Personal`: username, email, phone, password.
  - `Step2Role`: role selection (sub-agent / main-agent / admin), agent phone number, network multi-select (Vodacom, Tigo, Yas, Halotel).
  - `Step3Confirm`: Review summary before submitting to `POST /api/auth/register`.

### 3. Agent Portal (`/agent/*`)

Mobile-first, card-based layout for sub-agents. Protected — requires a valid JWT with role `sub-agent`.

- **AgentHomePage**: Network display card, quick-action shortcuts (New Request, Pending count, Done count), recent requests feed.
- **NewRequestPage**: 3-step wizard:
  - Step 1: Select requested network and source network via visual grid.
  - Step 2: Enter destination phone, source phone, amount (TZS), urgency toggle.
  - Step 3: Confirm summary → `POST /api/requests/submit`.
- **MyRequestsPage**: Scrollable list of all requests for the logged-in agent. Each card shows network, phones, amount, urgency badge, status badge, and relative timestamp.
- **MyTransfersPage**: Scrollable list of transfers associated with the agent.

### 4. Admin Panel (`/admin/*`)

Dark terminal aesthetic. Protected — requires role `admin` or `main-agent`.

- **DashboardPage**: Fetches all 5 dashboard endpoints in parallel on mount, then subscribes to `/api/sse` for live metric updates. Renders KPI stat cards (revenue, requests, transactions, sub-agents), monthly activity line chart, network distribution bar/donut charts, top 10 agents horizontal bar chart, and a performance metrics panel (success rate, averages, aging).
- **RequestQueuePage**: Full requests table with Approve, Reject, and Process Transfer action buttons. Approve calls `PUT /api/requests/:id` with `{ status: "approved" }`. Process calls `POST /api/transfers/process`.
- **TransfersPage**: Read-only transfer history table with network tags, phone numbers, amount, status, and timestamp.
- **AgentsPage**: Full agent table with role and network badges. Register Agent modal calls `POST /api/auth/register`. Delete calls `DELETE /api/agents/:id`.

---

## API Integration

All HTTP requests are made through a single Axios instance in `src/api/client.ts`. The instance reads `VITE_API_URL` from the environment and attaches the JWT token from Zustand's auth store on every request via a request interceptor. A response interceptor catches `401` errors and triggers an automatic logout.

```typescript
// src/api/client.ts
import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

export default client;
```

Each backend route group has a dedicated API file:

| File | Backend Route | Methods |
|------|--------------|---------|
| `auth.api.ts` | `/api/auth` | register, login, logout |
| `agents.api.ts` | `/api/agents` | getAll, getById, update, delete |
| `requests.api.ts` | `/api/requests` | submit, getAll, getById, update, delete |
| `transfers.api.ts` | `/api/transfers` | process, getAll, getById, update, delete |
| `dashboard.api.ts` | `/api/dashboard` | revenueMetrics, monthlyCounts, performance, perNetwork, topAgents |
| `sse.ts` | `/api/sse` | EventSource open, parse, reconnect |

---

## Authentication

- **JWT Storage**: The token returned by `/api/auth/login` or `/api/auth/register` is stored in Zustand's `auth.store.ts` and persisted to `localStorage` via Zustand's persist middleware.
- **Role Decoding**: The token payload contains `id` and `role`. On login, the role is read to decide whether to route to `/agent` or `/admin`.
- **Route Protection**: `ProtectedRoute.tsx` redirects unauthenticated users to `/login`. `RoleRoute.tsx` redirects users whose role doesn't match the required role for that section.
- **Usage**: The Axios interceptor in `client.ts` automatically attaches `Authorization: Bearer <token>` to every request — no manual header management needed at the page level.

---

## Real-Time Updates (SSE)

The admin dashboard subscribes to `/api/sse` using the browser's native `EventSource` API, managed inside `src/api/sse.ts` and consumed via the `useSSE` hook.

### Connection

```typescript
// src/api/sse.ts
export function createSSEConnection(token: string, onMetrics: (data: RevenueMetrics) => void) {
  const es = new EventSource(`${import.meta.env.VITE_API_URL}/api/sse`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  es.addEventListener("dashboard", (e) => {
    const parsed = JSON.parse(e.data);
    if (parsed.revenueMetrics) onMetrics(parsed.revenueMetrics);
  });

  es.onerror = () => {
    es.close();
    setTimeout(() => createSSEConnection(token, onMetrics), 5000); // auto-reconnect
  };

  return es;
}
```

### SSE Event Types

| Event | Payload | Consumer |
|-------|---------|----------|
| `connected` | `{ message: "Connected to dashboard updates" }` | `useSSE.ts` — logs connection |
| `dashboard` | `{ revenueMetrics: { ... } }` | `dashboard.store.ts` — overwrites live KPIs |
| `error` | `{ error: "Failed to fetch dashboard data" }` | `useSSE.ts` — shows toast notification |

### Live Metrics Shape

The `dashboard` event payload maps directly to the `RevenueMetrics` type:

```typescript
interface RevenueMetrics {
  // revenue
  currentRevenue: number;
  previousRevenue: number;
  revenuePercentage: number;
  totalRevenue: number;

  // requests
  dailyRequestsCount: number;
  currentRequests: number;
  previousRequests: number;
  requestsPercentage: number;
  totalRequests: number;

  // transactions
  dailyTransactionsCount: number;
  currentTransactions: number;
  previousTransactions: number;
  transactionsPercentage: number;
  totalTransactions: number;

  // subagents
  dailyAgentsCount: number;
  currentSubAgents: number;
  previousSubAgents: number;
  subAgentsPercentage: number;
  totalSubAgents: number;
}
```

---

## State Management

Zustand is used for all global state. Each store slice maps to a backend domain.

### `auth.store.ts`

Holds the active session. Persisted to `localStorage`.

```typescript
interface AuthState {
  agent: Agent | null;
  token: string | null;
  login: (agent: Agent) => void;
  logout: () => void;
}
```

### `requests.store.ts`

Caches the requests list and supports optimistic status updates (e.g., marking a request as `approved` in the UI before the server confirms).

### `transfers.store.ts`

Caches the transfers list. Refreshed after `POST /api/transfers/process` succeeds.

### `dashboard.store.ts`

Holds live KPI metrics. Populated on initial page load by `useDashboard` hook, then continuously overwritten by incoming SSE `dashboard` events via `useSSE`.

---

## Testing

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run tests:

   ```bash
   npm test
   ```

   - Tests cover auth flows, request submission wizard, SSE connection, transfer processing, and dashboard rendering.
   - Coverage report: `coverage/index.html`.

### Test Files

- `auth.test.tsx`: Tests `LoginPage` and `RegisterPage` form submission and error states.
- `request.test.tsx`: Tests `NewRequestPage` wizard steps and `POST /api/requests/submit` integration.
- `sse.test.ts`: Tests SSE connection, event parsing, and reconnect logic.
- `transfer.test.tsx`: Tests `RequestQueuePage` Approve/Reject/Process actions.
- `dashboard.test.tsx`: Tests `DashboardPage` chart rendering and SSE metric updates.

### Manual Testing

Use the running dev server alongside the Postman collection from the backend:

1. Start the dev server: `npm run dev`
2. Open `http://localhost:5173`
3. Register a new agent via the UI, then log in
4. Use the Agent Portal to submit a float request
5. Log in as admin to approve and process the request from the queue
6. Confirm the transfer appears in the Transfers page and updates the dashboard metrics

---

## Deployment

### Local

- Start dev server:

  ```bash
  npm run dev
  ```

- Access at `http://localhost:5173`.

### Production Build

1. Build:

   ```bash
   npm run build
   ```

2. Preview locally:

   ```bash
   npm run preview
   ```

3. Deploy the `dist/` folder to any static host (Vercel, Netlify, Render Static Sites, etc.).

### Docker

1. Build image:

   ```bash
   docker build -t svc-frontend .
   ```

2. Run container:

   ```bash
   docker run -p 3000:80 --env-file .env svc-frontend
   ```

---

## Error Handling

- **400 Bad Request**: Form validation errors displayed inline beneath the relevant field.
- **401 Unauthorized**: Axios interceptor catches this globally, clears the Zustand auth store, and redirects to `/login`.
- **403 Forbidden**: `RoleRoute.tsx` prevents the page from rendering and redirects to the appropriate portal.
- **404 Not Found**: Resource not found errors show an inline empty state within the relevant component (e.g., "No requests found").
- **500 Internal Server Error**: A global toast notification informs the user of a server error without crashing the app.
- **SSE Disconnection**: `useSSE.ts` detects `onerror` events and automatically reconnects after a 5-second delay. The live indicator in the topbar turns grey while disconnected.

---

## Security

- **Token Storage**: JWT stored in `localStorage` via Zustand persist. Cleared on logout or 401 response.
- **Role Guards**: `ProtectedRoute` and `RoleRoute` enforce access control client-side. All sensitive operations are additionally enforced server-side by the backend middleware.
- **Input Validation**: All form inputs are validated in `src/lib/validators.ts` before API calls are made — phone number format, minimum amount, required fields.
- **No Sensitive Env Vars in Frontend**: Only `VITE_API_URL` is exposed to the browser. API keys and secrets remain exclusively on the backend.

---

## Future Improvements

- Add push notifications for request status changes (Web Push API).
- Implement offline support with Service Workers for agents in low-connectivity areas.
- Add date range filters and network filters to dashboard analytics.
- Build a dedicated agent profile page for managing phone numbers and network assignments.
- Add dark/light theme toggle for the agent portal.

---

## Support

For issues, check the browser console for error messages or network failures. Provide the error message, the page/action that triggered it, and the backend response payload when reporting bugs.

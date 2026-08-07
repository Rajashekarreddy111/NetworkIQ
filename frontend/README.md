# NetworkIQ Frontend

NetworkIQ is an AI-powered supply chain inventory optimization console for planners, operations teams, and supply chain analysts. The frontend provides a premium enterprise dashboard for inventory visibility, AI transfer recommendations, planner approvals, agent monitoring, benchmarking, analytics, audit review, and configuration.

The app is built as a TanStack Start React application with mocked data by default, and it can be connected to a live NetworkIQ backend through an environment variable.

## Features

- Command dashboard with KPIs, AI insight cards, demand charts, transfer trends, and recent activity.
- Inventory Network page with SKU filters, inventory health indicators, warehouse context, and route visualization.
- AI Recommendations page with transfer plans, confidence scores, cost tradeoffs, business impact, and planner actions.
- Planner Approval Center for approving, rejecting, or overriding recommended transfers.
- Agent Monitor for the demand, inventory, capacity, transfer, coordinator, and guardrail agents.
- Benchmark view comparing classical solver output against the NetworkIQ AI plan.
- Analytics workspace for demand, warehouse, category, SKU, and inventory performance.
- Audit Trail for recommendation, decision, execution, and completion events.
- Settings and Profile pages for planner preferences, API settings, notifications, and account context.
- Responsive shell with desktop sidebar, mobile navigation, global search, notifications, theme controls, and toast feedback.

## Tech Stack

- React 19
- TypeScript
- Vite 8
- TanStack Start
- TanStack Router
- TanStack Query
- TanStack Table
- Tailwind CSS 4
- Radix UI primitives
- shadcn-style UI components
- Zustand
- Axios
- Recharts
- Motion
- Lucide React
- Sonner

## Requirements

- Node.js 20 or newer recommended
- npm 10 or newer recommended

## Getting Started

Install dependencies from the frontend directory:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

The app usually runs at:

```txt
http://localhost:5173/
```

If that port is already in use, Vite will print the available local URL in the terminal.

## Available Scripts

```sh
npm run dev
```

Starts the Vite development server.

```sh
npm run build
```

Creates a production build for the TanStack Start app.

```sh
npm run build:dev
```

Creates a development-mode build.

```sh
npm run preview
```

Serves the production build locally for verification.

```sh
npm run lint
```

Runs ESLint across the frontend source.

```sh
npm run format
```

Formats files with Prettier.

## Environment Configuration

The app uses mock data unless `VITE_NETWORKIQ_API_URL` is set.

Create a local `.env` file in the `frontend` directory when connecting to a backend:

```env
VITE_NETWORKIQ_API_URL=http://localhost:8000
```

When this variable is not set, API hooks read from `src/lib/mock-data.ts` through the mock resource map in `src/lib/api.ts`.

## API Resources

The frontend is prepared for these backend paths:

- `GET /dashboard`
- `GET /inventory`
- `GET /plan`
- `POST /plan/decision`
- `GET /self-check`
- `GET /benchmark`
- `GET /analytics`
- `GET /audit`
- `GET /config`

The shared Axios client lives in `src/lib/api.ts`. React Query hooks for these resources live in `src/hooks/use-networkiq.ts`.

## Project Structure

```txt
frontend/
  public/
    favicon.ico
    favicon.svg
    robots.txt
  src/
    components/
      common/        Shared dashboard components
      layout/        App shell, navbar, sidebar
      ui/            Reusable UI primitives
    hooks/           Data and viewport hooks
    lib/             API client, mock data, formatters, utilities
    routes/          File-based application routes
    store/           Zustand stores
    router.tsx       TanStack Router factory
    routeTree.gen.ts Generated route tree
    server.ts        SSR server wrapper
    start.ts         TanStack Start setup
    styles.css       Global theme and Tailwind styles
  package.json
  vite.config.ts
```

## Routes

- `/` - Command Dashboard
- `/inventory` - Inventory Network
- `/recommendations` - AI Recommendations
- `/approvals` - Planner Approval Center
- `/agents` - Agent Monitor
- `/benchmark` - Solver Benchmark
- `/analytics` - Analytics
- `/audit` - Audit Trail
- `/settings` - Settings
- `/profile` - Profile

## Styling And Design System

The UI uses a dark-first enterprise console style with:

- NetworkIQ brand metadata and favicon assets.
- Tailwind CSS tokens in `src/styles.css`.
- Reusable Radix-based UI components in `src/components/ui`.
- Shared dashboard primitives such as `SummaryCard`, `ChartCard`, `StatusBadge`, filters, states, and map components.
- Responsive layouts for desktop, tablet, and mobile.

## Data Flow

1. Pages call hooks from `src/hooks/use-networkiq.ts`.
2. Hooks use TanStack Query for caching, stale times, refetching, and mutations.
3. `fetchResource` and `postResource` in `src/lib/api.ts` decide between mock mode and live API mode.
4. Mock mode returns realistic domain data from `src/lib/mock-data.ts`.
5. Live mode sends requests through the shared Axios client.

## Build Output

Production builds are written to:

```txt
dist/
  client/
  server/
```

Use `npm run preview` after `npm run build` to inspect the production output locally.

## Development Notes

- `src/routeTree.gen.ts` is generated by TanStack Router. Do not edit it manually.
- Keep reusable visual primitives in `src/components/common` or `src/components/ui`.
- Keep page-level workflows in `src/routes`.
- Keep API request and response handling centralized in `src/lib/api.ts` and `src/hooks/use-networkiq.ts`.
- Prefer adding typed domain data to `src/lib/mock-data.ts` while backend endpoints are still being finalized.

## Troubleshooting

If dependencies are out of sync:

```sh
npm install
```

If a route does not appear after creating a new route file, restart the dev server so the generated route tree refreshes.

If the app still uses mock data after setting a backend URL, confirm the variable name starts with `VITE_`:

```env
VITE_NETWORKIQ_API_URL=http://localhost:8000
```

If production behavior differs from development:

```sh
npm run build
npm run preview
```

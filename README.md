# Melanis Frontend

Melanis Frontend is the React + TypeScript + Vite frontend for the Melanis product.

It currently hosts two product surfaces inside one runtime:

- `marketing`: the public landing experience
- `patient`: the authenticated patient and practitioner application

The codebase is intentionally organized to keep both surfaces in one repo while making their boundaries explicit.

## Stack

- React 19
- React Router 7
- TypeScript
- Vite
- Tailwind CSS
- Vitest + Testing Library

## Routes

- `/` and `/landing`: marketing surface
- `/patient-flow/*`: patient and practitioner application

Route composition now lives in:

- `src/app/router`
- `src/marketing/routes.tsx`
- `src/patient/app/routes.tsx`

## Source Layout

```text
src/
  app/         app bootstrap, providers, root router
  marketing/   landing-only screens and sections
  patient/     patient/practitioner flows, adapters, features
  shared/      approved cross-surface utilities and UI primitives
  test/        shared test helpers
```

Important internal conventions:

- `marketing` must not import from `patient`
- `patient` and `marketing` may import from `shared`
- new imports should use aliases, not deep relative paths

Available aliases:

- `@app/*`
- `@marketing/*`
- `@patient/*`
- `@shared/*`
- `@test/*`

## Patient App Structure

The patient surface keeps app-level concerns under `src/patient/app` and feature entrypoints under `src/patient/features`.

Use this pattern for new feature work:

```text
src/patient/features/<feature>/
  screen.tsx
  components/
  hooks/
  lib/
  types.ts
```

Page routes under `src/patient/app/pages` should stay thin over time and delegate to feature modules.

## Shared UI and Storage

Reusable UI primitives live in `src/shared/ui`.

Current shared primitives include:

- `Button`
- `Input`
- `Field`
- `Card`
- `Badge`
- `SectionHeader`
- `EmptyState`
- `ScreenShell`
- `LoadingState`

Browser persistence must go through `src/shared/lib/storage.ts`.
Do not call `localStorage` directly from feature code.

## Adapters and Runtime Modes

The patient app supports two runtime modes:

- mock adapters when `VITE_API_BASE_URL` is not set
- backend adapters when `VITE_API_BASE_URL` is set

Runtime adapter selection lives in `src/patient/app/runtime/adapters.ts`.

Example:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Without `VITE_API_BASE_URL`, the app uses local mock data and browser persistence.

Contract source of truth for real API mode:

- backend OpenAPI: `../melanis-backend/docs/openapi.v1.yaml`
- shared note: `../docs/API_CONTRACT_SOURCE_OF_TRUTH.md`

## Commands

```bash
npm run dev
npm run lint
npm test
npm run build
npm run check
```

## Testing

The default test stack is Vitest + Testing Library.

Shared test helpers live in `src/test`.

When adding or refactoring features, prefer covering:

- routing and guard behavior
- role-based access behavior
- persistence and restore behavior
- adapter contracts

## Working Rules

- use semantic Tailwind tokens instead of raw colors for new shared UI
- keep cross-surface logic in `shared`, not in `marketing` or `patient`
- keep auth/session state in context; avoid adding a global state library in the foundation pass
- prefer extracting repeated UI into shared or feature-local primitives before growing route files

## Architecture Notes

See:

- `docs/architecture.md`
- `docs/adr/0001-single-frontend-with-bounded-surfaces.md`
- `docs/adr/0002-adapter-selection-at-runtime.md`
- `docs/adr/0003-no-global-state-library-in-foundation-pass.md`

# Frontend Summary — Melanis Platform

> **Auto-generated:** 2026-02-25
> **Rule:** Claude MUST regenerate this file after every `git pull` in the frontend folder.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.0 |
| Routing | React Router (v7, `createBrowserRouter`) | 7.13.0 |
| Styling | Tailwind CSS | 3.4.17 |
| Animation | Motion (Framer Motion) | 12.23.24 |
| Icons | Lucide React | 0.487.0 |
| Build | Vite | 7.3.1 |
| Language | TypeScript (strict) | ~5.9.3 |
| Linting | ESLint 9 (flat config) + TypeScript ESLint | Latest |

**No external state management** — React Context + useState
**No API client library** — pluggable adapter pattern ready for backend
**No i18n library** — all text hardcoded in French
**No test framework configured yet**

---

## Commands

```bash
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # TypeScript check + Vite production build → dist/
npm run lint      # ESLint (flat config)
npm run preview   # Preview production build
```

---

## Project Structure

```
frontend/src/
├── main.tsx                              # Entry point
├── App.tsx                               # Root — exports patient-flow App
├── index.css                             # Tailwind + custom responsive utilities
├── landing/                              # Marketing landing page (13 components)
│   ├── LandingPage.tsx                   # Scroll-animated sections
│   └── components/landing/              # GuidedEntry, HowItWorks, FAQ, Footer, etc.
└── patient-flow/app/                     # Main application (~75 files)
    ├── App.tsx                           # AuthProvider + RouterProvider
    ├── routes.tsx                        # All route definitions
    ├── auth/                             # Auth domain (7 files)
    │   ├── types.ts                      # AuthUser, AuthSession, OtpChallenge, etc.
    │   ├── adapter.ts                    # Abstract AuthAdapter interface
    │   ├── mockAuthAdapter.ts            # localStorage-based mock (dev/demo)
    │   ├── AuthProvider.tsx              # Context provider for auth state
    │   ├── useAuth.ts                    # Hook to access auth context
    │   ├── flow.ts                       # localStorage utils for flow context + drafts
    │   └── validation.ts                 # Phone/OTP/PIN validation (Senegal +221)
    ├── components/                       # Shared UI components (30+ files)
    │   ├── PageLayout.tsx                # Main responsive panel wrapper
    │   ├── auth/AuthPrimitives.tsx       # TextInput, PhoneInput221, PrimaryButton, etc.
    │   ├── preconsult/                   # Pre-consult questionnaire (21 files)
    │   │   ├── types.ts                  # PreConsultData, MOTIFS, ZONES constants
    │   │   └── usePersistedPreConsult.ts # Auto-save hook (localStorage, 400ms debounce, 48h TTL)
    │   └── ...                           # OptionCard, TimeSlotGrid, FilterChips, etc.
    └── pages/                            # Page components (13 pages)
        ├── PF01-PF05.tsx                 # Patient flow pages (booking journey)
        └── auth/AU01-AU06.tsx            # Auth pages + AUVerification, AUPin
```

---

## Routes

```
/                              → LandingPage
/landing                       → LandingPage
/patient-flow/                 → PF01 (appointment type selection)
/patient-flow/creneau          → PF02 (time slot selection)
/patient-flow/confirmation     → PF03 (details review)
/patient-flow/detail-confirmation → PF04 (full recap)
/patient-flow/confirmation-succes → PF05 (success)
/patient-flow/auth/            → AU01 (login/signup/recovery choice)
/patient-flow/auth/connexion   → AU02 (login - phone + OTP)
/patient-flow/auth/inscription → AU03 (signup)
/patient-flow/auth/mot-de-passe-oublie → AU04 (forgot PIN)
/patient-flow/auth/verification → AUVerification (OTP code)
/patient-flow/auth/pin         → AUPin (PIN setup/verify)
/patient-flow/auth/profil      → AU05 (profile completion)
/patient-flow/auth/dashboard   → AU06 (dashboard)
```

Route state passed via `location.state` (React Router), not URL query params.

---

## Auth Architecture

**Pluggable adapter pattern** — swap `mockAuthAdapter` for a real backend adapter.

```
AuthAdapter (interface) → mockAuthAdapter (localStorage) | futureBackendAdapter (HTTP)
    ↓
AuthProvider (Context) — manages session, user, flowContext
    ↓
useAuth() hook — consumed by pages/components
```

**Auth flow:** Save booking context → redirect to auth → login/signup → OTP verify → PIN → profile → back to booking

**Phone validation:** Senegal only (`+221`), 9-digit format starting with `7`.

**localStorage keys:**
- `melanis_auth_session_v1` — current session (access + refresh tokens)
- `melanis_auth_flow_context_v1` — booking flow data preserved across auth
- `melanis_auth_users_v1` — mock user accounts
- `melanis_auth_challenges_v1` — OTP challenges + temp tokens
- `melanis_auth_pending_v1` — ongoing auth attempt (20min TTL)
- `melanis_auth_drafts_v1` — signup/recovery drafts (24h TTL)
- `melanis_preconsult_draft` — questionnaire draft (48h TTL)

---

## Design System (Tailwind Tokens)

**Colors:**
- Primary: `#5B1112` (burgundy) — `melanis-action-primary-*`
- Cream: `#FEF0D5` (page surface) — `melanis-semantic-surface-page`
- Teal: `#00415E` (accent/focus) — `melanis-action-secondary-*`
- Ink: `#111214` (text) — `melanis-semantic-text-primary`

**Font:** "Aileron" (CDN import), custom sizes from `display-h1` to `caption`

**Layout:** `.pf-shell`, `.pf-panel`, `.pf-page`, `.pf-scroll`, `.pf-header`, `.pf-cta` classes

**Responsive:** Mobile-first, tablet tuning (768-820px), compact desktop (1024px+, h<860px), safe area insets

---

## Key Patterns

| Pattern | Implementation |
|---------|---------------|
| Auth adapter | `AuthAdapter` interface → swap mock for real backend |
| State passing | `useNavigate()` with `location.state` |
| Form state | `useState` + `useCallback`, validation on change/submit |
| Persistence | localStorage with JSON, TTL checks, debounced save |
| Animations | `motion.div` with `initial`/`animate`/`transition` |
| Error display | Custom error mapping → French messages, `role="status"` |
| Loading | Skeleton pulse animations, disabled buttons, `Loader2` spinner |
| Keyboard a11y | Arrow keys on grids, Enter/Space to select, focus rings |
| Naming | Components: PascalCase files, Hooks: `use*`, Constants: SCREAMING_SNAKE |

---

## Backend Integration Points

To connect to real backend:
1. Create `backendAuthAdapter.ts` implementing `AuthAdapter` with HTTP calls to `/api/v1/auth/*`
2. Replace `mockAuthAdapter` import in `AuthProvider.tsx`
3. Add API client library (e.g., `axios` or native `fetch` wrapper)
4. Add env vars: `VITE_API_BASE_URL`, `VITE_AUTH_ADAPTER`
5. Pre-consult data → `POST /api/v1/pre-consult/questionnaires`
6. Appointment booking → `POST /api/v1/scheduling/appointments`
7. Media uploads → presigned URL flow via `/api/v1/media/upload-url`

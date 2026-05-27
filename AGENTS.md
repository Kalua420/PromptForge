# AGENTS.md — NexPrompt

## Quick start

```bash
# Frontend (port 5173)
cd client && npm i && npm run dev

# Backend (port 5000) — MySQL required
cd server && npm i && npx prisma db push && npm run dev

# Prisma seed (optional)
cd server && npm run seed
```

## Project layout

```
nexprompt/
├── client/            # React 18 + Vite 6 + Tailwind 3
│   ├── src/
│   │   ├── pages/     #  11 route-level pages (lazy-loaded, subdir per page)
│   │   ├── components/# 18 components, no subfolders
│   │   ├── stores/    #  6 Zustand stores (authStore, conversationStore, promptStore, templateStore, uiStore, subscriptionStore)
│   │   ├── utils/     #  HTTP client (Axios, auto-refresh on 401 with dedup)
│   │   └── hooks/     #  empty
│   └── .env.example   #  VITE_API_URL=http://localhost:5000
├── server/            # Express (ESM) + Prisma + Socket.IO
│   ├── src/index.js   #  entrypoint (dotenv auto-loads, validates DATABASE_URL/JWT_SECRET/JWT_REFRESH_SECRET at startup)
│   ├── routes/        #  9 route files (auth, prompts, templates, favorites, payments, conversations, subscription, team, admin)
│   ├── controllers/   #  9 controller files
│   ├── services/      #  promptEngine, ai/ (5 providers), promptStrategies/ (5), refineService, razorpayService, subscriptionService, usageService, notificationService, teamService
│   ├── middleware/     #  auth.js (authenticate, optionalAuth, requireAdmin, authenticateSocket), subscription.js (requireSubscription)
│   ├── sockets/       #  handlers.js (generate-stream, cancel-generation; rate limit: 10/min/user)
│   ├── config/        #  constants.js (USE_CASES, PROVIDERS), tiers.js (3 plans: free/pro/team with entitlements)
│   └── prisma/        #  schema.prisma (MySQL), seed.js
├── shared/            # (empty)
└── docs/              # (empty)
```

## Architecture & quirks

- **Prompt engine** (`server/services/promptEngine.js`): strategy pattern. 5 registered strategies (`image`, `coding`, `writing`, `chatbot`, `research`) at `services/promptStrategies/`. Add a file there and register in the engine. `video` is in fallback questions but has no strategy — do not rely on it.
- **AI providers** (`services/ai/aiManager.js`): 5 providers — `groq`, `openai`, `anthropic`, `opencode`, `gemini`. Never call provider SDKs directly outside this layer. Each reads its API key from server `.env`. `refineService` also calls provider APIs directly (not through aiManager).
- **Provider availability** is driven by `.env` — `GET /api/auth/providers` returns only providers with non-empty env keys set.
- **Auth**: JWT access (15m) + refresh (7d). `POST /api/auth/refresh` redeems refresh tokens. Client-side Axios interceptor auto-refreshes on 401 with deduplication. Socket.IO auth uses `handshake.auth.token` or `handshake.headers.authorization` via `authenticateSocket` middleware.
- **Generation has dual paths**: REST `POST /api/prompts/generate` (non-streaming, returns optimized prompt text) and Socket.IO `generate-stream` event (real-time token streaming via `StreamingOutput.jsx`; rate-limited to 10/min/user with AbortController cancellation).
- **Subscription system**: 3 plans — `free` (50 prompts/mo, Groq only), `pro` (₹19/mo or ₹15/mo annual, unlimited, all providers), `team` (₹49/mo or ₹39/mo annual, 3+ seats, team workspace). Entitlements in `config/tiers.js`. Razorpay amounts hardcoded in `services/razorpayService.js` (1900/4900 paise). Razorpay is optional — payment features silently disabled if env keys missing. Trials: Pro 7 days, Team 14 days. Free user prompts pruned after 7 days via daily cron.
- **Daily cron** runs at startup and every 24h: prunes free user prompts >7 days old, applies pending downgrades, handles trial ending/expired trials.
- **Rate limit**: 100 req / 15 min (Express), 10 socket generations / min.
- **No tests, no lint, no typecheck** — none of the `package.json` files have these scripts.
- **Server ESM**: `"type": "module"` in server/package.json.
- **Vercel deploy**: `vercel.json` builds client, rewrites all paths to `/index.html`.
- **Root doc files**: Multiple subscription docs (`SUBSCRIPTION_*.md`, `SUBSCRIPTION_INTEGRATION_EXAMPLES.js`), `PLATFORM_ANALYSIS.md`, `SECURITY_FIXES.md`, `PROJECT_ANALYSIS.md`, `SUBSCRIPTION_UPGRADE_FIX.md`, `design.md` — reference material, not in active use.

## Key commands

| Action | Command |
|---|---|
| Dev (server) | `cd server && npm run dev` (Node 20+ `--watch`) |
| Prisma sync | `cd server && npx prisma db push` (after schema changes, no migrations) |
| Prisma studio | `cd server && npx prisma studio` |
| Seed DB | `cd server && npm run seed` |

## State (Zustand)

Stores in `client/src/stores/`:
- `authStore` — JWT tokens, user (persisted as `auth-storage`)
- `conversationStore` — conversations, currentConversation
- `promptStore` — prompts, currentPrompt (not favorites)
- `templateStore` — templates, filter
- `uiStore` — theme, sidebar (persisted as `ui-storage`)
- `subscriptionStore` — currentTier, subscription, usage, warnings (persisted as `subscription-storage`). Also provides `hasFeature()`, `getLimit()`, and tier helpers.

## Routes (API)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | No | Returns access + refresh tokens (password min 8 chars) |
| POST | `/api/auth/login` | No | Returns access + refresh tokens |
| POST | `/api/auth/refresh` | No | Redeems refresh token for new pair |
| POST | `/api/auth/forgot-password` | No | Stub — no mail service configured |
| GET | `/api/auth/me` | Yes | User profile |
| GET | `/api/auth/providers` | No | Returns providers with keys set in server `.env` |
| GET/POST/DELETE | `/api/prompts` | Yes | CRUD, cursor-based pagination (max 100), max content 50000 chars |
| POST | `/api/prompts/refine` | Yes | AI-generated clarifying questions (falls back to static) |
| POST | `/api/prompts/generate` | Yes | Non-streaming prompt optimization |
| GET/POST | `/api/templates` | optionalAuth (GET), Yes (POST) | Template marketplace, user plan determines access |
| GET/POST/DELETE | `/api/favorites` | Yes | |
| GET/POST/DELETE/PATCH | `/api/conversations` | Yes | Max 50 returned, includes lastPrompt summary |
| POST/GET | `/api/payments` | Yes | Razorpay order creation & verification |
| POST | `/api/payments/webhook` | No | Razorpay webhook handler (payment.captured, payment.failed, subscription.charged/cancelled/expired) |
| GET/POST | `/api/payments/subscription` | Yes | Read / cancel subscription |
| GET | `/api/subscription/plans` | No | List all plans with pricing |
| POST | `/api/subscription/create` | Yes | Create paid subscription |
| PATCH | `/api/subscription/plan` | Yes | Change plan (upgrade only; downgrades not allowed via API) |
| POST | `/api/subscription/cancel` | Yes | Cancel paid subscription at period end |
| POST | `/api/subscription/pause` | Yes | Pause Team plan (pick resume duration) |
| POST | `/api/subscription/resume` | Yes | Resume paused Team plan |
| GET | `/api/subscription/usage` | Yes | Current usage with provider breakdown + history |
| GET | `/api/subscription/invoice-preview` | No | Calculate invoice for plan/cycle/seats |
| GET/POST | `/api/team/members` | Yes | List / manage team members (Team plan required) |
| POST | `/api/team/invite` | Yes | Invite member to team |
| POST | `/api/team/accept-invite` | Yes | Accept team invitation |
| DELETE | `/api/team/members/:id` | Yes | Remove team member |
| PATCH | `/api/team/members/:id/role` | Yes | Change member role |
| GET | `/api/team/analytics` | Yes | Team usage analytics |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET/PATCH/DELETE | `/api/admin/users` | Admin | User management |
| GET/POST/PATCH/DELETE | `/api/admin/templates` | Admin | Template CRUD |
| GET | `/api/admin/plans` | Admin | Plan config |
| GET | `/api/admin/services` | Admin | Service status (DB, Razorpay, AI providers) |
| Socket.IO | `generate-stream` | — | Real-time streaming, emits `token`, `done`, `error` events |

## Conventions

- **No inline styles** — TailwindCSS utility classes only (exceptions: dynamic gradient backgrounds with CSS vars)
- **Async/await** everywhere, no `.then()`
- **All route-level components lazy-loaded** with `React.lazy()`
- **No subfolders** in `components/` unless the component has multiple sub-components
- **Prisma**: MySQL, schema at `server/prisma/schema.prisma`. After edits, run `npx prisma db push` (no migrations).
- **`.env.example`** files in both `client/` and `server/` — copy to `.env` before developing. Server provider keys must be set for providers to appear in the UI.
- **Tier gating**: `TierGate` component wraps features by tier or feature name; `subscriptionStore.hasFeature()` drives access checks. `TierSync` sets `data-tier` attribute on `<html>`.

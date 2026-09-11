# Mountain-Able — Digital Tourism Platform

Master's project work — Politecnico di Milano, Master "Mountain-Able" (Programming and Planning for Sustainable Mountain Development), 2025/2026. Supervised by Prof. Corradi. The code and its documentation are both graded deliverables.

`README.md` documents how to run the project. This file documents how to *work* on it. When they disagree, this file wins.

## What this is

A centralized platform giving small Italian mountain municipalities one place to publish and maintain tourism information, and tourists one place to discover these underrepresented villages.

Core value: centralized tourism data + discovery and search + community reviews + administrative moderation + journey planning.

**Explicitly out of scope — do not build, do not scaffold for:** online booking, payments, transport optimization, real-time emergency services, AI chatbot or recommendations. These are documented in the report as future work. If a task seems to call for one of these, stop and ask.

## Repo

```
mountain_able/
├── CLAUDE.md
├── README.md
├── docs/          # project-report.md, security.md, design-decisions.md,
│                  # demo-script.md, screenshots/
├── server/        # Express REST API
└── client/        # Vite + React + Tailwind
```

API on `http://localhost:5000`, Vite on `http://localhost:5173`. MongoDB local at `mongodb://127.0.0.1:27017/mountain_able`.

Seeded accounts share the password `Password123!` — `admin@mountainable.it`, `authority@mountainable.it`, `officer.<area>@mountainable.it`, and tourists such as `sara@example.com`.

## Stack

- **Backend:** Node.js + Express, JavaScript ES modules (`"type": "module"`), **not** TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT bearer tokens + `bcryptjs`, with `tokenVersion` revocation
- **Frontend:** React 18 + Vite + Tailwind, react-router-dom, axios, i18next, lucide-react, leaflet/react-leaflet, recharts
- **Route planning:** OSRM (routing), Open-Meteo (elevation), Overpass (POIs and surface tags), Nominatim (geocoding) — all called server-side, all cached

## Roles

| Role | Capabilities |
|---|---|
| `tourist` | self-registers; browses, searches, reviews, plans journeys, tracks visits/favourites |
| `officer` | manages ONLY villages in their own `municipalityId`; starts `pending` until an admin activates |
| `admin` | full access; moderates comments, manages users, publishes villages |
| `authority` | read-only access to aggregated statistics |

## Conventions — follow these

- Thin controllers; reusable logic in `utils/` or model statics
- `catchAsync` wrapper — no `try/catch` in controllers
- Responses: `{ success: true, data, meta? }` / `{ success: false, message, errors? }`; `meta` carries `{ total, page, limit, totalPages }`
- One shared pagination helper — never reimplement per controller
- Validation via express-validator chains in `middleware/validators/`, returning 422 with a field-keyed error object
- Authorization stays in `protect` / `restrictTo` / `requireActive` / `ownsVillage` / `ownsResource` — never inline in a controller
- **Explicit allow-lists on every write** — pick permitted fields, never spread the request body. A mass-assignment defect was found and fixed here once already.
- Statistics use MongoDB aggregation pipelines, never in-memory reduction
- `Village.ratingAverage` / `ratingCount` recalculate only via `Comment.recalculateRatings()` from model hooks, counting approved comments only. `insertMany` bypasses hooks — call the static explicitly.
- **Comments are created `pending`** and become visible only after admin approval; editing an approved comment returns it to `pending`. Authors see their own pending review with a badge.
- **All client fetching goes through `cachedGet` / `useFetch` (`client/src/lib/requestCache.js`)** — never call axios inline. Shared data is lifted into a context provider (`MeContext`, `OfficerScopeContext`), never fetched per component.
- Frontend: every user-facing string through `t()`; both `en` and `it` populated from the first line
- Frontend: list and detail views handle loading / empty / error / success explicitly
- Frontend: filters, page and sort live in the URL query string
- Components under ~200 lines; reuse before writing a second version of anything
- **Never invent data to fill a UI.** If the API cannot supply a number, do not display it. Every externally-sourced fact shows its provenance.

## Design system

From Figma file `FPEg0EnTFkA7zlYtwzRJjm`. Configured in `client/tailwind.config.js`.

```
primary  #21bf73   brand green — headings, links, accents
cta      #25d366   buttons, dashboard sidebar
ink      #2b2b2b   body text
cream    #faf7f2   public page background
canvas   #f9fcfb   dashboard page background
```

Inter (400/500/600/700). `rounded-card 10px`, `rounded-pill 100px`, `shadow-card 3px 4px 10px rgba(0,0,0,.25)`.

Type scale — use only these: display 42 / h1 34 / h2 27 / h3 22 / body-lg 18 / body 16 / small 14.

Canvas 1440px, container `max-w-[1336px] mx-auto`. Mobile-first; nothing may overflow at 375px.

## The Figma is a draft, not a spec

Keep the structure and visual identity. Improve anything unfinished or carrying leftovers from an unrelated template. Known problems, already corrected — never reintroduce them:

- The searchbar base component has Location / Date / Guests. There is no booking here. Search is **Name / Region / Minimum rating**.
- The village detail page had **no reviews UI**; it was designed from scratch.
- The village stats strip showed "560 Tourists / 6 Hotels / 12 Shops". We have no such data.
- The dashboard sidebar read Stocks / Staff / Finance — a retail template.
- The profile page showed "15 Personnel" placeholders, a Date of birth field, and Moroccan sample data. We do not collect date of birth.
- Some labels were in French. Everything goes through `t()`.

Document every new deviation in `docs/design-decisions.md` as you make it.

## Current status

**Committed and working:**
- Backend: 16 models, auth with token revocation, RBAC + ownership middleware, full REST API, statistics via aggregation pipelines, seed of 20 real Italian mountain villages
- Public frontend: home, villages listing with Leaflet map, village detail with reviews, events, about, signup, login modal
- Dashboards: officer, admin, authority, plus a shared profile page
- Tourist area `/my`: visited villages, favourites, saved routes, own reviews
- Route planner (`/villages/:slug/route`): OSRM routing, elevation profile, corridor POIs from Overpass, terrain advisories with provenance, platform villages along the route, print view, save route
- Security hardening — see `docs/security.md`
- Request deduplication and shared fetch layer — officer dashboard went from 32 requests per load to 11
- `npm run warm-cache` with a verification pass, `docs/demo-script.md`, 16 captioned screenshots
- Public "claim your village" form at `/claim` — posts to `POST /api/users/officer-request`; entry points in the footer, on signup, and on each village page with the municipality pre-filled
- Support inbox: public `POST /api/support` persists a message, admins triage it at `/admin/support`
- `docs/role-audit.md` — a per-role audit of the running app against the report's claims; the four contradictions it found are fixed and documented in `docs/design-decisions.md`

- Inter-municipal service coordination — capability directory, requests routed by real travel time, responses, and the territorial evidence the accumulated record yields. See `docs/coordination-design.md` (the approved proposal) and report §12.

**Not started:**
- Deployment (Vercel + Render + MongoDB Atlas). Uploads still go to the local filesystem, which is ephemeral on managed hosts — object storage is needed.
- Academic chapters of the report (research questions, methodology, literature, conclusions) — written by the author, not generated.

**Rate limiting — settled, don't re-litigate:**
Limiters are scoped by purpose, not by one environment switch. `authLimiter` (login/register, 20 / 15 min) runs in **every** environment — brute-force protection that switches off outside production is not protection. `generalLimiter` (100 / 15 min per IP) is a flood defence and runs in **production only**: it is sized for one real user's browsing, and a demo across three dashboards at 11 requests per officer-dashboard load exhausts the window in about nine page loads. `routesLimiter` keeps its own gate in `routeRoutes.js`, skipped under `test`, because it protects the third-party providers too. Production behaviour is unchanged. See `docs/security.md` §3.5.

**Deferred by decision:**
- Real data ingestion (ISTAT / Wikidata / Wikipedia) and public launch with real municipalities. The current build uses seeded content, which is acceptable for the academic deliverable but must not be presented as real reviews of real villages.

## Next feature — inter-municipal service coordination

The original proposal stated two objectives that remain unrealised: *enhance data sharing between local authorities* and *improve coordination between municipalities*. Today each comune publishes in isolation with no channel to its neighbours.

The feature: each municipality declares the services it can offer (transport, guides, accommodation, equipment rental, EV charging), forming a capability registry. When a village cannot meet a visitor need, its officer raises a request — service, date, number of people — routed to municipalities within a chosen radius, ranked by real travel distance using the existing geospatial and routing infrastructure. Recipients offer, decline, or propose a partial arrangement, recorded as a thread.

**Coordination, not commerce.** The platform introduces the two administrations and records the outcome. No booking, no payment, no contract — consistent with the scope boundary excluding transactional features.

Secondary effect, and the more valuable one: every request records the service sought, the territory, and whether it was met. Over time this yields evidence of which capabilities are persistently absent from an area — exactly what a regional authority needs to direct investment, and something no single municipality can produce alone.

## Key files

- `docs/project-report.md` — the technical report
- `docs/security.md` — threat model, defence layers, audit findings
- `docs/design-decisions.md` — deviations from the prototype, with justifications
- `docs/demo-script.md` — the presentation walkthrough
- `server/API.md` — endpoint reference; keep it current
- `server/test-api.http` — a REST Client request per endpoint

## Commands

```bash
cd server && npm run seed && npm run dev
cd client && npm run dev
cd server && npm run warm-cache   # run on presentation morning, servers up
```
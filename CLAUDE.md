# Mountain-Able — Digital Tourism Platform

Master's project work — Politecnico di Milano, Master "Mountain-Able" (Programming and Planning for Sustainable Mountain Development), 2025/2026. Supervised by Prof. Corradi. The code and its documentation are both graded deliverables.

`README.md` documents how to run the project. This file documents how to *work* on it. When they disagree, this file wins.

## What this is

A centralized platform giving small Italian mountain municipalities one place to publish and maintain tourism information, and tourists one place to discover these underrepresented villages.

Core value: centralized tourism data + discovery and search + community reviews + administrative moderation.

**Explicitly out of scope — do not build, do not scaffold for:** online booking, payments, transport optimization, real-time emergency services, AI chatbot or recommendations. These are documented in the report as future work. If a task seems to call for one of these, stop and ask.

## Repo

```
mountain_able/
├── CLAUDE.md
├── README.md
├── server/          # Express REST API — complete
└── client/          # Vite + React + Tailwind — design system only so far
```

API on `http://localhost:5000`, Vite on `http://localhost:5173`. MongoDB local at `mongodb://127.0.0.1:27017/mountain_able`.

Seeded accounts all share the password `Password123!` — admin is `admin@mountainable.it`, authority is `authority@mountainable.it`, officers are `officer.<area>@mountainable.it`.

## Stack

- **Backend:** Node.js + Express, JavaScript ES modules (`"type": "module"`), **not** TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT bearer tokens + `bcryptjs`
- **Frontend:** React 18 + Vite + Tailwind, react-router-dom, axios, i18next, lucide-react, leaflet/react-leaflet, recharts

## Roles

| Role | Capabilities |
|---|---|
| `tourist` | self-registers; browses, searches, comments, rates |
| `officer` | manages ONLY villages in their own `municipalityId`; starts `pending` until an admin activates |
| `admin` | full access; moderates comments, manages users, publishes villages |
| `authority` | read-only access to aggregated statistics |

## Conventions — follow these

- Thin controllers; reusable logic in `utils/` or model statics
- `catchAsync` wrapper — no `try/catch` in controllers
- Responses: `{ success: true, data, meta? }` / `{ success: false, message, errors? }`; `meta` carries `{ total, page, limit, totalPages }`
- One shared pagination helper — never reimplement per controller
- Validation via express-validator chains in `middleware/validators/`, returning 422 with a field-keyed error object
- Authorization stays in `protect` / `restrictTo` / `ownsVillage` / `ownsResource` — never inline in a controller
- Statistics use MongoDB aggregation pipelines, never in-memory reduction
- `Village.ratingAverage` / `ratingCount` recalculate only via `Comment.recalculateRatings()` from model hooks, counting approved comments only. `insertMany` bypasses hooks — call the static explicitly.
- Frontend: every user-facing string through `t()`; both `en` and `it` populated from the first line, never retrofitted
- Frontend: list and detail views handle loading / empty / error / success explicitly
- Frontend: filters, page and sort live in the URL query string
- Components under ~200 lines; reuse before writing a second version of anything
- Never invent data to fill a UI. If the API cannot supply a number, do not display it.

## Design system

From Figma file `FPEg0EnTFkA7zlYtwzRJjm`. Already configured in `client/tailwind.config.js`.

```
primary  #21bf73   brand green — headings, links, accents
cta      #25d366   buttons, dashboard sidebar
ink      #2b2b2b   body text
cream    #faf7f2   public page background
canvas   #f9fcfb   dashboard page background
```

Inter (400/500/600/700). `rounded-card 10px`, `rounded-pill 100px`, `shadow-card 3px 4px 10px rgba(0,0,0,.25)`.

Type scale — use only these: display 42 / h1 34 / h2 27 / h3 22 / body-lg 18 / body 16 / small 14.

Canvas 1440px, container `max-w-[1336px] mx-auto`. Mobile-first; nothing may overflow at 375px. White on `#25d366` is borderline for contrast — use a darker shade where it fails WCAG AA.

## The Figma is a draft, not a spec

Keep the structure and visual identity. Improve anything unfinished, inconsistent, or carrying leftovers from an unrelated template. These are known problems — never reproduce them:

- The searchbar base component has Location / Date / Guests. There is no booking here. Search is **Name / Region / Minimum rating**.
- The village detail page has **no reviews UI at all**, despite ratings being a core feature. It must be designed.
- The village stats strip shows "560 Tourists / 6 Hotels / 12 Shops". We have no such data. Display only metrics the database can source.
- The dashboard sidebar reads Stocks / Staff / Finance — from a retail template.
- The profile page shows three "15 Personnel" placeholders, a Date of birth field, and Moroccan sample data. We do not collect date of birth: it has no purpose here, and the report has a data-privacy section to stay consistent with.
- Some labels are in French. Everything goes through `t()`.

Document every deviation you make as you make it — the list goes into the report's design chapter.

## Key files

- `server/API.md` — endpoint reference; feeds the report directly, keep it current
- `server/test-api.http` — a REST Client request per endpoint
- `server/src/seed/` — `seed.js` + `data.js`, 20 real Italian mountain villages with genuine coordinates

## Commands

```bash
cd server && npm run seed && npm run dev
cd client && npm run dev
```

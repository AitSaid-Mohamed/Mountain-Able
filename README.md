# Mountain-Able — Digital Platform for Enhancing Tourism in Italian Mountain Villages

Master's project — **Politecnico di Milano**, Master *"Mountain-Able"* (supervisor: Prof. Corradi).

A centralized platform that gives small Italian mountain municipalities a single
place to publish and maintain tourism information, and gives tourists a single
place to discover these underrepresented villages. Core value: **centralized
tourism data + discovery/search + community reviews + administrative
moderation**.

> **Out of scope** (documented as future work, intentionally *not* built): online
> booking, payments, transport optimization, real-time emergency services, and
> AI chatbot/recommendations.

This repository currently contains **milestones 1–2**: the project scaffold, the
backend foundation (models, authentication, role middleware), a full seed
dataset, and the **complete REST API** (villages, attractions, events, comments,
municipalities, categories, users, statistics, uploads and security hardening).
The frontend pages are delivered in a later milestone.

- **API reference:** [`server/API.md`](server/API.md) — every endpoint, grouped by resource.
- **Manual test collection:** [`server/test-api.http`](server/test-api.http) — a request for every endpoint (VS Code REST Client).

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Node.js + Express.js (REST), JavaScript ES modules (`"type": "module"`) |
| Database  | MongoDB + Mongoose |
| Auth      | JWT (`Authorization: Bearer`) + bcrypt password hashing |
| Uploads   | multer → local `/uploads` folder |
| Validation| express-validator |
| Frontend  | React 18 + Vite + Tailwind CSS |

> **Note on bcrypt:** the code uses `bcryptjs`, the pure-JavaScript,
> API-compatible implementation of bcrypt. It hashes identically to native
> `bcrypt` but avoids native build tooling — convenient for cross-platform
> (Windows) development and CI.

---

## Repository layout

```
mountain_able/
├── server/                  # Express REST API
│   ├── src/
│   │   ├── config/          # env + MongoDB connection
│   │   ├── models/          # 7 Mongoose schemas
│   │   ├── controllers/     # thin controllers (auth)
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # protect, restrictTo, ownsVillage, validate, errors, upload
│   │   ├── utils/           # catchAsync, AppError, jwt, apiResponse
│   │   ├── seed/            # seed.js + data.js (realistic dataset)
│   │   ├── app.js           # builds the Express app
│   │   └── server.js        # HTTP bootstrap
│   ├── uploads/             # multer target (git-ignored)
│   ├── .env.example
│   └── package.json
├── client/                  # Vite + React + Tailwind scaffold (design system only)
└── README.md
```

---

## Prerequisites

- **Node.js ≥ 18** (developed on Node 24)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or set `MONGODB_URI`)

---

## Getting started

### 1. Backend

```bash
cd server
npm install
cp .env.example .env         # then edit values if needed
npm run seed                 # wipe + populate the database
npm run dev                  # start API with auto-reload (http://localhost:5000)
# or: npm start              # start without nodemon
```

Health check: <http://localhost:5000/api/health>

### 2. Frontend

```bash
cd client
npm install
npm run dev                  # Vite dev server (http://localhost:5173)
```

### npm scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `server` | `npm run dev`  | Start API with nodemon |
| `server` | `npm start`    | Start API with node |
| `server` | `npm run seed` | Reset + seed the database |
| `client` | `npm run dev`  | Start Vite dev server |
| `client` | `npm run build`| Production build |
| `client` | `npm run preview` | Preview production build |

---

## Environment variables (`server/.env`)

| Variable         | Description | Default |
|------------------|-------------|---------|
| `PORT`           | API port | `5000` |
| `NODE_ENV`       | `development` \| `production` \| `test` | `development` |
| `MONGODB_URI`    | MongoDB connection string | `mongodb://127.0.0.1:27017/mountain_able` |
| `JWT_SECRET`     | Secret used to sign JWTs (required in production) | — |
| `JWT_EXPIRES_IN` | Access-token lifetime | `7d` |
| `SEED_PASSWORD`  | Shared password for all seeded accounts | `Password123!` |
| `CLIENT_ORIGIN`  | Allowed CORS origin | `http://localhost:5173` |
| `UPLOAD_DIR`     | Folder for uploaded images | `uploads` |

---

## Seeded login credentials

The seed script creates one account per role. **Every account shares the same
development password:** `Password123!`

| Role        | Email                                  | Notes |
|-------------|----------------------------------------|-------|
| `admin`     | `admin@mountainable.it`                | Full access, moderation, user management |
| `authority` | `authority@mountainable.it`            | Read-only regional statistics |
| `officer`   | `officer.aosta@mountainable.it`        | Manages *Unione Comuni Valle d'Aosta* villages |
| `officer`   | `officer.lucane@mountainable.it`       | Manages *Dolomiti Lucane* villages |
| `officer`   | `officer.gransasso@mountainable.it`    | Manages *Gran Sasso–Alto Sangro* villages |
| `officer`   | `officer.agordina@mountainable.it`     | Manages *Agordina e Giudicarie* villages |
| `tourist`   | `sara@example.com` (+6 more)           | Browse, search, comment, rate |

The dataset also includes **10 municipalities**, **8 categories**, **20 real
mountain villages** (Chamois, Ostana, Sauris, Castelmezzano, Santo Stefano di
Sessanio, Vipiteno, San Leo, …) with real coordinates and descriptions, ~87
attractions, ~48 events and ~54 moderated comments.

### Quick manual test

```bash
# Login → capture the token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mountainable.it","password":"Password123!"}'

# Authenticated request
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer <TOKEN>"
```

---

## Architecture notes

### Roles & authorization

Four roles are stored as an enum on the `User` model:

- **tourist** — self-registers; browses, searches, comments, rates.
- **officer** — municipality officer; may manage **only** villages of their own
  `municipalityId`. Officers start as `pending` and are activated by an admin.
- **admin** — full access; moderates comments, manages users, approves officers.
- **authority** — regional authority; read-only aggregated statistics.

Authorization is composed from three dedicated middlewares so controllers stay
thin and the rules live in one place:

- `protect` — verifies the JWT and attaches `req.user`.
- `restrictTo(...roles)` — role guard.
- `ownsVillage` — enforces *"an officer must never modify a village outside
  their municipality"* (admins bypass; the loaded village is attached to
  `req.village`).

### Consistent API envelope

- Success: `{ success: true, data, meta? }` (`meta` carries pagination info).
- Error:   `{ success: false, message, errors? }`, produced by a single
  centralized error handler that maps Mongoose validation, duplicate-key, cast
  and JWT errors to friendly HTTP status codes.

Controllers are wrapped with a `catchAsync` helper, so no controller needs a
`try/catch` — rejected promises are forwarded to the error handler.

### Automatic rating aggregation

`Village.ratingAverage` and `Village.ratingCount` are **never** computed on the
fly in a controller. Instead the `Comment` model exposes a static
`recalculateRatings(villageId)` that is triggered by post-`save`,
post-`findOneAndUpdate` and post-`findOneAndDelete` hooks. Whenever a comment is
created, edited, deleted or has its moderation `status` changed, the parent
village's aggregates are recomputed from **approved comments only**. (The seed
script calls the static explicitly because `insertMany` bypasses document
hooks.)

### Data models

`User`, `Municipality`, `Village`, `Category`, `Attraction`, `Event`,
`Comment` — with indexes on frequently queried fields (`email`, `slug`,
`region`, `ratingAverage`, `villageId`, `municipalityId`, …).

### Frontend design system

Tailwind is configured from the project Figma tokens (1440px canvas,
mobile-first):

| Token | Value | Use |
|-------|-------|-----|
| `primary` | `#21bf73` | brand green — headings, links, accents |
| `cta`     | `#25d366` | button green |
| `ink`     | `#2b2b2b` | body text |
| `cream`   | `#faf7f2` | page background |

Font **Inter** (400/500/600/700); radii `card` (10px) / `pill` (100px); shadow
`card`. Body defaults to `bg-cream text-ink font-sans`. The following libraries
are installed for later milestones (not yet used): `react-router-dom`, `axios`,
`i18next`, `react-i18next`, `lucide-react`, `leaflet`, `react-leaflet`,
`recharts`.

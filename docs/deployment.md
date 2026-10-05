# Deployment guide

Deploying Mountain-Able to **MongoDB Atlas** (database), **Render** (API) and
**Vercel** (client).

`README.md` covers running the project locally; this document covers putting it
online. Nothing here has been executed — these are the steps to follow.

**Order matters.** The API needs the database URL, and the client needs the API
URL, so deploy Atlas → Render → Vercel. One step at the end goes back to Render,
because the API cannot know the Vercel URL until Vercel has produced one.

---

## 0. What the repository already does for you

These were prepared in advance and need no action, but knowing they exist will
save time when something looks wrong:

| Concern | Where it is handled |
|---|---|
| Real client IPs behind Render's proxy | `app.set('trust proxy', 1)` in `server/src/app.js` |
| Multiple allowed origins | `CLIENT_ORIGIN` is parsed as a comma-separated list |
| SPA deep links (`/villages`, `/admin`) | `client/vercel.json` |
| Uploads surviving a redeploy | `CLOUDINARY_URL`, optional (§4) |
| Refusing to start with a weak secret | `server/src/config/env.js` throws in production |
| Warm-cache against a remote server | `npm run warm-cache -- <url>` |

---

## 1. MongoDB Atlas

### 1.1 Create the cluster

1. Sign in at <https://cloud.mongodb.com> and create a project.
2. **Build a Database → M0 (Free)**. Choose a region close to your Render region
   — Frankfurt or Ireland if you deploy the API in the EU. Cross-continent
   latency on every query is noticeable and avoidable.
3. Name the cluster (for example `mountain-able`).

### 1.2 Create a database user

**Database Access → Add New Database User**

- Authentication: password.
- Username and password: generate a strong password and **copy it now** —
  Atlas will not show it again.
- Role: *Read and write to any database*.

> If the password contains `@ : / ? # [ ]`, percent-encode it in the connection
> string (`@` becomes `%40`). An unencoded `@` splits the URI in the wrong place
> and produces a confusing authentication error.

### 1.3 Allow network access

**Network Access → Add IP Address → Allow access from anywhere (`0.0.0.0/0`)**

Render does not publish a fixed egress IP range on its free and starter tiers,
so an allow-list of specific addresses is not workable here. The database remains
protected by its credentials. If you later move to a paid Render plan with static
outbound IPs, narrow this.

### 1.4 Build the connection string

**Connect → Drivers → Node.js**, and copy the string. It looks like:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Insert the database name before the `?`:**

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mountain_able?retryWrites=true&w=majority
```

This is the single most common mistake in this whole process. Without the
database name, Atlas connects to a database called `test`, every query succeeds
against empty collections, and the deployed site looks like a working
application with no content — which reads as a bug in the code rather than a
configuration error.

### 1.5 Seed Atlas, once, from your machine

The seed script runs wherever it is pointed. Run it locally against Atlas rather
than on Render — it is a one-off, and running it on the server would risk a
redeploy re-running it and wiping live data.

```bash
cd server
MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mountain_able?retryWrites=true&w=majority" \
SEED_PASSWORD="choose-a-password" \
npm run seed
```

On Windows PowerShell:

```powershell
cd server
$env:MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mountain_able?retryWrites=true&w=majority"
$env:SEED_PASSWORD="choose-a-password"
npm run seed
```

Expect roughly:

```
🏛️  14 municipalities, 🏷️  8 categories.
🏔️  24 villages.
👤 users: 1 admin, 1 authority, 8 officers, 7 tourists.
💬 54 comments — 6 pending, 4 rejected.
🤝 15 service types, 32 declared capabilities.
📬 10 coordination requests, 11 responses.
✅ Seed complete.
```

Two warnings about this step:

- **`npm run seed` wipes every collection first.** Never run it against a
  database holding anything you want to keep. Once the site is public, treat it
  as destructive.
- **Set `SEED_PASSWORD` to something other than the default.** `Password123!`
  appears in the README and the demo script, so on a publicly reachable database
  it is effectively a published credential for an administrator account.

---

## 2. Render — the API

### 2.1 Create the service

1. Push the repository to GitHub if it is not already there.
2. At <https://dashboard.render.com>: **New → Web Service**, connect the repo.
3. Configure:

| Setting | Value |
|---|---|
| Name | `mountain-able-api` |
| Region | the same region as your Atlas cluster |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

**Root Directory must be `server`.** The repository holds two applications; left
blank, Render builds from the root, finds no `package.json` it recognises as the
service, and fails.

### 2.2 Environment variables

**Environment → Add Environment Variable**, for each of:

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Not cosmetic — enables the general rate limiter, enforces the secret check, hides stack traces |
| `MONGODB_URI` | the Atlas string from §1.4 | With the database name |
| `JWT_SECRET` | a long random string | See below |
| `CLIENT_ORIGIN` | `http://localhost:5173` for now | Corrected in §3.4 once Vercel gives you a URL |
| `JWT_EXPIRES_IN` | `7d` | Optional |
| `CLOUDINARY_URL` | see §4 | Optional but recommended |

Generate the secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Do not set `PORT`.** Render injects it, and the server reads it.

The server refuses to start in production if `JWT_SECRET` is missing, blank or
shorter than 16 characters. If the first deploy crashes, read the log before
assuming anything else is wrong — the message says exactly this.

### 2.3 Deploy and verify

Render deploys on save. When the log shows:

```
🚀 Mountain-Able API running on port 10000 (production)
   Allowed origins: http://localhost:5173
```

check the health endpoint:

```bash
curl https://mountain-able-api.onrender.com/api/health
```

Expected:

```json
{"success":true,"data":{"status":"ok","uptime":12.3,"db":"connected"}}
```

`"db":"connected"` is the part that matters. `"disconnected"` means the Atlas
URI, the database user or the network allow-list is wrong.

Then confirm the seeded data is visible:

```bash
curl "https://mountain-able-api.onrender.com/api/villages?limit=2"
```

If this returns `"total":0`, the database name is missing from the URI (§1.4).

### 2.4 The free tier sleeps

A free Render service **spins down after roughly 15 minutes of inactivity**, and
the next request takes **30–60 seconds** while it starts again.

This matters for a live demonstration more than anything else in this document.
Open the site a few minutes before presenting and let the first request complete.
If the presentation is important, consider the paid instance type for that day,
or accept the delay and know what it is rather than debugging it on stage.

---

## 3. Vercel — the client

### 3.1 Create the project

1. At <https://vercel.com/new>, import the same repository.
2. Configure:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `client` |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |

Again, **Root Directory must be `client`**.

### 3.2 Environment variable

**Settings → Environment Variables:**

| Key | Value | Environments |
|---|---|---|
| `VITE_API_URL` | `https://mountain-able-api.onrender.com/api` | Production, Preview, Development |

Two things about this that catch people out:

- **The `/api` suffix is required.** The client appends paths like `/villages` to
  it. Without the suffix every request 404s.
- **Vite inlines `VITE_*` variables at build time, not run time.** Changing this
  value later has no effect until you redeploy. If the deployed site is calling
  the wrong API after you corrected the variable, that is why.

### 3.3 Deploy

Deploy, and note the URL Vercel assigns (for example
`https://mountain-able.vercel.app`).

The site will load and then fail to fetch anything. That is expected: the API
does not yet allow this origin. Fix it next.

### 3.4 Point the API back at the client

Return to Render → Environment, and set:

```
CLIENT_ORIGIN=https://mountain-able.vercel.app
```

To keep local development working against the deployed API at the same time, use
the list form:

```
CLIENT_ORIGIN=https://mountain-able.vercel.app,http://localhost:5173
```

Rules for this value:

- **Bare origins only** — scheme, host and optional port. No path, and no
  trailing slash. A browser's `Origin` header never carries a trailing slash, so
  `https://site.vercel.app/` silently matches nothing. (The server strips
  trailing slashes defensively, but do not rely on it.)
- Comma-separated, whitespace tolerated.

Save; Render restarts automatically. Reload the Vercel site — content should
appear.

If a request is rejected you now get a clear message rather than a generic
failure:

```json
{"success":false,"message":"Origin https://... is not allowed. Add it to CLIENT_ORIGIN on the API."}
```

### 3.5 Why `vercel.json` exists

`client/vercel.json` rewrites every path to `index.html`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Without it, the site works while you navigate within it and breaks the moment
anyone **reloads a sub-page or opens a shared link**. React Router handles
`/villages` in the browser, but a reload asks Vercel for a file at that path,
which does not exist, and Vercel returns its 404.

This affects exactly the things most likely to be tried by an examiner: a shared
filtered-search URL, a bookmarked village page, refreshing `/admin`.

The rewrite is safe for the API because the API is on a different host
altogether — nothing under `/api` is served by Vercel.

---

## 4. Cloudinary — persistent uploads (optional, recommended)

### 4.1 Why

**Render's filesystem is ephemeral.** It is wiped on every restart and every
redeploy, and a free instance restarts whenever it wakes from sleep. Images
uploaded through the village editor are written to `server/uploads/` and will
disappear — leaving broken images on village pages that worked when they were
created, with no error anywhere to explain it.

Village images that come from the seed are Unsplash URLs and are unaffected. This
only concerns images uploaded through the running application.

### 4.2 Set it up

1. Create a free account at <https://cloudinary.com>.
2. On the dashboard, find **API Environment variable**. It looks like:
   `cloudinary://123456789012345:abcdefgHIJKLMNOP@your-cloud-name`
3. Add it to Render as `CLOUDINARY_URL`, verbatim.
4. Save and let the service restart.

That is all. The application detects the variable and switches storage backend:
uploads go to Cloudinary and the returned HTTPS URL is stored on the document
instead of a `/uploads/...` path. The client needs no change, because it already
passes absolute URLs through unmodified.

Left unset in production, the server prints a warning at startup and continues
with local storage:

```
⚠️  CLOUDINARY_URL is not set. Uploaded images will be written to the local
filesystem, which is wiped on every restart and redeploy on a managed host.
```

Existing local paths in the database are not migrated. If you seed after
configuring Cloudinary, seeded records are unaffected either way since they use
external URLs.

---

## 5. Warm the caches before a demonstration

The route planner's provider caches live in the **API server's process memory**,
so they must be warmed against the server you will actually demonstrate.

```bash
cd server
npm run warm-cache -- https://mountain-able-api.onrender.com
```

The `/api` suffix is added automatically; passing it explicitly also works, as
does `API_URL=... npm run warm-cache`.

The script prints a `PASS`/`FAIL` line per journey and exits non-zero if any
journey fails to verify as cache-served. **Do not present on a `FAIL`** — see
`docs/demo-script.md`.

Run this *after* the service has woken up, and note that a free instance
restarting discards the warmed caches, so warm it close to the presentation.

---

## 6. Post-deployment checklist

| Check | Command or action | Expected |
|---|---|---|
| API alive, database connected | `curl .../api/health` | `"status":"ok"`, `"db":"connected"` |
| Seeded data present | `curl ".../api/villages?limit=2"` | `"total":24` |
| CORS configured | Load the Vercel site | Villages appear |
| Deep link works | Open `/villages` directly, then refresh | Page loads, no 404 |
| Login works | Sign in as the admin | Dashboard loads |
| Rate limiter sees real IPs | Render logs | No `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` |
| Uploads persist | Upload an image, redeploy, reload the village | Image still visible (Cloudinary only) |
| Demonstration notice | Scroll to the footer | Sample-content notice visible |
| Secrets not committed | `git ls-files \| grep "\.env$"` | No output |

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Site loads, no content, console shows CORS errors | `CLIENT_ORIGIN` missing or has a trailing slash | §3.4 |
| `{"message":"Origin ... is not allowed"}` | Same, and now self-explanatory | Add that exact origin |
| `"total":0` from `/api/villages` | Database name missing from the Atlas URI | §1.4, then reseed |
| `"db":"disconnected"` | Wrong Atlas credentials, or IP not allow-listed | §1.2, §1.3 |
| Render crashes on boot with `FATAL: JWT_SECRET` | Secret missing, blank or under 16 characters | §2.2 |
| First request takes ~50 s | Free instance waking from sleep | §2.4 — expected |
| Refreshing `/villages` gives a Vercel 404 | `vercel.json` missing or root directory wrong | §3.5 |
| Client calls `localhost` in production | `VITE_API_URL` set after the build | Redeploy — §3.2 |
| Uploaded images vanish after a deploy | Ephemeral filesystem | §4 |
| Everyone rate-limited at once | `trust proxy` not applied | Already set; confirm `NODE_ENV=production` |
| `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` in logs | Proxy trust disabled | Already set in `app.js` |

---

## 8. Security notes for a public deployment

The threat model in `docs/security.md` assumed a local demonstration. Four points
change once the site is reachable from the internet:

1. **Change `SEED_PASSWORD`.** The default is published in this repository.
2. **`JWT_SECRET` must be unique to the deployment**, never the placeholder from
   `.env.example`. Changing it later invalidates every session, which is the
   correct behaviour if you suspect exposure.
3. **The general rate limiter only runs when `NODE_ENV=production`.** This is
   deliberate (see `docs/security.md` §3.5) but means a deployment left in
   development mode is unprotected against flooding.
4. **Atlas is open to all IPs** (§1.3). Credentials are the only barrier, so the
   database password should be long and random.

One further point, unchanged but worth restating in a public context: the
platform is a demonstration. The villages and municipalities are real; the
reviews, ratings and declared capabilities are sample content. The footer states
this on every page, and that notice should not be removed from a deployed build.

# Live demonstration script — ~10 minutes

> **On the morning of the presentation, with both servers already running, run
> `cd server && npm run warm-cache`.** The route planner's provider caches are
> in-process and the Overpass entries expire after a day, so yesterday's warm-up
> is worthless. The script pre-fetches every journey used below and then
> re-issues each request to confirm it is genuinely cache-served, printing a
> `PASS`/`FAIL` line per journey. **Do not present on a `FAIL`** — read
> [Troubleshooting](#troubleshooting) instead.

The walkthrough follows the platform's value chain rather than its menu
structure: a municipal officer publishes content, an administrator approves it,
a tourist discovers and plans a journey around it, and a regional authority
reads the aggregate that results. Each step exists because the previous one
produced something.

Step 7b then turns the chain sideways. Everything up to that point shows a
municipality speaking to tourists; 7b is the only part where municipalities speak
to each other, and it is the part that answers an objective the original proposal
set out and the rest of the build leaves untouched. Budget for it.

Password for every seeded account: `Password123!`

---

## Before you start

| # | Preparation | Why |
|---|---|---|
| 1 | `cd server && npm run dev`, `cd client && npm run dev` | API on `:5000`, Vite on `:5173`. |
| 2 | `cd server && npm run seed` — **only if the data looks wrong** | Reseeding resets everything, including the 6 pending reviews the moderation step depends on. If you reseed, warm the cache again afterwards: village IDs change. |
| 3 | `cd server && npm run warm-cache` | Must print `4/4` warmed and `4/4` verified. Note which journeys report a POI count — see step 6. |
| 3b | Open `/dashboard/coordination?tab=neighbours` once as `officer.torgnon@mountainable.it` | Ranking calls OSRM's table service. The result is cached for seven days, but the first call of the day takes a second or two — do it before the room is watching. |
| 4 | Log in as all four roles in **four separate browser profiles or windows** | The app holds one session at a time. Switching roles by logging out mid-demo costs ~20 seconds each time and invites a typo in front of the examiners. |
| 5 | Zoom the browser to 100 %, window at 1440 × 900 | Matches the layout the design system targets; the dashboard sidebar collapses below ~1100 px. |
| 6 | Open the four starting tabs listed below | Avoids typing URLs on stage. |
| 7 | Have `docs/security.md` and `docs/design-decisions.md` open in an editor tab | Both come up in questions; far better to show than to describe. |

**Tabs to open in advance**

| Window | Account | Starting URL |
|---|---|---|
| A — public | logged out | `http://localhost:5173/` |
| B — officer | `officer.aosta@mountainable.it` | `http://localhost:5173/dashboard` |
| C — admin | `admin@mountainable.it` | `http://localhost:5173/admin/villages` |
| D — authority | `authority@mountainable.it` | `http://localhost:5173/authority` |

A fifth tourist login is used in step 5; log in as `sara@example.com` in
window A when you get there, or prepare a fifth window if you prefer.

---

## 1 · Framing — the problem  ·  0:45

**Window A ·** `http://localhost:5173/` · logged out

Stay on the home page while you say this; do not scroll yet.

- Small Italian mountain municipalities have tourism information scattered
  across PDFs, dead Facebook pages and nothing at all. A tourist cannot find
  them; a municipality cannot afford a website.
- This platform is one place for both. **Twenty real villages** are seeded with
  genuine coordinates — Chamois, which has no road access, Sauris, Castelmezzano.
- Four roles, each with a different reason to be here: officer, administrator,
  tourist, authority. The demonstration follows them in that order.

Then scroll once through the home page — hero, most-popular villages, the About
band — and stop.

---

## 2 · The officer publishes content  ·  1:45

**Window B ·** `http://localhost:5173/dashboard` · `officer.aosta@mountainable.it`

This is Giulia Rossi, tourism officer for *Unione Comuni Valle d'Aosta*.

1. **The overview.** Point out that every figure is scoped to her own
   municipality. She has no view of any other.
2. **Villages → Add village.** Fill only what is needed to make the point —
   name, region, a short description, coordinates. *Suggestion:* a plausible new
   village name rather than a duplicate of a seeded one.
3. **Save, and point at the status column: `Draft`.**
   > This is the important beat. An officer can create and edit, but cannot
   > publish. `isPublished` is not in the controller's allow-list at all — the
   > field is unreachable from an officer's request, not merely hidden in the
   > UI. Publication is an administrator's decision.
4. If asked about scope enforcement: an officer acting on another
   municipality's village receives `403` from the `ownsVillage` middleware, not
   from a controller check.

**Leave the new village unpublished.** Step 3 publishes it.

---

## 3 · The administrator approves  ·  1:45

**Window C ·** `http://localhost:5173/admin/villages` · `admin@mountainable.it`

1. **Find the officer's draft** — it is newest-first at the top — and click its
   `Draft` badge to publish it. Note that it becomes publicly visible only now.
2. **Moderation** → `/admin/moderation`. The queue holds **6 pending reviews**.
   - Approve one and reject one, so both outcomes are visible.
   - Point out the keyboard shortcuts (`A` approve · `R` reject · `J`/`K` move):
     moderation is repetitive work, so it is built to be done quickly.
   - Say explicitly: **only approved reviews count towards a village's rating.**
     The average is recomputed by a model hook from an aggregation, never
     assembled in a controller.
3. **Officer requests** → `/admin/officer-requests`. Two pending requests. This
   is how a municipality joins: it applies, an administrator activates it. New
   officers start `pending` and cannot write until then.

> If asked why moderation matters: municipalities are being asked to trust that
> what appears against their village is not defamatory or spam. That trust is
> the platform's actual product. See `docs/design-decisions.md`.

---

## 4 · The tourist discovers  ·  2:00

**Window A ·** logged out at first

1. **`/villages`** — the listing. Search **Name / Region / Minimum rating**.
   Filter to a region and a minimum rating.
   > Point at the address bar: the filters, page and sort are **in the URL**. A
   > filtered search is a shareable link, and the back button behaves.
   > (Mention in passing that the Figma's search bar was Location/Date/Guests —
   > a booking-template leftover. There is no booking here, so it was rebuilt.)
2. **The map** stays in view beside the results and reflects the filter.
3. **Open a village** — `Scanno` is the strongest, and it is the destination in
   step 6. Show the gallery, the description, and the sidebar: attractions,
   events, altitude, municipality.
   > The Figma's stats strip read "560 Tourists / 6 Hotels / 12 Shops". The
   > database holds none of those, so it shows attractions, events and reviews
   > instead. Inventing numbers to fill a layout would have been dishonest.
4. **Scroll to the reviews** — average, 1–5 distribution, the list.
   > The Figma had no reviews UI at all, despite ratings being a core feature.
   > This section was designed from scratch.

---

## 5 · The loop closes — a tourist writes a review  ·  1:15

**Window A ·** log in as `sara@example.com`

Still on the village page, write and submit a short review.

- It does **not** appear in the public list. It appears in *your* card, badged
  **"Pending review"**, with a note that an administrator will publish it
  shortly.
  > Reviews are moderated before publication. The author is told so explicitly —
  > a review that simply vanished would read as a bug. Nobody else can see it,
  > and it does not move the village's rating.
- **Switch to window C** (`/admin/moderation`), approve it, switch back and
  reload: it is now public and counted.

> This is the strongest single moment in the demonstration — it closes the loop
> between three of the four roles in under a minute. If you are running short,
> cut step 7 rather than this.

Worth mentioning if asked: **editing an approved review returns it to pending**,
otherwise the gate could be bypassed by posting something innocuous and editing
it afterwards.

---

## 6 · Planning a journey  ·  2:00

**Window A ·** `http://localhost:5173/plan`

Use the journey that reported a POI count in the warm-cache output. **Sulmona →
Scanno** is the default choice below; `Brescia → Bagolino` is the fallback.

1. Search `Scanno`, choose it, and continue into the planner.
2. In the start field **type `Sulmona` and click the first suggestion**
   (*Sulmona, L'Aquila, Abruzzo, 67039, Italia*).
   > **This matters.** Route cache keys round coordinates to ~11 m. A different
   > suggestion is a different cache key and a live provider call — which on an
   > unfamiliar network may take a minute. The warm-cache script prints the
   > exact coordinates it warmed; they come from this same first result.
3. Plan the route. It should return **instantly** — roughly 31 km, ~1100 m of
   ascent.
4. Point out, in order:
   - **The elevation profile.** This is mountain travel; distance alone is
     useless. The profile is reconstructed from an elevation API, because the
     routing provider does not supply one.
   - **Terrain advisories**, derived from the profile and from road surface
     tags — sustained climbs, unpaved sections.
   - **Other platform villages along the corridor**, found with a geospatial
     query against our own database, not by scanning in JavaScript.
   - **OSM points of interest** along the route, and the OpenStreetMap
     attribution.
5. If POIs are unavailable, say so plainly and move on — see below.

> **Honest degradation.** If routing fails, the planner returns the destination
> and says the route is unavailable. It never draws a straight line between two
> points and calls it a route. If Overpass is down, the POI layer says so rather
> than showing an empty map that implies there is nothing there.

---

## 7 · The authority reads the aggregate  ·  1:15

**Window D ·** `http://localhost:5173/authority` · `authority@mountainable.it`

1. **Overview** — platform-wide totals.
2. **Regions**, **Top villages**, **Satisfaction over time** — the last one has
   twelve months of genuine variation, because the seeded reviews are spread
   across the year.
3. Two things to say:
   - This role is **read-only by construction**. It has no write endpoint at
     all, not a hidden button.
   - Every figure comes from a **MongoDB aggregation pipeline**, computed in the
     database. Nothing is reduced in memory in Node.

---

## 7b · The municipalities coordinate  ·  2:00

**Window B ·** `http://localhost:5173/dashboard` · sign in as
`officer.torgnon@mountainable.it`

This is the strongest step in the demonstration, because everything before it
shows a municipality speaking to tourists. This is the only part where
municipalities speak to **each other**.

1. Point at the **Coordination** entry in the sidebar — it carries a **count**.
   Torgnon has one unanswered request waiting.
   > A municipality of a few hundred residents cannot sustain a shuttle, a guide
   > or a rental point. A valley of six such villages usually can. The capacity
   > exists; it is fragmented across boundaries the terrain does not respect.
2. **Our capabilities** — Torgnon declares a hostel, cross-country hire, a hall
   and local produce. Toggling a service on takes a few seconds, which is
   deliberate: a directory nobody fills in is worth nothing.
3. **Neighbours** — the directory, ranked by **travel time, not distance**. This
   is the moment to slow down:
   > Valtournenche is **5.8 kilometres from Torgnon in a straight line**. By road
   > it is **26.5 kilometres and 88 minutes**, because the only way between them
   > goes down to the valley floor and back up. A straight-line radius would have
   > called that neighbour *close*. This is why the ranking uses the routing
   > service, and it is one OSRM matrix call, not one call per candidate.
4. **Our requests** — open the closed one for *accessible transport*. It was
   raised twice and met neither time.
5. **Raise a request** and choose a service. Before sending anything, the dialog
   shows **exactly which municipalities will receive it**, with travel times.
   > An officer must never be unsure who they just contacted.
6. Switch to `officer.valtournenche@mountainable.it` → **Incoming**, and answer
   one. Three options, not two — *we can help*, *we can partly help*, *we
   cannot*.
   > A neighbour who can send one minibus instead of two is the realistic case in
   > mountain terrain. And a clear no is more useful than silence.
7. Say the boundary out loud, before anyone asks:
   > There is no price here, no availability calendar, no booking and no payment.
   > The platform introduces the two administrations and records the outcome. The
   > arrangement happens between them, off the platform, exactly as it does today
   > — except that today they have no way to find each other.

**Window D ·** `/authority/coordination`

8. **Where to invest** — the table flags **accessible transport** as a priority:
   sought twice, met neither time, declared by one municipality in fourteen.
   > This is the part no single comune could produce. Each of them knows only
   > its own unmet need. Pooled across the territory it becomes evidence of which
   > capability is persistently missing — which is exactly what a regional
   > authority needs to direct investment.
9. Point at the **coverage matrix** and its empty cells, and at **n < 5** where a
   rate is withheld.
   > Ten requests is not a statistically meaningful sample, so the screen shows
   > counts and refuses to print a percentage from one or two cases. The same
   > honesty rule that removed the invented visitor counts from the village page.

---

## 8 · Close  ·  0:45

Return to window A, home page.

- Recap the chain in one sentence: *officer publishes → admin approves →
  tourist discovers and plans → authority measures.*
- Then the second one, which is the part that answers the original proposal's
  unrealised objective: *municipalities declare what they can offer, ask their
  neighbours for what they cannot, and the record of what went unmet becomes
  territorial evidence.*
- State the scope boundary before you are asked: **no booking, no payments, no
  transport optimisation, no chatbot.** These are documented as future work,
  not omissions.
- Offer the documentation: `server/API.md` for the endpoint reference,
  `docs/security.md` for the hardening pass, `docs/design-decisions.md` for the
  decisions behind the implementation.

---

## Timing

| Step | Minutes | Running |
|---|---|---|
| 1 · Framing | 0:45 | 0:45 |
| 2 · Officer publishes | 1:45 | 2:30 |
| 3 · Admin approves | 1:45 | 4:15 |
| 4 · Tourist discovers | 2:00 | 6:15 |
| 5 · Review loop closes | 1:15 | 7:30 |
| 6 · Journey planner | 2:00 | 9:30 |
| 7 · Authority | 1:15 | 10:45 |
| 7b · Municipalities coordinate | 2:00 | 12:45 |
| 8 · Close | 0:45 | 13:30 |

Thirteen and a half minutes at a comfortable pace — the walkthrough has outgrown
the original ten-minute budget, and step 7b is the reason.

**If you must cut to ten minutes, cut steps 2 and 7, not 7b.** Step 2 can be
shortened by filling fewer fields; step 7 can drop to the overview and the
satisfaction chart alone. Step 7b is the only part of the demonstration that
shows municipalities working with each other rather than publishing at tourists,
and it is the part that answers an objective the proposal set and the rest of the
build does not touch. **Do not cut step 5 or step 7b.**

If the presentation is strictly capped at ten minutes, the better trade is to
merge 7 and 7b: open `/authority/coordination` as the single authority screen and
skip the other three, keeping the officer half of 7b intact.

---

## Troubleshooting

| Symptom | Cause | Do this |
|---|---|---|
| `warm-cache` prints `FAIL` for a journey | Something is reaching a provider live | Re-run it. If it still fails, drop that journey and present one that passed. |
| `warm-cache` warns "no elevation profile cached" | Open-Meteo did not answer, and the elevation-less route is now cached for 7 days | Restart the API server to clear the in-process cache, then warm again. Re-running alone returns the same cached route. |
| `warm-cache` cannot reach the API | Server not running, or a different port | Start it; or `API_URL=http://host/api npm run warm-cache`. |
| Route planner is slow on stage | The start point did not match a warmed one | Re-type the place name and pick **the first suggestion**. |
| POIs say "unavailable" | Overpass mirrors are down — they frequently are | Say so and move on. The failure is cached, so it fails instantly rather than hanging; that is deliberate and worth pointing out as honest degradation. |
| Moderation queue is empty | Someone reseeded, or the 6 pending were moderated in a rehearsal | `npm run seed`, then `npm run warm-cache` again. |
| A dashboard looks wrong at a small window | Sidebar collapses below ~1100 px | Resize to 1440 × 900. |

---

## Accounts

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@mountainable.it` | Full access; moderates, publishes, manages users. |
| Authority | `authority@mountainable.it` | Read-only aggregate statistics. |
| Officer | `officer.aosta@mountainable.it` | Unione Comuni Valle d'Aosta. Others: `officer.lucane@`, `officer.gransasso@`, `officer.agordina@`. |
| Officer (coordination) | `officer.torgnon@mountainable.it` | **Use these for step 7b.** The Valtournenche/Ayas cluster, the only municipalities with real neighbours: also `officer.valtournenche@`, `officer.antey@`, `officer.ayas@`. Torgnon has an unanswered incoming request, so its sidebar badge shows a count. |
| Tourist | `sara@example.com` | Has visits and favourites already. Others: `davide@`, `elena@`, `matteo@`, `francesca@`, `andrea@`, `martina@example.com`. |

Password for all of them: `Password123!`

---

## Warmed journeys

Warmed by `npm run warm-cache`; the coordinates come from the first Nominatim
suggestion for each place name, which is what the planner will produce when you
type it.

| Type in the start field | Destination | Roughly |
|---|---|---|
| `Sulmona` | Scanno | 31 km · ↑1100 m |
| `Brescia` | Bagolino | 27 km · ↑1109 m |
| `Aosta` | Chamois | 40 km · ↑917 m |
| `Castelmezzano` | Pietrapertosa | 12 km · ↑839 m |

Always click the **first** suggestion.

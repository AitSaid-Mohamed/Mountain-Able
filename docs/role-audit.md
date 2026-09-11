# Role audit — what each role can actually do

*Compiled 10 September 2026, by reading `server/src/routes/`, `server/src/middleware/`,
`server/src/controllers/`, `client/src/App.jsx` and `client/src/config/dashboardNav.js`
against the code as committed. Every capability below is derived from a guard chain or a
route definition, not from the report or from expectation.*

Where a behaviour could not be established by reading alone, it is marked
**[unverified]** rather than asserted.

> **Status, 10 September 2026.** Four findings from this audit have since been
> fixed: the missing officer-request form (§5.1), the support dialog's unsent
> submission (§6.1), the save-route role gap (§6.2) and the inline comment
> authorisation (§0). They are marked **RESOLVED** in place below, with the
> original finding left intact — the point of the audit is the record of what was
> found, not a clean sheet. Reasoning for each fix is in
> `docs/design-decisions.md`; the report summarises them in §10.1.1.

---

## 0. The guards, and what each one actually does

Four middleware functions carry all authorisation. Understanding them makes the rest of
this document readable.

| Guard | File | Effect |
|---|---|---|
| `protect` | `middleware/auth.js` | Requires a valid Bearer token; loads `req.user`. Rejects a missing/invalid token (401), a token whose `tv` claim ≠ the user's `tokenVersion` (401, revocation), and a `suspended` user (403). |
| `optionalAuth` | `middleware/auth.js` | Attaches `req.user` when a valid token is present, never rejects. Used where a route is public but behaves differently when signed in. |
| `restrictTo(...roles)` | `middleware/auth.js` | 403 unless `req.user.role` is in the list. |
| `requireActive` | `middleware/auth.js` | 403 when `req.user.status === 'pending'`. Applied to officer/admin write routes only. |
| `ownsVillage` | `middleware/ownsVillage.js` | Loads the village from `params.villageId ?? params.id`; admins bypass; officers pass only when `village.municipalityId.equals(req.user.municipalityId)`; otherwise 403. |
| `ownsResource(Model, name)` | `middleware/ownsVillage.js` | Same rule for attractions and events addressed by their own id, resolved through the parent village. |

**One structural note.** `PATCH /api/comments/:id` and `DELETE /api/comments/:id`
(`routes/commentRoutes.js`) carry `protect` **only** — no `restrictTo`, no `ownsResource`.
Their authorship and admin checks live inline in `commentController.js`
(`updateComment`, `deleteComment`). This works, but it contradicts the convention in
`CLAUDE.md` that authorisation never sits inline in a controller. It is the only place in
the codebase where that rule is broken. Flagged as a consistency defect, not a
vulnerability — the checks themselves are correct.

**RESOLVED.** Extracted to `server/src/middleware/ownsComment.js` as
`canEditComment` and `canDeleteComment`, both mounted on the routes and attaching
`req.comment`. The claim of centralised authorisation now holds without exception.

---

## 1. Tourist

Self-registers at `POST /api/auth/register`, which forces `role: 'tourist'` and
`status: 'active'` server-side (`authController.js:34-35`), so the public endpoint cannot
mint a privileged account.

### 1.1 Actions, by area

**Account**
- Register, log in, read own profile (`GET /api/auth/me`), update own profile and upload
  an avatar (`PATCH /api/auth/me`). The update allow-list is `firstName`, `lastName`,
  `phone`, `city` — role, status, email and password are excluded by design.

**Discovery** (all public, no auth required)
- List/search/filter/sort/paginate published villages — `GET /api/villages`.
- Map feed — `GET /api/villages/map`.
- Village detail by slug — `GET /api/villages/:slug`.
- Per-village attractions, events, comments; global events feed; municipalities;
  categories.

**Reviews**
- Create exactly one review per village — `POST /api/villages/:villageId/comments`,
  `restrictTo('tourist')`. Created `pending`; invisible to others until an admin approves.
- Edit own review within 24 h — `PATCH /api/comments/:id`. An edit resets status to
  `pending`, so an approved review re-enters the queue.
- Delete own review at any time — `DELETE /api/comments/:id`.
- Read own reviews — `GET /api/comments/me` (note: `protect` only, so any role may call
  it; only tourists ever have rows).

**Personal tracking** — `/api/me/*`, the whole router gated by
`protect, restrictTo('tourist')` (`meRoutes.js:19`)
- Visited villages: list, add, update (date/note), remove.
- Favourites: list, add, remove.
- Saved routes: list, add, remove.
- Own aggregate stats — `GET /api/me/stats`.

**Journey planning** — `/api/routes/*`, **fully public, no `protect` at all**
- `POST /api/routes/plan`, `GET /api/routes/corridor`, `GET /api/routes/geocode`.
  Guarded only by `routesLimiter` (60 / 15 min, skipped under `NODE_ENV=test`).

### 1.2 Screens

| Route | Screen |
|---|---|
| `/` | Home |
| `/villages` | Listing + map |
| `/villages/:slug` | Village detail with reviews |
| `/villages/:slug/route` | Route planner |
| `/plan` | Plan a journey (village picker) |
| `/events` | Events |
| `/about` | About |
| `/signup` | Sign up |
| `/login` | Home with login modal |
| `/profile` | Shared profile (all four roles) |
| `/my` | Tourist overview |
| `/my/visited` | Visited villages |
| `/my/favorites` | Favourites |
| `/my/routes` | Saved routes |
| `/my/reviews` | Own reviews |

`/my/*` is guarded by `RequireRole roles={['tourist']}`; a wrong role gets `ForbiddenPage`,
not a redirect.

### 1.3 What a tourist cannot do

| Blocked action | Stopped by |
|---|---|
| Create/edit/delete a village | `restrictTo('officer','admin')` on the village write routes |
| Create/edit/delete attractions or events | `restrictTo('officer','admin')` |
| Publish a village | `restrictTo('admin')` on `PATCH /villages/:id/publish` |
| Moderate any review | `restrictTo('admin')` on `/comments/pending` and `/comments/:id/moderate` |
| Manage users, municipalities, categories, officer requests | `restrictTo('admin')` |
| Read any statistic | `restrictTo('authority','admin')` on the whole stats router |
| Review the same village twice | 409 in `createComment`, plus a compound unique index on `Comment` |
| Edit a review after 24 h | 403 from `canEditComment` (`middleware/ownsComment.js`) |
| Edit or delete another user's review | `canEditComment` / `canDeleteComment` |

---

## 2. Municipality Officer

Created `pending` — either by `POST /api/users/officer-request` (public) or by the seed.
A pending officer authenticates and reads normally but every write is refused by
`requireActive`.

### 2.1 Actions, by area

**Villages**
- Create — `POST /api/villages` (`restrictTo('officer','admin')`, `requireActive`). The
  controller **overwrites** `municipalityId` with the officer's own
  (`villageController.js`), so an officer cannot attribute a village to another comune
  even by crafting the body.
- Update / delete own — `PATCH`/`DELETE /api/villages/:id` (`+ ownsVillage`). Delete
  cascades to attractions, events and comments.
- Images — `POST /api/villages/:id/images`, `DELETE /api/villages/:id/images/:idx`
  (`+ ownsVillage`), with magic-byte verification on upload.

**Attractions and events**
- Create under own villages — `POST /api/villages/:villageId/{attractions,events}`
  (`+ ownsVillage`).
- Edit/delete by id — `PATCH`/`DELETE /api/{attractions,events}/:id` (`+ ownsResource`).

**Feedback** — read-only. Reviews on their villages are read through the ordinary
per-village comment endpoint; officers have no moderation capability.

**Everything a signed-in non-tourist can do publicly** — browse, plan routes, edit own
profile.

### 2.2 Screens

`/dashboard`, `RequireRole roles={['officer']}`. Nav from `dashboardNav.js`:
Overview · My villages · Attractions · Events · Feedback · Profile.

| Route | Screen |
|---|---|
| `/dashboard` | Overview (KPIs, villages, latest feedback) |
| `/dashboard/villages` | Own villages table |
| `/dashboard/villages/new` | Village editor (create) |
| `/dashboard/villages/:id/edit` | Tabbed editor: Details · Location · Media · Attractions · Events |
| `/dashboard/attractions` | Attractions across own villages |
| `/dashboard/events` | Events across own villages |
| `/dashboard/feedback` | Reviews on own villages |
| `/dashboard/profile` | Shared profile |

### 2.3 What an officer cannot do

| Blocked action | Stopped by |
|---|---|
| Touch another municipality's village | `ownsVillage` → 403 |
| Touch another municipality's attraction/event | `ownsResource` → 403 |
| Publish anything | `restrictTo('admin')` on `/publish`; `isPublished` is also absent from the update allow-list, so the field is unreachable, not merely hidden |
| Set `ratingAverage` / `ratingCount` | Absent from the allow-list; derived from approved comments only |
| Reassign a village's municipality | `municipalityId` is added to the allow-list only when `req.user.role === 'admin'` |
| Write anything at all while `pending` | `requireActive` → 403, mirrored client-side by `readOnly` in `DashboardLayout` |
| Moderate reviews, manage users/categories/municipalities | `restrictTo('admin')` |
| Read statistics | `restrictTo('authority','admin')` |
| Use `/api/me/*` (favourites, visits, saved routes) | `restrictTo('tourist')` — see §6, this has a UI consequence |

---

## 3. System Administrator

No self-service path: seeded, or promoted by another admin via
`PATCH /api/users/:id/role`.

### 3.1 Actions, by area

**Everything the officer can do, unbounded** — `ownsVillage` and `ownsResource` both
bypass unconditionally for admins, so all villages, attractions and events are writable.

**Publication** — `PATCH /api/villages/:id/publish`, admin-only.

**Moderation** — `GET /api/comments/pending`; `PATCH /api/comments/:id/moderate`
(approve/reject); `DELETE /api/comments/:id` on any review.

**Users** — list/filter (`?role=`, `?status=`), read one, change status
(suspending also `$inc`s `tokenVersion`, killing live sessions), change role, delete
(self-deletion refused with 400).

**Officer requests** — list (`?status=`), approve/reject. Approval flips the linked
account to `active`, rejection to `suspended`.

**Municipalities and categories** — full CRUD, with referential-integrity guards: a
municipality with villages, or a category in use by attractions, returns 409.

**Statistics** — all four endpoints (`restrictTo('authority','admin')`).

### 3.2 Screens

`/admin`, `RequireRole roles={['admin']}`.

| Route | Screen |
|---|---|
| `/admin` | Overview |
| `/admin/villages` | All villages, publish toggle, bulk publish |
| `/admin/villages/new`, `/admin/villages/:id/edit` | Village editor (shared with officer) |
| `/admin/municipalities` | Municipality CRUD |
| `/admin/users` | User management |
| `/admin/officer-requests` | Approval queue |
| `/admin/moderation` | Review queue |
| `/admin/categories` | Category CRUD |
| `/admin/profile` | Shared profile |

### 3.3 What an admin cannot do

The role is designed for full access; the only true blocks are:

| Blocked action | Stopped by |
|---|---|
| Delete their own account | Explicit check in `deleteUser` → 400; UI also disables self-directed role/status/delete (`AdminUsers.jsx`, `disabled: self`) |
| Delete a municipality that still has villages | 409 in `deleteMunicipality` |
| Delete a category still used by attractions | 409 in `deleteCategory` |
| Use `/api/me/*` | `restrictTo('tourist')` |
| Post a review | `restrictTo('tourist')` on comment creation |

Note: nothing stops an admin from changing **their own role** via
`PATCH /api/users/:id/role` through a direct API call — the self-guard covers delete,
status and (in the UI) role, but the role controller itself has no self-check. The UI
disables it; the API does not. Low severity given the role is already privileged, but it
is an inconsistency between the two layers.

---

## 4. Regional Authority

Seeded or admin-assigned. Read-only by construction.

### 4.1 Actions

Exactly four endpoints, all `restrictTo('authority','admin')`, all implemented as
aggregation pipelines:

- `GET /api/stats/overview` — platform totals + mean rating
- `GET /api/stats/regions` — per-region aggregates
- `GET /api/stats/villages/top` — top villages, `ratingCount >= 3`, optional `?region=`
- `GET /api/stats/satisfaction` — distribution + 12-month series

Plus public browsing and own-profile editing.

### 4.2 Screens

`/authority`, `RequireRole roles={['authority']}`: Overview · Regions · Top villages ·
Satisfaction · Profile. Each table offers a client-side CSV export.

### 4.3 What an authority cannot do

Everything else. The role appears in **no** `restrictTo` list except the stats router, so
every write route in the system rejects it at the role guard. There is no ownership rule
to apply because there is nothing for it to own.

---

## 5. API permits it, no UI exposes it

These are working endpoints or parameters with no control in the interface.

| # | Capability | Status |
|---|---|---|
| 1 | **`POST /api/users/officer-request`** — the entire public "claim your village" flow. Endpoint, `OfficerRequest` model and the admin review queue all exist and work; there is no submission page and no link to one. The footer's **"For municipalities"** points at `/about`, which is the natural entry point and offers nothing. | **RESOLVED** — form at `/claim`, reachable from the footer (repointed), the sign-up page, and each village page with the municipality pre-filled. |
| 2 | **`category` filter on `GET /api/villages`** — supported by the controller, honoured by both the grid and the map, but `VillageSearchBar` offers only Name / Region / Minimum rating. Reachable only by hand-typing `?category=slug`. | Categories exist, are admin-managed, and are shown on village detail — but cannot be searched by. |
| 3 | **`province` filter** — same situation, no control anywhere. | |
| 4 | **`GET /api/officer-requests?status=approved\|rejected`** — the admin screen fetches `status: 'pending'` only, so once a request is decided it disappears from the interface. The audit trail (`reviewedBy`, `reviewedAt`) is recorded and then unreadable. | |
| 5 | **`GET /api/users/:id`** — implemented, never called; `AdminUsers` works from the list payload. | Harmless. |
| 6 | **`GET /api/municipalities/:id`** — implemented (returns the municipality plus its villages), never called. | Harmless. |
| 7 | **`GET /api/health`** — no UI, by design. | Not a gap. |
| 8 | **Admin attraction/event management outside the village editor** — the admin nav has no Attractions or Events entry, unlike the officer's. Admins reach them only through the village editor's tabs, which does work. | Minor asymmetry, not a functional block. |

---

## 6. UI offers it, API does not back it

| # | Control | What actually happens |
|---|---|---|
| 1 | **Support / Contact dialog** (`SupportModal.jsx`, reached from footer **"Contact us"** and **"Report an issue"**) | Submitting ran `console.info('[support] submission', form)`, waited 600 ms, and showed a success panel reading *"Thanks for reaching out! We'll get back to you soon."* Nothing was sent, stored or routed — the only control in the build that **claimed success for an action that did not occur**. **RESOLVED** — posts to `POST /api/support`, persisted as `SupportMessage` and triaged by admins at `/admin/support`; the success panel now follows a real `201`, and a failure shows an error. |
| 2 | **"Save route"** on the route planner (`RoutePlannerPage.jsx:91`) | Guarded on `if (!user)` only — it never checked the role. `POST /api/me/routes` is `restrictTo('tourist')`, so a signed-in **officer, admin or authority** who clicked Save got a **403**. **RESOLVED** — `canSave = !user || user.role === 'tourist'` hides the control for those roles, matching `VillageOwnControls.jsx:26`; logged-out visitors still see it and are prompted to sign in. |
| 3 | **Officer Feedback → "Report to admin"** | Client-side only; sets local state and toasts *"Reported to admin for review."* The report is documented as unbuilt in §10.1, but the **string asserts the report reached an admin**, which is untrue. The mechanism is honest; the wording is not. |
| 4 | **Profile → Password & Security** | Form renders; submit toasts *"Password change will be available soon."* Honest — no fake success. |
| 5 | **Profile → Delete account** | Type-to-confirm modal, then toasts *"You cannot change or delete your own account here."* Honest, though the confirm-by-typing ceremony implies an action that never happens. |
| 6 | **Login modal → "Login with Google · Coming soon"** | Labelled inert. Honest. |
| 7 | **Footer "How it works"** → `/about`, same target as "Our Mission" | Two labels, one destination. Cosmetic. |

Items 4–6 are correctly handled and listed here only so the distinction is on record.
Items 1–3 are the real ones.

---

## 7. Claimed vs built

Read against `docs/project-report.md` §1 (objectives), §4 (per-role claims) and §10.1
(self-declared gaps).

### 7.1 Stated objectives (§1)

| Claim | Verdict | Evidence |
|---|---|---|
| Centralised repository maintained by municipalities themselves | **Partial** | The maintenance machinery is complete and correct. But a municipality cannot *join*: the public request form does not exist (§5.1). Every officer in the system was seeded. The claim holds architecturally and fails operationally. |
| Discoverable through search, filtering and an interactive map | **Fully implemented** | Search, region, minimum-rating, sort, pagination, all URL-driven; map filters in step with the grid. Two supported filters have no control (§5.2, §5.3), which narrows the claim without breaking it. |
| Trust through moderated community reviews | **Fully implemented** | `pending` on create, admin queue, edit re-queues, only approved reviews count toward `ratingAverage`. Verified through the guard chain and `Comment.recalculateRatings()`. |
| Aggregated evidence-based view for regional authorities | **Fully implemented** | Four aggregation-pipeline endpoints, four screens, CSV export, no write capability anywhere. |
| Clearly bounded scope — no booking, payments, transport | **Fully implemented, with one wording risk** | No transactional code exists. But the report lists *"transport optimisation"* among the exclusions while the build ships a full OSRM route planner with elevation, surface advisories and corridor POIs. These are different things — journey *information* versus transport *optimisation* — but the report never draws the distinction, because (see below) it never mentions the route planner at all. An examiner could reasonably read that as the project crossing its own stated boundary. |

### 7.2 The largest mismatch — built but never claimed

**The report does not mention the route planner, the `/my` tourist area, favourites,
visited villages or saved routes anywhere.** A grep across all 592 lines for *route
planner*, */my*, *favourite/favorite*, *saved route* and *journey* returns only one
incidental hit in the introduction's prose.

What that omits:

- Three models — `Favorite`, `VisitedVillage`, `SavedRoute` — of the eleven in the build.
  §6 (Data model) therefore describes an incomplete schema.
- Five screens (`/my`, `/my/visited`, `/my/favorites`, `/my/routes`, `/my/reviews`) and
  two more (`/villages/:slug/route`, `/plan`). §4.1's tourist screen table lists seven
  routes; the build has fourteen for that role.
- Two whole routers — `/api/me/*` and `/api/routes/*` — absent from §4.1's API surface
  table, which is introduced with the claim that it was *"derived directly from the
  `restrictTo(...)` guards and the route definitions in `server/src/routes/`"*. For the
  tourist that statement is no longer accurate.
- The four external integrations (OSRM, Open-Meteo, Overpass, Nominatim), their caching
  layer, and the provenance handling — probably the most technically substantial work in
  the project, and the part most likely to earn credit.

This is the reverse of the usual problem: the code is ahead of its documentation. But the
report is a graded deliverable, and §4 explicitly claims to be derived from the routes.
An examiner comparing the two will find the report describing a smaller system than the
one demonstrated.

### 7.3 Per-role claims in §4

| Claim | Verdict |
|---|---|
| §4.1 tourist capabilities, restrictions, lifecycle | **Accurate** for what it covers; **incomplete** per §7.2. |
| §4.1 walkthrough (Abruzzo + 4-star filter, then Scanno) | **Accurate** — the filter yields four villages including Scanno, and the map now narrows with it. |
| §4.2 officer capabilities, `ownsVillage`/`ownsResource`/`requireActive` behaviour | **Accurate.** Verified guard-by-guard. |
| §4.2 *"the interface never offers an action that the API would reject"* | **Contradicted** — by the Save-route button (§6.2), which is on a tourist screen rather than an officer one, but the sentence is written as a general property of the build. |
| §4.3 admin capabilities and safeguards | **Accurate**, except that the self-role-change guard is UI-only (§3.3). |
| §4.4 authority read-only posture | **Accurate.** Confirmed: the role appears in no other `restrictTo` list. |

### 7.4 The report's own §10.1 gap list

Each claim checked against the code:

| §10.1 claim | Verdict |
|---|---|
| No password-change endpoint; form shows an informational notice | **Accurate** |
| No self-service deletion; control explains admin-only | **Accurate** |
| No review-reporting endpoint; officer action is client-side | **Accurate as to mechanism**; the user-facing string overstates it (§6.3) |
| Top-villages omits municipality | **Accurate** — the `$project` emits `region`/`province`, no municipality |
| No per-officer aggregate endpoint; figures composed client-side | **Accurate** — `OfficerScopeContext` fans out per village |
| Officer-request approval cannot amend the municipality inline | **[unverified]** — the `OfficerRequest` model does carry no municipality id, which is consistent with the claim, but I did not trace the approval modal's fields |
| Unsaved-changes protection is `beforeunload` only | **[unverified]** — not traced |
| No automated test suite or CI | **Accurate** — no test runner in `package.json`, no workflow files |
| Deployment local, uploads on local filesystem | **Accurate** |

**Not listed in §10.1 but should be:** the missing officer-request UI, the fake support
submission, and the Save-route role gap.

---

## 8. Prioritised gaps

### 8.1 Gaps that undermine something the project explicitly claims

*All six below were addressed on 10 September 2026 — items 1, 3 and 4 in code,
items 2 and 6 in the report itself. Item 5 remains open. The original findings are
kept as the record of what the audit found.*

1. **No public officer-request form.** *(FIXED — `/claim`.)* The report devotes §4.2(g) to an officer lifecycle
   that begins at `POST /api/users/officer-request`, and §1 claims a repository
   *"maintained by the municipalities themselves"*. Neither is reachable: the API works,
   the admin queue works, the front door does not exist. Highest priority — it is the one
   gap that falsifies a stated objective rather than trimming it. The footer's *"For
   municipalities"* link is the natural place to land it.

2. **The report omits the route planner and the whole `/my` area.** *(FIXED — §4.1, §5, §6 and §8 of the report updated 10 September 2026.)* §4.1 states its tables
   are derived from the routes; for the tourist they no longer are. Three models, seven
   screens, two routers and four external integrations are undocumented. This is a
   documentation fix, not a code fix, and it is the cheapest large gain available before
   submission — the work is already built and demonstrable.

3. **The support dialog fakes success.** *(FIXED — `POST /api/support` + admin inbox.)* It tells the user a message was sent when nothing
   left the browser. §11 of the report argues at length that the platform *"only claims
   … what it can honestly support"*, citing the removed date-of-birth field and the
   refusal to invent visitor counts. This control contradicts that argument directly, and
   it sits behind two footer links an examiner may well click. Cheapest fix: change the
   copy to match the other unbuilt features, or remove the form and leave the contact
   channels. A real endpoint is not required.

4. **Save-route offers a 403 to three of four roles.** *(FIXED — role guard.)* §4.2(d) claims the interface never
   offers an action the API would reject. One-line fix at `RoutePlannerPage.jsx:91`,
   mirroring the check already present in `VillageOwnControls.jsx:26`.

5. **"Reported to admin for review" is untrue.** *(STILL OPEN — wording unchanged.)* Same class as (3) but smaller: the
   mechanism is documented honestly in §10.1, only the string overstates. Reword.

6. **Scope-boundary wording.** *(FIXED — §3 of the report now distinguishes journey information from transport optimisation.)* The report lists *"transport optimisation"* as excluded
   while the build ships journey planning. The distinction is defensible and worth one
   explicit paragraph — but only after (2), since the reader currently has no idea the
   planner exists.

### 8.2 Unbuilt nice-to-haves

7. **Category and province filters have no UI control.** Both work server-side. A category
   dropdown is small work and makes the admin-managed category taxonomy useful to
   visitors instead of decorative.

8. **Decided officer requests vanish from the interface.** `reviewedBy` / `reviewedAt` are
   recorded and never shown. A status filter on the existing screen would surface the
   audit trail.

9. **Comment authorisation sits inline in the controller**, against the convention in
   `CLAUDE.md`. *(FIXED — `middleware/ownsComment.js`.)* Behaviour is correct; only the placement is inconsistent. Worth fixing
   because the report and `security.md` both present centralised authorisation as a
   design property.

10. **Admin self-role-change is blocked in the UI but not the API.** Low severity, but the
    two layers disagree.

11. **Admin nav has no Attractions/Events entry** where the officer's does. Reachable via
    the village editor; only an asymmetry.

12. **`GET /api/users/:id` and `GET /api/municipalities/:id` are unused.** Harmless; note
    them so they are not mistaken for dead code.

13. **Everything already in §10.1** — password change, self-service deletion, review
    reporting endpoint, municipality in top-villages, per-officer aggregate endpoint,
    automated tests and CI, object storage for uploads. All correctly declared; none
    contradicts a claim.

---

## 9. Confidence

Sections 1–6 are derived directly from route definitions, guard chains and controller
bodies, and from the frontend route tree and nav config. The API-permits/UI-lacks and
UI-offers/API-lacks lists were built by cross-referencing every `useFetch` / `cachedGet` /
`api.*` call in `client/src` against the mounted routes; a control that calls no endpoint
cannot be found this way if it is written in an unusual style, so §6 is a strong but not
provably exhaustive list.

Two items in §7.4 are marked **[unverified]** and were not traced. Nothing else in this
document rests on assumption; where the code and the report disagree, the code was taken
as the fact.

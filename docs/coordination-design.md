# Inter-municipal service coordination — design proposal

*Drafted 11 September 2026. **Approved and implemented**; see §12 of
`docs/project-report.md` for the built feature and `docs/design-decisions.md` for
the decisions taken while building it.*

**Decisions taken on the three flagged points:**

1. **The four clustered comuni were added.** Real administrations with accurate
   coordinates are not the thing the project's seeded-content rule guards against —
   that rule concerns invented opinions attributed to real places. The extension is
   stated in the report (§12.8) as a design decision rather than left to be noticed.
2. **The centroid anchor was accepted**, with the limitation documented where it is
   visible: §2.5 below, `server/src/utils/municipalityAnchor.js`, and the report's
   limitations section (§10.1) — not only in a code comment.
3. **Email notification was not built.** In-app badge only, with the limitation
   named in the report rather than papered over.

`partial` was kept as a third response type. The admin oversight screen was cut, as
anticipated in §10 — administrators manage the taxonomy and can moderation-close a
request through the API, and they are not participants in coordination.

**One thing measurement changed.** §5 below estimated the Aosta/Piedmont pair at
37 km by road. On the extended seed the sharpest case is closer and worse: Torgnon
and Valtournenche are **5.8 km apart in a straight line, 26.5 km and 88 minutes by
road** — a detour factor of 4.6, not 2.5. The argument for ranking by travel time
is stronger than this document originally claimed.

This proposal is grounded in measurements taken against the seeded database and the
live OSRM instance the platform already uses; the numbers quoted below are real,
not illustrative, and are reproducible from the current seed.

---

## 0. The argument, stated once

A mountain village of three hundred residents cannot sustain a shuttle, a licensed
guide or an equipment rental point. A valley of six such villages usually can. The
capacity exists; it is fragmented across administrative boundaries that the terrain
does not respect, and no comune can see past its own boundary to find it.

Everything below follows from that. The platform's job is to make the fragmentation
visible and crossable: let each municipality **declare** what it can offer, **see**
what its neighbours offer, and **ask** when it needs something it does not have.
The platform introduces the two administrations and records what happened. It is
not a party to the arrangement.

---

## 1. The coordination/commerce boundary, in concrete terms

The boundary is drawn at **the platform never becomes a party to the arrangement**.
The two administrations agree between themselves, by whatever means they already
use; the platform's record says only that they were introduced and what the outcome
was.

| Built | Not built, deliberately |
|---|---|
| A directory of declared capabilities | Prices, rate cards, quotes |
| A request naming a service, a date range and a group size | Availability calendars, inventory, seat counts |
| A response: *we can help* / *we can partly help* / *we cannot* | A "Book" button, confirmation numbers, holds |
| Contact details so the two can talk directly | In-platform messaging that becomes the contract of record |
| An outcome recorded by the requester: met / not met | Invoices, commission, payment state |
| Aggregate evidence of where capability is missing | One municipality rating or reviewing another |

Two of these deserve their reasoning stated, because both were tempting.

**Contact details rather than platform messaging.** The response carries a name,
email and phone, and the officers continue off-platform. A built-in thread would
slowly become the contract of record — the place where terms were agreed — which is
exactly what the boundary excludes. A free-text `message` on the response exists to
say *"we have a nine-seat minibus on Tuesdays, call Marco"*, not to negotiate.

**No municipality-to-municipality ratings.** A rating turns a neighbour into a
supplier and introduces reputational stakes between administrations that have to
keep working together afterwards. The *aggregate* response rate is reported to the
regional authority (§7) because that is territorial evidence; no comune is ever
shown a score of another comune.

---

## 2. Data model

Four new collections.

### 2.1 `ServiceType` — the taxonomy

Seeded and admin-managed. A fixed vocabulary, not free text, because aggregating
across municipalities is half the value of the feature and free text does not
aggregate.

| Field | Type | Notes |
|---|---|---|
| `slug` | String | required, unique, indexed — stable key used by the API and seed |
| `name` | String | required |
| `description` | String | one line, shown under the name when declaring |
| `icon` | String | a lucide icon name, as `Category.icon` already does |
| `group` | String | enum — `mobility`, `expertise`, `facilities`, `supply`, `emergency` |
| `sortOrder` | Number | fixed display order, so screens are stable |
| `isActive` | Boolean | default `true` — retire a type without deleting history |

Retire rather than delete: a deleted `ServiceType` would orphan the requests and
capabilities that reference it, and destroy exactly the historical record §7 is
built on. Deletion is refused with 409 when in use, matching `Category`.

### 2.2 `MunicipalityCapability` — what a comune declares it can offer

| Field | Type | Notes |
|---|---|---|
| `municipalityId` | ObjectId → Municipality | required, indexed |
| `serviceTypeId` | ObjectId → ServiceType | required, indexed |
| `description` | String | free text — *"nine-seat minibus, weekdays only"* |
| `contactName` / `contactEmail` / `contactPhone` | String | who a neighbour should approach |
| `isActive` | Boolean | default `true` — pause an offer without losing it |
| `declaredBy` | ObjectId → User | the officer who declared it |
| `reviewedAt` | Date | last time an officer confirmed it is still true |
| timestamps | | |

**Compound unique index `{ municipalityId, serviceTypeId }`** — one declaration per
service per comune. The detail belongs in `description`, not in duplicate rows.

### 2.3 `CoordinationRequest`

| Field | Type | Notes |
|---|---|---|
| `municipalityId` | ObjectId → Municipality | the requester, indexed |
| `serviceTypeId` | ObjectId → ServiceType | required, indexed |
| `title` | String | required, short |
| `details` | String | free text context |
| `neededFrom` / `neededTo` | Date | the date range the need falls in |
| `peopleCount` | Number | optional, group size |
| `radiusKm` | Number | the search radius used |
| `status` | String | enum `open` / `fulfilled` / `unmet` / `cancelled` / `expired`, indexed |
| `recipients` | Array | **snapshot** — see below |
| `fulfilledByMunicipalityId` | ObjectId → Municipality | set when closed as fulfilled |
| `closedAt` / `closedNote` | Date / String | |
| `expiresAt` | Date | indexed |
| `createdBy` | ObjectId → User | |
| timestamps | | |

`recipients` is a snapshot array of `{ municipalityId, travelMinutes, travelKm,
rankedBy }`, written once when the request is raised. It is deliberately frozen:

- it records **who was actually asked**, which is the auditable fact — recomputing
  the candidate set later would silently rewrite history as capabilities change;
- it stores the travel time *as ranked at the time*, so the record does not depend
  on a routing provider still being reachable months later;
- it makes the "who may respond" authorisation check a cheap array lookup rather
  than a re-run of the geospatial and routing pipeline on every response.

`rankedBy` is `'road'` or `'straight-line'`, carrying provenance: if OSRM was
unreachable and the ranking fell back to straight-line distance, the record says so
and the UI labels it, per the platform's existing rule that externally-sourced
facts show their source.

### 2.4 `CoordinationResponse` — its own collection, not a subdocument

| Field | Type | Notes |
|---|---|---|
| `requestId` | ObjectId → CoordinationRequest | required, indexed |
| `municipalityId` | ObjectId → Municipality | the responder, indexed |
| `type` | String | enum `offer` / `partial` / `decline` |
| `message` | String | free text |
| `contactName` / `contactEmail` / `contactPhone` | String | prefilled from the capability, editable |
| `createdBy` | ObjectId → User | |
| timestamps | | |

**Compound unique index `{ requestId, municipalityId }`** — one position per
municipality per request, editable afterwards.

**Why a separate collection, not a subdocument array.** Four reasons, in order of
weight:

1. **Different writers.** A response is written by a municipality *other than the
   one that owns the request*. As a subdocument, responding means granting write
   access to a document another tenant owns — the authorisation rule becomes "you
   may modify this document, but only this one array element, only the element that
   is yours". That is precisely the kind of inline, conditional rule the project's
   conventions push into middleware, and it is far cleaner when the thing being
   written is its own document with its own owner.
2. **Concurrent writes.** Several municipalities may respond within the same
   minute. Separate documents make that trivially safe; array `$push` onto a shared
   document invites lost updates.
3. **They are queried independently.** "Every response my municipality has made",
   "median time to first response by region", "which municipalities never respond"
   — all are natural queries over a collection and awkward over nested arrays.
4. **The analytics in §7 are aggregation pipelines over responses.** `$unwind` on a
   subdocument array to get there is a needless step.

The counter-argument — that a response has no meaning outside its request, so it
looks like a subdocument — is real but weaker than the four above.

### 2.5 Municipality coordinates: a gap that must be closed

**`Municipality` has no location.** Only `Village` carries `location` and a `geo`
2dsphere index. Coordination is geographic, so the municipality needs an anchor.

Proposed: derive it rather than store a hand-entered second copy. A municipality's
anchor is the **centroid of its published villages**, computed with an aggregation
over the existing `geo` index. Verified against the seed — all ten municipalities
produce a sensible centroid, 1–4 villages each.

The honest limitation: a centroid is not where the minibus is parked. For a
municipality spread along fifteen kilometres of valley, the anchor may be a few
kilometres from the village that actually holds the service. At the granularity
this feature works at — *is this a forty-minute neighbour or a four-hour one* —
that error does not change any decision. If it ever matters, the fix is to anchor
the capability at a specific village rather than the municipality, which the model
above can absorb by adding an optional `villageId` to `MunicipalityCapability`.
I would not build that now.

A municipality with no published village has no anchor and is excluded from
distance ranking, shown separately as "location unknown" rather than silently
dropped.

---

## 3. Service taxonomy

Fifteen types in five groups. Chosen to cover what an Italian mountain comune
plausibly offers, and — importantly — to be things a *neighbouring administration*
could supply, not things a business sells to a tourist.

**Mobility**
| Slug | Name | Description |
|---|---|---|
| `shuttle-transport` | Shuttle & group transport | Minibus or coach for visitor groups between villages |
| `accessible-transport` | Accessible transport | Vehicles equipped for reduced-mobility visitors |
| `ev-charging` | EV charging | Public charging points available to visitors |
| `road-clearing` | Snow clearing & road access | Winter clearing capacity, seasonal road status |

**Expertise**
| Slug | Name | Description |
|---|---|---|
| `mountain-guide` | Licensed mountain guide | Qualified guides for hiking, alpine or ski touring |
| `cultural-guide` | Cultural & heritage guide | Guided visits to churches, museums and historic sites |
| `interpreter` | Language support | Staff or volunteers able to assist visitors in other languages |

**Facilities**
| Slug | Name | Description |
|---|---|---|
| `group-accommodation` | Group accommodation | Hostel, refuge or municipal lodging with group capacity |
| `meeting-space` | Meeting & event space | Halls or rooms for events, briefings and gatherings |
| `equipment-rental` | Equipment rental | Snowshoes, skis, bicycles, via ferrata kit |
| `parking-area` | Coach parking & staging | Space for coaches and group arrivals |

**Supply**
| Slug | Name | Description |
|---|---|---|
| `local-produce` | Local produce | Cheese, cured meats, honey and other produce in quantity |
| `artisan-crafts` | Artisan crafts | Workshops and makers able to host or supply visitors |

**Emergency & care**
| Slug | Name | Description |
|---|---|---|
| `first-aid` | First aid & medical presence | Staffed first-aid post, nurse or doctor |
| `mountain-rescue` | Mountain rescue liaison | Contact point for the local rescue organisation |

`mountain-rescue` is a **liaison contact**, not a dispatch channel — real-time
emergency services are out of scope, and the description must not imply otherwise.
The UI will state this on the type itself.

---

## 4. Request lifecycle

```
                      ┌─────────────────────────────────────┐
   officer creates    │                                     │
        ──────────▶ open ──── requester closes ────▶ fulfilled
                      │                             (names who helped)
                      ├──── requester closes ────▶ unmet
                      ├──── requester cancels ───▶ cancelled
                      └──── expiresAt passes ────▶ expired
```

Responses (`offer` / `partial` / `decline`) accumulate against an `open` request
and **do not change its status**. Only the requester decides whether their need was
met; a neighbour's offer is not the same as the need being satisfied.

| Transition | Who | Notes |
|---|---|---|
| → `open` | Requesting officer (active, own municipality) | Recipients resolved and snapshotted at this moment |
| `open` → `fulfilled` | Requesting officer | Optionally names the municipality that helped |
| `open` → `unmet` | Requesting officer | "We asked, nobody could help" — the key analytic signal |
| `open` → `cancelled` | Requesting officer | Need went away, or was solved another way |
| `open` → `expired` | System | `expiresAt` passed with no closure |
| any → `cancelled` | Admin | Moderation only, with a required note |

**Terminal states are final.** No reopening — a recurring need is a new request,
which keeps the record honest and the analytics countable. Reopening would make
"how many times was this sought" unanswerable.

**Expiry: yes, and it matters.** Default `expiresAt` is `neededTo + 1 day`, or 30
days from creation when no end date is given. Two reasons: an `open` request that
nobody will ever answer makes the whole feature look abandoned, and — more
importantly — **expiry converts silence into data**. A request that quietly sits
open forever tells the regional authority nothing; one that expires unanswered is
evidence that the capability was absent. Analytics count `expired` and `unmet`
together as *not met*, while distinguishing them, because they mean different
things: `unmet` is "we were told no", `expired` is "nobody replied at all".

Expiry is applied **lazily** — computed on read and persisted on the next write —
rather than by a scheduled job. The platform has no job runner, adding one for this
is disproportionate, and a status that is correct whenever anybody looks at it is
sufficient. This will be stated in the code rather than left as a surprise.

**When several municipalities offer**, all offers stay visible; the requester
picks, contacts them off-platform, and names one when closing. Nothing is
auto-selected — choosing a partner is an administrative decision, not a ranking
function.

**When the requester changes their mind**, `cancelled` exists precisely so that
withdrawal is distinguishable from failure. Counting a cancellation as unmet demand
would corrupt the evidence in §7.

---

## 5. Routing and ranking

The point of using real travel time is not precision for its own sake. Measured on
the current seed:

> **Unione Comuni Valle d'Aosta → Unione Montana Valli del Piemonte:
> 15 km straight line, 37 km by road, 75 minutes' drive** — a detour factor of 2.5.

Across all 45 seeded pairs the road/straight-line factor ranges from 1.3 to 2.5. A
straight-line radius would rank a neighbour beyond a ridge as *close*, and an
officer would waste a phone call discovering otherwise. **Ranking is by travel
duration, not distance** — 37 km taking 75 minutes is the whole argument for why
distance alone misleads in mountain terrain.

### Avoiding unbounded fan-out

Three stages, one external call:

1. **Geospatial pre-filter (database).** `$geoNear` from the requester's centroid
   over village `geo`, rolled up to municipalities, keeping those whose
   straight-line distance ≤ `radiusKm`. This is **lossless**: road distance is
   always ≥ straight-line distance, so anything outside the straight-line radius is
   necessarily outside the road radius. Nothing valid is excluded.
2. **Capability filter (database).** Keep only municipalities with an active
   declared capability of the requested `serviceTypeId`. Asking a comune for
   something it has not declared is noise.
3. **One OSRM `/table` call** with the requester as the single source and the
   survivors as destinations, annotated for duration and distance.

**One request, not N.** Measured against the live provider: a full 10×10 matrix for
every seeded municipality returned in **291 ms**. Ranking is therefore a single
cached call regardless of how many candidates survive, which is the entire answer
to unbounded fan-out. The result is cached under the existing `TTL.route` (7 days)
keyed on rounded coordinates, so a repeated request costs nothing.

**Candidate cap: 25**, applied after stage 2 by straight-line order. The OSRM demo
server accepts far more, but a request routed to more than 25 administrations is
not coordination, it is a mailshot — the cap is a product decision, not a technical
one, and it is documented rather than silent.

**Provider failure** falls back to straight-line ordering, marks the request
`rankedBy: 'straight-line'`, and the UI says so. It never silently presents
straight-line order as road order.

### Default radius

**60 km**, adjustable to 25 / 50 / 100 / 200.

I want to be straight about a weakness here. On the current seed, a 60 km radius
finds a neighbour for only **two** of ten municipalities — the Aosta/Piedmont pair
at 37 km. The next-closest pair is 125 km apart, and Abruzzo, Basilicata,
Emilia-Romagna and Friuli have no neighbour at any plausible radius. This is an
artefact of a seed that picked twenty scenic villages spread across Italy rather
than a realistic cluster within one valley system; in the real deployment the
feature is aimed at, neighbouring comuni are 10–40 km apart and the radius is
generous.

Rather than paper over it, the empty case is designed for: when a radius returns no
candidates, the screen says so plainly and offers both to widen the radius and to
show the three nearest municipalities with their real travel times, letting the
officer decide. **No silent widening** — a request the officer thinks went to
neighbours must not quietly go to a comune four hours away. I also propose seeding
a cluster of additional municipalities in one valley (§9) so the demo shows the
feature working as intended rather than showing its empty state.

---

## 6. Screens per role

### Officer — `/dashboard/coordination`

The officer gains a genuinely new area of responsibility, so it is one nav entry
with four tabs rather than four nav entries.

| Tab | Contents |
|---|---|
| **Our capabilities** | The fifteen service types, each toggled on/off for this municipality with a description and contact. Shows `reviewedAt` and flags declarations not confirmed in twelve months. This is the low-friction entry point — an officer can fill it in once in a few minutes. |
| **Neighbours** | The directory: municipalities within the chosen radius, ranked by travel time, each showing what they have declared. Browsable without raising anything — often the officer just wants to know who has a minibus. |
| **Our requests** | Outgoing. Raise a request; see responses as they arrive; close as fulfilled / unmet / cancelled. |
| **Incoming** | Requests routed *to* this municipality. Respond with offer / partial / decline, or leave it. |

Raising a request is a short form: service type, title, details, date range, group
size, radius — then a **preview of exactly which municipalities will receive it**,
with travel times, before sending. An officer must never be unsure who they just
contacted.

Pending officers see all of this read-only, as `requireActive` already enforces on
every other write.

### Admin — `/admin/coordination` and `/admin/service-types`

- **Service types**: CRUD over the taxonomy, mirroring the existing categories
  screen, with the same in-use deletion guard.
- **Coordination oversight**: every request across the platform, filterable by
  status and region, read-only except for a moderation close. The admin is not a
  participant in coordination — they do not respond on anyone's behalf — so the
  only write is the moderation cancel that already exists for comments.
- A capability audit view: which municipalities have declared nothing, which have
  stale declarations. This is the lever for the cold-start problem in §8.

### Authority — `/authority/coordination`

Read-only, as everywhere. Contents in §7.

---

## 7. What the regional authority gets

This is the part that makes the feature more than a message board, so it gets the
most care. Every request permanently records **what was sought, where, and whether
it was met**. No single municipality can produce that; it only exists because the
requests pool across the territory.

Five aggregations, all MongoDB pipelines.

**7.1 Capability coverage matrix** — service type × region, counting municipalities
declaring each. Presented as a matrix with empty cells visually distinct. The
finding it produces reads: *"no municipality in Basilicata declares first-aid
presence."* That is a structural gap, visible before anybody has asked for
anything.

**7.2 Unmet demand by service type** — requests grouped by `serviceTypeId` and
region, with counts by status and a fulfilment rate. The headline table, ranked by
unmet count. Reads: *"equipment rental was sought nine times in Abruzzo and met
twice."* Demand that went unanswered is far stronger evidence for investment than
demand that was satisfied.

**7.3 Demand against supply** — 7.1 joined to 7.2: service types with high demand
and low declared coverage, ranked. This is the investment-priority list, and the
single most useful output of the feature. A service nobody offers and nobody asks
for is not a gap; one that is asked for repeatedly and offered by nobody is.

**7.4 Response behaviour** — per region: share of requests receiving at least one
response, median hours to first response, decline rate. This separates two
explanations that look identical in 7.2: *the capability does not exist* versus
*the neighbours are not engaging with the platform*. Those call for opposite
interventions, and conflating them would make the evidence actively misleading.

**7.5 Structural isolation** — municipalities with no neighbour within 60 minutes
declaring anything. The comuni for which coordination is not an available strategy
at all, and which therefore need provision rather than introduction.

Presented as: three KPI cards (requests raised, fulfilment rate, median response
time), the coverage matrix, the ranked demand-vs-supply table, and CSV export on
every table via the existing `exportCsv` helper — matching the other authority
screens exactly.

**On small numbers.** With ten municipalities and a handful of seeded requests,
these figures are illustrative, not statistically meaningful. Every table therefore
shows **absolute counts alongside every rate**, and a rate computed from fewer than
five requests is shown as "n too small" rather than as a percentage. This is the
project's existing "never invent data to fill a UI" rule applied to statistics: a
fulfilment rate of "0%" from one request would be a lie told with a true number.

---

## 8. Notification

**In-app, and that is enough for this build.** The dashboard sidebar gains an
optional count badge on the Coordination entry, showing incoming open requests with
no response from this municipality, plus the officer's own requests that have
received a new response. Fetched through the existing `useFetch`/`cachedGet` on
dashboard mount — one small endpoint, no polling loop, no websockets. A badge that
is correct whenever the officer opens the dashboard is proportionate to a workflow
whose natural rhythm is days.

This needs a small change to `dashboardNav.js` and `DashboardSidebar.jsx`, which
currently render `{ to, key, icon }` with no badge support.

**On email, plainly.** Email is what the feature actually wants — officers will not
open a dashboard daily, and a request that waits a week for someone to notice is a
request that expires unanswered. But it needs: an SMTP or API provider and a
credential in the deployment; a queue with retries, because sending inside a
request handler makes the request fail when the provider is slow; bounce and
unsubscribe handling; and a deliverability story (SPF/DKIM) or the mail lands in
spam and the feature looks broken in a way nobody can see. That is a meaningful
piece of infrastructure for a project that is not yet deployed and has no secret
management.

My recommendation: **not now**, and say so in the report as a known limitation
rather than pretending the in-app badge is sufficient in production.
`Municipality.contactEmail` already exists, so the data is in place and it is a
contained addition once there is somewhere to deploy and somewhere to keep a
credential. I would rather ship an honest in-app indicator than a half-working mail
path.

---

## 9. What could go wrong

**Spam requests.** Only active officers may raise one, it is attributable to a
named officer and municipality, and a per-municipality limit of 10 open requests at
once applies. Admins can moderation-close. Mitigated, and the accountability does
most of the work: this is not an anonymous board.

**Municipalities declaring capabilities they do not have.** The platform does not
and cannot verify. Mitigation is transparency, not enforcement: every declaration
shows who declared it and when, and one not confirmed for twelve months is flagged
stale to its own officer. **I would accept the residual risk**, because the
counterparty is another public administration with a reputation among its
neighbours, not an anonymous seller — and because the failure mode is a wasted
phone call, not a lost payment. Verification would require the platform to become
an accreditation body, which it is not.

**Requests that go unanswered and make the feature look dead.** The real risk.
Three mitigations: expiry (§4) so nothing lingers visibly; the recipient list shown
to the requester at send time so silence is at least attributable; and the response
rate surfaced to the regional authority in 7.4, which is where non-engagement can
actually be acted on. I explicitly rejected read receipts — surveilling whether
another administration opened your request is both creepy and a poor proxy.

**An empty registry at launch.** The genuine cold-start problem: the directory is
worthless until municipalities declare, and nobody declares into an empty
directory. Mitigations: declaring is deliberately the cheapest action in the
feature (toggle, one line of description, contact — a few minutes); the
capabilities tab is the landing tab; the admin audit view shows who has declared
nothing so they can be prompted. For the deliverable, the seed populates plausible
capabilities for all ten municipalities and several requests in different states.
**The seeded data must never be presented as real declarations by real comuni** —
the same rule the project already applies to seeded reviews.

**Sparse seed geography.** Covered in §5. Two of ten municipalities have a neighbour
within 60 km. I propose seeding **four additional municipalities clustered in the
Aosta/Piedmont valley system**, 15–40 km apart, so the feature demonstrates with a
realistic cluster. They would be real comuni with real coordinates. Flagging this
because it grows the seed beyond the current twenty villages, and I would rather
have it approved than assumed.

**Analytics that overclaim on tiny numbers.** Covered in §7 — counts always shown,
rates suppressed below n=5.

---

## 10. What I am least confident about

Ranked, most doubtful first.

1. **The four extra seeded municipalities.** It makes the demo honest but grows
   seeded content, and the project has an explicit rule against presenting seeded
   data as real. I think it is right; it is your call.
2. **The municipality centroid as routing anchor.** Defensible at this granularity
   (§2.5), but wrong in principle — the service sits in a village, not at an
   average. The alternative, anchoring capabilities to a village, is more correct
   and more work, and I have deferred it.
3. **`partial` as a third response type.** It models something real ("we can do
   Tuesday but not Wednesday"), but `offer` plus a free-text message may cover it
   without a third branch in every status filter and chart. I lean toward keeping
   it; I would not argue hard.
4. **The 60 km default and the 25-candidate cap.** Both are judgement calls with
   thin evidence behind them, chosen to be adjustable rather than correct.
5. **Whether the admin needs a full coordination oversight screen.** Admins are not
   participants. It may be enough that they manage the taxonomy and can
   moderation-close from a request page, without a dedicated screen. This is the
   part I would cut first if the feature is getting too large.
6. **Lazy expiry.** Correct whenever read, but a request is technically `open` in
   the database after its expiry until someone touches it. Analytics must therefore
   compute expiry at query time too, or they will overcount `open`. Manageable, but
   it is a footgun I am deliberately introducing to avoid a job runner.

---

## 11. Scope check

Nothing above books, prices, schedules, holds inventory, takes payment, or rates
one municipality against another. The platform records that A asked B for a
shuttle, that B said yes, and that A considered the need met. Everything that
follows happens between two administrations, off-platform, as it does today —
except that today they have no way to find each other.

**Awaiting approval before implementation.**

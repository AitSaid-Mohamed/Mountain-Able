# Design decisions

Implementation decisions that are not visible from the code alone — what was
chosen, and why. This complements two existing documents rather than repeating
them: deviations from the Figma prototype are tabulated in
`docs/project-report.md` §8, and security findings and their fixes are in
`docs/security.md`.

---

## Review moderation gates publication

*2 August 2026*

**What changed.** A review created through `POST /api/villages/:villageId/comments`
is now stored with `status: 'pending'` and is not public until an administrator
approves it. Editing a review returns it to `pending`. The author — and only the
author — sees their own unapproved review, labelled.

**Why.** This aligns the code with the specification rather than changing the
design. The report and `CLAUDE.md` both describe moderation as an administrator
capability gating what appears on the platform, and the data model was built for
it: `Comment.status` exists, the admin queue at `GET /api/comments/pending`
filters on `'pending'`, and `Comment.recalculateRatings()` counts approved
comments only.

The controller, however, never set a status, so creation fell through to the
schema default of `'approved'`. Every review published instantly, and the only
`pending` comments in existence were the ones the seed script assigned at
random. The moderation queue was therefore a feature that worked correctly but
could never receive anything in real use, and the documented workflow did not
describe the running system.

**Three consequences had to be handled together**, because fixing only the first
would have introduced worse problems than it solved.

1. **The author must be told.** A tourist who submits a review and sees it
   vanish reads that as a bug, not as moderation. `GET /api/villages/:id/comments`
   therefore runs under `optionalAuth` and widens its filter to
   `$or: [{ status: 'approved' }, { userId: req.user._id }]` — the caller's own
   review is returned whatever its status, and nobody else's unapproved review
   is ever exposed. The village page and the tourist's *My reviews* page badge
   it "Pending review" with a note that an administrator will publish it
   shortly. Rejected reviews are shown to their author the same way, since
   hiding those silently reproduces exactly the same confusion.

2. **The rating breakdown must not count it.** The endpoint now returns a row
   the public list must not include, so `ReviewsSection` derives the list, the
   pagination and the 1–5 distribution from the approved subset. An unapproved
   review must not shift a distribution it is not counted in — and
   `ratingAverage` already excluded it, so counting it in the bars would have
   made the two disagree on screen.

3. **Editing must re-enter moderation.** Otherwise the gate is trivially
   bypassed: post something innocuous, wait for approval, then edit it into
   anything. `PATCH /api/comments/:id` sets `status: 'pending'` whenever content
   or rating changes. This also correctly drops the old rating out of the
   village average until the new text is approved.

**Trade-off accepted.** Reviews no longer appear immediately, which is a slower
experience for the tourist and creates moderation work that scales with usage.
For a platform whose value rests on municipalities trusting the content shown
against their village, that is the right side of the trade — and it is the
behaviour the report already described.

**Seed data.** `seed.js` previously assigned statuses probabilistically
(~85/8/7%), so a reseed could leave the moderation queue with one item or none.
It now assigns exactly 6 pending and 4 rejected from an already-shuffled pair
list, so the queue is reliably populated for demonstration while still spreading
across villages and users.

**Verified** end to end against a running server: a posted review is `pending`
and invisible anonymously and to a second tourist, visible to its author,
public after admin approval, and back to `pending` and hidden again after an
edit.

---

## Overpass failures are cached briefly

*2 August 2026*

`overpassRun()` cached successful lookups for a day but returned `null` on
failure without caching it. Because a failed lookup walks all three mirrors at a
20-second timeout each, every subsequent request for the same corridor repeated
up to a minute of timeouts — indefinitely, for as long as Overpass stayed
unreachable.

Failures are now cached as `null` under a short TTL (`TTL.overpassFailure`, 10
minutes) so the next request degrades immediately and honestly instead of
hanging, while a transient outage is not pinned for the full day a success
would get. The cache read tests `!== undefined` rather than truthiness, since
`null` is now a meaningful cached value.

This was found by the verification pass in `npm run warm-cache`, which reported
a corridor still taking 50 seconds on a second request after warming. It matters
for the live demonstration specifically: without it, no amount of pre-warming
can protect the route planner from a flaky Overpass, which is the entire purpose
of that script.

---

## Officer scope is loaded once for the dashboard, not once per screen

*3 August 2026*

The request de-duplication introduced earlier covered the public pages and the
tourist area, because both fetch through `useFetch`, which goes through
`lib/requestCache.js`. The dashboards were only partly covered, and the officer
dashboard not at all.

**Measured before the fix**, counting the `/api` requests a browser actually
issues for one load: `/dashboard` and `/dashboard/villages` each made **32**
requests — the officer's village list three times over, and every village's
attractions, events and comments three times each. The admin and authority
screens were in better shape (3–5 requests each) but every page in the
application fetched `/auth/me` twice.

Three separate causes, all of which had to go:

1. **`useOfficerScope` called `api.get` directly**, so nothing de-duplicated it.
   It now goes through `cachedGet` like everything else.
2. **Its effect depended on `user.municipalityId`**, a populated object. Every
   time the user object was replaced — which happens on each session
   re-hydration — the identity changed even though the municipality had not,
   and the entire fan-out ran again. It now depends on the id as a string.
3. **It was a hook, so each of its six consumers ran the fan-out separately.**
   It is now a provider mounted once in `DashboardLayout`, and the six screens
   read the same state.

`OfficerFeedback` additionally repeated the per-village comment fetch that the
scope had already done, keyed on the `villages` array identity so it re-ran
whenever the scope reloaded. The scope now fetches reviews once at `limit=50`
and shares them; the overview takes the most recent and the feedback screen
filters the full set.

**The provider is demand-driven rather than eager.** Mounting it above every
dashboard screen made screens that do not use it pay for it — the village
editor went from 3 requests to 12. Consumers now register on mount, and the
fan-out runs only while at least one is mounted.

`AuthContext` was also fetching `/auth/me` outside the shared layer, which is
why every page loaded it twice under StrictMode. It now uses `cachedGet`, and
clears the cache on login and logout, since the cache is keyed by URL rather
than by user and a signed-in read must not survive a session change.

**Measured after**, one load each:

| Screen | Before | After |
|---|---|---|
| `/dashboard` (officer overview) | 32 | 11 |
| `/dashboard/villages` (officer) | 32 | 11 |
| `/dashboard/villages/new` (village editor) | 3 | 2 |
| `/admin` (overview) | 5 | 4 |
| `/admin/villages` | 3 | 2 |
| `/admin/municipalities` | 5 | 4 |
| `/authority` (overview) | 5 | 4 |

No endpoint is requested more than once on any of them. The officer figure of
11 is one village-list request plus three per village for three villages, plus
`/auth/me` — the irreducible cost of composing per-village data without a
dedicated officer stats endpoint. Walking five screens in one session now costs
10 requests as an admin and 14 as an officer.

---

## Session validation is not a credential endpoint

*2 August 2026*

The strict authentication limiter was mounted on all of `/api/auth`, so
`GET /api/auth/me` — which the client calls on every page load to validate the
stored session — shared a 20-per-15-minute budget with login attempts. Browsing
about twenty pages exhausted it, and since the client invalidated the session on
any non-network failure, the `429` deleted the token and logged the user out.

Two changes, because either alone leaves the other defect standing: the limiter
now covers `/api/auth/login` and `/api/auth/register` only, and the client
invalidates a session on `401`/`403` alone, surfacing anything else as a
retryable error rather than a logout.

Found while capturing screenshots — two capture runs in quick succession left
signed-in pages rendering as logged out. It is worth recording that the bug was
invisible during ordinary development, where nobody loads twenty authenticated
pages inside fifteen minutes, and would have appeared first in front of an
examiner clicking quickly through the demonstration. Details in
`docs/security.md` §3.5.

---

## Route rate limit set to 60 requests / 15 min

*2 August 2026*

Raised from 20. Planning a single journey already costs three requests
(geocode, plan, corridor), and switching travel profile or retrying a failed
route costs more, so the previous cap throttled one genuine user before it
inconvenienced an abuser. The substantive protection against hammering a
provider is the cache — only a miss reaches a third party at all. Recorded in
`docs/security.md` §3.6.

---

## The villages map follows the filters

*7 September 2026*

`GET /api/villages/map` ignored every query parameter and always returned all
twenty published villages, while the grid beside it was filtered. Filtering to
Abruzzo with a 4-star minimum gave four cards next to a map of the whole
country — the two halves of one screen disagreeing about what the user had
asked for.

The endpoint now takes the same filters as `GET /api/villages`, and both build
their filter through one shared helper (`server/src/utils/villageFilter.js`)
rather than each holding its own copy. Duplicating that logic is precisely how
the two would drift apart again.

It is deliberately **not** paginated. The grid shows one page; a user who has
filtered to a region wants the region's whole set of markers, not the nine that
happen to be on screen. The narrow projection — five scalar fields, no
descriptions, no image arrays, no populate — is what makes returning the full
match set cheap, and a documented 500-village ceiling bounds it.

On the client the map reads the filters but not `sort` or `page`, since neither
changes which villages match. That is not only a saved request: refetching on
sort would make the markers flicker while the same set was redrawn.

Where nothing matches, the map shows a "nothing to map" empty state instead of
an empty Leaflet canvas, which reads as a broken map rather than an honest
answer. It is top-aligned to sit level with the grid's empty state beside it.

This also corrects `docs/demo-script.md` §4, which already told the presenter
that the map "reflects the filter". The script described the behaviour the
product should have had; the code, not the script, was wrong.

---

## Four fixes from a self-audit against the report

*10 September 2026*

These four are grouped because they share an origin. Late in the project the
running application was audited **against the claims made in `docs/project-report.md`**
— endpoint by endpoint, guard by guard — specifically looking for places where the
documentation and the code disagreed. The audit is written up in
`docs/role-audit.md`; §10.1.1 of the report summarises what it found. Each entry
below records one fix and why it was made the way it was.

### 1. The public "claim your village" form

*The gap.* §4.2(g) of the report described an officer lifecycle beginning at
`POST /api/users/officer-request`, and §1 claimed a repository *"maintained by the
municipalities themselves"*. The endpoint worked. The `OfficerRequest` model
worked. The administrator's review queue worked. There was no submission page, and
nothing in the interface linked to one — the footer's **"For municipalities"** went
to `/about`. Every officer in the database had been created by the seed script.
The whole back end of the feature existed with no front door.

*The fix.* `client/src/pages/ClaimVillagePage.jsx` at `/claim`, posting to the
existing endpoint. Three entry points, chosen because a municipal employee could
plausibly arrive from any of them:

- the footer's **"For municipalities"**, repointed from `/about`;
- the **sign-up page**, where someone representing a comune is most likely to be
  filling in the wrong form — registration hard-codes `role: 'tourist'`, so
  without a pointer they would create a visitor account and wonder why they cannot
  publish;
- **each village page**, as *"Are you the municipality?"*, with the municipality
  name, region and province pre-filled from that village. Someone who finds their
  own comune already listed and wants to take it over should not have to retype
  what the platform already knows. The card is hidden from signed-in officers,
  admins and authorities, who already hold accounts.

*What the page promises.* Review, not access. The account is created immediately
but `pending`, so `requireActive` blocks every write until an administrator
approves it. The confirmation says exactly that rather than implying the applicant
can now publish, and an aside spells out the three steps before submitting.

### 2. The support dialog now sends something

*The gap.* The footer's support dialog displayed *"Thanks for reaching out! We'll
get back to you soon"* after writing the submission to `console.info` and
discarding it. §11 of the report argues at length that the platform *"only claims
… what it can honestly support"*, citing the removed date-of-birth field and the
refusal to display invented visitor counts. This contradicted that argument more
directly than anything else the audit found, and it sat behind two footer links.

*The choice.* Two options were on the table: replace the fake success with an
honest `mailto:` link, or build the endpoint. The endpoint was chosen because
"for administrators to read" is the behaviour the dialog already implied, and
because a `mailto:` hands the user off to whatever mail client they may not have
configured — on a shared demo machine, to nothing at all. The cost is a twelfth
collection and one more admin screen; the benefit is that the dialog now does what
it always said it did.

*The shape.* `SupportMessage` (`email`, `message`, optional `userId`, `status`
`new`/`handled`, `handledBy`, `handledAt`), a public `POST /api/support` under
`optionalAuth`, and admin-only `GET`/`PATCH`/`DELETE`. Administrators triage in a
support inbox at `/admin/support` with a URL-driven status filter, matching every
other list view in the project.

Three details worth recording:

- **`optionalAuth`, not `protect`.** A visitor who cannot reach support is exactly
  the person who most needs to; requiring an account to report a problem would
  exclude the people best placed to spot one. When the sender happens to be signed
  in, their `userId` is attached automatically so the admin can see who wrote it.
- **`supportLimiter` runs in every environment.** 5 messages per hour per IP. This
  is the only public unauthenticated endpoint that persists free text, which makes
  it the obvious spam target, and `generalLimiter` is production-only — so a
  limiter that also switched off in development would leave the endpoint bare
  exactly where it is easiest to reach.
- **The response returns only the created id and timestamp.** The endpoint is
  public; echoing the stored document back would tell the sender nothing they did
  not just type.

*Only `status` is editable by an admin.* The message body is the sender's words
and is never rewritable from the admin side.

### 3. Save-route guarded on role, not just on being signed in

*The gap.* `RoutePlannerPage` guarded its **Save this route** control on
`if (!user)` alone. `/api/me/*` is `restrictTo('tourist')`, so a signed-in officer,
administrator or authority who clicked it received a 403. §4.2(d) of the report
claims *"the interface never offers an action that the API would reject"*.

*The fix.* `canSave = !user || user.role === 'tourist'` hides the control for the
other three roles, with an early return in the handler as a second line. This is
the check `VillageOwnControls` already applied to favourites and visits; it simply
had not been carried across to the planner. Logged-out visitors still see the
button and are prompted to sign in, because they may well be tourists — hiding it
from them would remove a legitimate call to action.

### 4. Comment authorisation moved into middleware

*The gap.* `CLAUDE.md`, the report and `docs/security.md` all present centralised
authorisation as a design property: the rule lives in the guard chain and no
controller repeats it. `PATCH` and `DELETE /api/comments/:id` were the exception —
they carried `protect` alone, with the authorship check, the 24-hour edit window
and the admin-moderator exception written inline in the controller.

*Why fix a correct implementation.* Nothing was exploitable; the checks were right.
The problem is structural. An authorisation rule inside a controller is one that a
future reader auditing the middleware will not find, and one a new endpoint can
silently fail to inherit. It also made a documented claim false in exactly one
place, which is the kind of small untruth this audit existed to find.

*The fix.* `server/src/middleware/ownsComment.js` exports `canEditComment` (author,
within the window) and `canDeleteComment` (author, or an admin acting as
moderator). Both attach the loaded document as `req.comment`, so the controllers
neither re-query nor decide anything about permission.

*One deliberate asymmetry.* `canEditComment` grants admins **no** exception. An
administrator's tools for a bad review are moderation and deletion; rewriting
another person's words while leaving their name on them is not a moderation
action, and the middleware refuses it as firmly as it refuses a stranger.
Deletion, by contrast, does admit the admin — and the author may delete at any
time with no window, since withdrawing your own words is not the same as changing
them after they were approved.

---

## Inter-municipal service coordination

*11 September 2026*

The full proposal is in `docs/coordination-design.md`, written and approved before
implementation. What follows records the decisions taken while building it, and
the two places where measurement changed the design.

### Coordination, not commerce — where the line was drawn

The platform introduces two administrations and records the outcome. It is never a
party to the arrangement. Concretely: no price, no availability calendar, no
booking, no confirmation, no payment, and no municipality-to-municipality rating.

Two of those were tempting enough to be worth recording.

**Contact details instead of in-platform messaging.** A response carries a name,
email and phone, and the two officers continue off-platform. A built-in thread
would slowly become the contract of record — the place where terms were agreed —
which is exactly what the boundary excludes. The free-text `message` exists to say
*"nine-seat minibus on Tuesdays, call Marco"*, not to negotiate.

**No ratings between municipalities.** A rating turns a neighbour into a supplier
and introduces reputational stakes between administrations that must keep working
together afterwards. The *aggregate* response rate goes to the regional authority
because that is territorial evidence; no comune is ever shown a score of another.

### Responses are their own collection

Four reasons, in order of weight. First, a response is written by a municipality
*other than* the one owning the request — as a subdocument, responding would mean
granting write access to another tenant's document under a rule reading "you may
modify this document, but only the one array element that is yours", precisely the
inline conditional logic this project keeps out of controllers. Second, several
municipalities may respond in the same minute, and separate documents make that
trivially safe where `$push` onto a shared document invites lost updates. Third,
responses are queried independently. Fourth, the authority analytics are pipelines
over responses, which would otherwise need an `$unwind` to reach.

### Ranking by travel time, and the one call that makes it affordable

Straight-line distance is actively misleading in mountain terrain, and the seeded
data demonstrates it better than any argument: **Torgnon and Valtournenche are
5.8 km apart in a straight line, 26.5 km and 88 minutes apart by road** — a detour
factor of 4.6, because the only way between them is down to the valley floor and
back up. Ranking is therefore by *duration*, not distance.

The obvious objection is cost: ranking N candidates by real road time looks like N
routing calls. It is not. OSRM's `/table` service returns a full matrix in one
request — measured at **291 ms for a 10×10 matrix** against the live provider — so
ranking is a single cached call regardless of how many candidates survive.
`planRoute` was the wrong tool here and is left alone: it also fetches an elevation
profile and turn-by-turn steps that ranking has no use for.

The pre-filter before it is *lossless*, which is worth stating because it looks
like an approximation: road distance is always at least straight-line distance, so
a straight-line radius filter can never exclude a valid road-radius candidate.

A provider failure falls back to straight-line ordering, stamps
`rankedBy: 'straight-line'` on the request, and the UI labels it. A fallback is
never presented as road ordering.

### The municipality anchor is a centroid, and that is a known compromise

`Municipality` carries no coordinates — only `Village` has `location`/`geo` — so
the anchor is derived as the centroid of a municipality's published villages.

This is wrong in principle and adequate in practice. A centroid is not where the
minibus is parked: for a comune spread along fifteen kilometres of valley the
anchor may sit a few kilometres from the village that actually holds the service.
At the granularity the feature works at — *is this a forty-minute neighbour or a
four-hour one* — that error changes no decision. The correct fix is to anchor each
capability at a specific village (an optional `villageId` on
`MunicipalityCapability`), deferred as more work than the granularity justifies.
Documented in `docs/coordination-design.md` §2.5, in
`server/src/utils/municipalityAnchor.js`, and in the report's limitations section
rather than only in a code comment.

A municipality with no published village has no anchor and is shown as "location
unknown" rather than silently dropped from a directory it belongs in.

### Expiry turns silence into data, and is lazy

A request nobody will ever answer makes the feature look abandoned, and — more
importantly — tells the regional authority nothing. Expiry converts that silence
into evidence: a request that lapses unanswered says the capability was absent.
`unmet` and `expired` are counted together as *not met* but reported separately,
because "we were told no" and "nobody replied at all" call for opposite
interventions.

Expiry is applied lazily — computed on read, persisted on the next write — because
the platform has no job runner and adding one so a field can flip on a timer is
disproportionate. The cost is real and is recorded rather than hidden: between
lapsing and the next read the database still says `open`, so **every statistic
applies the same cutoff at query time** via `EXPIRED_AWARE_STATUS`. A figure that
was wrong merely because nobody had looked at a request would be worse than the
job runner.

### Only the requester closes a request

Responses accumulate against an open request and never move its status. A
neighbour's offer is not the same as the need being satisfied, and letting an offer
close the record would corrupt exactly the signal the authority reads. Terminal
states are final: a recurring need is a new request, so "how many times was this
sought" stays answerable. `cancelled` exists so a withdrawn need is distinguishable
from a failure — counting it as unmet demand would corrupt the evidence.

### `partial` is a first-class response

A neighbour who can send one minibus instead of two, or cover the Saturday but not
the Sunday, is the realistic case in mountain terrain. Collapsing it into yes/no
would make the feature binary in a way real coordination is not. It costs a third
branch in the status filters and charts, and it is worth it.

### Statistics withhold rates rather than round them

With fourteen municipalities and ten seeded requests these figures are
illustrative, not significant. Every table therefore shows absolute counts beside
every rate, and a rate computed from fewer than five decided requests is returned
as `null` and rendered as "n < 5". A fulfilment rate of "0%" from a single request
is a lie told with a true number — the project's rule against inventing data to
fill a UI applies to statistics as much as to a village stat strip.

### The seed was extended with four real comuni

The original ten municipalities were chosen to spread twenty scenic villages across
Italy, which is right for a discovery platform and useless for a coordination one:
at any plausible radius only one of those ten pairs is a neighbour of another, and
four municipalities have no neighbour at all.

So the seed now also contains **Valtournenche, Torgnon, Antey-Saint-André and
Ayas** — real comuni of the Valtournenche and Ayas valleys, with accurate
coordinates, one real village each, and an officer apiece. They sit across genuine
ridges from one another, which is the problem the feature exists to address.

This was raised before building and approved explicitly. The project's rule about
seeded content concerns *fabricated opinions about real places* — invented reviews
and ratings attributed to real villages. Real administrations with real coordinates
are not that, and no review or rating is attributed to any of the four. The
extension is stated in the report rather than left to be noticed.

### The admin oversight screen was cut

Admins manage the taxonomy (`/admin/service-types`) and can moderation-close any
request through the API, but there is no dedicated admin screen listing every
request across the platform. Admins are not participants in coordination, the
feature had grown large, and this was identified in the design as the least
load-bearing part and the first thing to cut. Recorded so the absence reads as a
decision rather than an omission.

### Notification is in-app only

The sidebar carries a count of incoming requests this municipality has not
answered. One small read on dashboard mount through the existing cache, not a
polling loop: the natural rhythm of inter-municipal correspondence is days.

Email is what the feature actually wants — officers will not open a dashboard
daily, and a request that waits a week to be noticed is one that expires
unanswered. It is not built because it needs a provider credential, a retry queue
(sending inside a request handler makes the request fail when the provider is
slow), bounce handling, and an SPF/DKIM story, in a project that is not deployed
and has no secret management. Named as a limitation in the report rather than
papered over with the claim that a badge is sufficient.

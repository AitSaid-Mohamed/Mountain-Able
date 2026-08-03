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

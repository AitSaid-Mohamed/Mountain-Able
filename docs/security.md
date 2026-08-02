# Security — Mountain-Able

This document records the security posture of the platform: the threat model, the
defence layers and what each protects against, the specific defects a dedicated
audit found and how they were fixed, and the trade-offs that were made
deliberately rather than by omission. It is written to be read alongside the
security chapter of the project report.

## 1. Threat model

Mountain-Able is a public web application with four privilege tiers (tourist,
municipality officer, administrator, regional authority) backed by a REST API
and MongoDB. The assets worth protecting are: user accounts and credentials;
the integrity of published tourism content and its community ratings; the
privacy of users' personal and self-declared data; and the availability of the
service and of the third-party services it proxies (OSRM, Overpass, Nominatim,
Open-Meteo). The adversaries considered are unauthenticated internet clients,
authenticated users attempting to exceed their privileges (a tourist acting as
an admin, an officer editing another municipality), and automated abuse
(credential stuffing, denial of service, injection). Physical and
infrastructure-level attacks are out of scope for a Master's project running on
a single host.

## 2. Defence layers

| Layer | Mechanism | Protects against |
|---|---|---|
| Transport/header hardening | `helmet` (CSP, `X-Content-Type-Options: nosniff`, etc.) | Clickjacking, MIME sniffing, header-based attacks |
| CORS | `cors` with a single fixed `CLIENT_ORIGIN` (never reflects the request origin) | Cross-origin credential theft |
| Authentication | JWT bearer tokens signed with `JWT_SECRET`; passwords hashed with bcrypt (cost 12) | Credential theft, forged sessions |
| Token revocation | `tokenVersion` embedded in the JWT and checked in `protect` | Continued use of a stolen/compromised token after password change or suspension |
| Authorisation | `restrictTo(...roles)`, `requireActive`, `ownsVillage`, `ownsResource` | Privilege escalation, cross-tenant access between officers |
| Mass-assignment control | Explicit field allow-lists (`utils/pick.js`) on every write | Setting `role`, `isPublished`, `ratingAverage`, `userId`, … from the request body |
| Input validation | `express-validator` chains → HTTP 422 with field errors | Malformed/out-of-range input reaching the models |
| NoSQL-injection sanitisation | `express-mongo-sanitize` (runs before all routes; covers body, query, params) | MongoDB operator injection (`{"$gt":""}`) |
| Rate limiting | Per-IP general (100/15 min), login/register (20/15 min), routes (60/15 min); plus per-account lockout | Brute force, credential stuffing, DoS of proxied services |
| Upload safety | Declared-MIME filter **and** magic-byte verification; server-generated filenames; hardened static headers | Stored XSS via SVG/HTML, spoofed content type, path traversal |
| Outbound-request safety | Coordinate bounds validation, fixed provider hosts, geometry-size cap, explicit timeouts | SSRF, DoS against us and against third parties |
| Error handling | Centralised handler; stack traces only in development | Information disclosure |

## 3. Issues found by the audit, and their fixes

Severity uses a pragmatic High/Medium/Low scale for this project's context.

### 3.1 Mass assignment on writes — **High / Medium**

*Finding.* Several write endpoints spread `req.body` directly into a document
create/update:

- **`POST /api/villages`** allowed a client to set `isPublished`,
  `ratingAverage` and `ratingCount`. An **officer could self-publish** a village
  (bypassing the admin-only publish step) and set an **arbitrary fake rating** —
  **High**, because it defeats both the moderation workflow and the integrity of
  the ratings that the whole platform's trust rests on.
- **`PATCH /api/villages/:id`** deleted `isPublished` but still allowed
  `ratingAverage`/`ratingCount` to be written — **Medium** (fake ratings).
- **Attractions/events** used a deny-list (`delete updates.villageId`) rather
  than an allow-list — **Low** (no sensitive fields, but the wrong pattern).
- **Categories/municipalities** spread the body — **Low** (admin-only).

*Verified safe before the audit:* `PATCH /api/auth/me` already used an explicit
allow-list (no `role`/`status`/`municipalityId`), `POST /api/auth/register`
forced `role: 'tourist'` server-side, `POST /api/users/officer-request` forced
`role: 'officer', status: 'pending'`, and comment create/update explicitly
picked only `content`/`rating`. So the most serious possible defect —
privilege escalation through `PATCH /me` — did **not** exist.

*Fix.* Introduced `server/src/utils/pick.js` and converted every write to an
explicit allow-list: villages, attractions, events, categories and
municipalities now enumerate exactly the fields a client may set.
`isPublished`, `ratingAverage`, `ratingCount`, `userId` and `villageId` can no
longer be assigned from a request body under any circumstances. Verified with
automated checks (officer create/update cannot set `isPublished` or
`ratingAverage`; `PATCH /me` cannot elevate `role`).

### 3.2 User enumeration on login — **Medium**

*Finding.* The login handler compared the password only when the email matched a
user, so an unknown email returned faster than a wrong password — a timing
oracle for valid emails. (The message and status were already generic.)

*Fix.* `login` now performs a bcrypt comparison against a fixed dummy hash when
the email is unknown, equalising the response time, and returns one generic
`401` for both cases. Verified: unknown-email and wrong-password responses are
byte-identical in status and message.

### 3.3 Weak password policy — **Medium**

*Finding.* The minimum length was six characters, with no check against trivial
values.

*Fix.* Raised to a minimum of **eight** characters (`middleware/validators/
passwordRule.js` and the model's `minlength`), and added rejection of a small
common-password blocklist, single-repeated-character strings, and passwords
containing the user's email local-part. Composition rules (forced symbols) were
deliberately **not** added — length is the stronger lever and symbol rules push
users toward predictable substitutions.

### 3.4 No token revocation — **Medium**

*Finding.* Tokens lasted seven days and logout was client-side only, so a stolen
token stayed valid until expiry; suspending an account did not end its sessions.

*Fix.* Added a `tokenVersion` integer on the user, embedded it in the JWT
(`tv`), and verified it in `protect` (and `optionalAuth`). It is incremented
automatically when the password changes (model `pre('save')` hook) and when an
admin suspends the account (`$inc` in `updateUserStatus`). Either action
invalidates every existing token for that user immediately. Verified: a token
becomes invalid the moment its owner is suspended.

### 3.5 Account-targeted brute force — **Medium**

*Finding.* The auth rate limiter was per-IP, so an attacker rotating IPs could
still hammer one account.

*Fix.* Added per-account throttling: `failedLoginAttempts` and `lockUntil` on
the user. After five consecutive failures the account locks for fifteen minutes
with a clear `429` message; a successful login resets the counters. This is
independent of, and additional to, the per-IP limiter. Verified: the sixth
attempt (even with the correct password) is rejected with `429`.

*Follow-up.* The strict limiter was originally mounted on the whole `/api/auth`
surface, which included `GET /api/auth/me`. That endpoint validates an existing
session and runs on every page load, so a limit sized for brute-force attempts
(20 / 15 min) throttled ordinary browsing — and because the client treated any
non-network failure as a rejected token, the resulting `429` silently logged the
user out after roughly twenty page views. The limiter is now mounted on
`/api/auth/login` and `/api/auth/register` only, which is where credentials are
actually submitted, and the client invalidates a session on `401`/`403` alone.
Brute-force protection is unchanged; the general limiter and the per-account
lockout still cover everything else.

### 3.6 External-service proxy hardening — **Medium**

*Finding.* The routing endpoints turn the server into an HTTP client acting on
user input.

*Fixes.*
- **Coordinate validation.** `POST /api/routes/plan` and
  `GET /api/routes/corridor` reject any coordinate that is not a finite number
  within WGS84 bounds before it can reach an outbound URL.
- **No host injection (verified).** Every provider base URL is a hard-coded
  constant; only the path and query carry user input (validated numbers or a
  URL-encoded place string). No SSRF vector exists.
- **Geometry cap.** `/api/routes/corridor` rejects a polyline longer than 300
  points (`422`) — an unbounded query string was a DoS vector against us and
  against Overpass.
- **Timeouts.** Every outbound call has an explicit `AbortController` timeout
  (routing 15 s, Overpass 20 s per mirror, Nominatim 10 s), so a hanging
  provider cannot exhaust the server.
- **Dedicated rate limit.** `/api/routes/*` has its own limiter, separate from
  the general one, because these endpoints consume a third party's free
  service. It is set to 60 requests / 15 min per IP. The figure is a balance,
  not a maximum-strictness choice: planning one journey already costs three
  requests (geocode, plan, corridor), and switching travel profile or retrying
  a failed route costs more, so a tighter cap penalises a single genuine user
  before it inconveniences an abuser. The real protection here is the cache —
  only a miss reaches a provider, so repeat traffic is absorbed below this
  limit entirely.

### 3.7 Upload safety — **Medium**

*Finding.* The upload filter trusted the client-declared MIME type; the stored
extension came from the client filename.

*Fixes.*
- **Magic-byte verification.** `verifyImageBytes` reads the real file signature
  after multer writes it and deletes/rejects anything that is not genuinely a
  JPEG/PNG/WebP, regardless of the declared type. Verified: an SVG/HTML payload
  sent as `image/png` is rejected with `400`; a genuine PNG is accepted.
- **SVG excluded** from the allowed types (it can carry script).
- **Filename safety.** The stored extension is derived from the accepted MIME
  type, never from `originalname`, and the base name is a server-generated
  timestamp+random string — so no path separator or traversal sequence from the
  upload can reach the filesystem.
- **Static-serving headers.** `/uploads` is served with
  `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src
  'none'`, so even a hypothetical served file cannot be interpreted as HTML or
  execute script.

### 3.8 Injection and output — **verified sound**

`express-mongo-sanitize` runs before any route handler and covers body, query
and params. The React frontend contains **no** `dangerouslySetInnerHTML`; all
user-generated text (comments, notes) and all external data (Overpass POIs,
routing responses) are rendered as React text nodes, never as markup.

### 3.9 Configuration — **Low, fixed**

`JWT_SECRET` now has **no production fallback**: the server refuses to start in
production if it is unset or shorter than 16 characters, logging a clear reason.
In development a clearly-labelled placeholder is allowed for convenience. CORS
already named a fixed origin. `npm audit` is clean on the server.

### 3.10 Dependency advisory — **accepted with justification**

`npm audit` reports two "high" advisories in `react-router-dom` (7.18.1): a
**CSRF bypass in React Router's RSC / framework mode**
(GHSA-qwww-vcr4-c8h2). This application is a **client-only SPA using
`BrowserRouter`** and does **not** use RSC or the framework's server actions, so
the advisory is not exploitable in our usage. The only available remedy is a
breaking downgrade to 7.11.0, which npm itself flags as a breaking change and
which would risk regressing routing behaviour the app depends on. The decision
is therefore to **not** downgrade now, to document the reasoning here, and to
adopt the fixed release once a non-breaking one is published. The server has no
outstanding advisories.

## 4. Documented trade-offs

### 4.1 Token storage: `localStorage` vs httpOnly cookie

The JWT is stored in `localStorage`, which is readable by any script that runs
in the page — so a successful XSS would expose the token. The alternative, an
`httpOnly` cookie, is invisible to script and would remove that exposure, but it
introduces **CSRF** risk (the browser attaches the cookie automatically to
cross-site requests), which would then require its own defence (a CSRF token or
`SameSite` strict cookies plus origin checks), and it complicates the clean
separation between a static SPA origin and an API origin that the project
currently enjoys.

For a Master's project the `localStorage` approach was kept deliberately, on the
basis that the XSS attack surface is itself minimised (no `dangerouslySet
InnerHTML`, a strict upload policy, output rendered as text, `helmet` CSP) and
that token lifetime is now bounded by the `tokenVersion` revocation mechanism.
This is recorded as a **conscious decision, not an oversight**; a production
deployment handling real personal data should revisit it and move to `httpOnly`
+ `SameSite` cookies with CSRF protection.

### 4.2 In-memory caches and rate-limit stores

The request cache, provider caches and rate-limit counters are in-process. This
is appropriate for a single-host deployment but would need a shared store (e.g.
Redis) behind multiple instances; noted so it is a known limitation rather than
a surprise.

## 5. Verification

All fixes were verified with scripted checks against a running server: 14 checks
for mass assignment, enumeration, password policy and coordinate/geometry
bounds, and 7 for token revocation, account lockout and upload magic-byte
validation — 21 in total, all passing.

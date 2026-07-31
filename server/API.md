# Mountain-Able REST API

Base URL: `http://localhost:5000/api`

## Conventions

**Response envelope.** Every response uses a consistent shape.

- Success: `{ "success": true, "data": <payload>, "meta"?: <pagination> }`
- Error: `{ "success": false, "message": <string>, "errors"?: <fieldMap> }`

`meta` (on paginated list endpoints):

```json
{ "total": 20, "page": 1, "limit": 9, "totalPages": 3 }
```

**Authentication.** Send the JWT access token as a Bearer header:

```
Authorization: Bearer <token>
```

**Roles.** `tourist`, `officer`, `admin`, `authority`. An `officer` may only
manage villages (and their attractions/events) belonging to its own
municipality. A `pending` officer can authenticate and read but is blocked from
any write operation (`403`).

**Status codes.** `200` OK · `201` Created · `400` Bad request · `401`
Unauthenticated · `403` Forbidden · `404` Not found · `409` Conflict · `422`
Validation failed · `429` Rate limited · `500` Server error.

**Validation errors (`422`).** `errors` is a field-keyed object:

```json
{ "success": false, "message": "Validation failed",
  "errors": { "email": "A valid email is required.", "rating": "Rating must be an integer between 1 and 5." } }
```

**Rate limiting.** 100 requests / 15 min per IP across `/api`; 20 / 15 min on
`/api/auth`.

---

## Health

### `GET /api/health`
Public. Liveness probe.

**200**
```json
{ "success": true, "data": { "status": "ok", "uptime": 42.1, "db": "connected" } }
```

---

## Auth

### `POST /api/auth/register`
Public. Self-service registration (always creates a `tourist`).

Body: `{ "firstName", "lastName", "email", "password", "phone"?, "city"? }`

**201**
```json
{ "success": true, "data": { "token": "<jwt>", "user": { "id": "...", "role": "tourist", "email": "..." } } }
```

### `POST /api/auth/login`
Public.

Body: `{ "email", "password" }`

**200** `{ "success": true, "data": { "token": "<jwt>", "user": { ... } } }`
**401** `{ "success": false, "message": "Incorrect email or password." }`

### `GET /api/auth/me`
Auth (any role). Returns the current user.

### `PATCH /api/auth/me`
Auth (any role). Updates own profile. Whitelisted fields: `firstName`,
`lastName`, `avatar`, `phone`, `city`. Role, status, email and password cannot
be changed here.

Accepts **either**:

- `application/json` — updates the text fields, e.g. `{ "city": "Milano" }`, or
- `multipart/form-data` — to upload an **avatar image** in the `avatar` field
  (jpg/jpeg/png/webp, ≤5 MB). The image is stored under `/uploads` (like
  village images) and the saved path is returned on the user's `avatar`. Any
  text fields sent alongside are updated too.

**200** (after avatar upload)
```json
{ "success": true, "data": { "user": {
  "id": "...", "firstName": "Sara", "role": "tourist",
  "avatar": "/uploads/1730000000000-123456789.png" } } }
```
The `avatar` path is served statically from the API origin
(`http://localhost:5000/uploads/...`). A non-image or oversized file is
rejected with **400**.

---

## Villages

### `GET /api/villages`
Public (optional auth). List with search, filter, sort, pagination.

| Query | Description |
|-------|-------------|
| `search` | case-insensitive partial match on `name` + `description` |
| `region` | exact match |
| `province` | exact match |
| `minRating` | `ratingAverage >= value` |
| `category` | slug or id — villages having ≥1 attraction in that category |
| `sort` | `rating`, `-rating`, `name`, `-name`, `newest` (default `-rating`) |
| `page` | default `1` |
| `limit` | default `9`, max `50` |
| `includeUnpublished` | `true` — admins see all; owning officer also sees their own unpublished |

Public callers only receive `isPublished: true` villages.

**200**
```json
{ "success": true,
  "data": [ { "_id": "...", "name": "Scanno", "slug": "scanno", "ratingAverage": 4.5, "municipalityId": { "name": "..." } } ],
  "meta": { "total": 20, "page": 1, "limit": 9, "totalPages": 3 } }
```

### `GET /api/villages/map`
Public. Lightweight payload for the Leaflet map (`_id`, `name`, `slug`,
`location`, `ratingAverage`, `coverImage` only).

**200** `{ "success": true, "data": [ { "_id": "...", "name": "Scanno", "location": { "lat": 41.9, "lng": 13.88 }, "ratingAverage": 4.5, "coverImage": "..." } ] }`

### `GET /api/villages/:slug`
Public (optional auth). Full detail: populated municipality, attractions (with
category), upcoming events, and the 10 most recent approved comments (authors
limited to `firstName`, `lastName`, `avatar`). Unpublished villages are visible
only to admins and the owning officer.

**200**
```json
{ "success": true, "data": {
  "_id": "...", "name": "Scanno", "description": "...",
  "municipalityId": { "name": "...", "region": "Abruzzo" },
  "attractions": [ { "name": "...", "categoryId": { "name": "Hiking", "icon": "Footprints" } } ],
  "events": [ { "title": "...", "startDate": "..." } ],
  "comments": [ { "content": "...", "rating": 5, "userId": { "firstName": "Sara" } } ] } }
```
**404** `{ "success": false, "message": "Village not found." }`

### `POST /api/villages`
Role: `officer` (own municipality), `admin`. Officers always create within their
own municipality (body `municipalityId` is ignored for officers).

Body: `{ "name", "description", "region", "province", "location": {lat,lng}, "shortDescription"?, "altitude"?, "population"?, "municipalityId"? (admin) }`

**201** returns the created village. **422** on validation error.

### `PATCH /api/villages/:id`
Role: `officer` (own), `admin`. Any village field except `isPublished` and (for
officers) `municipalityId`. Slug is regenerated if `name` changes.

**200** updated village · **403** other municipality · **404** not found.

### `DELETE /api/villages/:id`
Role: `officer` (own), `admin`. Cascade-deletes the village's attractions,
events and comments.

**200** `{ "success": true, "data": { "deleted": true, "id": "..." } }`

### `PATCH /api/villages/:id/publish`
Role: `admin`. Body: `{ "isPublished": true|false }`.

### `POST /api/villages/:id/images`
Role: `officer` (own), `admin`. `multipart/form-data`, field `images`
(up to 8 files; jpg/jpeg/png/webp; ≤5 MB each). Appends to the `images` array
and sets `coverImage` if unset.

**201** updated village · **400** no files / wrong type / too large.

### `DELETE /api/villages/:id/images/:idx`
Role: `officer` (own), `admin`. Removes the image at array index `:idx`.

**200** updated village · **400** index out of range.

---

## Attractions

### `GET /api/villages/:villageId/attractions`
Public. Supports `?category=` (slug or id).

**200** `{ "success": true, "data": [ { "name": "...", "categoryId": { "name": "Nature" } } ] }`

### `POST /api/villages/:villageId/attractions`
Role: `officer` (own), `admin`.

Body: `{ "name", "categoryId", "description"?, "location"? }`

**201** created attraction.

### `PATCH /api/attractions/:id`
Role: `officer` (own), `admin`. **200** / **403** / **404**.

### `DELETE /api/attractions/:id`
Role: `officer` (own), `admin`. **200** `{ "deleted": true }`.

---

## Events

### `GET /api/events`
Public. Query: `?upcoming=true` (endDate ≥ now, sorted ascending by
`startDate`), `?region=`, `?villageId=`.

**200** `{ "success": true, "data": [ { "title": "...", "startDate": "...", "villageId": { "name": "..." } } ] }`

### `GET /api/villages/:villageId/events`
Public. Supports `?upcoming=true`.

### `POST /api/villages/:villageId/events`
Role: `officer` (own), `admin`. Validates `endDate >= startDate`.

Body: `{ "title", "startDate", "endDate", "description"?, "image"? }`

**201** created event · **422** if `endDate < startDate`.

### `PATCH /api/events/:id`
Role: `officer` (own), `admin`.

### `DELETE /api/events/:id`
Role: `officer` (own), `admin`.

---

## Comments & ratings

Whenever a comment is created, edited, deleted or moderated, the parent
village's `ratingAverage` / `ratingCount` are recomputed automatically from
**approved comments only** (model hooks — never in the controller).

### `GET /api/villages/:villageId/comments`
Public. Approved only, newest first, paginated (`page`, `limit` default 10).

**200** with `meta`.

### `POST /api/villages/:villageId/comments`
Role: `tourist`. One comment per user per village — enforced by a compound
unique index `{ userId, villageId }` on the Comment collection (the DB is the
source of truth); the controller returns a friendly `409` on top.

Body: `{ "content", "rating" (integer 1–5) }`

**201** created comment · **409** `{ "message": "You have already reviewed this village." }` · **422** invalid rating.

### `PATCH /api/comments/:id`
Role: author only, within 24h of creation. Body: `{ "content"?, "rating"? }`.

**200** updated · **403** not author / edit window elapsed · **404**.

### `DELETE /api/comments/:id`
Role: author or `admin`. **200** `{ "deleted": true }`.

### `GET /api/comments/pending`
Role: `admin`. Moderation queue (status `pending`), paginated, with author and
village populated.

### `PATCH /api/comments/:id/moderate`
Role: `admin`. Body: `{ "status": "approved" | "rejected" }`.

**200** updated comment (triggers rating recalculation).

---

## Municipalities

### `GET /api/municipalities`
Public. All municipalities, sorted by name.

### `GET /api/municipalities/:id`
Public. Municipality with its villages (`villages` array).

### `POST /api/municipalities`
Role: `admin`. Body: `{ "name", "region", "province", "contactEmail"?, "phone"? }`.

### `PATCH /api/municipalities/:id`
Role: `admin`.

### `DELETE /api/municipalities/:id`
Role: `admin`. **409** if any village still references it.

---

## Categories

### `GET /api/categories`
Public.

### `POST /api/categories`
Role: `admin`. Body: `{ "name", "icon"?, "slug"? }` (slug auto-generated if omitted).

### `PATCH /api/categories/:id`
Role: `admin`.

### `DELETE /api/categories/:id`
Role: `admin`. **409** if any attraction references it.

---

## Users & account requests

### `GET /api/users`
Role: `admin`. Query: `?role=`, `?status=`, `page`, `limit` (default 20, max 100).

**200** with `meta`.

### `GET /api/users/:id`
Role: `admin`.

### `PATCH /api/users/:id/status`
Role: `admin`. Body: `{ "status": "pending" | "active" | "suspended" }`.
(Approve a pending officer by setting `active`.)

### `PATCH /api/users/:id/role`
Role: `admin`. Body: `{ "role", "municipalityId"? }`. `municipalityId` is
required when the target role is `officer`.

### `DELETE /api/users/:id`
Role: `admin`. Cannot delete own account (`400`).

### `POST /api/users/officer-request`
Public. Officer account request. Body: `{ "firstName", "lastName", "email",
"password", "municipalityName", "region", "province"?, "message"? }`. Creates a
user with role `officer` and status `pending`, linking to (or creating) the
named municipality, **and** an auditable `OfficerRequest` record that preserves
the free-text `message` for the admin queue (see *Officer requests*).

**201**
```json
{ "success": true, "data": {
  "user": { "role": "officer", "status": "pending" },
  "request": { "_id": "...", "requesterName": "Aspiring Officer", "email": "...",
               "municipalityName": "...", "region": "...", "message": "...", "status": "pending" },
  "message": "Your officer account request has been submitted and is awaiting approval." } }
```
**409** if the email already exists.

---

## Officer requests

Auditable queue of public officer account requests. Each record stores the
applicant details and free-text `message`, plus `status`
(`pending` | `approved` | `rejected`), `reviewedBy` and `reviewedAt`.

### `GET /api/officer-requests`
Role: `admin`. Newest first, paginated. Query: `?status=`, `page`, `limit`
(default 20, max 100).

**200**
```json
{ "success": true,
  "data": [ { "_id": "...", "requesterName": "Paolo Verdi", "email": "...",
              "municipalityName": "Comune di Usseaux", "region": "Piedmont",
              "message": "...", "status": "pending", "reviewedBy": null, "reviewedAt": null } ],
  "meta": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 } }
```

### `PATCH /api/officer-requests/:id`
Role: `admin`. Approve or reject a request. Body: `{ "status": "approved" | "rejected" }`.
Records `reviewedBy` / `reviewedAt` and updates the linked officer account:
approving sets it `active`, rejecting sets it `suspended`.

**200**
```json
{ "success": true, "data": {
  "request": { "status": "approved", "reviewedBy": "<adminId>", "reviewedAt": "..." },
  "officerStatus": "active" } }
```
**404** if the request does not exist · **422** on an invalid status.

---

## Statistics

All four endpoints require role `authority` or `admin`. Implemented with
MongoDB aggregation pipelines.

### `GET /api/stats/overview`
Platform totals + average rating.

**200**
```json
{ "success": true, "data": {
  "villages": 20, "municipalities": 10, "attractions": 87, "events": 48,
  "tourists": 7, "comments": 54, "approvedComments": 46, "averageRating": 4.13 } }
```

### `GET /api/stats/regions`
Per-region aggregates.

**200**
```json
{ "success": true, "data": [
  { "region": "Abruzzo", "villageCount": 4, "avgRating": 4.2, "totalAttractions": 18, "totalComments": 11 } ] }
```

### `GET /api/stats/villages/top`
Top 10 villages by `ratingAverage` with `ratingCount >= 3`. Query: `?region=`.

**200** `{ "success": true, "data": [ { "name": "...", "ratingAverage": 5, "ratingCount": 4 } ] }`

### `GET /api/stats/satisfaction`
Rating distribution (1–5) + 12-month time series.

**200**
```json
{ "success": true, "data": {
  "distribution": [ { "rating": 1, "count": 2 }, { "rating": 5, "count": 20 } ],
  "monthly": [ { "year": 2026, "month": 7, "count": 46, "avgRating": 4.13 } ] } }
```

---

## Errors — examples

**401** (missing token)
```json
{ "success": false, "message": "You are not logged in. Please provide a valid token." }
```

**403** (pending officer write)
```json
{ "success": false, "message": "Your account is awaiting admin approval and cannot perform this action yet." }
```

**409** (duplicate)
```json
{ "success": false, "message": "You have already reviewed this village." }
```

**422** (validation)
```json
{ "success": false, "message": "Validation failed", "errors": { "rating": "Rating must be an integer between 1 and 5." } }
```

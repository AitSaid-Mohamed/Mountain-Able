# Screenshots

UI captures of the running Mountain-Able frontend (React + Vite) against the
seeded backend, taken in one batch so the data is consistent across every shot.

Desktop is **1440 × 900** and mobile **375 × 812**, both at `deviceScaleFactor:
2` — so the files are 2880 px and 750 px wide respectively. Each capture waits
for every image to decode, for all Leaflet tiles to finish loading, and for the
Recharts mount animation to settle before shooting.

Public pages are captured full-page where they are taller than the viewport.
**Dashboard pages are viewport-height only**: those layouts scroll inside their
own container rather than the document, so a full-page capture would return the
viewport anyway. Where a list continues below the fold, the caption says so.

| File | What it shows |
|------|---------------|
| `01-home.png` | Full home page, logged out — hero, Most Popular villages, the About band and the FAQ accordion. |
| `02-villages-listing.png` | Villages listing: the Name / Region / Minimum-rating search bar, the village card grid, and the Leaflet map of Italy beside the results. The Figma's Location/Date/Guests booking bar was rebuilt here — there is no booking in this product. |
| `03-villages-listing-filtered.png` | The same listing filtered to **Region = Abruzzo, Minimum rating = 4+**, sorted by highest rated — four of the twenty villages. Supports the demo's point that filters, sort and page live in the URL (`?region=Abruzzo&minRating=4&sort=-rating`), so a filtered search is a shareable link and the back button behaves. The map narrows with the results — four markers, zoomed to Abruzzo — because `/villages/map` takes the same filters as the listing. |
| `04-village-detail.png` | Full village detail page (Scanno) — gallery, description, and the sidebar with map, municipality, altitude, attractions and upcoming events. The stats strip shows attractions, events and reviews rather than the Figma's "Tourists / Hotels / Shops", none of which the database holds. |
| `05-village-reviews.png` | The reviews block, signed in as a tourist: average score, the 1–5 distribution, the write-a-review form, and the start of the review list. This section had no Figma design at all and was designed from scratch. |
| `06-route-planner.png` | Route planner, Sulmona → Scanno by car. The route and its corridor POIs on the map; the **elevation profile**, terrain and surface advisories in the right-hand panel. The panel is scrolled to bring the profile into frame — the summary card and the journey header sit above it. |
| `07-signup.png` | Tourist self-registration at `/signup`. First/last name, email, optional phone and city, password and confirmation, and an optional profile photo. There is **no date-of-birth field** — the Figma prototype had one, and it was removed because the platform has no purpose for that data. |
| `08-login-modal.png` | The login modal, opened over the home page by the `/login` route. Captured at viewport height rather than full page: the modal is a fixed overlay, so a full-page shot would stretch its backdrop over content the user cannot see while it is open. |
| `09-officer-dashboard.png` | Officer dashboard (Giulia Rossi, Unione Comuni Valle d'Aosta). Every figure is scoped to her own municipality — three villages, not the platform's twenty. The sidebar is tourism navigation, replacing the Figma's retail Stocks / Staff / Finance. |
| `10-officer-village-editor.png` | The village editor an officer uses to create or update a village. An officer cannot publish: `isPublished` is not in the controller's allow-list, so the field is unreachable from their request rather than merely hidden. |
| `11-admin-moderation.png` | Admin moderation queue with its keyboard shortcuts (A approve · R reject · J/K move). Three of the six seeded pending reviews are in frame; the rest continue below the fold. |
| `12-authority-overview.png` | Authority overview — platform-wide totals. This role is read-only by construction and has no write endpoint. |
| `13-authority-satisfaction.png` | Satisfaction analytics: rating distribution, monthly reviews against average rating across twelve months, and average rating by region. Every figure comes from a MongoDB aggregation pipeline, not from in-memory reduction. |
| `14-tourist-area.png` | The signed-in tourist's own area — visits, favourites, saved routes and reviews. |
| `15-mobile-home.png` | Home page at 375 px: collapsed hamburger navigation, stacked hero and cards. |
| `16-mobile-villages-listing.png` | Villages listing at 375 px: single-column cards, the map behind a show/hide toggle, and pagination. |

`03`, `07` and `08` were captured in a **second batch**, against the same seeded
database but a later seed run, and the remaining thirteen were renumbered around
them to keep the narrative order. The three new shots contain no seed-relative
dates, so nothing in them can disagree with the original batch; the review dates
visible in `05` and `11` still come from the first run.

## Regenerating

There is no checked-in capture script — Playwright is installed temporarily and
removed afterwards, so it is not a project dependency. To retake the set:

1. Start MongoDB, `cd server && npm run dev`, `cd client && npm run dev`.
2. `cd server && npm run seed` for consistent data, then `npm run warm-cache`
   so the route-planner shot does not wait on live providers.
3. `cd client && npm install --no-save playwright && npx playwright install chromium`.
4. Run a capture script against `http://localhost:5173`, authenticating by
   seeding `localStorage.mountainable_token` with a JWT from
   `POST /api/auth/login`.
5. `npm uninstall playwright` when finished.

Note that the seeded reviews are dated relative to the seed run, so dates in a
regenerated set will differ from the ones shown here.

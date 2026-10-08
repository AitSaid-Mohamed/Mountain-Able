# Video presentation — narration script (~12 minutes)

This is the spoken script for the recorded video. `docs/demo-script.md` says what to click in a live demonstration, and `docs/demo-accounts.md` lists the seeded accounts. This document says **what to say**, sentence by sentence, and what is on screen while you say it.

Everything is recorded from `http://localhost:5173` against a freshly seeded local database. **Never say a password aloud, and never type one while recording.** Every account is logged in before recording starts (see the checklist at the end).

Each narration line is a short, plain sentence written to be read aloud. At a calm pace of about 135 words a minute, the narration runs a little under 12 minutes. The rest of the time is for clicks and pauses.

## Scenes at a glance

| # | Scene | Time | Window · account |
|---|---|---|---|
| 1 | The problem | 0:00–0:50 | A · logged out |
| 2 | Discovery: search, filters, map | 0:50–1:55 | A · logged out |
| 3 | The journey planner | 1:55–3:05 | B · `sara@example.com` |
| 4 | A review, held for moderation | 3:05–3:50 | B · `sara@example.com` |
| 5 | The administrator: moderation and a municipality application | 3:50–4:55 | C · `admin@mountainable.it` |
| 6 | Coordination I: the gap, the directory, driving time | 4:55–6:50 | D · `officer.torgnon@mountainable.it` |
| 7 | Coordination II: answering Valtournenche live | 6:50–8:35 | D · `officer.torgnon@mountainable.it` |
| 8 | The regional authority: gap analytics | 8:35–10:05 | E · `authority@mountainable.it` |
| 9 | Method and self-audit | 10:05–11:10 | editor |
| 10 | Conclusion | 11:10–12:00 | A · logged out |

Coordination runs from scene 6 through scene 8, about 5 minutes 10 seconds of the 12.

---

## 1 · The problem — 0:00–0:50

**ON SCREEN**
- Window A, logged out, `http://localhost:5173/`.
- Stay at the top of the home page. During the last paragraph, scroll slowly once to the village cards, then stop.

**SAY**

> This is Mountain-Able, my project work for the Master in Programming and Planning for Sustainable Mountain Development at the Politecnico di Milano.
>
> Small Italian mountain municipalities have a visibility problem. Their tourism information is scattered, out of date, or missing. A comune of a few hundred people cannot keep its own website running. And a visitor who has never heard of the village will never find it.
>
> Mountain-Able gives these municipalities one shared place to publish. It gives visitors one place to discover them.
>
> The project has two axes. The first is the visitor: discovery, journey planning and reviews. The second is the municipalities themselves, and how they can work together. I will spend most of this video on the second, because it is the newer idea.
>
> One thing first. Everything you will see runs on a demonstration dataset. The villages are real places. The reviews, events, requests and figures were generated for this demonstration. They show how the method works. They are not claims about the real municipalities.

**CAREFUL:** Don't say or imply that the platform is hosted, live, or used by any municipality. It runs on localhost.

---

## 2 · Discovery: search, filters, map — 0:50–1:55

**ON SCREEN**
1. Window A. Click **Villages** in the header (`/villages`).
2. In **Region**, choose **Abruzzo**. Click **Search**. Point at the address bar (`?region=Abruzzo`).
3. Open the **Minimum rating** dropdown to show *3+ / 4+ / 4.5+ stars*. Press **Esc** without choosing.
4. Point at the map beside the results.
5. Click the **Scanno** card. You land on `/villages/scanno`.
6. Scroll slowly through the description and the sidebar, then down to **Reviews**.

**SAY**

> The catalogue holds twenty-four villages in fourteen municipalities, from the Aosta Valley down to Basilicata.
>
> You can search by name, filter by region, and set a minimum rating. Here is Abruzzo.
>
> Look at the address bar. The filters live in the URL. A filtered search is a link you can share, and the back button works as you expect.
>
> The map shows every village that matches the filter, not just the current page of results.
>
> This is Scanno, above its heart-shaped lake. The page brings together the description, the attractions, the events and the reviews.
>
> The original design prototype had a statistics strip here, with tourists, hotels and shops. The platform holds no such data, so the strip is gone. The rule throughout the project is simple: if the system cannot supply a number, it does not display one.
>
> The rating at the top is computed only from reviews an administrator has approved. Pending and rejected reviews do not count.

**CAREFUL:** Don't apply the rating filter. Ratings are random on every seed, so it could leave an empty list. Don't read out Scanno's rating or review count either: they also change on every seed.

---

## 3 · The journey planner — 1:55–3:05

**ON SCREEN**
1. Switch to window B. Sara is already logged in and on `/villages/scanno`.
2. Click **Plan your journey**. You land on `/villages/scanno/route`.
3. In **Starting point**, type `Sulmona` and click **the first suggestion**. Leave **Travelling by** on **Car**. Leave the travel date empty.
4. Click **Plan route**.
5. Point in turn at the **Summary**, the **Elevation profile**, the **Advisories** with their grey source lines, and **Along the way**.

**SAY**

> Sara is a visitor planning a trip to Scanno. She starts from Sulmona, in the valley below.
>
> The route comes from OpenStreetMap-based routing. In the mountains, distance alone tells you very little. So the planner rebuilds an elevation profile along the route, using a separate elevation service.
>
> Below it are the advisories, and each one says where it comes from. Some are computed from the elevation profile, such as a sustained steep gradient or a high-altitude section. Others come from OpenStreetMap road tags, such as an unpaved or narrow stretch. Where OpenStreetMap does not record the surface, the planner says so. It does not assume the road is paved.
>
> Every advisory ends with the same instruction: verify locally before travelling. The system cannot know whether a pass is open today, and it does not pretend to.
>
> Along the way, it lists other villages on the platform near the route, found with a geospatial query on the platform's own database. It also lists services from OpenStreetMap, such as fuel, pharmacies and viewpoints.
>
> This is a planning tool, not navigation. It does no transport optimisation, which stays out of scope.

**CAREFUL:** Click the **first** Sulmona suggestion, with Car and no date. Anything else misses the warmed cache and calls the providers live. If the points of interest say *"could not be loaded"*, read that sentence aloud and move on. Showing the failure honestly is part of the design. Don't name specific advisories: which ones appear depends on provider data at warm-up time.

---

## 4 · A review, held for moderation — 3:05–3:50

**ON SCREEN**
1. Window B, still Sara. Click **Back to village** and scroll to **Reviews**.
2. Under **Write a review**, choose 5 stars and type: *"Quiet lanes and a beautiful walk down to the lake."* Click **Submit review**.
3. Point at the **Your review** card and its **Pending review** badge. Then point at the public list below it: the review is not there.

**SAY**

> Sara has been to Scanno before. She leaves a review.
>
> It does not appear in the public list. She sees it in her own card, marked "Pending review", with a note that an administrator will publish it.
>
> Every review is created as pending. Until an administrator approves it, only its author can see it, and it does not affect the village's rating.
>
> Editing an approved review sends it back to pending. Otherwise someone could post something harmless, get it approved, and then change it.
>
> Telling the author what is happening matters. A review that silently vanished would look like a bug.

**CAREFUL:** A tourist can review each village only once, and the seed hands out reviews at random. Checklist step 4 makes sure Sara has no Scanno review before you record.

---

## 5 · The administrator: moderation and a municipality application — 3:50–4:55

**ON SCREEN**
1. Switch to window C, logged in as `admin@mountainable.it`, at `/admin/moderation`. **Reload** the page.
2. Sara's review is at the top (newest first) and already highlighted. Press **A** to approve it.
3. Switch to window B and reload `/villages/scanno`. Point at Sara's review in the public list and at the rating line above it.
4. Back to window C. Click **Officer requests** in the sidebar (`/admin/officer-requests`).
5. On **Paolo Verdi · Comune di Usseaux**, click **Approve**. Pause on the confirmation dialog, then click **Approve** in it.

**SAY**

> This is the administrator's moderation queue. Next to Sara's review, it holds the pending reviews from the seed.
>
> Moderation is repetitive work, so it is driven by the keyboard. A approves, R rejects, J and K move up and down. I approve Sara's review.
>
> Back on the village page, the review is now public. The rating has been recalculated from approved reviews only. A database hook does that whenever a review's status changes. The page never computes it.
>
> The second queue is how a municipality joins. Anyone can apply through the public "claim your village" form. The applicant gets an officer account that starts as pending, and it cannot change anything until an administrator approves it.
>
> Here is an application from Paolo Verdi for Usseaux. I check the municipality and the region, and approve.
>
> Officers are confined to their own municipality. An officer cannot edit another municipality's village. The server enforces that in middleware, not by hiding buttons.

**CAREFUL:** The two seeded applications have **no linked user account**, so approving one only records the decision. Don't say the approval "activated Paolo's account". The narration describes the general mechanism first, then the act of approving, and that wording is accurate.

---

## 6 · Coordination I: the gap, the directory, driving time — 4:55–6:50

**ON SCREEN**
1. Switch to window D, logged in as `officer.torgnon@mountainable.it`, at `/dashboard`.
2. Point at **Coordination** in the sidebar and its count of **1**.
3. Click **Coordination**. The **Our capabilities** tab opens. Point at the four services switched on: **Group accommodation**, **Equipment rental**, **Meeting & event space**, **Local produce**.
4. Click the **Neighbours** tab. Set **Service** to **Licensed mountain guide**. Leave **Within** at **60 km**.
5. Two cards appear: **Comune di Valtournenche** and **Comune di Ayas**. Point at the time in the top-right corner of each card, then at the service badges.

**SAY**

> Now the second axis.
>
> Today each comune publishes on its own. The original proposal for this project set two objectives that a tourism catalogue cannot meet by itself: data sharing between local authorities, and coordination between municipalities. This part of the platform addresses them.
>
> The idea is simple. A village of a few hundred people cannot keep a minibus, a mountain guide, a first-aid post and a hostel. A valley of several such villages often can. The capacity exists, but it is split across municipal boundaries.
>
> This is Torgnon, in the Aosta Valley. Its officer declares what the comune can offer its neighbours: a hostel for groups, ski and snowshoe hire, a meeting hall, and local produce.
>
> Declaring takes a few switches over a fixed list of services. It has to be quick, because a directory nobody fills in is worth nothing. The list is fixed rather than free text because free text cannot be aggregated, and later the regional authority needs to aggregate it.
>
> Torgnon has no mountain guide of its own. The Neighbours tab shows who nearby offers one. Look at how the list is ranked. It is ranked by driving time, not by distance.
>
> In mountain terrain, kilometres mislead. Chamois sits above the same valley as Torgnon. On a map it looks close to everything around it. But no road reaches Chamois at all. Visitors leave the car at the bottom and take a cable car up. A distance in kilometres says nothing about that.
>
> The same thing happens all over the Alps. Two villages on either side of a ridge can be close in a straight line, and still be an hour apart by road. The only road goes down to the valley floor and back up again.
>
> So the platform works in three steps. First, a straight-line radius narrows the candidates. That loses nothing, because a road is never shorter than a straight line. Second, it keeps only the municipalities that declare the service. Third, a single call to a routing service ranks them by driving time.
>
> If that call fails, the list falls back to straight-line order, and the screen says so. It never passes off a straight-line order as a road order.
>
> Driving time is still an approximation. For Chamois, a road router would stop at the cable car station. The platform does not model cable cars, and I would rather say that than hide it.

**CAREFUL:**
- **Don't read out or describe** the minutes or kilometres on either card, and say nothing about the distance or time between Torgnon and Valtournenche. Point at the column, not at the number. Don't say which card comes first, either.
- Use **Licensed mountain guide**, not *Any service*. With *Any service*, the list also includes *Unione Montana Valli del Piemonte*. That union's computed location is the average of two villages far apart in Piedmont, and the average happens to fall inside the Aosta Valley. It's a seeding artefact, and it invites a question you don't want on camera.
- If an amber note says the routing provider could not be reached, say: *"The routing service did not answer, so the screen says so and falls back to straight-line order."* Then continue.
- A capability card may show **Needs confirming**. The seed gives each declaration a random confirmation date, and anything over a year old is flagged. If one appears, you can say: *"Declarations older than a year are flagged, so the directory does not quietly go stale."*

---

## 7 · Coordination II: answering Valtournenche live — 6:50–8:35

**ON SCREEN**
1. Window D, still Torgnon. Click the **Incoming** tab.
2. The top card is **Hall for a joint valley tourism meeting** · *Meeting & event space · Comune di Valtournenche*, status **Open**, **80 people**. Let it sit on screen for a moment.
3. Click **Respond**. Point at the three options.
4. Choose **We can help**. In **Message**, type: *"The sala polivalente seats 90, with a projector and kitchen. Call our tourism office to fix the date."*
5. Point at **Who should they contact?** The fields are already filled in from Torgnon's own declaration. Click **Send response**.
6. Point at the card: it now reads **1 can help · 0 partly · 0 cannot**, and the status is still **Open**.
7. Click the **Our requests** tab. Point at the three closed requests in turn: *Transport for 40 walkers* (**Met**, *Met by Comune di Valtournenche*), *German-speaking guide for a visiting delegation* (**Expired**), *Accessible transport for two visitors* (**Not met**), with its closing note.

**SAY**

> The count in the sidebar was one. One request from a neighbour is waiting for Torgnon's answer.
>
> Valtournenche is hosting a joint valley tourism meeting. It needs a room for about eighty people, with a projector. The request went only to municipalities within the chosen radius that declare a meeting space. Torgnon declares one.
>
> There are three possible answers, not two: we can help, we can partly help, or we cannot help. In the mountains, a partial answer is the realistic one. A neighbour who can send one minibus instead of two has still helped. And a clear no is more useful than silence.
>
> Torgnon's hall seats ninety, so I answer that we can help.
>
> The contact details come from Torgnon's own declaration. And this is where the platform stops. It introduces the two administrations. They make the arrangement directly, by phone or by email, as they would today. The difference is that today they have no reliable way to find each other.
>
> This is coordination, not commerce. There are no prices, no booking, and no payment. No municipality rates another. The record holds only what was asked, who answered, and whether the need was met.
>
> Notice that the request is still open. An offer does not close it. Only the municipality that asked can say whether its need was met, because an offer is not the same thing as a solved problem.
>
> Torgnon's own requests show the rest of the lifecycle. It asked for transport for a walking group, and Valtournenche lent its minibuses: met. It asked for a German-speaking guide, nobody replied, and the request expired. It asked for accessible transport, nobody nearby could provide it, and it closed as not met. The note says this was the second time that year.
>
> A closed request stays closed. If the same need comes back, it becomes a new request. That way the record can always answer one question: how many times was this asked for?

**CAREFUL:**
- Answer **only** the meeting-hall request. The snowshoe request from Ayas below it also has a **Respond** button, because Torgnon can change an earlier answer, but Torgnon has already offered on it.
- The card says **Sent to 2 municipalities**. The second is *Unione Montana Valli del Piemonte*, the same averaged-location artefact as in scene 6. Don't comment on the count.
- The sidebar count stays at **1** until the page reloads, because it is read once when the dashboard opens. Don't reload, and don't point at it again.
- Say nothing about the distance or driving time between Torgnon and Valtournenche.

---

## 8 · The regional authority: gap analytics — 8:35–10:05

**ON SCREEN**
1. Switch to window E, logged in as `authority@mountainable.it`, at `/authority/coordination`. **Reload** the page.
2. Point at the four figures across the top.
3. Point at **Where to invest**. The top row is **Accessible transport**, highlighted, with a **Priority** badge.
4. Scroll past **Demand by service** to **Capability coverage**. Point at the empty cells.
5. Scroll to **Response behaviour**, then **Structurally isolated**. End on the small-numbers note at the bottom of the page.

**SAY**

> This is the part that no single municipality could produce on its own.
>
> Every request permanently records what was sought, where, and whether the need was met. Each comune sees only its own unmet needs. Pooled across a territory, the record shows which capabilities are persistently missing. That is exactly what a regional authority needs to decide where to invest.
>
> The authority's role is read-only. It has no write access at all. Every figure here is computed by an aggregation pipeline inside the database.
>
> "Where to invest" sets demand against declared supply. A service nobody offers and nobody asks for is not a gap. One that is asked for repeatedly and offered by almost nobody is. In this dataset, that is accessible transport. It was requested twice, met neither time, and only one municipality offers it.
>
> The coverage matrix shows supply by region. An empty cell means no municipality in that region declares the service at all, before anyone has even asked.
>
> Response behaviour separates two explanations that otherwise look the same. Either the capability does not exist, or the neighbours are not answering. Those call for opposite responses.
>
> The isolated list shows municipalities with no neighbour offering anything within sixty kilometres. For them, introductions cannot help. What they need is provision, which is a different budget line. Here, most of the municipalities outside one Aosta Valley cluster are isolated. That comes from how the demonstration villages were chosen, spread across Italy, and it is not a finding about those places.
>
> One rule about small numbers. Where fewer than five requests have been decided, the screen shows counts and withholds the percentage. A percentage from one or two cases would be a lie told with a true number.
>
> And again, this is demonstration data. These figures show how the method works. They say nothing about the real Aosta Valley.

**CAREFUL:**
- The narration gives no figure except the three accessible-transport facts, which follow directly from the seed. If you want to add a figure, read it from the screen. From the seed and the code I *calculate* these, but I haven't seen them in the running app: **10** requests raised; **Met 50%** of **6** decided; **10 / 14** municipalities declaring; **32** services declared; for the Aosta Valley, **8** of 10 requests answered (**80%**) after your reply in scene 7. If the screen disagrees, trust the screen and leave the figure out.
- Don't name the isolated municipalities from memory. By my calculation there are eight, but read them from the screen if you mention any.

---

## 9 · Method and self-audit — 10:05–11:10

**ON SCREEN**
1. Editor window: `docs/role-audit.md`, scrolled to **§8.1 Gaps that undermine something the project explicitly claims**.
2. Then `docs/security.md`, showing the **§3 Issues found by the audit** headings.
3. Then `docs/design-decisions.md`, scrolled through briefly.

**SAY**

> A word on method.
>
> The backend is Node and Express, with MongoDB. The frontend is React. External data comes from open sources: OpenStreetMap routing, an elevation service, OpenStreetMap points of interest and geocoding. All of it is called from the server, and all of it is cached.
>
> Before submitting, I audited the running system against the claims in my own report, one role at a time. Every capability was traced to a route and its access guards, not to what I expected it to do.
>
> The audit found six places where the build and the report disagreed. One example: the report described municipalities applying to join, but there was no public form to do it. Five of the six are fixed, three in the code and two in the report. One is still open: a single interface message that overstates what happens. It is recorded as open, not hidden.
>
> A separate security review found a mass-assignment flaw, where a request could set fields it should never control. It was fixed with an explicit allow-list on every write. That review is documented, with the other findings and the trade-offs I accepted.
>
> Every departure from the original design prototype is recorded with its reason. The booking-style search bar was replaced. A reviews section was designed from scratch. Invented statistics were removed.

**CAREFUL:** The project has no automated test suite (`server/package.json` has no `test` script), so don't claim tests.

---

## 10 · Conclusion — 11:10–12:00

**ON SCREEN**
- Window A, `http://localhost:5173/`, top of the home page. Don't move.

**SAY**

> To sum up.
>
> For visitors, Mountain-Able makes small mountain villages findable. It helps people plan a realistic journey to them. And it keeps reviews trustworthy through moderation.
>
> For municipalities, it lets them declare what they can offer, ask their neighbours for what they lack, and record the outcome. Over time, that record becomes evidence of what is missing, and where.
>
> The scope is deliberately limited. There is no booking, no payment, no transport optimisation and no chatbot. These are documented as future work.
>
> And the platform does not claim to solve depopulation. Depopulation has causes that no website can reach. What this project offers is narrower: visibility for places that lack it, a channel between administrations that lack one, and evidence that can inform the decisions that do matter.
>
> Thank you.

---

## Claims I could not fully verify

Everything the narration states about the system was checked against the code and the seed (`server/src/seed/`, `server/src/services/coordination.js`, the coordination controllers and guards, `Comment.js`, the client components and `client/src/locales/en.json`). These are the exceptions:

- **Chamois has no road access.** This comes from the seed's description of Chamois, which matches its well-known status, but it's a fact about the world, not about the code. The claim that a road router would stop at the cable car is my reasoning about how routing works. I didn't run a route to Chamois to watch it happen.
- **The scene 8 figures** (10 requests, 50% of 6, 10/14, 32, 80%, eight isolated) are my arithmetic from the seed and the aggregation code. I haven't read them from the running app. The narration deliberately leaves them out.
- **Which advisories appear for Sulmona → Scanno** depends on provider data at warm-up time. The narration describes the kinds of advisory, not a specific list.
- **The card order on the Neighbours tab** depends on live OSRM durations. The narration doesn't say which card comes first.

---

## Pre-recording checklist

Do these **in this order**. Each step depends on state the previous one creates, and two of them (seeding and logging in) undo things done before them.

| # | Do | Why it is here in the order |
|---|---|---|
| 1 | Close every terminal you won't need, and make sure MongoDB is running. | — |
| 2 | `cd server && npm run seed` | Seeding wipes everything, so it comes first. It restores the 6 pending reviews, the two officer applications, and the open coordination requests. The seed backdates open requests, which expire 30 days after their seeded creation date; the earliest lapses 16 days after seeding. **Seed on recording day.** |
| 3 | `cd server && npm run dev`, then `cd client && npm run dev` | The route and travel-time caches live in the API's memory. Starting the API after the final seed means the warm-up fills a cache that matches the current data. |
| 4 | In a **private** browser window, log in as `sara@example.com` and open `/my/reviews`. If Sara already has a review of **Scanno**, go back to step 2 and reseed. Then log out and close the window. | The seed assigns reviews to random tourist–village pairs, and a tourist can review a village only once. Reseeding is quicker than rewriting scenes 3–5 around another village, because the warmed journey goes to Scanno. |
| 5 | `cd server && npm run warm-cache`. It must print **Warmed 4/4 journeys · verified 4/4 cache-served**. | Fills the route caches for Sulmona → Scanno and the other demo journeys. It runs after the final seed because the cache entries are tied to the current village IDs. Don't record on a `FAIL`: re-run it, and if it still fails, see `docs/demo-script.md` → Troubleshooting. |
| 6 | **From here on, don't edit or save any file under `server/`.** | `nodemon` restarts the API on any change, which empties the in-memory caches from steps 5 and 8. |
| 7 | Open five separate browser profiles (or windows that don't share a login) and log each one in: **A** logged out at `/`; **B** `sara@example.com` at `/villages/scanno`; **C** `admin@mountainable.it` at `/admin/moderation`; **D** `officer.torgnon@mountainable.it` at `/dashboard`; **E** `authority@mountainable.it` at `/authority/coordination`. | Logins come after the final seed, because the seed recreates every user and an older session would point at a user that no longer exists. Logging in beforehand also keeps every password off the recording. Login is limited to 20 attempts per 15 minutes per IP. If rehearsals have used that up, wait it out. |
| 8 | In window D, open **Coordination → Neighbours**, set **Service** to **Licensed mountain guide** and **Within** to **60 km**, and wait for both cards to show a time. Then click back to **Our capabilities** and reload `/dashboard`. | `warm-cache` doesn't warm the coordination ranking. The ranking is a live OSRM call, cached for 7 days per exact list of destinations. Only this exact service and radius produce the list cached here, which is why scene 6 must use the same choice. Opening and reloading the dashboard doesn't change any data. |
| 9 | **Don't rehearse the live actions**: submitting Sara's review, approving it, approving Paolo Verdi, answering Valtournenche. If you do, go back to step 2 and repeat everything after it. | Each of these changes the data. After a rehearsal, the moderation queue, the sidebar count, the officer-request list and the authority figures no longer match the script. |
| 10 | If you ran `warm-cache` more than once, wait 15 minutes before recording scene 3. | Planner requests share a limit of 60 per 15 minutes per IP, and `warm-cache` sends its requests through the same endpoints. |
| 11 | Set every window to 1440 × 900 at 100% zoom. | The dashboard sidebar collapses below about 1100 px. |
| 12 | Hide before recording: all terminals (the seed prints the password), `server/.env`, password-manager pop-ups, the bookmarks bar, unrelated tabs, desktop notifications. In the editor, keep only `docs/role-audit.md`, `docs/security.md` and `docs/design-decisions.md` open. | Nothing secret, personal or unrelated should end up in a submitted video. |

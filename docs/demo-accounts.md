# Demo accounts

Every account created by `npm run seed` (`server/src/seed/seed.js`, data from `server/src/seed/data.js`). The seed wipes the database first, so this list is complete after a fresh seed.

**Password for every account:** the value of `SEED_PASSWORD`. Locally that is `Password123!`: `server/.env` sets it, and `server/src/config/env.js` falls back to the same value when the variable is unset. A production seed should use a different password (see `docs/deployment.md`).

**Status:** the seed creates every account as `active`. No seeded account is `pending` or `suspended`.

## Admin

| Email | Name | Role | Status |
|---|---|---|---|
| `admin@mountainable.it` | Alessandro Bianchi | admin | active |

## Authority

| Email | Name | Role | Status |
|---|---|---|---|
| `authority@mountainable.it` | Regione Osservatorio | authority | active |

## Officers

An officer manages every village whose `municipalityId` matches their own.

| Email | Name | Role | Status | Municipality | Villages managed |
|---|---|---|---|---|---|
| `officer.aosta@mountainable.it` | Giulia Rossi | officer | active | Unione Comuni Valle d'Aosta | Chamois, Bard, Fontainemore |
| `officer.lucane@mountainable.it` | Marco Ferrari | officer | active | Unione Comuni Dolomiti Lucane | Castelmezzano, Pietrapertosa |
| `officer.gransasso@mountainable.it` | Chiara Esposito | officer | active | Comunità Montana Gran Sasso–Alto Sangro | Santo Stefano di Sessanio, Scanno, Barrea, Roccaraso |
| `officer.agordina@mountainable.it` | Luca Colombo | officer | active | Unione Montana Agordina e Giudicarie | Canale d'Agordo, Rango |
| `officer.valtournenche@mountainable.it` | Elena Bionaz | officer | active | Comune di Valtournenche | Valtournenche |
| `officer.torgnon@mountainable.it` | Davide Perrin | officer | active | Comune di Torgnon | Torgnon |
| `officer.antey@mountainable.it` | Sofia Maquignaz | officer | active | Comune di Antey-Saint-Andre | Antey-Saint-André |
| `officer.ayas@mountainable.it` | Matteo Favre | officer | active | Comune di Ayas | Champoluc |

Six municipalities have **no officer**: Unione Montana Valli Occitane (Ostana, Elva), Unione Montana Valli del Piemonte (Usseaux, Viganella), Comunità di Montagna della Carnia (Sauris), Comunità Montana di Valle Sabbia (Bagolino), Comprensorio Wipptal (Vipiteno), and Unione dei Comuni dell'Appennino (San Leo, Cerreto Alpi). Only the admin can edit their nine villages.

## Tourists

| Email | Name | Role | Status | Seeded activity |
|---|---|---|---|---|
| `sara@example.com` | Sara Greco | tourist | active | 4 visited villages, 3 favourites, reviews |
| `davide@example.com` | Davide Marchetti | tourist | active | 2 visited villages, 1 favourite, reviews |
| `elena@example.com` | Elena Ricci | tourist | active | reviews |
| `matteo@example.com` | Matteo Conti | tourist | active | reviews |
| `francesca@example.com` | Francesca Gallo | tourist | active | reviews |
| `andrea@example.com` | Andrea Fontana | tourist | active | reviews |
| `martina@example.com` | Martina Barbieri | tourist | active | reviews |

The seed creates 54 reviews and assigns them to random tourist and village pairs: 6 pending, 4 rejected, 44 approved. Which tourist gets how many reviews changes on every reseed, so check `/my` before recording if a specific tourist's review list matters.

## Not accounts: officer access requests

The seed also creates two `OfficerRequest` records with status `pending` for the admin queue: **Paolo Verdi** (`paolo.verdi@example.com`, Comune di Usseaux) and **Anna Neri** (`anna.neri@example.com`, Comune di Bagolino). These are applications, not user accounts, and you cannot log in with them.

## Coordination state by officer

This is what each officer's coordination inbox shows right after a seed. "Awaiting" means an open request routed to this municipality that it has not answered yet. It is the same count that `GET /api/coordination/inbox` returns as `awaitingResponse`.

| Officer | Capabilities declared | Outgoing (state) | Incoming awaiting a reply |
|---|---|---|---|
| torgnon | 4: group accommodation, equipment rental, meeting space, local produce | 3: shuttle (fulfilled), interpreter (expired), accessible transport (unmet) | **1**: Valtournenche, "Hall for a joint valley tourism meeting" |
| valtournenche | 5: mountain guide, shuttle, first aid, equipment rental, mountain rescue | 2: meeting space (**open, no replies yet**), group accommodation (fulfilled) | 0 (has already answered both open Ayas requests) |
| ayas | 5: mountain guide, cultural guide, group accommodation, artisan crafts, road clearing | 3: first aid (**open**, 1 partial), snowshoes (**open**, 1 offer + 1 partial), cultural guide (cancelled) | 0 |
| antey | 4: coach parking, EV charging, interpreter, accessible transport | 2: accessible transport (unmet), road clearing (fulfilled) | 0 |
| aosta | 3: shuttle, cultural guide, local produce | — | 0 (declined the closed Torgnon shuttle request) |
| gransasso | 2: mountain guide, equipment rental | — | 0 |
| agordina | 2: group accommodation, road clearing | — | 0 |
| lucane | none | — | 0 |

### Recommended for the demo

- **`officer.torgnon@mountainable.it`** is the only officer that meets all three criteria. It has declared capabilities. It has one incoming request waiting for a reply: the officer can answer Valtournenche's meeting-hall request live by offering the 90-seat sala polivalente. Its three outgoing requests cover the fulfilled, expired and unmet outcomes. Its two unmet accessible-transport requests are also the "persistent gap" the authority dashboard shows.
- **`officer.ayas@mountainable.it`** is the best account for the requester side. It has two open outgoing requests with offers and partial responses to compare, and it can close one as fulfilled on camera.
- A good sequence: log in as Torgnon and reply to the meeting-hall request. Then log in as Valtournenche and show the new response on its open request.

### Timing caveat

Open requests expire 30 days after creation, and the seed backdates them. The open requests are 5, 10 and 14 days old at seed time. That means **Ayas's first-aid request turns `expired` 16 days after seeding**, the snowshoe request after 20 days, and Valtournenche's meeting-hall request after 25 days. `sweepExpired()` changes their status the next time someone reads them. Reseed shortly before you record.

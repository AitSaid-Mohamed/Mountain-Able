/**
 * Warm the route-planner caches for the demo.
 *
 * The routing, elevation, geocoding and Overpass caches live in the running
 * server's process memory, so this script drives them **over HTTP against the
 * live server** (not by importing the services, which would warm a different
 * process). After it runs, the demo journeys are served from cache and never
 * wait on Nominatim/OSRM/Open-Meteo/Overpass — which matters because Overpass
 * is intermittent on an unfamiliar network.
 *
 * It warms the full journey as the presenter will perform it — geocode the
 * start town, plan the route, fetch the corridor — because warming only the
 * last two steps would still leave the *first* click of the demo waiting on a
 * live Nominatim call.
 *
 * Cache keys round coordinates to 4 decimals (~11 m, see services/cache.js),
 * so the start point must match almost exactly for the warmed route to be
 * used. Rather than trust the hard-coded coordinates below to agree with what
 * Nominatim returns, the script adopts the geocoder's own first result as the
 * start point and prints it — those printed coordinates are what the demo will
 * actually produce.
 *
 * Usage:  npm run warm-cache            (server must already be running)
 *         API_URL=http://host/api npm run warm-cache
 *
 * Exits non-zero if any journey fails to verify, so a failed warm-up is
 * noticed now rather than on stage. The journeys warmed, and the exact place
 * strings to type, are documented in docs/demo-script.md.
 */
const API = process.env.API_URL ?? 'http://localhost:5000/api';

// Representative journeys between seeded villages, chosen for the demo:
// real start towns, scenic/steep mountain routes, and generally good OSM
// coverage. `query` is typed into the planner's start field and `start` is the
// fallback used only if geocoding fails; `dest` is a seeded village slug.
const JOURNEYS = [
  { label: 'Aosta → Chamois (car-free village, Aosta Valley)', query: 'Aosta', start: { lat: 45.7372, lng: 7.3206 }, dest: 'chamois' },
  { label: 'Sulmona → Scanno (heart-shaped lake, Abruzzo)', query: 'Sulmona', start: { lat: 42.0503, lng: 13.9296 }, dest: 'scanno' },
  { label: 'Castelmezzano → Pietrapertosa (Lucanian Dolomites)', query: 'Castelmezzano', start: { lat: 40.5286, lng: 16.045 }, dest: 'pietrapertosa' },
  { label: 'Brescia → Bagolino (Valle Sabbia, Lombardy)', query: 'Brescia', start: { lat: 45.5416, lng: 10.2118 }, dest: 'bagolino' },
];
const PROFILE = 'driving-car';

/**
 * A response this slow cannot have come from cache: every provider call is a
 * round trip to the public internet (and a route also fans out to batched
 * elevation lookups), so a hit is single- or low-double-digit milliseconds
 * plus a small indexed Mongo query, while a miss is a second or more.
 */
const CACHE_CEILING_MS = 400;

async function getJson(url, opts) {
  const started = Date.now();
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, json, ms: Date.now() - started };
}

function simplify(geometry, max = 60) {
  const step = Math.max(1, Math.floor(geometry.length / max));
  return geometry.filter((_, i) => i % step === 0).map((c) => `${c[0]},${c[1]}`).join(';');
}

/** Bail out loudly on 429 — otherwise a throttled run looks like a cache miss. */
function rateLimited(...responses) {
  return responses.some((r) => r?.status === 429);
}

const round4 = (n) => Math.round(n * 1e4) / 1e4;

async function warm() {
  console.log(`🔥 Warming route caches via ${API}\n`);

  // Resolve destination slugs → ids from the public map feed.
  const { status, json } = await getJson(`${API}/villages/map`);
  if (status !== 200 || !json?.data) {
    console.error('❌ Could not reach the API. Is the server running? (npm run dev)');
    process.exit(1);
  }
  const bySlug = new Map(json.data.map((v) => [v.slug, v]));

  // ── Pass 1: warm ────────────────────────────────────────────────────────
  const warmed = [];
  for (const j of JOURNEYS) {
    const village = bySlug.get(j.dest);
    if (!village) {
      console.log(`⚠️  ${j.label}: destination "${j.dest}" not found (reseed?) — skipped`);
      continue;
    }
    try {
      // Geocode first, and adopt the result the presenter will click.
      const geo = await getJson(`${API}/routes/geocode?q=${encodeURIComponent(j.query)}`);
      if (rateLimited(geo)) {
        console.error('❌ Rate limited by /api/routes (429). Wait 15 minutes and rerun.');
        process.exit(1);
      }
      const hit = geo.json?.data?.[0];
      const start = hit ? { lat: hit.lat, lng: hit.lng } : j.start;
      if (hit) {
        console.log(`📍 "${j.query}" → ${round4(hit.lat)}, ${round4(hit.lng)}`);
        console.log(`     first result: ${hit.label}`);
      } else {
        console.log(`⚠️  "${j.query}" did not geocode — falling back to hard-coded ${j.start.lat}, ${j.start.lng}`);
        console.log('     the demo will NOT hit this cache entry if the presenter types the place name.');
      }

      const planBody = JSON.stringify({ start, villageId: village._id, profile: PROFILE });
      const plan = await getJson(`${API}/routes/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: planBody,
      });
      if (rateLimited(plan)) {
        console.error('❌ Rate limited by /api/routes (429). Wait 15 minutes and rerun.');
        process.exit(1);
      }
      if (plan.status !== 200 || !plan.json?.data?.route) {
        console.log(`⚠️  ${j.label}: route unavailable (${plan.json?.data?.routeError ?? plan.status})`);
        continue;
      }
      const route = plan.json.data.route;
      const km = (route.distance / 1000).toFixed(1);
      const elev = route.elevation ? `↑${route.elevation.ascent}m` : 'no elevation';

      const corridorUrl = `${API}/routes/corridor?geometry=${encodeURIComponent(simplify(route.geometry))}`;
      const corridor = await getJson(corridorUrl);
      const pois = corridor.json?.data?.unavailable
        ? 'POIs: Overpass unavailable (cached empty)'
        : `POIs: ${corridor.json?.data?.pois?.length ?? 0}`;

      console.log(`✅ ${j.label}\n     ${km} km · ${elev} · ${pois}\n`);
      warmed.push({
        journey: j,
        start,
        geocoded: Boolean(hit),
        // The elevation profile is a highlight of the demo, and Open-Meteo is
        // as intermittent as Overpass — a route can warm successfully with no
        // profile attached, which is only obvious once it's on screen.
        elevation: Boolean(route.elevation),
        planBody,
        corridorUrl,
        cold: { geocode: geo.ms, plan: plan.ms, corridor: corridor.ms },
      });
    } catch (err) {
      console.log(`⚠️  ${j.label}: ${err.message}\n`);
    }
  }

  if (!warmed.length) {
    console.error('❌ Nothing was warmed. Is the database seeded? (npm run seed)');
    process.exit(1);
  }

  // ── Pass 2: verify ──────────────────────────────────────────────────────
  // Re-issue each demo request and confirm it now comes back at cache speed.
  // There is no cache-status field in the API to assert on, so this is a
  // timing argument: the gap between a hit and a provider round trip is one to
  // two orders of magnitude, not a marginal difference, and both numbers are
  // printed so the judgement is visible rather than hidden behind a boolean.
  console.log('🔍 Verifying every demo request is now served from cache\n');

  let passed = 0;
  for (const w of warmed) {
    const geo = await getJson(`${API}/routes/geocode?q=${encodeURIComponent(w.journey.query)}`);
    const plan = await getJson(`${API}/routes/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: w.planBody,
    });
    const corridor = await getJson(w.corridorUrl);

    if (rateLimited(geo, plan, corridor)) {
      console.error('❌ Rate limited by /api/routes (429) during verification. Wait 15 minutes and rerun.');
      process.exit(1);
    }

    const checks = [
      { name: 'geocode', ms: geo.ms, cold: w.cold.geocode, ok: geo.status === 200 && geo.ms <= CACHE_CEILING_MS },
      { name: 'plan', ms: plan.ms, cold: w.cold.plan, ok: plan.status === 200 && Boolean(plan.json?.data?.route) && plan.ms <= CACHE_CEILING_MS },
      { name: 'corridor', ms: corridor.ms, cold: w.cold.corridor, ok: corridor.status === 200 && corridor.ms <= CACHE_CEILING_MS },
    ];
    const failed = checks.filter((c) => !c.ok);
    const detail = checks.map((c) => `${c.name} ${c.ms}ms (cold ${c.cold}ms)`).join(' · ');

    if (failed.length) {
      console.log(`❌ FAIL  ${w.journey.label}\n     ${detail}`);
      console.log(`     not cache-served: ${failed.map((c) => c.name).join(', ')}`);
    } else {
      console.log(`✅ PASS  ${w.journey.label}\n     ${detail}`);
      passed += 1;
    }
  }

  const ungeocoded = warmed.filter((w) => !w.geocoded);
  const flat = warmed.filter((w) => !w.elevation);
  console.log(`\n🔥 Warmed ${warmed.length}/${JOURNEYS.length} journeys · verified ${passed}/${warmed.length} cache-served.`);
  if (ungeocoded.length) {
    console.log(`⚠️  ${ungeocoded.length} journey(s) fell back to hard-coded coordinates — re-run before relying on them.`);
  }
  if (flat.length) {
    console.log(`⚠️  No elevation profile cached for: ${flat.map((w) => w.journey.query).join(', ')}.`);
    console.log('   Open-Meteo did not answer. The route is now cached *without* a profile for');
    console.log('   7 days, and re-running alone will just return that cached route — restart');
    console.log('   the server to clear the in-process cache, then warm again.');
  }
  if (passed < warmed.length || warmed.length < JOURNEYS.length) {
    console.log('   Re-run before presenting; see docs/demo-script.md.');
    process.exit(1);
  }
  process.exit(0);
}

warm();

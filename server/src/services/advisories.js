/**
 * Derive road/terrain advisories from real data only. Each advisory is a
 * structured descriptor (type + computed params + severity + provenance); the
 * human-readable, translated text is composed on the client via t(), so a
 * warning is never hard-coded in one language. Every advisory declares its
 * provenance and, implicitly, its uncertainty — nothing here asserts a live
 * road condition the system cannot actually know.
 */
const SEVERITY_RANK = { high: 3, medium: 2, low: 1, info: 0 };

/** Advisories derivable from the computed route (elevation + duration). */
export function buildTerrainAdvisories(elevation, durationSec) {
  const out = [];

  if (elevation) {
    const { steepest, maxAltitude } = elevation;
    if (steepest && steepest.gradientPct >= 6 && steepest.lengthKm >= 1.5) {
      out.push({
        type: 'steepGradient',
        severity: steepest.gradientPct >= 10 ? 'high' : 'medium',
        params: { lengthKm: steepest.lengthKm, gradientPct: steepest.gradientPct },
        provenance: 'computed',
      });
    }
    if (maxAltitude >= 1500) {
      out.push({
        type: 'highAltitude',
        severity: maxAltitude >= 2000 ? 'high' : 'medium',
        params: { maxAltitude },
        provenance: 'computed',
      });
    }
  }

  const hours = durationSec / 3600;
  if (hours >= 2) {
    out.push({ type: 'longJourney', severity: 'low', params: { hours: Math.round(hours * 10) / 10 }, provenance: 'computed' });
  }

  return sortAdvisories(out);
}

/** Advisories derivable from OSM surface/width tags (may be unavailable). */
export function buildSurfaceAdvisories(surface) {
  const out = [];
  if (!surface || !surface.available) {
    // Honest gap: state the surface is not recorded rather than assume paved.
    out.push({ type: 'surfaceUnknown', severity: 'info', params: {}, provenance: 'osm-missing' });
    return out;
  }
  if (surface.unpaved) {
    out.push({ type: 'unpaved', severity: 'medium', params: { surfaces: surface.surfaces ?? [] }, provenance: 'osm' });
  }
  if (surface.narrow) {
    out.push({ type: 'narrow', severity: 'medium', params: {}, provenance: 'osm' });
  }
  if (!surface.unpaved && !surface.narrow) {
    out.push({ type: 'surfacePaved', severity: 'info', params: {}, provenance: 'osm' });
  }
  return sortAdvisories(out);
}

function sortAdvisories(list) {
  return list.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

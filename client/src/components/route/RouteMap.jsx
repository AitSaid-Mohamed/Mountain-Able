import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GROUP_COLOR } from '../../lib/poi.js';

const pin = (color, scale = 1) =>
  L.divIcon({
    className: 'route-pin',
    html: `<div style="transform:scale(${scale});transform-origin:bottom center"><svg width="24" height="32" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 13 21 13 21s13-11.8 13-21C26 5.8 20.2 0 13 0z" fill="${color}"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg></div>`,
    iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -28],
  });

const DEST_ICON = pin('#178a53', 1.35);
const VILLAGE_ICON = pin('#21bf73', 1.05);
const START_ICON = L.divIcon({
  className: 'route-pin',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3)"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick?.(e.latlng) });
  return null;
}

/** Fit the map to the route (or destination) whenever they change. */
function Fit({ line, destination, start }) {
  const map = useMap();
  const key = `${line.length}:${destination?.lat},${destination?.lng}:${start?.lat},${start?.lng}`;
  useEffect(() => {
    const pts = line.length ? line : [];
    if (start) pts.push([start.lat, start.lng]);
    if (destination) pts.push([destination.lat, destination.lng]);
    if (pts.length === 0) return;
    if (pts.length === 1) { map.setView(pts[0], 12); return; }
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/**
 * The route map: brand-green polyline, a distinct destination marker, platform
 * villages along the corridor (green pins), OSM POIs (coloured by category,
 * toggleable), and a highlight synced from the elevation chart. Clicking the
 * map sets the start point. Platform data and OSM data are visually distinct.
 */
export default function RouteMap({
  geometry = [], destination, start, pois = [], villagesAlong = [],
  visibleGroups, hoveredPoint, onMapClick, className,
}) {
  const { t } = useTranslation();
  const line = geometry.map((c) => [c[1], c[0]]); // [lng,lat] → [lat,lng]
  const center = destination ? [destination.lat, destination.lng] : [43.5, 12.5];

  return (
    <MapContainer center={center} zoom={9} scrollWheelZoom className={className} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <Fit line={line} destination={destination} start={start} />

      {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#21bf73', weight: 5, opacity: 0.9 }} />}

      {start && <Marker position={[start.lat, start.lng]} icon={START_ICON} />}

      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={DEST_ICON}>
          <Popup>
            <strong>{destination.name}</strong>
            <br />{destination.region}
          </Popup>
        </Marker>
      )}

      {/* Platform villages — visually distinct from OSM POIs */}
      {villagesAlong.map((v) => (
        <Marker key={v._id} position={[v.location.lat, v.location.lng]} icon={VILLAGE_ICON}>
          <Popup>
            <strong>{v.name}</strong>
            <br />{v.region} · {t('route.along.fromRoute', { km: v.distanceKm })}
            <br /><Link to={`/villages/${v.slug}`} className="text-primary">{t('common.seeDetails')}</Link>
          </Popup>
        </Marker>
      ))}

      {/* OSM POIs — small coloured dots by category group */}
      {pois.filter((p) => !visibleGroups || visibleGroups.has(p.group)).map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={6}
          pathOptions={{ color: '#fff', weight: 1.5, fillColor: GROUP_COLOR[p.group], fillOpacity: 0.95 }}
        >
          <Popup>
            <strong>{p.name || t('route.poi.unnamed', { type: t(`route.poi.${p.sub}`) })}</strong>
            <br />{t(`route.poi.${p.sub}`)} · {t('route.along.fromRoute', { km: p.distanceKm })}
          </Popup>
        </CircleMarker>
      ))}

      {/* Elevation-chart hover highlight */}
      {hoveredPoint && (
        <CircleMarker center={[hoveredPoint.lat, hoveredPoint.lng]} radius={8}
          pathOptions={{ color: '#178a53', weight: 3, fillColor: '#fff', fillOpacity: 1 }} />
      )}
    </MapContainer>
  );
}

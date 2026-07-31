import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onImageError, FALLBACK_IMAGE, mediaUrl } from '../../lib/utils.js';

/** A teardrop divIcon coloured by state (normal / highlighted). */
function pinIcon(highlight) {
  const color = highlight ? '#178a53' : '#21bf73';
  const scale = highlight ? 1.25 : 1;
  return L.divIcon({
    className: 'village-pin',
    html: `<div style="transform:scale(${scale});transform-origin:bottom center">
      <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 13 21 13 21s13-11.8 13-21C26 5.8 20.2 0 13 0z" fill="${color}"/>
        <circle cx="13" cy="13" r="5" fill="#fff"/>
      </svg></div>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

/** Fit the map to the markers whenever the set of villages changes. */
function FitBounds({ villages }) {
  const map = useMap();
  const key = villages.map((v) => v._id).join(',');
  useEffect(() => {
    if (villages.length === 0) return;
    const bounds = L.latLngBounds(villages.map((v) => [v.location.lat, v.location.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/**
 * Leaflet map of villages. Each marker shows a popup with thumbnail, name,
 * rating and a details link. `highlightId` (hovered card) enlarges its marker.
 */
export default function VillagesMap({ villages = [], highlightId, className }) {
  const { t } = useTranslation();
  const center = villages[0]
    ? [villages[0].location.lat, villages[0].location.lng]
    : [43.5, 12.5]; // central Italy fallback

  return (
    <MapContainer
      center={center}
      zoom={6}
      scrollWheelZoom={false}
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds villages={villages} />
      {villages.map((v) => (
        <Marker
          key={v._id}
          position={[v.location.lat, v.location.lng]}
          icon={pinIcon(v._id === highlightId)}
          zIndexOffset={v._id === highlightId ? 1000 : 0}
        >
          <Popup>
            <div className="w-44">
              <img
                src={mediaUrl(v.coverImage) || FALLBACK_IMAGE}
                alt={v.name}
                onError={onImageError}
                className="mb-2 h-24 w-full rounded object-cover"
              />
              <p className="font-semibold text-ink">{v.name}</p>
              <p className="text-small text-ink/60">
                ★ {v.ratingAverage ? v.ratingAverage.toFixed(1) : '—'}
              </p>
              <Link
                to={`/villages/${v.slug}`}
                className="mt-1 inline-block text-small font-semibold text-primary hover:underline"
              >
                {t('villages.seeOnMap')}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

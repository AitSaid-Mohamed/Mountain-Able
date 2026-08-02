import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const icon = L.divIcon({
  className: 'village-pin',
  html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 13 21 13 21s13-11.8 13-21C26 5.8 20.2 0 13 0z" fill="#21bf73"/>
      <circle cx="13" cy="13" r="5" fill="#fff"/></svg>`,
  iconSize: [26, 34],
  iconAnchor: [13, 34],
});

function ClickHandler({ onChange }) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) });
  return null;
}

/**
 * Interactive location picker: a draggable marker plus click-to-place, writing
 * the chosen coordinates back through `onChange(lat, lng)`.
 */
export default function MarkerPicker({ lat, lng, onChange, className }) {
  const hasPos = Number.isFinite(lat) && Number.isFinite(lng);
  const center = hasPos ? [lat, lng] : [43.5, 12.5];

  return (
    <MapContainer center={center} zoom={hasPos ? 11 : 6} className={className} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      <ClickHandler onChange={onChange} />
      {hasPos && (
        <Marker
          position={[lat, lng]}
          icon={icon}
          draggable
          eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); onChange(p.lat, p.lng); } }}
        />
      )}
    </MapContainer>
  );
}

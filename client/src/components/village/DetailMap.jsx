import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

const icon = L.divIcon({
  className: 'village-pin',
  html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 13 21 13 21s13-11.8 13-21C26 5.8 20.2 0 13 0z" fill="#21bf73"/>
      <circle cx="13" cy="13" r="5" fill="#fff"/></svg>`,
  iconSize: [26, 34],
  iconAnchor: [13, 34],
});

/** Small non-interactive map centred on a single village. */
export default function DetailMap({ location, name, className }) {
  if (!location) return null;
  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={11}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      className={className}
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[location.lat, location.lng]} icon={icon} title={name} />
    </MapContainer>
  );
}

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapView({ facilities = [], userLocation, center, zoom = 12 }) {
  const mapCenter = center || userLocation || [20.5937, 78.9629]; // India center fallback

  return (
    <MapContainer center={mapCenter} zoom={zoom} style={{ height: '400px', width: '100%' }} className="rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
      {facilities.map((f) => {
        const [lng, lat] = f.location?.coordinates || [];
        if (!lat || !lng) return null;
        return (
          <Marker key={f._id} position={[lat, lng]}>
            <Popup>
              <strong>{f.name}</strong><br />
              {f.address?.city}, {f.address?.state}<br />
              Rating: {f.rating?.toFixed(1)} ⭐
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

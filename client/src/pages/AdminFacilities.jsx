import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import AdminSidebar from '../components/admin/AdminSidebar';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons (broken in Vite/webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const WASTE_TYPES = ['mobile', 'laptop', 'battery', 'television', 'refrigerator', 'printer', 'other'];

const emptyForm = {
  name: '', description: '',
  address: { street: '', city: '', state: '', pincode: '' },
  location: { coordinates: ['', ''] },
  contact: { phone: '', email: '', website: '' },
  wasteTypes: [],
  isCertified: false,
  acceptsPickup: false,
  acceptsDropoff: true,
  operatingHours: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' },
};

// Component that listens for map clicks and updates marker position
function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Derived marker position from form coords
  const markerLat = parseFloat(form.location.coordinates[1]);
  const markerLng = parseFloat(form.location.coordinates[0]);
  const hasMarker = !isNaN(markerLat) && !isNaN(markerLng);

  const fetchFacilities = () => {
    setLoading(true);
    api.get('/facilities?limit=100')
      .then(({ data }) => setFacilities(data.facilities))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFacilities(); }, []);

  const openEdit = (f) => {
    setEditId(f._id);
    setForm({
      ...f,
      location: { coordinates: [f.location?.coordinates?.[0] || '', f.location?.coordinates?.[1] || ''] },
    });
    setShowForm(true);
    setShowMap(false);
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setShowForm(true); setShowMap(false); };

  const toggleWasteType = (t) => setForm(p => ({
    ...p, wasteTypes: p.wasteTypes.includes(t) ? p.wasteTypes.filter(x => x !== t) : [...p.wasteTypes, t],
  }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      location: { type: 'Point', coordinates: [parseFloat(form.location.coordinates[0]), parseFloat(form.location.coordinates[1])] },
    };
    try {
      if (editId) await api.put(`/facilities/${editId}`, payload);
      else await api.post('/facilities', payload);
      toast.success(editId ? 'Facility updated' : 'Facility created');
      setShowForm(false);
      fetchFacilities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const deleteFacility = async (id) => {
    if (!confirm('Deactivate this facility?')) return;
    try {
      await api.delete(`/facilities/${id}`);
      toast.success('Facility deactivated');
      fetchFacilities();
    } catch { toast.error('Delete failed'); }
  };

  const set = (path, val) => setForm(p => {
    const parts = path.split('.');
    const updated = { ...p };
    let cur = updated;
    for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = { ...cur[parts[i]] }; cur = cur[parts[i]]; }
    cur[parts[parts.length - 1]] = val;
    return updated;
  });

  // Called when user clicks on the map
  const handleMapPick = (lat, lng) => {
    set('location.coordinates', [lng.toFixed(6), lat.toFixed(6)]);
    // Optionally close the map panel after picking
    // setShowMap(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      <AdminSidebar />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Facilities</h1>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2">
            <FiPlus size={15} /> Add Facility
          </button>
        </div>

        {loading ? <Loader /> : (
          <div className="space-y-3">
            {facilities.map(f => (
              <div key={f._id} className="card flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{f.name}</span>
                    {f.isCertified && <FiCheckCircle size={14} className="text-green-500" />}
                    {!f.isActive && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <p className="text-sm text-gray-500">{f.address?.city}, {f.address?.state}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {f.wasteTypes?.map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(f)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <FiEdit2 size={12} /> Edit
                  </button>
                  <button onClick={() => deleteFacility(f._id)} className="text-red-400 hover:text-red-600 p-2">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl my-4">
            <h3 className="font-semibold text-gray-800 mb-4">{editId ? 'Edit' : 'Add'} Facility</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input required value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Facility name" />
              <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input-field resize-none" rows={2} placeholder="Description" />

              {/* Address fields */}
              <div className="grid grid-cols-2 gap-3">
                <input required value={form.address.street} onChange={e => set('address.street', e.target.value)} className="input-field" placeholder="Street" />
                <input required value={form.address.city} onChange={e => set('address.city', e.target.value)} className="input-field" placeholder="City" />
                <input required value={form.address.state} onChange={e => set('address.state', e.target.value)} className="input-field" placeholder="State" />
                <input required value={form.address.pincode} onChange={e => set('address.pincode', e.target.value)} className="input-field" placeholder="Pincode" />
              </div>

              {/* Location / Coordinates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Location Coordinates</p>
                  <button
                    type="button"
                    onClick={() => setShowMap(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FiMapPin size={12} />
                    {showMap ? 'Hide Map' : 'Pick on Map'}
                  </button>
                </div>

                {/* Manual coordinate inputs */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.location.coordinates[0]}
                    onChange={e => set('location.coordinates', [e.target.value, form.location.coordinates[1]])}
                    className="input-field"
                    placeholder="Longitude"
                  />
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.location.coordinates[1]}
                    onChange={e => set('location.coordinates', [form.location.coordinates[0], e.target.value])}
                    className="input-field"
                    placeholder="Latitude"
                  />
                </div>

                {/* Interactive map picker */}
                {showMap && (
                  <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '300px' }}>
                    <MapContainer
                      center={hasMarker ? [markerLat, markerLng] : [20.5937, 78.9629]}
                      zoom={hasMarker ? 15 : 5}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <LocationPicker onPick={handleMapPick} />
                      {hasMarker && <Marker position={[markerLat, markerLng]} />}
                    </MapContainer>
                  </div>
                )}

                {showMap && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <FiMapPin size={11} />
                    Click anywhere on the map to set the facility location
                  </p>
                )}
              </div>

              {/* Contact */}
              <div className="grid grid-cols-3 gap-3">
                <input value={form.contact.phone} onChange={e => set('contact.phone', e.target.value)} className="input-field" placeholder="Phone" />
                <input value={form.contact.email} onChange={e => set('contact.email', e.target.value)} className="input-field" placeholder="Email" />
                <input value={form.contact.website} onChange={e => set('contact.website', e.target.value)} className="input-field" placeholder="Website" />
              </div>

              {/* Waste Types */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Waste Types</p>
                <div className="flex flex-wrap gap-2">
                  {WASTE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => toggleWasteType(t)}
                      className={`px-3 py-1 rounded-full text-xs capitalize border transition-colors
                        ${form.wasteTypes.includes(t) ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-4 text-sm">
                {[['isCertified', 'Certified'], ['acceptsPickup', 'Accepts Pickup'], ['acceptsDropoff', 'Accepts Dropoff']].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="accent-primary" />
                    {l}
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
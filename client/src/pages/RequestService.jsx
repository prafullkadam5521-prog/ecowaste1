import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const WASTE_TYPES = ['mobile', 'laptop', 'battery', 'television', 'refrigerator', 'printer', 'other'];

const emptyItem = () => ({ type: 'mobile', quantity: 1, description: '' });

export default function RequestService() {
  const { facilityId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    serviceType: 'dropoff',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    pickupAddress: { street: '', city: '', state: '', pincode: '' },
  });
  const [wasteItems, setWasteItems] = useState([emptyItem()]);

  useEffect(() => {
    api.get(`/facilities/${facilityId}`)
      .then(({ data }) => setFacility(data.facility))
      .catch(() => toast.error('Facility not found'))
      .finally(() => setLoading(false));
  }, [facilityId]);

  const addItem = () => setWasteItems(p => [...p, emptyItem()]);
  const removeItem = (i) => setWasteItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => setWasteItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        facilityId,
        wasteItems,
        serviceType: form.serviceType,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        notes: form.notes,
      };
      if (form.serviceType === 'pickup') payload.pickupAddress = form.pickupAddress;

      const { data } = await api.post('/requests', payload);
      toast.success('Request submitted successfully!');
      navigate(`/track/${data.request._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Loader />;
  if (!facility) return <div className="text-center py-20 text-gray-400">Facility not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Request Service</h1>
      <p className="text-gray-500 text-sm mb-6">at <span className="font-medium text-gray-700">{facility.name}</span></p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service type */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Service Type</h2>
          <div className="flex gap-3">
            {['dropoff', 'pickup'].map(t => (
              <button key={t} type="button"
                disabled={t === 'pickup' && !facility.acceptsPickup}
                onClick={() => setForm(p => ({ ...p, serviceType: t }))}
                className={`flex-1 py-3 rounded-lg border-2 capitalize font-medium transition-colors text-sm
                  ${form.serviceType === t ? 'border-primary bg-green-50 text-primary' : 'border-gray-200 text-gray-600'}
                  ${t === 'pickup' && !facility.acceptsPickup ? 'opacity-40 cursor-not-allowed' : ''}`}>
                {t === 'dropoff' ? '📦 Drop Off' : '🚗 Pickup'}
                {t === 'pickup' && !facility.acceptsPickup && <span className="block text-xs font-normal">Not available</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Waste items */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Waste Items</h2>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
              <FiPlus size={14} /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {wasteItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select value={item.type} onChange={e => updateItem(i, 'type', e.target.value)} className="input-field flex-1 capitalize">
                  {WASTE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
                <input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                  className="input-field w-20" placeholder="Qty" />
                <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                  className="input-field flex-1" placeholder="Brief description (optional)" />
                {wasteItems.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 mt-2">
                    <FiTrash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Schedule</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input type="date" required value={form.scheduledDate} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Time</label>
              <input type="time" required value={form.scheduledTime}
                onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))} className="input-field" />
            </div>
          </div>
        </div>

        {/* Pickup address */}
        {form.serviceType === 'pickup' && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">Pickup Address</h2>
            <div className="space-y-3">
              <input required placeholder="Street address" value={form.pickupAddress.street}
                onChange={e => setForm(p => ({ ...p, pickupAddress: { ...p.pickupAddress, street: e.target.value } }))} className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="City" value={form.pickupAddress.city}
                  onChange={e => setForm(p => ({ ...p, pickupAddress: { ...p.pickupAddress, city: e.target.value } }))} className="input-field" />
                <input required placeholder="State" value={form.pickupAddress.state}
                  onChange={e => setForm(p => ({ ...p, pickupAddress: { ...p.pickupAddress, state: e.target.value } }))} className="input-field" />
              </div>
              <input required placeholder="Pincode" value={form.pickupAddress.pincode}
                onChange={e => setForm(p => ({ ...p, pickupAddress: { ...p.pickupAddress, pincode: e.target.value } }))} className="input-field" />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className="input-field resize-none" rows={3} placeholder="Any special instructions..." />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

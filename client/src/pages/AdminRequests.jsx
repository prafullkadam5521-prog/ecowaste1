import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/admin/AdminSidebar';
import StatusBadge from '../components/request/StatusBadge';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const STATUSES = ['pending', 'approved', 'rejected', 'collected', 'recycled', 'completed'];

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [modal, setModal] = useState(null); // { requestId, currentStatus }
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });

  const fetch = () => {
    setLoading(true);
    const q = filter ? `?status=${filter}` : '';
    api.get(`/admin/requests${q}`)
      .then(({ data }) => setRequests(data.requests))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [filter]);

  const openModal = (r) => {
    setModal(r);
    setStatusForm({ status: r.status, note: '' });
  };

  const updateStatus = async () => {
    if (!statusForm.status) return;
    setUpdating(modal._id);
    try {
      await api.put(`/requests/${modal._id}/status`, statusForm);
      toast.success('Status updated');
      setModal(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(null); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      <AdminSidebar />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">All Requests</h1>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field w-44">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>

        {loading ? <Loader /> : (
          <div className="space-y-3">
            {requests.length === 0 && <p className="text-gray-400 text-center py-12">No requests found.</p>}
            {requests.map(r => (
              <div key={r._id} className="card hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">{r.user?.name}</span>
                      <span className="text-gray-400 text-sm">→</span>
                      <span className="font-medium text-gray-700">{r.facility?.name}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm text-gray-500">{r.user?.email} · {r.user?.phone}</p>
                    <div className="flex gap-2 mt-1 text-xs text-gray-500">
                      <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">{r.serviceType}</span>
                      <span>{r.wasteItems?.map(i => i.type).join(', ')}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/track/${r._id}`} target="_blank" className="btn-secondary text-xs py-1.5 px-3">View</Link>
                    <button onClick={() => openModal(r)} className="btn-primary text-xs py-1.5 px-3">Update Status</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Update Request Status</h3>
            <select value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}
              className="input-field mb-3 capitalize">
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <textarea value={statusForm.note} onChange={e => setStatusForm(p => ({ ...p, note: e.target.value }))}
              className="input-field mb-4 resize-none" rows={3} placeholder="Add a note (optional)" />
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={updateStatus} disabled={!!updating} className="btn-primary flex-1">
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

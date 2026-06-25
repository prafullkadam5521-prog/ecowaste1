import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/common/Loader';
import StatusBadge from '../components/request/StatusBadge';
import toast from 'react-hot-toast';
import { FiPackage, FiCalendar, FiEye } from 'react-icons/fi';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'collected', 'recycled', 'completed', 'rejected'];

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/requests/my')
      .then(({ data }) => setRequests(data.requests))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const cancelRequest = async (id) => {
    if (!confirm('Cancel this request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      setRequests(p => p.filter(r => r._id !== id));
      toast.success('Request cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Requests</h1>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm capitalize border transition-colors
              ${filter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 text-gray-600 hover:border-primary'}`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No requests found.</p>
          <Link to="/facilities" className="btn-primary mt-4 inline-block py-2 px-6">Find a Facility</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{r.facility?.name}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-gray-500">{r.facility?.address?.city}, {r.facility?.address?.state}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiPackage size={11} />
                      {r.wasteItems?.map(i => i.type).join(', ')}
                    </span>
                    <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">{r.serviceType}</span>
                    {r.scheduledDate && (
                      <span className="flex items-center gap-1">
                        <FiCalendar size={11} />
                        {new Date(r.scheduledDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Link to={`/track/${r._id}`} className="flex items-center gap-1 text-primary text-sm font-medium hover:underline">
                    <FiEye size={13} /> Track
                  </Link>
                  {['pending', 'approved'].includes(r.status) && (
                    <button onClick={() => cancelRequest(r._id)} className="text-red-400 text-xs hover:text-red-600">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

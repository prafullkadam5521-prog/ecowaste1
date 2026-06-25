import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/common/Loader';
import StatusTracker from '../components/request/StatusTracker';
import StatusBadge from '../components/request/StatusBadge';
import toast from 'react-hot-toast';
import { FiMapPin, FiPackage, FiAward } from 'react-icons/fi';
import { MdRecycling } from 'react-icons/md';

export default function TrackRequest() {
  const { requestId } = useParams();
  const [request,     setRequest]     = useState(null);
  const [rewardEarned, setRewardEarned] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    api.get(`/requests/${requestId}`)
      .then(({ data }) => {
        setRequest(data.request);
        setRewardEarned(data.rewardEarned || null);
      })
      .catch(() => toast.error('Request not found'))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return <Loader />;
  if (!request) return <div className="text-center py-20 text-gray-400">Request not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Track Request</h1>
          <p className="text-xs text-gray-400 mt-0.5">ID: {request._id}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* ── Points earned banner (only on completed) ── */}
      {rewardEarned && (
        <div className="mb-5 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-primary/30 rounded-2xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FiAward size={28} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-base">🎉 Reward Points Earned!</p>
            <p className="text-sm text-gray-600">{rewardEarned.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {rewardEarned.breakdown?.map((b, i) => (
                <span key={i} className="text-xs bg-white border border-green-200 text-green-700 px-2 py-0.5 rounded-full capitalize">
                  {b.quantity}× {b.wasteType} = +{b.points}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-extrabold text-primary">+{rewardEarned.points}</p>
            <p className="text-xs text-gray-500">points</p>
          </div>
        </div>
      )}

      {/* Status tracker */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-6">Disposal Status</h2>
        <StatusTracker status={request.status} statusHistory={request.statusHistory} />
      </div>

      {/* Facility info */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Facility</h2>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-primary flex-shrink-0">
            <FiMapPin size={18} />
          </div>
          <div>
            <p className="font-medium text-gray-800">{request.facility?.name}</p>
            <p className="text-sm text-gray-500">{request.facility?.address?.city}, {request.facility?.address?.state}</p>
            {request.facility?.contact?.phone && (
              <a href={`tel:${request.facility.contact.phone}`} className="text-sm text-primary hover:underline mt-0.5 block">
                {request.facility.contact.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Request details */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Request Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Service Type</span>
            <span className="capitalize font-medium">{request.serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Scheduled Date</span>
            <span className="font-medium">
              {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Scheduled Time</span>
            <span className="font-medium">{request.scheduledTime || '—'}</span>
          </div>
          {request.assignedAgent && (
            <div className="flex justify-between">
              <span className="text-gray-500">Assigned Agent</span>
              <span className="font-medium">{request.assignedAgent.name}</span>
            </div>
          )}
        </div>

        {/* Waste items with points preview */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <FiPackage size={14} /> Waste Items
          </h3>
          <div className="space-y-1.5">
            {request.wasteItems?.map((item, i) => {
              const POINTS_MAP = { mobile:50, laptop:80, battery:30, television:70, refrigerator:100, printer:60, other:20 };
              const pts = (POINTS_MAP[item.type] || 20) * (item.quantity || 1);
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded capitalize">{item.type}</span>
                    <span className="text-gray-500">× {item.quantity}</span>
                    {item.description && <span className="text-gray-400 text-xs">— {item.description}</span>}
                  </div>
                  {request.status !== 'completed' && (
                    <span className="text-xs text-primary font-medium">+{pts} pts on complete</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {request.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Notes: </span>
            <span className="text-sm text-gray-700">{request.notes}</span>
          </div>
        )}
      </div>

      {/* Pickup address */}
      {request.serviceType === 'pickup' && request.pickupAddress && (
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-800 mb-2">Pickup Address</h2>
          <p className="text-sm text-gray-600">
            {request.pickupAddress.street}, {request.pickupAddress.city},{' '}
            {request.pickupAddress.state} - {request.pickupAddress.pincode}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Link to="/my-requests" className="btn-secondary flex-1 text-center py-2.5 min-w-[120px]">
          All Requests
        </Link>
        {rewardEarned && (
          <Link to="/rewards" className="btn-primary flex-1 text-center py-2.5 min-w-[120px] flex items-center justify-center gap-2">
            <FiAward size={15} /> View Rewards
          </Link>
        )}
        {request.status === 'completed' && !request.isReviewed && (
          <Link to={`/facilities/${request.facility?._id}`} className="btn-secondary flex-1 text-center py-2.5 min-w-[120px]">
            Leave a Review
          </Link>
        )}
      </div>
    </div>
  );
}

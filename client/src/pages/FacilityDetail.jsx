import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/facility/MapView';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { FiStar, FiPhone, FiMail, FiGlobe, FiCheckCircle, FiMapPin } from 'react-icons/fi';

export default function FacilityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [facility, setFacility] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/facilities/${id}`),
      api.get(`/reviews/facility/${id}`),
    ]).then(([fRes, rRes]) => {
      setFacility(fRes.data.facility);
      setReviews(rRes.data.reviews);
    }).catch(() => toast.error('Failed to load facility'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews', { facilityId: id, ...review });
      setReviews(p => [data.review, ...p]);
      toast.success('Review submitted!');
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Loader />;
  if (!facility) return <div className="text-center py-20 text-gray-400">Facility not found.</div>;

  // GeoJSON stores [lng, lat] — destructure correctly
  const [lng, lat] = facility.location?.coordinates || [];

  // Only render map when both coordinates are valid numbers
  const hasValidCoords = typeof lat === 'number' && typeof lng === 'number';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{facility.name}</h1>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
              <FiMapPin size={14} />
              {facility.address?.street}, {facility.address?.city}, {facility.address?.state} - {facility.address?.pincode}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                <FiStar size={14} fill="currentColor" /> {facility.rating?.toFixed(1)} ({facility.totalReviews} reviews)
              </div>
              {facility.isCertified && (
                <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  <FiCheckCircle size={12} /> Certified
                </span>
              )}
            </div>
          </div>
          {user && (
            <Link to={`/request/${facility._id}`} className="btn-primary px-6 py-2.5">
              Request Service
            </Link>
          )}
        </div>

        {facility.description && <p className="text-gray-600 text-sm mt-4">{facility.description}</p>}

        {/* Contact */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
          {facility.contact?.phone && (
            <a href={`tel:${facility.contact.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
              <FiPhone size={14} /> {facility.contact.phone}
            </a>
          )}
          {facility.contact?.email && (
            <a href={`mailto:${facility.contact.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
              <FiMail size={14} /> {facility.contact.email}
            </a>
          )}
          {facility.contact?.website && (
            <a href={facility.contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
              <FiGlobe size={14} /> Website
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Waste types */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Accepted Waste Types</h2>
          <div className="flex flex-wrap gap-2">
            {facility.wasteTypes?.map(t => (
              <span key={t} className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full capitalize">{t}</span>
            ))}
          </div>
          <div className="mt-4 flex gap-4">
            {facility.acceptsPickup && <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">✓ Pickup Available</span>}
            {facility.acceptsDropoff && <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">✓ Drop-off Available</span>}
          </div>
        </div>

        {/* Operating hours */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Operating Hours</h2>
          {facility.operatingHours ? (
            <div className="grid grid-cols-2 gap-1 text-sm">
              {Object.entries(facility.operatingHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between">
                  <span className="capitalize text-gray-500">{day}</span>
                  <span className="text-gray-700 font-medium">{hours || 'Closed'}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">Operating hours not specified</p>}
        </div>
      </div>

      {/* Map — KEY FIX: explicit height wrapper so Leaflet doesn't collapse to 0px */}
      {hasValidCoords && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Location</h2>
          <div style={{ height: '400px', width: '100%' }}>
            <MapView facilities={[facility]} center={[lat, lng]} zoom={15} />
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Reviews ({reviews.length})</h2>
        {user && (
          <form onSubmit={submitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Write a Review</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600">Rating:</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setReview(p => ({ ...p, rating: n }))}
                  className={`text-xl ${n <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
              ))}
            </div>
            <textarea value={review.comment} onChange={e => setReview(p => ({ ...p, comment: e.target.value }))}
              className="input-field mb-2 resize-none" rows={3} placeholder="Share your experience..." />
            <button type="submit" disabled={submitting} className="btn-primary text-sm py-1.5">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
        <div className="space-y-4">
          {reviews.length === 0 ? <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p> :
            reviews.map(r => (
              <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                    {r.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-700 text-sm">{r.user?.name}</span>
                  <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="text-gray-600 text-sm ml-10">{r.comment}</p>}
                <p className="text-xs text-gray-400 ml-10 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
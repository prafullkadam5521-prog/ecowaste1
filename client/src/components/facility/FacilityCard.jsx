import { Link } from 'react-router-dom';
import { FiMapPin, FiStar, FiCheckCircle, FiPhone } from 'react-icons/fi';
import { MdRecycling } from 'react-icons/md';

const WASTE_COLORS = {
  mobile: 'bg-blue-100 text-blue-700',
  laptop: 'bg-purple-100 text-purple-700',
  battery: 'bg-yellow-100 text-yellow-700',
  television: 'bg-pink-100 text-pink-700',
  refrigerator: 'bg-cyan-100 text-cyan-700',
  printer: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function FacilityCard({ facility, distanceKm, isTop }) {
  return (
    <div className={`card hover:shadow-md transition-shadow ${isTop ? 'border-primary border-2' : ''}`}>
      {isTop && (
        <div className="flex items-center gap-1 text-primary text-xs font-semibold mb-2">
          <MdRecycling size={14} /> AI Top Pick
        </div>
      )}
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-800 text-base">{facility.name}</h3>
        {facility.isCertified && (
          <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
            <FiCheckCircle size={13} /> Certified
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
        <FiMapPin size={13} />
        <span>{facility.address?.city}, {facility.address?.state}</span>
        {distanceKm != null && <span className="ml-1 text-primary font-medium">· {distanceKm} km</span>}
      </div>

      <div className="flex items-center gap-1 text-sm mt-1 text-yellow-500">
        <FiStar size={13} fill="currentColor" />
        <span className="font-medium">{facility.rating?.toFixed(1) || '—'}</span>
        <span className="text-gray-400">({facility.totalReviews} reviews)</span>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {facility.wasteTypes?.slice(0, 4).map((w) => (
          <span key={w} className={`text-xs px-2 py-0.5 rounded-full capitalize ${WASTE_COLORS[w] || WASTE_COLORS.other}`}>
            {w}
          </span>
        ))}
        {facility.wasteTypes?.length > 4 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            +{facility.wasteTypes.length - 4}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {facility.contact?.phone && (
          <a href={`tel:${facility.contact.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary">
            <FiPhone size={12} /> {facility.contact.phone}
          </a>
        )}
        <Link to={`/facilities/${facility._id}`} className="btn-primary py-1.5 text-sm ml-auto">
          View Details
        </Link>
      </div>
    </div>
  );
}

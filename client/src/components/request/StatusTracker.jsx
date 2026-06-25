import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

const STEPS = ['pending', 'approved', 'collected', 'recycled', 'completed'];

export default function StatusTracker({ status, statusHistory = [] }) {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 text-red-500 font-medium">
        <FiXCircle size={18} /> Request Rejected
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress bar */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 z-0">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step} className="flex flex-col items-center z-10 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                ${done ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                {done ? <FiCheckCircle size={16} /> : <FiClock size={14} />}
              </div>
              <span className={`text-xs mt-1 capitalize font-medium ${active ? 'text-primary' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {statusHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Status History</h4>
          <div className="space-y-2">
            {[...statusHistory].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-medium capitalize">{h.status}</span>
                  {h.note && <span className="text-gray-500"> — {h.note}</span>}
                  <div className="text-gray-400 text-xs">{new Date(h.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

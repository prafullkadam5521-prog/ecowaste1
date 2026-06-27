import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { FiWifi, FiActivity, FiAlertTriangle, FiMapPin } from 'react-icons/fi';
import { MdDeleteOutline } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  EMPTY:  { color: 'text-green-600',  bg: 'bg-green-100',  border: 'border-green-300',  bar: 'from-green-400 to-green-500',    glow: 'shadow-green-200/60',  label: 'Empty',  hex: '#22c55e' },
  LOW:    { color: 'text-lime-600',   bg: 'bg-lime-100',   border: 'border-lime-300',   bar: 'from-lime-400 to-lime-500',      glow: 'shadow-lime-200/60',   label: 'Low',    hex: '#84cc16' },
  MEDIUM: { color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300', bar: 'from-orange-400 to-orange-500',  glow: 'shadow-orange-200/60', label: 'Medium', hex: '#f97316' },
  FULL:   { color: 'text-red-600',    bg: 'bg-red-100',    border: 'border-red-300',    bar: 'from-red-500 to-red-600',        glow: 'shadow-red-300/60',    label: 'Full',   hex: '#ef4444' },
};

// ── Map marker icons (color-coded by status) ──────────────────────────────
const PUNE_CENTER = [18.5204, 73.8567];

function makeIcon(hexColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${hexColor}"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

// ── Relative time helper ──────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
  if (diff < 5)    return 'Just now';
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Signal strength from distance ─────────────────────────────────────────
function signalBars(distance) {
  if (distance <= 5)  return 4;
  if (distance <= 15) return 3;
  if (distance <= 30) return 2;
  return 1;
}

// ── DustbinCard ───────────────────────────────────────────────────────────
function DustbinCard({ bin }) {
  const s = STATUS_CONFIG[bin.status] || STATUS_CONFIG.EMPTY;
  const bars = signalBars(bin.distance);
  const isFull = bin.status === 'FULL';

  return (
    <div className={`card relative overflow-hidden border-2 ${s.border} transition-all duration-500 hover:shadow-lg ${isFull ? s.glow + ' shadow-lg' : ''}`}>
      {/* Full warning pulse overlay */}
      {isFull && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none rounded-xl" />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
            <MdDeleteOutline size={22} className={s.color} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">{bin.dustbinId}</h3>
            <span className={`text-xs font-medium ${s.color}`}>{bin.label || 'Smart Bin'}</span>
          </div>
        </div>

        {/* Status badge */}
        <span className={`${s.bg} ${s.color} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
          {isFull && <FiAlertTriangle size={12} />}
          {s.label}
        </span>
      </div>

      {/* Fill level bar */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500">Fill Level</span>
          <span className={`text-2xl font-extrabold ${s.color} leading-none`}>
            {bin.fillLevel.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${s.bar} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(bin.fillLevel, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* Distance */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Distance</p>
          <p className="text-sm font-bold text-gray-800">{bin.distance.toFixed(1)} <span className="text-xs font-normal text-gray-400">cm</span></p>
        </div>

        {/* Signal */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Signal</p>
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-[2px]">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`w-[3px] rounded-sm transition-colors duration-300 ${
                    i <= bars ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  style={{ height: `${6 + i * 3}px` }}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-gray-500">{bars}/4</span>
          </div>
        </div>
      </div>

      {/* Footer — connectivity & time */}
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
          <FiWifi size={13} />
          <span>Connected</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <FiActivity size={12} />
          <span>{timeAgo(bin.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function SmartDustbin() {
  const [dustbins, setDustbins] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const intervalRef = useRef(null);

  const fetchDustbins = async (isInitial = false) => {
    try {
      const { data } = await api.get('/dustbin');
      setDustbins(data.dustbins || []);
      setError(false);
      if (isInitial) setLoading(false);
    } catch {
      if (isInitial) { setLoading(false); setError(true); }
    }
  };

  useEffect(() => {
    fetchDustbins(true);
    intervalRef.current = setInterval(() => fetchDustbins(false), 2000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Summary stats
  const totalBins = dustbins.length;
  const fullBins  = dustbins.filter(b => b.status === 'FULL').length;
  const avgFill   = totalBins ? (dustbins.reduce((s, b) => s + b.fillLevel, 0) / totalBins).toFixed(1) : 0;

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MdDeleteOutline size={26} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Smart Dustbin</h1>
            <p className="text-sm text-gray-500">Real-time IoT waste monitoring dashboard</p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-green-700">Live — refreshing every 2s</span>
        </div>
      </div>

      {/* Summary bar */}
      {totalBins > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MdDeleteOutline size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Bins</p>
              <p className="text-xl font-extrabold text-gray-800">{totalBins}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <FiActivity size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Average Fill</p>
              <p className="text-xl font-extrabold text-gray-800">{avgFill}%</p>
            </div>
          </div>
          <div className={`card flex items-center gap-3 ${fullBins > 0 ? 'border-red-200 bg-red-50/50' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fullBins > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
              <FiAlertTriangle size={18} className={fullBins > 0 ? 'text-red-500' : 'text-gray-400'} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Bins Full</p>
              <p className={`text-xl font-extrabold ${fullBins > 0 ? 'text-red-600' : 'text-gray-800'}`}>{fullBins}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-20 text-gray-400">
          <FiAlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
          <p>Could not connect to the server. Retrying…</p>
        </div>
      )}

      {/* Empty state */}
      {!error && totalBins === 0 && (
        <div className="text-center py-20 text-gray-400">
          <MdDeleteOutline size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium text-gray-500 mb-1">No Dustbins Online</p>
          <p className="text-sm">Waiting for ESP32 to send data to <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">POST /api/dustbin/update</code></p>
        </div>
      )}

      {/* Dustbin Map */}
      {totalBins > 0 && dustbins.some(b => b.location?.coordinates?.[0]) && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiMapPin size={18} className="text-primary" /> Dustbin Locations
          </h2>
          <div className="card p-0 overflow-hidden rounded-xl border border-gray-200" style={{ height: '400px' }}>
            <MapContainer center={PUNE_CENTER} zoom={12} className="h-full w-full" scrollWheelZoom={true}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {dustbins.filter(b => b.location?.coordinates?.[0]).map(bin => {
                const st = STATUS_CONFIG[bin.status] || STATUS_CONFIG.EMPTY;
                return (
                  <Marker
                    key={bin.dustbinId}
                    position={[bin.location.coordinates[1], bin.location.coordinates[0]]}
                    icon={makeIcon(st.hex)}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{bin.dustbinId}</p>
                        {bin.label && <p className="text-gray-500">{bin.label}</p>}
                        <p>Fill: <b>{bin.fillLevel.toFixed(1)}%</b> — <span style={{ color: st.hex }}>{st.label}</span></p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Dustbin grid */}
      {totalBins > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dustbins.map(bin => (
            <DustbinCard key={bin.dustbinId} bin={bin} />
          ))}
        </div>
      )}
    </div>
  );
}

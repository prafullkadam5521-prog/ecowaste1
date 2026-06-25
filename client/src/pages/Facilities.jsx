import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FacilityCard from '../components/facility/FacilityCard';
import MapView from '../components/facility/MapView';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import {
  FiSearch, FiMap, FiList, FiZap,
  FiMessageCircle, FiX, FiSend, FiTrash2, FiRefreshCw,
} from 'react-icons/fi';
import { MdRecycling, MdSmartToy } from 'react-icons/md';

// ── Constants ──────────────────────────────────────────────────────────────
const WASTE_TYPES = ['mobile', 'laptop', 'battery', 'television', 'refrigerator', 'printer', 'other'];

const QUICK_QUESTIONS = [
  'How do I recycle a battery?',
  'Wipe data before recycling my phone?',
  'What happens to recycled laptops?',
  'Why is e-waste harmful?',
  'Can I recycle a broken TV?',
  'What metals are in old electronics?',
];

// ── Markdown-lite renderer ─────────────────────────────────────────────────
function BotMessage({ text }) {
  return (
    <div className="text-sm leading-relaxed space-y-0.5">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const isBullet = /^[-•*]\s/.test(line.trim());
        const html = line
          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
          .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>');
        const content = isBullet ? html.replace(/^[-•*]\s*/, '') : html;
        return isBullet ? (
          <div key={i} className="flex gap-1.5">
            <span className="text-primary flex-shrink-0 mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        ) : (
          <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </div>
  );
}

// ── EcoBot floating chat widget ────────────────────────────────────────────
function EcoWasteChat() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm **EcoBot** 🌱\nAsk me anything about e-waste recycling — batteries, phones, laptops, TVs and more.\n\nHow can I help you today?" },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [lastUserMsg, setLast]  = useState('');
  const [showRetry, setRetry]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const addBot = (text, isError = false) =>
    setMessages((p) => [...p, { role: 'bot', text, isError }]);

  const sendMessage = async (quickText) => {
    const text = (quickText || input).trim();
    if (!text || loading) return;

    setInput('');
    setLast(text);
    setRetry(false);
    setMessages((p) => [...p, { role: 'user', text }]);
    setLoading(true);

    // Build Gemini-format history (skip opening bot greeting, skip error messages)
    const snap = [...messages, { role: 'user', text }];
    const history = snap.slice(1, -1)
      .filter((m) => !m.isError)
      .map((m) => ({
        role:  m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    try {
      // Calls YOUR backend /api/chat — no CORS, API key stays on server
      const { data } = await api.post('/chat', { history, message: text });
      addBot(data.reply);
    } catch (err) {
      const status = err?.response?.status;
      const errMsg = err?.response?.data?.error;

      if (status === 429 || errMsg === 'rate_limited') {
        addBot('⚠️ The AI is temporarily busy. Please wait ~1 minute and tap **Retry**.', true);
      } else if (errMsg) {
        addBot(`⚠️ ${errMsg}`, true);
      } else {
        addBot('⚠️ Something went wrong. Please check your connection and try again.', true);
      }
      setRetry(true);
    } finally {
      setLoading(false);
    }
  };

  const retryLast = async () => {
    if (!lastUserMsg) return;
    setMessages((p) => p.slice(0, -1));
    setRetry(false);
    await new Promise((r) => setTimeout(r, 300));
    sendMessage(lastUserMsg);
  };

  const clearChat = () => {
    setMessages([{ role: 'bot', text: "Chat cleared! 🌱 Ask me anything about e-waste recycling." }]);
    setLast('');
    setRetry(false);
  };

  const showQuickQ = messages.length <= 2 && !loading;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        title="EcoBot — E-waste assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-xl
          hover:scale-105 hover:bg-primary-dark transition-all flex items-center justify-center group"
      >
        {open ? <FiX size={22} /> : (
          <>
            <FiMessageCircle size={22} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
            <span className="absolute right-16 bg-gray-800 text-white text-xs rounded-lg px-2 py-1
              whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Ask EcoBot ♻️
            </span>
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white"
          style={{ width: '360px', height: '520px' }}
        >
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MdSmartToy size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">EcoBot</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <p className="text-green-100 text-xs">E-waste recycling assistant</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} title="Clear chat"
                className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <FiTrash2 size={14} />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <FiX size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50/70">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MdRecycling size={15} className="text-primary" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2.5
                  ${m.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none text-sm'
                    : m.isError
                      ? 'bg-red-50 text-red-700 rounded-tl-none border border-red-100'
                      : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                  }`}
                >
                  {m.role === 'bot' ? <BotMessage text={m.text} /> : <p className="text-sm">{m.text}</p>}
                  {m.isError && showRetry && i === messages.length - 1 && (
                    <button onClick={retryLast}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">
                      <FiRefreshCw size={11} /> Retry
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MdRecycling size={15} className="text-primary" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {showQuickQ && (
            <div className="px-3 pt-2 pb-1 border-t border-gray-100 bg-white flex-shrink-0">
              <p className="text-xs text-gray-400 mb-1.5">Try asking:</p>
              <div className="flex flex-wrap gap-1">
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full hover:bg-green-100 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex gap-2 items-center flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about e-waste recycling..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-gray-50"
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center
                disabled:opacity-40 hover:bg-primary-dark transition-colors flex-shrink-0">
              <FiSend size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Facilities page ───────────────────────────────────────────────────
export default function Facilities() {
  const { user } = useAuth();
  const [facilities, setFacilities]             = useState([]);
  const [recommendations, setRecommendations]   = useState({ top: null, alternatives: [] });
  const [loading, setLoading]                   = useState(true);
  const [view, setView]                         = useState('list');
  const [userLocation, setUserLocation]         = useState(null);
  const [filters, setFilters]                   = useState({ wasteType: '', city: '', certified: '' });
  const [selectedWasteTypes, setSelectedWasteTypes] = useState([]);
  const [aiLoading, setAiLoading]               = useState(false);

  useEffect(() => { fetchFacilities(); }, [filters]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.wasteType) params.append('wasteType', filters.wasteType);
      if (filters.city)      params.append('city', filters.city);
      if (filters.certified) params.append('certified', filters.certified);
      const { data } = await api.get(`/facilities?${params}`);
      setFacilities(data.facilities);
    } catch { toast.error('Failed to load facilities'); }
    finally  { setLoading(false); }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserLocation([coords.latitude, coords.longitude]); toast.success('Location detected!'); },
      () => toast.error('Could not get location'),
    );
  };

  const getAIRecommendations = async () => {
    if (!userLocation)              return toast.error('Please detect your location first');
    if (!selectedWasteTypes.length) return toast.error('Select at least one waste type');
    setAiLoading(true);
    try {
      const { data } = await api.post('/facilities/recommend', {
        lat: userLocation[0], lng: userLocation[1], wasteTypes: selectedWasteTypes,
      });
      setRecommendations({ top: data.top, alternatives: data.alternatives });
      if (!data.top) toast('No facilities found nearby', { icon: 'ℹ️' });
      else           toast.success('AI recommendations ready!');
    } catch { toast.error('Recommendation failed'); }
    finally  { setAiLoading(false); }
  };

  const toggleWasteType = (t) =>
    setSelectedWasteTypes((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Find E-Waste Facilities</h1>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input className="input-field pl-9" placeholder="Search by city..." value={filters.city}
              onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <select className="input-field" value={filters.wasteType}
            onChange={(e) => setFilters((p) => ({ ...p, wasteType: e.target.value }))}>
            <option value="">All Waste Types</option>
            {WASTE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <select className="input-field" value={filters.certified}
            onChange={(e) => setFilters((p) => ({ ...p, certified: e.target.value }))}>
            <option value="">All Facilities</option>
            <option value="true">Certified Only</option>
          </select>
          <div className="flex gap-2">
            {['list', 'map'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${view === v ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
                {v === 'list' ? <><FiList size={14} /> List</> : <><FiMap size={14} /> Map</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations panel */}
      {user && (
        <div className="card mb-6 border-primary/30 bg-green-50/50">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiZap className="text-primary" /> AI Smart Recommendations
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {WASTE_TYPES.map((t) => (
              <button key={t} onClick={() => toggleWasteType(t)}
                className={`px-3 py-1 rounded-full text-sm capitalize border transition-colors
                  ${selectedWasteTypes.includes(t) ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 text-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={detectLocation} className="btn-secondary text-sm py-1.5">Detect My Location</button>
            <button onClick={getAIRecommendations} disabled={aiLoading} className="btn-primary text-sm py-1.5">
              {aiLoading ? 'Finding...' : 'Get Recommendations'}
            </button>
            {userLocation && <span className="self-center text-xs text-green-600 font-medium">✓ Location detected</span>}
          </div>
        </div>
      )}

      {/* AI Results */}
      {(recommendations.top || recommendations.alternatives.length > 0) && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">AI Recommended Facilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.top && (
              <FacilityCard facility={recommendations.top.facility} distanceKm={recommendations.top.distanceKm} isTop />
            )}
            {recommendations.alternatives.map((r) => (
              <FacilityCard key={r.facility._id} facility={r.facility} distanceKm={r.distanceKm} />
            ))}
          </div>
          <hr className="my-6" />
        </div>
      )}

      {/* Facilities list / map */}
      {loading ? <Loader /> : view === 'map' ? (
        <MapView facilities={facilities} userLocation={userLocation} />
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">{facilities.length} facilities found</p>
          {facilities.length === 0
            ? <div className="text-center py-16 text-gray-400">No facilities found. Try adjusting filters.</div>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilities.map((f) => <FacilityCard key={f._id} facility={f} />)}
              </div>
          }
        </div>
      )}

      {/* EcoBot floating chatbot */}
      <EcoWasteChat />
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { FiAward, FiTrendingUp, FiList, FiUsers } from 'react-icons/fi';
import { MdRecycling } from 'react-icons/md';

// ── Tier config ───────────────────────────────────────────────────────────
const TIERS = [
  { name: 'Bronze',   min: 0,    max: 399,      icon: '🥉', color: 'text-amber-600' },
  { name: 'Silver',   min: 400,  max: 999,      icon: '🥈', color: 'text-gray-500'  },
  { name: 'Gold',     min: 1000, max: 1999,     icon: '🥇', color: 'text-yellow-500' },
  { name: 'Platinum', min: 2000, max: Infinity, icon: '💎', color: 'text-purple-600' },
];

const TIER_STYLES = {
  Bronze:   { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  bar: 'bg-amber-400'  },
  Silver:   { bg: 'bg-slate-50',  border: 'border-slate-300',  text: 'text-slate-600',  bar: 'bg-slate-400'  },
  Gold:     { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', bar: 'bg-yellow-400' },
  Platinum: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', bar: 'bg-purple-500' },
};

// Frontend tier calculation — single source of truth, never trusts stale DB value
const calcTierName = (pts) => {
  if (pts >= 2000) return 'Platinum';
  if (pts >= 1000) return 'Gold';
  if (pts >= 400)  return 'Silver';
  return 'Bronze';
};

const buildSummary = (totalPoints, backendSummary) => {
  const tierName = calcTierName(totalPoints);          // always correct
  const tier     = TIERS.find(t => t.name === tierName);
  const idx      = TIERS.indexOf(tier);
  const next     = TIERS[idx + 1] || null;
  const progress = next
    ? Math.min(Math.round(((totalPoints - tier.min) / (next.min - tier.min)) * 100), 99)
    : 100;
  return {
    ...backendSummary,
    tier,                                    // full tier object with min/max
    tierName,                                // string name
    nextTier: next,
    progress,
    pointsToNext: next ? Math.max(next.min - totalPoints, 0) : 0,
  };
};

// Points per item
const POINTS_MAP_DISPLAY = {
  mobile: 50, laptop: 80, battery: 30,
  television: 70, refrigerator: 100, printer: 60, other: 20,
};

// ── TierCard ─────────────────────────────────────────────────────────────
function TierCard({ summary }) {
  const s = TIER_STYLES[summary.tierName] || TIER_STYLES.Bronze;
  return (
    <div className={`card border-2 ${s.border} ${s.bg} flex flex-col items-center py-6 gap-2`}>
      <span className="text-6xl leading-none">{summary.tier.icon}</span>
      <h2 className={`text-xl font-bold ${s.text}`}>{summary.tierName} Member</h2>
      <p className="text-4xl font-extrabold text-gray-800">{summary.totalPoints.toLocaleString()}</p>
      <p className="text-sm text-gray-500">Total Points Earned</p>

      {summary.nextTier ? (
        <div className="w-full mt-3 px-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-medium">{summary.tierName} ({summary.tier.min} pts)</span>
            <span className="font-medium">{summary.nextTier.name} ({summary.nextTier.min.toLocaleString()} pts)</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${s.bar} rounded-full transition-all duration-700`}
              style={{ width: `${summary.progress}%` }}
            />
          </div>
          <p className="text-xs text-center mt-1.5">
            <span className="font-semibold text-gray-700">{summary.pointsToNext}</span>
            <span className="text-gray-400"> more points to reach </span>
            <span className="font-semibold text-gray-700">{summary.nextTier.name}</span>
          </p>
        </div>
      ) : (
        <p className="text-sm font-semibold text-purple-600 mt-2">🎉 Highest tier achieved!</p>
      )}
    </div>
  );
}

// ── TierRoadmap ───────────────────────────────────────────────────────────
function TierRoadmap({ currentTierName, totalPoints }) {
  const currentIdx = TIERS.findIndex(t => t.name === currentTierName);
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiTrendingUp className="text-primary" size={16} /> Tier Roadmap
      </h3>
      <div className="space-y-3">
        {TIERS.map((t, i) => {
          const isActive = i === currentIdx;
          const isPast   = i < currentIdx;
          return (
            <div key={t.name}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all
                ${isActive ? 'border-primary bg-green-50' : isPast ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-100 bg-white'}`}>
              <span className="text-2xl w-8 text-center">{t.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                  {t.name}
                  {isActive && <span className="ml-1 text-xs font-normal opacity-70">(current)</span>}
                </p>
                <p className="text-xs text-gray-400">{t.min.toLocaleString()} pts required</p>
              </div>
              {isPast  && <span className="text-green-500 text-xs font-semibold">✓ Achieved</span>}
              {isActive && <span className="text-primary text-xs font-semibold">Active</span>}
              {!isPast && !isActive && (
                <span className="text-xs text-gray-400 font-medium">
                  {Math.max(t.min - totalPoints, 0)} pts away
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PointsGuide ───────────────────────────────────────────────────────────
function PointsGuide({ pointsMap }) {
  const pm = pointsMap || POINTS_MAP_DISPLAY;
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <MdRecycling className="text-primary" size={18} /> Points per Item
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(pm).map(([type, pts]) => (
          <div key={type} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
            <span className="text-sm capitalize text-gray-700 font-medium">{type}</span>
            <span className="text-sm font-bold text-primary">+{pts} pts</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">Points × quantity per item</p>
    </div>
  );
}

// ── HistoryTab ────────────────────────────────────────────────────────────
function HistoryTab({ history }) {
  if (!history.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <MdRecycling size={40} className="mx-auto mb-3 opacity-30" />
        <p className="mb-4">No rewards yet. Complete your first disposal to earn points!</p>
        <Link to="/facilities" className="btn-primary py-2 px-6 text-sm">Find a Facility</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {history.map((r) => (
        <div key={r._id} className="card flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MdRecycling size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{r.description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {r.breakdown?.map((b, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                    {b.quantity}× {b.wasteType} (+{b.points})
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xl font-extrabold text-primary">+{r.points}</p>
            <p className="text-xs text-gray-400">points</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── LeaderboardTab ────────────────────────────────────────────────────────
function LeaderboardTab({ leaderboard, myRank }) {
  if (!leaderboard.length) {
    return <div className="text-center py-12 text-gray-400">No leaderboard data yet.</div>;
  }
  const MEDALS = ['🥇', '🥈', '🥉'];
  return (
    <div>
      {myRank && (
        <div className="mb-4 p-3 bg-green-50 border border-primary/30 rounded-xl text-sm text-center text-primary font-semibold">
          🏆 You are ranked #{myRank} on the leaderboard!
        </div>
      )}
      <div className="space-y-2">
        {leaderboard.map((u, i) => {
          const tn  = calcTierName(u.totalPoints);
          const ts  = TIER_STYLES[tn];
          return (
            <div key={u._id}
              className={`flex items-center gap-3 p-3 rounded-xl border
                ${i < 3 ? 'bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-sm' : 'bg-white border-gray-100'}`}>
              <span className="text-lg w-8 text-center font-extrabold">
                {i < 3 ? MEDALS[i] : <span className="text-gray-400 text-sm">#{i + 1}</span>}
              </span>
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{u.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ts?.text} ${ts?.bg}`}>
                  {TIERS.find(t => t.name === tn)?.icon} {tn}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-extrabold text-primary">{u.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-gray-400">pts</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Rewards() {
  const [rawData,  setRawData]  = useState(null);
  const [board,    setBoard]    = useState({ leaderboard: [], myRank: null });
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('history');

  useEffect(() => {
    Promise.all([api.get('/rewards/me'), api.get('/rewards/leaderboard')])
      .then(([r, b]) => {
        setRawData(r.data);
        setBoard({ leaderboard: b.data.leaderboard, myRank: b.data.myRank });
      })
      .catch(() => toast.error('Failed to load rewards'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!rawData) return <div className="text-center py-20 text-gray-400">Could not load rewards.</div>;

  // Build summary with frontend-calculated tier (always correct)
  const summary = buildSummary(rawData.summary.totalPoints, rawData.summary);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FiAward size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Rewards</h1>
          <p className="text-sm text-gray-500">Earn points for every e-waste disposal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          <TierCard summary={summary} />
          <TierRoadmap currentTierName={summary.tierName} totalPoints={summary.totalPoints} />
          <PointsGuide pointsMap={rawData.pointsMap} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'history',     label: 'Points History', icon: <FiList size={14} /> },
              { key: 'leaderboard', label: 'Leaderboard',    icon: <FiUsers size={14} /> },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all
                  ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === 'history'
            ? <HistoryTab history={rawData.history} />
            : <LeaderboardTab leaderboard={board.leaderboard} myRank={board.myRank} />
          }
        </div>
      </div>
    </div>
  );
}
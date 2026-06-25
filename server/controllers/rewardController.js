const Reward = require('../models/Reward');
const User   = require('../models/User');

const TIERS = [
  { name: 'Bronze',   min: 0,    max: 399,        color: '#CD7F32', icon: '🥉' },
  { name: 'Silver',   min: 400,  max: 999,        color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold',     min: 1000, max: 1999,       color: '#FFD700', icon: '🥇' },
  { name: 'Platinum', min: 2000, max: Infinity,   color: '#E5E4E2', icon: '💎' },
];

// Derive correct tier purely from points — single source of truth
const calcTier = (points) => {
  if (points >= 2000) return 'Platinum';
  if (points >= 1000) return 'Gold';
  if (points >= 400)  return 'Silver';
  return 'Bronze';
};

const getTierInfo = (points) => {
  const tierName = calcTier(points);
  const tier     = TIERS.find(t => t.name === tierName);
  const idx      = TIERS.indexOf(tier);
  const next     = TIERS[idx + 1] || null;
  const progress = next
    ? Math.min(Math.round(((points - tier.min) / (next.min - tier.min)) * 100), 99)
    : 100;
  return { tier, next, progress };
};

// @desc  Get my reward summary + history
// @route GET /api/rewards/me
const getMyRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name totalPoints rewardTier');

    const totalPoints = user.totalPoints || 0;

    // Always derive tier from points — corrects any stale DB value
    const correctTier = calcTier(totalPoints);
    if (user.rewardTier !== correctTier) {
      user.rewardTier = correctTier;
      await user.save();
    }

    const history = await Reward.find({ user: req.user._id })
      .populate('request', 'serviceType scheduledDate wasteItems')
      .sort({ createdAt: -1 })
      .limit(20);

    const { tier, next, progress } = getTierInfo(totalPoints);

    res.json({
      success: true,
      summary: {
        totalPoints,
        tier:         correctTier,          // always points-derived
        tierInfo:     tier,
        nextTier:     next,
        progress,
        pointsToNext: next ? Math.max(next.min - totalPoints, 0) : 0,
      },
      history,
      pointsMap: Reward.POINTS_MAP,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Leaderboard
// @route GET /api/rewards/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ role: 'user', isActive: true, totalPoints: { $gt: 0 } })
      .select('name totalPoints rewardTier profileImage')
      .sort({ totalPoints: -1 })
      .limit(10);

    const myRank = users.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;

    res.json({ success: true, leaderboard: users, myRank: myRank || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Points config
// @route GET /api/rewards/config
const getConfig = async (req, res) => {
  res.json({ success: true, pointsMap: Reward.POINTS_MAP, tiers: TIERS });
};

module.exports = { getMyRewards, getLeaderboard, getConfig };
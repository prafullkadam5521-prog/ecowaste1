const Request  = require('../models/Request');
const Facility = require('../models/Facility');
const User     = require('../models/User');
const Reward   = require('../models/Reward');
const sendEmail = require('../utils/sendEmail');

// ── Tier calculation (standalone — does NOT rely on mongoose hooks) ────────
const calcTier = (points) => {
  if (points >= 2000) return 'Platinum';
  if (points >= 1000) return 'Gold';
  if (points >= 400)  return 'Silver';
  return 'Bronze';
};

// ── Award points helper ────────────────────────────────────────────────────
const awardPoints = async (request) => {
  try {
    const POINTS_MAP = Reward.POINTS_MAP;
    let earned = 0;
    const breakdown = [];

    for (const item of request.wasteItems || []) {
      const perItem = POINTS_MAP[item.type] || POINTS_MAP['other'];
      const qty     = Number(item.quantity) || 1;
      const pts     = perItem * qty;
      earned       += pts;
      breakdown.push({ wasteType: item.type, quantity: qty, points: pts });
    }

    if (earned === 0) return null;

    const parts       = breakdown.map(b => `${b.quantity}x ${b.wasteType}`);
    const description = `Recycled ${parts.join(', ')}`;

    // 1. Save reward record
    const reward = await Reward.create({
      user:    request.user._id || request.user,
      request: request._id,
      points:  earned,
      breakdown,
      description,
    });

    // 2. Fetch user, add points, recalculate tier, save
    //    Using findById + save ensures the tier is always correct.
    const userId  = request.user._id || request.user;
    const userDoc = await User.findById(userId);

    if (userDoc) {
      const newTotal      = (userDoc.totalPoints || 0) + earned;
      userDoc.totalPoints = newTotal;
      userDoc.rewardTier  = calcTier(newTotal); // set directly — no hook ambiguity
      await userDoc.save();
    }

    return { reward, totalPoints: earned };
  } catch (err) {
    console.error('awardPoints error:', err.message);
    return null;
  }
};

// ── Create new request ─────────────────────────────────────────────────────
const createRequest = async (req, res) => {
  try {
    const { facilityId, wasteItems, serviceType, scheduledDate, scheduledTime, pickupAddress, notes } = req.body;

    const facility = await Facility.findById(facilityId);
    if (!facility || !facility.isActive)
      return res.status(404).json({ success: false, message: 'Facility not found' });
    if (serviceType === 'pickup' && !facility.acceptsPickup)
      return res.status(400).json({ success: false, message: 'This facility does not accept pickups' });

    const request = await Request.create({
      user: req.user._id,
      facility: facilityId,
      wasteItems,
      serviceType,
      scheduledDate,
      scheduledTime,
      pickupAddress,
      notes,
      statusHistory: [{ status: 'pending', updatedBy: req.user._id, note: 'Request created' }],
    });

    await sendEmail({
      to:      req.user.email,
      subject: 'E-Waste Request Submitted — EcoWasteFinder',
      html:    `<h2>Hi ${req.user.name},</h2><p>Your e-waste <b>${serviceType}</b> request has been submitted.</p><p>Request ID: <b>${request._id}</b></p>`,
    });

    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get my requests ────────────────────────────────────────────────────────
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user._id })
      .populate('facility', 'name address contact')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single request ─────────────────────────────────────────────────────
const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('facility',      'name address contact')
      .populate('user',          'name email phone')
      .populate('assignedAgent', 'name phone');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const isOwner = request.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    let rewardEarned = null;
    if (request.status === 'completed') {
      rewardEarned = await Reward.findOne({ request: request._id }).select('points breakdown description');
    }

    res.json({ success: true, request, rewardEarned });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update status (admin/agent) ────────────────────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { status, note, assignedAgent } = req.body;
    const request = await Request.findById(req.params.id).populate('user', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const prevStatus = request.status;
    request.status   = status;
    if (assignedAgent) request.assignedAgent = assignedAgent;
    request.statusHistory.push({ status, updatedBy: req.user._id, note });
    await request.save();

    // Award points ONLY when transitioning TO completed (prevent duplicate awards)
    let rewardResult = null;
    if (status === 'completed' && prevStatus !== 'completed') {
      // Make sure no reward exists yet for this request
      const existing = await Reward.findOne({ request: request._id });
      if (!existing) {
        rewardResult = await awardPoints(request);
      }
    }

    const pointsMsg = rewardResult
      ? `<p>🎉 You earned <b>${rewardResult.totalPoints} points</b>! Check your <a href="#">Rewards Dashboard</a>.</p>`
      : '';

    await sendEmail({
      to:      request.user.email,
      subject: `Request ${status.charAt(0).toUpperCase() + status.slice(1)} — EcoWasteFinder`,
      html:    `<h2>Hi ${request.user.name},</h2><p>Your request status: <b>${status}</b>.</p>${note ? `<p>Note: ${note}</p>` : ''}${pointsMsg}`,
    });

    res.json({ success: true, request, rewardEarned: rewardResult });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Cancel request ─────────────────────────────────────────────────────────
const cancelRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['collected', 'recycled', 'completed'].includes(request.status))
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed request' });

    await request.deleteOne();
    res.json({ success: true, message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createRequest, getMyRequests, getRequest, updateStatus, cancelRequest };
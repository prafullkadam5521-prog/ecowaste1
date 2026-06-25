const User = require('../models/User');
const Facility = require('../models/Facility');
const Request = require('../models/Request');
const Review = require('../models/Review');

// @desc  Admin dashboard stats
// @route GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalFacilities, totalRequests, pendingRequests] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Facility.countDocuments({ isActive: true }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
    ]);

    const wasteStats = await Request.aggregate([
      { $unwind: '$wasteItems' },
      { $group: { _id: '$wasteItems.type', count: { $sum: '$wasteItems.quantity' } } },
      { $sort: { count: -1 } },
    ]);

    const monthlyStats = await Request.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.json({ success: true, stats: { totalUsers, totalFacilities, totalRequests, pendingRequests, wasteStats, monthlyStats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all requests (admin)
// @route GET /api/admin/requests
const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Request.countDocuments(query);
    const requests = await Request.find(query)
      .populate('user', 'name email phone')
      .populate('facility', 'name address')
      .populate('assignedAgent', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all users (admin)
// @route GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = role ? { role } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password').skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Toggle user active status
// @route PUT /api/admin/users/:id/toggle
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Generate waste report
// @route GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const query = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [statusBreakdown, topFacilities, agentPerformance] = await Promise.all([
      Request.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Request.aggregate([
        { $match: query },
        { $group: { _id: '$facility', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'facilities', localField: '_id', foreignField: '_id', as: 'facility' } },
        { $unwind: '$facility' },
        { $project: { name: '$facility.name', count: 1 } },
      ]),
      Request.aggregate([
        { $match: { ...query, assignedAgent: { $exists: true } } },
        { $group: { _id: '$assignedAgent', completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, total: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'agent' } },
        { $unwind: '$agent' },
        { $project: { name: '$agent.name', completed: 1, total: 1 } },
      ]),
    ]);

    res.json({ success: true, report: { statusBreakdown, topFacilities, agentPerformance } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all reviews (admin)
// @route GET /api/admin/reviews
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('facility', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getAllRequests, getAllUsers, toggleUser, getReports, getAllReviews };

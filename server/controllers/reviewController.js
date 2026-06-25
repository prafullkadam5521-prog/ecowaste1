const Review = require('../models/Review');
const Request = require('../models/Request');

// @desc  Add review
// @route POST /api/reviews
const addReview = async (req, res) => {
  try {
    const { facilityId, requestId, rating, comment } = req.body;

    const existing = await Review.findOne({ user: req.user._id, facility: facilityId });
    if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this facility' });

    const review = await Review.create({
      user: req.user._id,
      facility: facilityId,
      request: requestId,
      rating,
      comment,
    });

    if (requestId) await Request.findByIdAndUpdate(requestId, { isReviewed: true });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get reviews for a facility
// @route GET /api/reviews/facility/:facilityId
const getFacilityReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ facility: req.params.facilityId })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete review (owner or admin)
// @route DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addReview, getFacilityReviews, deleteReview };

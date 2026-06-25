const Facility = require('../models/Facility');
const Request = require('../models/Request');
const { scoreAndRankFacilities } = require('../utils/aiRecommendation');

// @desc  Get AI-recommended facilities
// @route POST /api/facilities/recommend
const getRecommendations = async (req, res) => {
  try {
    const { lat, lng, wasteTypes, radius = 30000 } = req.body;
    if (!lat || !lng || !wasteTypes?.length) {
      return res.status(400).json({ success: false, message: 'lat, lng and wasteTypes required' });
    }

    // Fetch nearby facilities supporting required waste types
    const facilities = await Facility.find({
      isActive: true,
      wasteTypes: { $in: wasteTypes },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: Number(radius),
        },
      },
    }).limit(20);

    if (!facilities.length) {
      return res.json({ success: true, top: null, alternatives: [], message: 'No facilities found nearby' });
    }

    // Get user past requests to factor in behavior
    const pastRequests = await Request.find({ user: req.user._id }).select('facility status');

    const ranked = scoreAndRankFacilities(facilities, {
      userLat: parseFloat(lat),
      userLng: parseFloat(lng),
      wasteTypes,
      pastRequests,
    });

    res.json({
      success: true,
      top: ranked[0] || null,
      alternatives: ranked.slice(1, 4),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getRecommendations };

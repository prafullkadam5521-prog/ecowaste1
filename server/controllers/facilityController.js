const Facility = require('../models/Facility');

// @desc  Get all facilities (with filters)
// @route GET /api/facilities
const getFacilities = async (req, res) => {
  try {
    const { wasteType, city, certified, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    if (wasteType) query.wasteTypes = wasteType;
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (certified === 'true') query.isCertified = true;

    const total = await Facility.countDocuments(query);
    const facilities = await Facility.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ rating: -1 });

    res.json({ success: true, total, page: Number(page), facilities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get nearby facilities (geospatial)
// @route GET /api/facilities/nearby?lat=&lng=&radius=&wasteType=
const getNearbyFacilities = async (req, res) => {
  try {
    const { lat, lng, radius = 20000, wasteType } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });

    const query = {
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: Number(radius),
        },
      },
    };
    if (wasteType) query.wasteTypes = wasteType;

    const facilities = await Facility.find(query).limit(20);
    res.json({ success: true, facilities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single facility
// @route GET /api/facilities/:id
const getFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id).populate('addedBy', 'name');
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
    res.json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create facility (admin)
// @route POST /api/facilities
const createFacility = async (req, res) => {
  try {
    const facility = await Facility.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update facility (admin)
// @route PUT /api/facilities/:id
const updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
    res.json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete facility (admin)
// @route DELETE /api/facilities/:id
const deleteFacility = async (req, res) => {
  try {
    await Facility.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Facility deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFacilities, getNearbyFacilities, getFacility, createFacility, updateFacility, deleteFacility };

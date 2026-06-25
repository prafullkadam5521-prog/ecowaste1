const Dustbin = require('../models/Dustbin');

// @desc  Upsert dustbin data (ESP32 sends this)
// @route POST /api/dustbin/update
const updateDustbin = async (req, res) => {
  try {
    const { dustbinId, distance, fillLevel } = req.body;

    if (!dustbinId) {
      return res.status(400).json({ success: false, message: 'dustbinId is required' });
    }

    let dustbin = await Dustbin.findOne({ dustbinId });

    if (dustbin) {
      dustbin.distance  = distance  ?? dustbin.distance;
      dustbin.fillLevel = fillLevel ?? dustbin.fillLevel;
      await dustbin.save(); // pre-save hook recalculates status
    } else {
      dustbin = await Dustbin.create({ dustbinId, distance, fillLevel });
    }

    res.json({ success: true, message: 'Dustbin data saved', dustbin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all dustbin records
// @route GET /api/dustbin
const getDustbins = async (req, res) => {
  try {
    const dustbins = await Dustbin.find().sort({ updatedAt: -1 });
    res.json({ success: true, dustbins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { updateDustbin, getDustbins };

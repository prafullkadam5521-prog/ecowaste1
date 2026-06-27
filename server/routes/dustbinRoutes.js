const express = require('express');
const router = express.Router();
const { updateDustbin, getDustbins } = require('../controllers/dustbinController');

// Simple API-key guard for ESP32 (no JWT needed on microcontroller)
const dustbinAuth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  const expected = process.env.DUSTBIN_API_KEY;
  // If no key is configured in .env, allow all requests (backwards-compatible)
  if (expected && key !== expected) {
    return res.status(401).json({ success: false, message: 'Invalid API key' });
  }
  next();
};

router.post('/update', dustbinAuth, updateDustbin);
router.get('/', getDustbins);

module.exports = router;

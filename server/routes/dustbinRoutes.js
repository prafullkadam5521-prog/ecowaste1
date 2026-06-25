const express = require('express');
const router = express.Router();
const { updateDustbin, getDustbins } = require('../controllers/dustbinController');

router.post('/update', updateDustbin);
router.get('/', getDustbins);

module.exports = router;

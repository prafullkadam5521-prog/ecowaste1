const express = require('express');
const router  = express.Router();
const { getMyRewards, getLeaderboard, getConfig } = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me',          protect, getMyRewards);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/config',      getConfig);

module.exports = router;

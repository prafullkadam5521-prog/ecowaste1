const express = require('express');
const router = express.Router();
const {
  getFacilities, getNearbyFacilities, getFacility,
  createFacility, updateFacility, deleteFacility,
} = require('../controllers/facilityController');
const { getRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getFacilities);
router.get('/nearby', getNearbyFacilities);
router.get('/:id', getFacility);
router.post('/recommend', protect, getRecommendations);
router.post('/', protect, authorize('admin'), upload.array('images', 5), createFacility);
router.put('/:id', protect, authorize('admin'), upload.array('images', 5), updateFacility);
router.delete('/:id', protect, authorize('admin'), deleteFacility);

module.exports = router;

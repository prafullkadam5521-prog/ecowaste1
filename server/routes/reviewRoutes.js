const express = require('express');
const router = express.Router();
const { addReview, getFacilityReviews, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addReview);
router.get('/facility/:facilityId', getFacilityReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;

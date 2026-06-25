const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllRequests, getAllUsers, toggleUser, getReports, getAllReviews } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/requests', getAllRequests);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUser);
router.get('/reports', getReports);
router.get('/reviews', getAllReviews);

module.exports = router;

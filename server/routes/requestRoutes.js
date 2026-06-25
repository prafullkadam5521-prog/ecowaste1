const express = require('express');
const router = express.Router();
const { createRequest, getMyRequests, getRequest, updateStatus, cancelRequest } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/:id', protect, getRequest);
router.put('/:id/status', protect, authorize('admin', 'agent'), updateStatus);
router.delete('/:id', protect, cancelRequest);

module.exports = router;

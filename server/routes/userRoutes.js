const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfileImage } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/:id', protect, getUserProfile);
router.put('/profile-image', protect, upload.single('image'), updateProfileImage);

module.exports = router;

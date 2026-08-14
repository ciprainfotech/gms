const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authorizeGarage } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Memory Storage Setup for Cloudinary Uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG and WEBP image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Routes
router.get('/', authorizeGarage, profileController.getProfile);
router.put('/user', authorizeGarage, profileController.updateUserProfile);
router.post('/change-password', authorizeGarage, profileController.changePassword);
router.put('/garage', authorizeGarage, profileController.updateGarageDetails);
router.post('/logo', authorizeGarage, upload.single('logo'), profileController.uploadGarageLogo);
router.post('/garage-logo', authorizeGarage, upload.single('logo'), profileController.uploadGarageLogo);

module.exports = router;

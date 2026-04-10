const express = require('express');
const { upload } = require('../config/upload');
const { uploadImage } = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/upload', verifyToken, upload.single('image'), uploadImage);

module.exports = router;

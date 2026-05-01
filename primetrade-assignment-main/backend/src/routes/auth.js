const express = require('express');
const { register, login, getProfile } = require('../controllers/authControllers.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

module.exports = router;
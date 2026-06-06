const express = require('express');
const router = express.Router();
const { loginTeacher } = require('../controllers/authController');

// Define the POST route for /api/auth/login
router.post('/login', loginTeacher);

module.exports = router;
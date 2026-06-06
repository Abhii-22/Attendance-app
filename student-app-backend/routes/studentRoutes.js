const express = require('express');
const router = express.Router();
const { enrollStudent } = require('../controllers/studentController');

// Define the POST route for /api/students/enroll
router.post('/enroll', enrollStudent);

module.exports = router;
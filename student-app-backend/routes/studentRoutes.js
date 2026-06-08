const express = require('express');
const router = express.Router();
const { enrollStudent, getStudentsByTeacher } = require('../controllers/studentController');

// Define the POST route for /api/students/enroll
router.post('/enroll', enrollStudent);

// ✅ Added: Define the GET route for fetching a teacher's roster 
router.get('/teacher/:teacherId', getStudentsByTeacher);

module.exports = router;
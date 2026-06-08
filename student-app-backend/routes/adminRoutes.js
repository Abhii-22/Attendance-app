const express = require('express');
const router = express.Router();
const { 
  getSystemStats, 
  getAllTeachers,
  createTeacherProfile,
  updateTeacherProfile,
  deleteTeacherProfile,
  importStudentsFromExcel
} = require('../controllers/adminController');

// System Counter Metrics Routing Prefix
router.get('/stats', getSystemStats);

// Teacher Base CRUD Operations Routing Configuration
router.get('/teachers', getAllTeachers);
router.post('/teachers/create', createTeacherProfile);
router.put('/teachers/:id', updateTeacherProfile);
router.delete('/teachers/:id', deleteTeacherProfile);

// Student Excel Import Route Mapping
router.post('/students/import', importStudentsFromExcel);

module.exports = router;
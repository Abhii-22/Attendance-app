const express = require('express');
const router = express.Router();
const { createLog, getTeacherLogs } = require('../controllers/historyController');

// POST a new log, GET logs for a specific teacher
router.post('/', createLog);
router.get('/:teacherId', getTeacherLogs);

module.exports = router;
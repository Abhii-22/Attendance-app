const HistoryLog = require('../models/HistoryLog');

// @desc    Save a new attendance snapshot
// @route   POST /api/history
const createLog = async (req, res) => {
  try {
    const newLog = await HistoryLog.create(req.body);
    res.status(201).json({ success: true, log: newLog });
  } catch (error) {
    console.error('Save Log Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save attendance log' });
  }
};

// @desc    Get all logs for a specific teacher
// @route   GET /api/history/:teacherId
const getTeacherLogs = async (req, res) => {
  try {
    // Fetch logs sorted by newest first
    const logs = await HistoryLog.find({ teacherId: req.params.teacherId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('Fetch Logs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history logs' });
  }
};

module.exports = { createLog, getTeacherLogs };
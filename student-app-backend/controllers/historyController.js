const mongoose = require('mongoose');
const HistoryLog = require('../models/HistoryLog');
const Student = require('../models/Student');

// @desc    Save a new attendance snapshot and update analytics calculations
// @route   POST /api/history
const createLog = async (req, res) => {
  try {
    let { className, dateString, submissionTime, teacherName, teacherId, presentCount, totalStudents, studentsSnapshot } = req.body;

    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ success: false, message: "Invalid or missing Teacher ID reference parameter." });
    }

    const standardizedClassName = className ? className.toString().trim().toUpperCase() : "GENERAL";

    if (!studentsSnapshot || studentsSnapshot.length === 0) {
      const realRoster = await Student.find({
        $or: [{ class: standardizedClassName }, { section: standardizedClassName }, { assignedClass: standardizedClassName }]
      });

      if (realRoster && realRoster.length > 0) {
        studentsSnapshot = realRoster.map(s => ({
          id: s._id.toString(),
          name: s.name,
          rollNumber: s.rollNumber,
          status: 'Present'
        }));
      }
    }

    const cleanSnapshot = (studentsSnapshot || []).map(s => ({
      id: s.id || s._id || '',
      name: s.name || 'Unknown Student',
      rollNumber: s.rollNumber || 'N/A',
      status: s.status === 'Absent' ? 'Absent' : 'Present'
    }));

    const finalTotal = cleanSnapshot.length > 0 ? cleanSnapshot.length : (totalStudents || 0);
    const finalPresent = cleanSnapshot.length > 0 ? cleanSnapshot.filter(item => item.status === 'Present').length : (presentCount || 0);

    const newLog = await HistoryLog.create({
      className: standardizedClassName,
      dateString: dateString || new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      submissionTime: submissionTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      teacherName: teacherName || "Instructor",
      teacherId: new mongoose.Types.ObjectId(teacherId),
      presentCount: finalPresent,
      totalStudents: finalTotal,
      studentsSnapshot: cleanSnapshot
    });

    return res.status(201).json({ success: true, log: newLog });
  } catch (error) {
    console.error('Save Log Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save attendance log', error: error.message });
  }
};

const getTeacherLogs = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ success: false, message: "Invalid Teacher ID structure format query." });
    }

    const logs = await HistoryLog.find({ teacherId: new mongoose.Types.ObjectId(teacherId) }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('Fetch Logs Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch history logs' });
  }
};

module.exports = { createLog, getTeacherLogs };
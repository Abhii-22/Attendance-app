const mongoose = require('mongoose');

// We embed the student snapshot directly into the log so it is permanently frozen in time
const snapshotSchema = new mongoose.Schema({
  id: String,
  name: String,
  rollNumber: String,
  status: { type: String, enum: ['Present', 'Absent'] }
}, { _id: false });

const historyLogSchema = new mongoose.Schema({
  className: { type: String, required: true },
  dateString: { type: String, required: true },
  submissionTime: { type: String, required: true },
  teacherName: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  presentCount: { type: Number, required: true },
  totalStudents: { type: Number, required: true },
  studentsSnapshot: [snapshotSchema] // The exact roster at the moment of submission
}, { timestamps: true });

module.exports = mongoose.model('HistoryLog', historyLogSchema);
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  designation: { type: String, required: true },
  securityPin: { type: String, required: true } // In a real app, this will be hashed/encrypted
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
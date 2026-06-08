const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  securityPin: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

// ✅ FIX: Export the Teacher model correctly, avoiding memory collisions
module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
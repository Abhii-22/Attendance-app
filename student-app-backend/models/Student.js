const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  rollNumber: { 
    type: String, 
    required: true,
    unique: true // No two students can have the same roll number
  },
  assignedClass: { 
    type: String, 
    required: true,
    enum: ['CSE A', 'CSE B', 'AIML', 'ECE'] // Restricts to valid class sections
  },
  registeredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher' // Links the student to the teacher who added them
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
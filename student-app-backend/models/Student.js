const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  rollNumber: { 
    type: String, 
    required: true,
    unique: true, // No two students can have the same roll number
    trim: true
  },
  // ✅ ADDED: Added 'class' and 'section' fields to ensure full compatibility
  // with whatever query parameters your main Attendance Screen dropdown uses!
  class: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  assignedClass: { 
    type: String, 
    required: true,
    trim: true
    // ✅ FIX: Removed the strict enum constraint array completely. 
    // Now any custom section you type on your profile page can be saved dynamically!
  },
  registeredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher' // Links the student to the teacher who added them
  }
}, { timestamps: true });

// ✅ FIX: Using the memory-check or assignment short-circuit prevents the 
// 'OverwriteModelError' from ever crashing Nodemon again during code modifications.
module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
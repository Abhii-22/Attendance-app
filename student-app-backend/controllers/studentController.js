const Student = require('../models/Student');

// @desc    Register a new student to a class
// @route   POST /api/students/enroll
const enrollStudent = async (req, res) => {
  const { name, rollNumber, assignedClass, teacherId } = req.body;

  try {
    // 1. Check if roll number already exists
    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Roll number already registered.' });
    }

    // 2. Create the new student
    const newStudent = await Student.create({
      name,
      rollNumber,
      assignedClass,
      registeredBy: teacherId // Match key to schema definition
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      student: newStudent
    });

  } catch (error) {
    console.error('Enrollment Error:', error);
    res.status(500).json({ success: false, message: 'Server error during enrollment' });
  }
};

// @desc    Get all students registered by a specific teacher
// @route   GET /api/students/teacher/:teacherId
const getStudentsByTeacher = async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Queries the DB looking for the specific ID key assigned during enrollment
    const students = await Student.find({ registeredBy: teacherId });
    
    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Fetch Students Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching student lists' });
  }
};

module.exports = {
  enrollStudent,
  getStudentsByTeacher
};
const Student = require('../models/Student');

// @desc    Register a new student to a class manually
// @route   POST /api/students/enroll
const enrollStudent = async (req, res) => {
  const { name, rollNumber, assignedClass, teacherId } = req.body;

  try {
    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Roll number already registered.' });
    }

    const uniformSection = assignedClass.toString().trim().toUpperCase();

    const newStudent = await Student.create({
      name: name.toString().trim(),
      rollNumber: rollNumber.toString().trim(),
      class: uniformSection,
      section: uniformSection,
      assignedClass: uniformSection,
      registeredBy: teacherId
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

// @desc    Get all students STRICLY registered by the logged-in teacher
// @route   GET /api/students/teacher/:teacherId
const getStudentsByTeacher = async (req, res) => {
  const { teacherId } = req.params;

  try {
    // ✅ FIXED: Strict isolation. Removed loose global parameters.
    const rawStudents = await Student.find({ registeredBy: teacherId }).sort({ rollNumber: 1 });

    // Force runtime structural normalization
    const cleanStudents = (rawStudents || []).map(student => {
      const doc = student.toObject();
      const fallbackSection = (doc.assignedClass || doc.class || doc.section || "GENERAL").toString().trim().toUpperCase();
      
      return {
        ...doc,
        class: fallbackSection,          
        section: fallbackSection,        
        assignedClass: fallbackSection   
      };
    });
    
    res.status(200).json({
      success: true,
      students: cleanStudents
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
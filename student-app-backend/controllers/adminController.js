const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const HistoryLog = require('../models/HistoryLog');

// @desc    Get complete system counts for dashboard analytics cards
// @route   GET /api/admin/stats
const getSystemStats = async (req, res) => {
  try {
    const totalTeachers = (await Teacher.countDocuments({})) || 0;
    const totalStudents = (await Student.countDocuments({})) || 0;
    const totalLogs = (await HistoryLog.countDocuments({})) || 0;

    return res.status(200).json({
      success: true,
      totalTeachers,
      totalStudents,
      totalLogs
    });
  } catch (error) {
    console.error("Admin Stats Fetch Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server registry metrics failure",
      totalTeachers: 0,
      totalStudents: 0,
      totalLogs: 0 
    });
  }
};

// @desc    Fetch all registered teachers for the directory layout
// @route   GET /api/admin/teachers
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ 
      success: true, 
      teachers: teachers || [] 
    });
  } catch (error) {
    console.error("Fetch Teachers Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error fetching instructor registry",
      teachers: [] 
    });
  }
};

// @desc    Provision new Teacher authorization profiles
// @route   POST /api/admin/teachers/create
const createTeacherProfile = async (req, res) => {
  const { name, email, department, employeeId, designation, securityPin } = req.body;

  try {
    const emailConflict = await Teacher.findOne({ email: email.toLowerCase().trim() });
    if (emailConflict) {
      return res.status(400).json({ success: false, message: "Email is already registered to an instructor account." });
    }

    const idConflict = await Teacher.findOne({ employeeId });
    if (idConflict) {
      return res.status(400).json({ success: false, message: "Employee ID configuration conflict detected." });
    }

    const newTeacher = await Teacher.create({
      name,
      email: email.toLowerCase().trim(),
      department,
      employeeId,
      designation,
      securityPin
    });

    return res.status(201).json({
      success: true,
      message: "Teacher profile created successfully",
      teacher: newTeacher
    });
  } catch (error) {
    console.error("Teacher account generation failure:", error);
    return res.status(500).json({ success: false, message: "Server error during teacher provisioning" });
  }
};

// @desc    Update an instructor profile parameters
// @route   PUT /api/admin/teachers/:id
const updateTeacherProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, department, employeeId, designation, securityPin } = req.body;

  try {
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      {
        name,
        email: email.toLowerCase().trim(),
        department,
        employeeId,
        designation,
        securityPin
      },
      { new: true }
    );

    if (!updatedTeacher) {
      return res.status(404).json({ success: false, message: "Instructor profile not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error("Update Teacher Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating instructor profile" });
  }
};

// @desc    Delete an instructor profile permanently
// @route   DELETE /api/admin/teachers/:id
const deleteTeacherProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTeacher = await Teacher.findByIdAndDelete(id);
    if (!deletedTeacher) {
      return res.status(404).json({ success: false, message: "Instructor profile not found." });
    }
    
    return res.status(200).json({ success: true, message: "Instructor profile deleted successfully" });
  } catch (error) {
    console.error("Delete Teacher Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting instructor profile" });
  }
};

module.exports = {
  getSystemStats,
  getAllTeachers,
  createTeacherProfile,
  updateTeacherProfile,
  deleteTeacherProfile
};
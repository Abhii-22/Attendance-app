const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const HistoryLog = require('../models/HistoryLog');

// Get complete system counts for dashboard analytics cards
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
      message: "Internal server registry metrics failure"
    });
  }
};

// Fetch all registered teachers for the directory list view
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
      message: "Server error fetching instructor registry" 
    });
  }
};

// Provision new Teacher authorization profiles
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

// Update an instructor profile parameters
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

// Delete an instructor profile permanently
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

// BULK Student Excel/CSV Importer
const importStudentsFromExcel = async (req, res) => {
  const { students, section, teacherId } = req.body;

  if (!section || !students || !Array.isArray(students)) {
    return res.status(400).json({ success: false, message: "Missing section allocation name or student dataset records." });
  }

  try {
    let importedCount = 0;
    let duplicateCount = 0;
    
    // Force clean uppercase formats for matching reliability
    const targetClassStr = section.toString().trim().toUpperCase();

    let verifiedId = teacherId || null;
    if (!verifiedId) {
      const fallbackTeacher = await Teacher.findOne({});
      if (fallbackTeacher) {
        verifiedId = fallbackTeacher._id;
      }
    }

    for (const student of students) {
      const name = student.name || student.Name;
      const rollNumber = student.rollNumber || student.RollNumber;

      if (!name || !rollNumber) continue;

      const existingStudent = await Student.findOne({ rollNumber: rollNumber.toString().trim() });
      
      if (existingStudent) {
        duplicateCount++;
        continue;
      }

      // Populate every field simultaneously to satisfy frontend logic constraints
      await Student.create({
        name: name.toString().trim(),
        rollNumber: rollNumber.toString().trim(),
        class: targetClassStr,          
        section: targetClassStr,        
        assignedClass: targetClassStr,  
        registeredBy: verifiedId
      });

      importedCount++;
    }

    console.log(`📊 Bulk Import Complete: Added ${importedCount} students to section [${targetClassStr}]`);

    return res.status(200).json({
      success: true,
      message: "Bulk upload processed cleanly",
      importedCount,
      duplicateCount
    });

  } catch (error) {
    console.error("Excel Database Import Error:", error);
    return res.status(500).json({ success: false, message: "Internal server data compilation error." });
  }
};

module.exports = {
  getSystemStats,
  getAllTeachers,
  createTeacherProfile,
  updateTeacherProfile,
  deleteTeacherProfile,
  importStudentsFromExcel
};
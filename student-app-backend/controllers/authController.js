const Teacher = require('../models/Teacher');

const loginTeacher = async (req, res) => {
  const { email, pin } = req.body;

  console.log(`\n--- 🔐 New Login Attempt ---`);
  console.log(`1. Received Email from App: "${email}"`);
  console.log(`2. Received PIN from App: "${pin}"`);

  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // Search the database
    const teacher = await Teacher.findOne({ email: cleanEmail });

    if (!teacher) {
      console.log(`❌ REJECTED: Could not find any teacher in the database with email: ${cleanEmail}`);
      console.log(`💡 Hint: Did you run 'node seed.js' after updating your .env file?`);
      return res.status(401).json({ success: false, message: 'Invalid email or PIN' });
    }

    console.log(`✅ Found Teacher in DB: ${teacher.name}`);
    console.log(`3. Database PIN is: "${teacher.securityPin}" | Input PIN is: "${pin.trim()}"`);

    if (teacher.securityPin === pin.trim()) {
      console.log(`✅ PIN MATCH! Authorizing user...`);
      res.status(200).json({
        success: true,
        profile: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          department: teacher.department,
          employeeId: teacher.employeeId,
          designation: teacher.designation
        }
      });
    } else {
      console.log(`❌ REJECTED: The PIN did not match.`);
      res.status(401).json({ success: false, message: 'Invalid email or PIN' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

module.exports = {
  loginTeacher
};
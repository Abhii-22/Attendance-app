const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// 1. Import API Route Files
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const historyRoutes = require('./routes/historyRoutes');
const adminRoutes = require('./routes/adminRoutes'); // ✅ Imported admin routes file

// 2. Mount API Routes with clean path prefixes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes); // ✅ Mounted admin routes to handle /api/admin/* endpoints

// Basic Health Check Route (Must stay below your API mounts)
app.get('/', (req, res) => {
  res.send('Student Attendance API is running...');
});

// Environment Configuration Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// 3. Connect to MongoDB and Bind to the Local Network Gateway
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Database');
    
    // ✅ FIX: Explicitly passing '0.0.0.0' tells Express to listen to incoming connections
    // from external local devices (like your phone) instead of locking it down to localhost.
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running globally on local network port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message);
  });
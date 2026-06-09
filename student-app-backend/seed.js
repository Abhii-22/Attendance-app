const mongoose = require('mongoose');
require('dotenv').config();
const Teacher = require('./models/Teacher');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB for seeding...');
  
  // Wipe existing to prevent duplicates during testing
  await Teacher.deleteMany({});

  await Teacher.create({
    
  });

  console.log('✅ Test Teacher Added!');
  process.exit();
});
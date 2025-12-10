import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const users = await User.find().select('name email role department');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nPlease run: npm run seed:users\n');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Department: ${user.department}`);
        console.log('');
      });
    }

    // Check specifically for admin
    const admin = await User.findOne({ email: 'admin@lab.com' });
    if (admin) {
      console.log('✅ Admin user exists');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Has password: ${admin.password ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Admin user NOT found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();


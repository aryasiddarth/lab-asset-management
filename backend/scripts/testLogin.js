import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check if admin user exists
    const admin = await User.findOne({ email: 'admin@lab.com' });
    
    if (!admin) {
      console.log('❌ Admin user does NOT exist!');
      console.log('\nPlease run: npm run seed:users\n');
      process.exit(1);
    }

    console.log('✅ Admin user found:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Has password: ${admin.password ? 'Yes' : 'No'}`);
    console.log(`   Password length: ${admin.password ? admin.password.length : 0}`);

    // Test password
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    console.log(`\n🔐 Testing password 'admin123':`);
    if (isMatch) {
      console.log('   ✅ Password is CORRECT and matches!');
    } else {
      console.log('   ❌ Password does NOT match!');
      console.log('   This means the password was not hashed correctly.');
      console.log('   Please run: npm run seed:users (to recreate users with hashed passwords)');
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      console.log('\n⚠️  WARNING: JWT_SECRET is not set or is using default value!');
      console.log('   Please set a proper JWT_SECRET in your .env file');
    } else {
      console.log('\n✅ JWT_SECRET is configured');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();


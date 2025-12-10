import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function verifySetup() {
  try {
    console.log('🔍 Verifying Setup...\n');
    
    // Check MongoDB connection
    console.log('1. Checking MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Connected to MongoDB\n');

    // Check if users exist
    console.log('2. Checking if users exist...');
    const userCount = await User.countDocuments();
    console.log(`   Found ${userCount} user(s) in database`);
    
    if (userCount === 0) {
      console.log('   ❌ No users found!');
      console.log('   → Run: npm run seed:users\n');
      process.exit(1);
    }
    console.log('   ✅ Users exist\n');

    // Check admin user
    console.log('3. Checking admin user...');
    const admin = await User.findOne({ email: 'admin@lab.com' });
    
    if (!admin) {
      console.log('   ❌ Admin user not found!');
      console.log('   → Run: npm run seed:users\n');
      process.exit(1);
    }
    
    console.log(`   ✅ Admin user found: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password hash exists: ${admin.password ? 'Yes' : 'No'}`);
    console.log(`   Password hash length: ${admin.password ? admin.password.length : 0}\n`);

    // Test password
    console.log('4. Testing password authentication...');
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    if (isMatch) {
      console.log('   ✅ Password "admin123" is CORRECT!\n');
    } else {
      console.log('   ❌ Password "admin123" does NOT match!');
      console.log('   → The password was not hashed correctly.');
      console.log('   → Run: npm run seed:users (to recreate users)\n');
      process.exit(1);
    }

    // Check JWT_SECRET
    console.log('5. Checking JWT_SECRET...');
    if (!process.env.JWT_SECRET) {
      console.log('   ❌ JWT_SECRET is not set!');
      console.log('   → Add JWT_SECRET to your .env file\n');
      process.exit(1);
    } else if (process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      console.log('   ⚠️  JWT_SECRET is using default value');
      console.log('   → Consider changing it in production\n');
    } else {
      console.log('   ✅ JWT_SECRET is configured\n');
    }

    // Check environment variables
    console.log('6. Checking environment variables...');
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
    console.log(`   PORT: ${process.env.PORT || '5000 (default)'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}\n`);

    console.log('✅ All checks passed!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: admin@lab.com');
    console.log('   Password: admin123\n');
    
    console.log('💡 If login still fails:');
    console.log('   1. Make sure backend server is running on port 5000');
    console.log('   2. Check browser console for errors');
    console.log('   3. Verify frontend is connecting to http://localhost:5000/api');
    console.log('   4. Check CORS settings in backend\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   → MongoDB is not running or connection string is wrong');
    }
    process.exit(1);
  }
}

verifySetup();


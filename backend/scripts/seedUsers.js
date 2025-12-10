import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@lab.com',
    password: 'admin123',
    role: 'admin',
    department: 'IT'
  },
  {
    name: 'Lab Manager',
    email: 'manager@lab.com',
    password: 'manager123',
    role: 'lab_manager',
    department: 'Computer Science'
  },
  {
    name: 'Technician',
    email: 'tech@lab.com',
    password: 'tech123',
    role: 'technician',
    department: 'Engineering'
  },
  {
    name: 'Viewer',
    email: 'viewer@lab.com',
    password: 'viewer123',
    role: 'viewer',
    department: 'General'
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (optional)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create users individually - passwords will be hashed by pre-save hook
    const createdUsers = [];
    for (const userData of testUsers) {
      // Create user with plain password - pre-save hook will hash it
      const user = new User(userData);
      await user.save(); // This triggers the pre-save hook to hash the password
      createdUsers.push(user);
    }
    
    console.log(`Created ${createdUsers.length} test users:`);
    createdUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    console.log('\n✅ Users created successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin@lab.com / admin123');
    console.log('  Manager: manager@lab.com / manager123');
    console.log('  Technician: tech@lab.com / tech123');
    console.log('  Viewer: viewer@lab.com / viewer123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();


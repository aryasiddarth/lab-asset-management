import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Lab from '../models/Lab.js';

dotenv.config();

const technicians = [
  {
    name: 'John Smith',
    email: 'john.tech@lab.com',
    password: 'JohnSmith@2026',
    role: 'technician',
    department: 'Computer Science'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.tech@lab.com',
    password: 'SarahJohn@2026',
    role: 'technician',
    department: 'Engineering'
  },
  {
    name: 'Mike Davis',
    email: 'mike.tech@lab.com',
    password: 'MikeDavis@2026',
    role: 'technician',
    department: 'IT'
  },
  {
    name: 'Emily Wilson',
    email: 'emily.tech@lab.com',
    password: 'EmilyWil@2026',
    role: 'technician',
    department: 'Electronics'
  },
  {
    name: 'David Brown',
    email: 'david.tech@lab.com',
    password: 'DavidBrown@2026',
    role: 'technician',
    department: 'Mechanical'
  }
];

async function seedTechnicians() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all labs
    const labs = await Lab.find().sort({ code: 1 });
    
    if (labs.length === 0) {
      console.log('No labs found. Please create labs first.');
      process.exit(1);
    }

    console.log(`Found ${labs.length} labs`);

    // Delete existing technicians
    await User.deleteMany({ role: 'technician' });
    console.log('Cleared existing technicians');

    // Create technicians and assign to labs
    const createdTechnicians = [];
    for (let i = 0; i < technicians.length && i < labs.length; i++) {
      const techData = technicians[i];
      const lab = labs[i];

      // Create technician with labId
      const technician = new User({
        ...techData,
        labId: lab._id
      });
      await technician.save();
      createdTechnicians.push(technician);

      // Update lab with technician info
      lab.technicianId = technician._id;
      lab.technicianName = technician.name;
      await lab.save();

      console.log(`Created technician ${technician.name} and assigned to lab ${lab.code}`);
    }

    console.log(`\n✅ Created ${createdTechnicians.length} technicians:`);
    createdTechnicians.forEach((tech, index) => {
      console.log(`  - ${tech.email} (${tech.name}) assigned to lab ${labs[index].code}`);
    });

    console.log('\nLogin credentials (all use password: tech123):');
    createdTechnicians.forEach(tech => {
      console.log(`  ${tech.email} / tech123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding technicians:', error);
    process.exit(1);
  }
}

seedTechnicians();


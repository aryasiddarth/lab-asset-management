import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Lab from '../models/Lab.js';

dotenv.config();

async function findAndAssignTechnician(labSearchTerm) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Search for lab by name or code (case-insensitive)
    const lab = await Lab.findOne({
      $or: [
        { name: { $regex: labSearchTerm, $options: 'i' } },
        { code: { $regex: labSearchTerm, $options: 'i' } }
      ]
    });

    if (!lab) {
      console.log(`❌ Lab matching "${labSearchTerm}" not found!`);
      console.log('\nSearching for similar labs...');
      
      const similarLabs = await Lab.find({
        $or: [
          { name: { $regex: labSearchTerm.replace(/\s+/g, '.*'), $options: 'i' } },
          { code: { $regex: labSearchTerm.replace(/\s+/g, '.*'), $options: 'i' } }
        ]
      }).limit(10);
      
      if (similarLabs.length > 0) {
        console.log('\nSimilar labs found:');
        similarLabs.forEach(l => {
          console.log(`  - Code: ${l.code}, Name: ${l.name}, Department: ${l.department}`);
        });
      } else {
        console.log('No similar labs found.');
      }
      process.exit(1);
    }

    console.log(`\n✅ Found lab:`);
    console.log(`   Code: ${lab.code}`);
    console.log(`   Name: ${lab.name}`);
    console.log(`   Department: ${lab.department}`);
    
    if (lab.technicianId) {
      const existingTech = await User.findById(lab.technicianId);
      console.log(`\n⚠️  Lab already has a technician assigned:`);
      console.log(`   ${existingTech.name} (${existingTech.email})`);
      console.log(`\nTo reassign, first unassign the current technician.`);
      process.exit(0);
    }

    // Find an unassigned technician or create a new one
    let technician = await User.findOne({ role: 'technician', labId: null });
    
    if (!technician) {
      // Create a new technician
      const techName = `Tech-${lab.code}`;
      const techEmail = `tech.${lab.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@lab.com`;
      
      console.log(`\nNo unassigned technician found. Creating new technician...`);
      technician = new User({
        name: techName,
        email: techEmail,
        password: 'tech123',
        role: 'technician',
        department: lab.department || 'General',
        labId: lab._id
      });
      await technician.save();
      console.log(`✅ Created new technician: ${techEmail} (password: tech123)`);
    } else {
      console.log(`\nFound unassigned technician: ${technician.email}`);
    }

    // Assign technician to lab
    technician.labId = lab._id;
    await technician.save();

    // Update lab with technician info
    lab.technicianId = technician._id;
    lab.technicianName = technician.name;
    await lab.save();

    console.log(`\n✅ Successfully assigned technician to lab:`);
    console.log(`   Technician: ${technician.name} (${technician.email})`);
    console.log(`   Lab: ${lab.code} - ${lab.name}`);
    console.log(`   Department: ${lab.department}`);
    console.log(`\nLogin credentials: ${technician.email} / tech123`);

    process.exit(0);
  } catch (error) {
    console.error('Error assigning technician:', error);
    process.exit(1);
  }
}

// Get search term from command line arguments
const labSearchTerm = process.argv[2];

if (!labSearchTerm) {
  console.log('Usage: node scripts/findAndAssignTechnician.js <labNameOrCode>');
  console.log('Example: node scripts/findAndAssignTechnician.js "computing lab 18"');
  console.log('Example: node scripts/findAndAssignTechnician.js CL-18');
  process.exit(1);
}

findAndAssignTechnician(labSearchTerm);


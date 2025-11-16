import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatRoom from '../models/ChatRoom.js';
import User from '../models/User.js';

dotenv.config();

async function addEmployeesToGeneralRoom() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all active employees
    const employees = await User.find({ 
      role: 'employee', 
      isActive: true 
    }).select('_id fullName email');
    
    console.log(`\n👥 Found ${employees.length} active employees`);

    // Find the general room
    const generalRoom = await ChatRoom.findOne({ 
      type: { $in: ['general', 'project'] },
      name: 'General'
    });

    if (!generalRoom) {
      console.log('❌ General room not found');
      return;
    }

    console.log(`\n💬 General room: ${generalRoom.name}`);
    console.log(`   Current participants: ${generalRoom.participants.length}`);

    // Add employees who aren't already participants
    let addedCount = 0;
    for (const employee of employees) {
      const isParticipant = generalRoom.participants.some(
        p => p.user.toString() === employee._id.toString()
      );
      
      if (!isParticipant) {
        generalRoom.participants.push({
          user: employee._id,
          role: 'member',
          joinedAt: new Date()
        });
        console.log(`   ✅ Added: ${employee.fullName}`);
        addedCount++;
      } else {
        console.log(`   ⏭️  Already member: ${employee.fullName}`);
      }
    }

    if (addedCount > 0) {
      await generalRoom.save();
      console.log(`\n✅ Added ${addedCount} employee(s) to General room`);
    } else {
      console.log(`\n✅ All employees are already in the General room`);
    }

    // Display final participants
    await generalRoom.populate('participants.user', 'fullName email role');
    console.log(`\n📋 Final participants (${generalRoom.participants.length}):`);
    generalRoom.participants.forEach(p => {
      console.log(`   - ${p.user.fullName} (${p.role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

addEmployeesToGeneralRoom();

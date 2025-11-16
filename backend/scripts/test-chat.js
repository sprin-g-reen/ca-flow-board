import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

dotenv.config();

async function testChat() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Check for users
    const users = await User.find({}).select('fullName email role');
    console.log('\n📋 Users in database:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.fullName} (${user.email}) - ${user.role}`);
    });

    // Check for chat rooms
    const rooms = await ChatRoom.find({})
      .populate('participants.user', 'fullName email role')
      .populate('lastMessage');
    console.log('\n💬 Chat rooms in database:', rooms.length);
    rooms.forEach(room => {
      console.log(`  - ${room.name} (${room.type})`);
      console.log(`    Participants: ${room.participants.length}`);
      room.participants.forEach(p => {
        console.log(`      - ${p.user.fullName} (${p.role})`);
      });
    });

    // Check for messages
    const messages = await ChatMessage.countDocuments({});
    console.log('\n📨 Total messages:', messages);

    // If no rooms, create a default general room
    if (rooms.length === 0) {
      console.log('\n🔧 No chat rooms found. Creating default general room...');
      
      const allUsers = await User.find({ isActive: true });
      if (allUsers.length > 0) {
        const owner = allUsers.find(u => u.role === 'owner') || allUsers[0];
        
        const generalRoom = await ChatRoom.create({
          name: 'General',
          type: 'general',
          description: 'General team discussions',
          createdBy: owner._id,
          participants: allUsers.map(user => ({
            user: user._id,
            role: user.role === 'owner' ? 'admin' : 'member'
          }))
        });
        
        console.log('✅ Created general room:', generalRoom.name);
        console.log('   Added', allUsers.length, 'participants');
      } else {
        console.log('❌ No active users found to add to room');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

testChat();

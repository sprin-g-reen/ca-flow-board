import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

async function testChatAPI() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find the employee user
    const employee = await User.findOne({ email: 'vijay@hmps.com' });
    if (!employee) {
      console.error('❌ Employee not found');
      return;
    }

    console.log('👤 Testing with user:', employee.fullName, '(' + employee.email + ')');

    // Generate a token for the employee
    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    console.log('🔑 Generated token');

    // Test the chat rooms endpoint
    const response = await fetch('http://localhost:3001/api/chat/rooms', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);

    if (response.ok) {
      const rooms = await response.json();
      console.log('✅ Received rooms:', rooms.length);
      rooms.forEach(room => {
        console.log(`\n  📁 ${room.name} (${room.type})`);
        console.log(`     Participants: ${room.participants?.length || 0}`);
        console.log(`     Unread count: ${room.unreadCount || 0}`);
        if (room.lastMessage) {
          console.log(`     Last message: "${room.lastMessage.content?.substring(0, 50)}..."`);
        }
      });
    } else {
      const error = await response.text();
      console.error('❌ Error response:', error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

testChatAPI();

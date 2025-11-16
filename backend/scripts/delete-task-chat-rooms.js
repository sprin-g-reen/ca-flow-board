import mongoose from 'mongoose';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';

/**
 * Permanently delete all task-related chat rooms and their messages
 * This script will:
 * 1. Find all rooms with names starting with "task-" (old format)
 * 2. Delete all messages in those rooms
 * 3. Delete the rooms themselves
 */

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca-flow-board';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function deleteTaskChatRooms() {
  try {
    // Connect to database first
    await connectDB();

    console.log('🔍 Searching for task chat rooms...\n');

    // Find all rooms with names matching the old "task-{id}" pattern
    const taskRooms = await ChatRoom.find({
      name: { $regex: /^task-[a-f0-9]{24}$/i }
    });

    if (taskRooms.length === 0) {
      console.log('✅ No old task chat rooms found. Nothing to delete.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`📊 Found ${taskRooms.length} task chat rooms to delete:\n`);
    taskRooms.forEach((room, index) => {
      console.log(`${index + 1}. ${room.name} (ID: ${room._id})`);
      console.log(`   - Type: ${room.type}`);
      console.log(`   - Participants: ${room.participants.length}`);
      console.log(`   - Created: ${room.createdAt}\n`);
    });

    // Get room IDs
    const roomIds = taskRooms.map(r => r._id);

    // Delete all messages in these rooms
    console.log('🗑️  Deleting messages...');
    const messageResult = await ChatMessage.deleteMany({ 
      room: { $in: roomIds } 
    });
    console.log(`   ✅ Deleted ${messageResult.deletedCount} messages\n`);

    // Delete the rooms
    console.log('🗑️  Deleting chat rooms...');
    const roomResult = await ChatRoom.deleteMany({ 
      _id: { $in: roomIds } 
    });
    console.log(`   ✅ Deleted ${roomResult.deletedCount} rooms\n`);

    console.log('✨ Cleanup completed successfully!\n');
    console.log('Summary:');
    console.log(`- Rooms deleted: ${roomResult.deletedCount}`);
    console.log(`- Messages deleted: ${messageResult.deletedCount}`);
    console.log('\n💡 New task chat rooms will be created with task titles as names.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting task chat rooms:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Confirm before deletion
console.log('\n⚠️  WARNING: This will permanently delete all old task chat rooms!\n');
console.log('This script will delete:');
console.log('- All chat rooms with names like "task-{id}"');
console.log('- All messages in those rooms');
console.log('\nStarting in 3 seconds...\n');

setTimeout(() => {
  deleteTaskChatRooms();
}, 3000);

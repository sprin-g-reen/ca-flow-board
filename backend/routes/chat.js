import express from 'express';
import auth from '../middleware/auth.js';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';

const router = express.Router();

// Get all chat rooms for the authenticated user
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      'participants.user': req.user.id
    })
    .populate('participants.user', 'fullName email avatar role isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Calculate unread count for each room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await ChatMessage.countDocuments({
          room: room._id,
          'readBy.user': { $ne: req.user.id },
          sender: { $ne: req.user.id }
        });

        return {
          ...room.toObject(),
          unreadCount
        };
      })
    );

    res.json(roomsWithUnread);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific room
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant in the room
    const room = await ChatRoom.findOne({
      _id: roomId,
      'participants.user': req.user.id
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const messages = await ChatMessage.find({ room: roomId })
      .populate('sender', 'fullName email avatar role')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message to a room
router.post('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, type = 'text', replyTo } = req.body;

    // Check if user is participant in the room
    const room = await ChatRoom.findOne({
      _id: roomId,
      'participants.user': req.user.id
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const message = new ChatMessage({
      room: roomId,
      sender: req.user.id,
      content,
      type,
      replyTo,
      readBy: [{ user: req.user.id, readAt: new Date() }]
    });

    await message.save();
    await message.populate('sender', 'fullName email avatar role');

    // Update room's last message and timestamp
    room.lastMessage = message._id;
    room.updatedAt = new Date();
    await room.save();

    // Broadcast to WebSocket clients
    const chatWS = req.app.get('chatWS');
    if (chatWS) {
      chatWS.broadcast({
        type: 'new_message',
        roomId,
        message
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new chat room
router.post('/rooms', auth, async (req, res) => {
  try {
    const { name, type = 'general', participants = [] } = req.body;

    // Add creator as admin participant
    const roomParticipants = [
      {
        user: req.user.id,
        role: 'admin',
        joinedAt: new Date()
      },
      ...participants.map(userId => ({
        user: userId,
        role: 'member',
        joinedAt: new Date()
      }))
    ];

    const room = new ChatRoom({
      name,
      type,
      participants: roomParticipants,
      createdBy: req.user.id
    });

    await room.save();
    await room.populate('participants.user', 'fullName email avatar role isOnline lastSeen');

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read in a room
router.post('/rooms/:roomId/read', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Update all unread messages in the room
    await ChatMessage.updateMany(
      {
        room: roomId,
        'readBy.user': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room
router.post('/rooms/:roomId/join', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if already a participant
    const isParticipant = room.participants.some(p => p.user.toString() === req.user.id);
    if (isParticipant) {
      return res.status(400).json({ message: 'Already a participant' });
    }

    room.participants.push({
      user: req.user.id,
      role: 'member',
      joinedAt: new Date()
    });

    await room.save();
    await room.populate('participants.user', 'fullName email avatar role isOnline lastSeen');

    res.json(room);
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a room
router.post('/rooms/:roomId/leave', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.participants = room.participants.filter(p => p.user.toString() !== req.user.id);
    await room.save();

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
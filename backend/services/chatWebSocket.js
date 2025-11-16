import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class ChatWebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
    this.onlineUsers = new Set();
  }

  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/chat'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('🔗 WebSocket server initialized for chat');
  }

  async handleConnection(ws, req) {
    try {
      // Extract token from query or header
      const token = this.extractToken(req);
      // Log connection attempt (mask token) for debugging
      try {
        const url = req.url || '';
        const masked = url.replace(/(token=)([^&\s]+)/i, '$1***');
        console.log('Incoming WS connection:', masked, 'from', req.socket?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown');
      } catch (e) {
        // ignore logging errors
      }
      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (verifyErr) {
        console.error('WebSocket JWT verify failed:', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
        try { ws.close(1008, 'Invalid token'); } catch (e) { /* ignore */ }
        return;
      }
      const user = await User.findById(decoded.id).select('fullName email role isActive');
      
      if (!user || !user.isActive) {
        ws.close(1008, 'Invalid user');
        return;
      }

      // Store connection
      this.clients.set(user._id.toString(), ws);
      this.onlineUsers.add(user._id.toString());

      // Update user online status
      await User.findByIdAndUpdate(user._id, {
        isOnline: true,
        lastSeen: new Date()
      });

      // Notify other users about online status
      this.broadcastUserStatus(user._id.toString(), 'online');

      // Send current online users to new connection
      ws.send(JSON.stringify({
        type: 'users_online',
        userIds: Array.from(this.onlineUsers)
      }));

      console.log(`👤 User ${user.fullName} connected to chat`);

      // Handle messages
      ws.on('message', (data) => {
        this.handleMessage(ws, user, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(user._id.toString());
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(user._id.toString());
      });

      // Ping-pong for connection health
      ws.on('pong', () => {
        ws.isAlive = true;
      });

    } catch (error) {
      console.error('Connection error:', error);
      try { ws.close(1011, 'Server error'); } catch (e) { /* ignore */ }
    }
  }

  extractToken(req) {
    // Try query parameter first
    const url = new URL(req.url, `http://${req.headers.host}`);
    let token = url.searchParams.get('token');
    
    // Try Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    return token;
  }

  async handleMessage(ws, user, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        case 'typing':
          this.broadcastToRoom(message.roomId, {
            type: 'user_typing',
            userId: user._id.toString(),
            roomId: message.roomId
          }, user._id.toString());
          break;
        case 'stop_typing':
          this.broadcastToRoom(message.roomId, {
            type: 'user_stop_typing',
            userId: user._id.toString(),
            roomId: message.roomId
          }, user._id.toString());
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  async handleDisconnection(userId) {
    // Remove from online users
    this.onlineUsers.delete(userId);
    this.clients.delete(userId);

    // Update user offline status
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      // Notify other users about offline status
      this.broadcastUserStatus(userId, 'offline');

      console.log(`👤 User ${userId} disconnected from chat`);
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  }

  broadcastUserStatus(userId, status) {
    const message = JSON.stringify({
      type: status === 'online' ? 'user_online' : 'user_offline',
      userId
    });

    this.clients.forEach((ws, clientId) => {
      if (clientId !== userId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  broadcastToRoom(roomId, message, excludeUserId = null) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  broadcast(message) {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  // Health check - ping all connections
  startHealthCheck() {
    setInterval(() => {
      this.clients.forEach((ws, userId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.isAlive = false;
          ws.ping();
          
          // Remove dead connections
          setTimeout(() => {
            if (!ws.isAlive) {
              this.handleDisconnection(userId);
              ws.terminate();
            }
          }, 5000);
        } else {
          this.handleDisconnection(userId);
        }
      });
    }, 30000); // Every 30 seconds
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.onlineUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }
}

export default new ChatWebSocketService();
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class TaskWebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
    this.firmClients = new Map(); // firmId -> Set of userIds
  }

  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/tasks',
      verifyClient: async (info, callback) => {
        try {
          // Extract token from query string
          const url = new URL(info.req.url, 'ws://localhost');
          const token = url.searchParams.get('token');
          
          if (!token) {
            callback(false, 401, 'Unauthorized');
            return;
          }

            // Verify token
            let decoded;
            try {
              decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
              console.error('Task WS JWT verify failed:', err && err.message ? err.message : err);
              callback(false, 401, 'Unauthorized');
              return;
            }

            // Support tokens with `id` or `userId` claim
            const userId = decoded.userId || decoded.id || decoded._id;
            const user = await User.findById(userId).populate('firmId');
          
          if (!user) {
            callback(false, 401, 'User not found');
            return;
          }

          // Attach user info to request
          info.req.user = user;
          callback(true);
        } catch (error) {
          console.error('WebSocket verification error:', error);
          callback(false, 401, 'Unauthorized');
        }
      }
    });

    console.log('🔗 WebSocket server initialized for task updates');

    this.wss.on('connection', (ws, req) => {
      const user = req.user;
      const userId = user._id.toString();
      const firmId = user.firmId._id.toString();
      
      console.log(`👤 Task WebSocket client connected: ${user.fullName || user.email} (${userId})`);
      
      // Store client connection
      this.clients.set(userId, ws);
      
      // Track firm memberships
      if (!this.firmClients.has(firmId)) {
        this.firmClients.set(firmId, new Set());
      }
      this.firmClients.get(firmId).add(userId);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Task updates WebSocket connected',
        userId,
        firmId,
        timestamp: new Date().toISOString()
      }));

      // Handle incoming messages (for ping/pong, etc.)
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`👤 Task WebSocket client disconnected: ${user.fullName || user.email}`);
        this.clients.delete(userId);
        
        // Remove from firm tracking
        const firmSet = this.firmClients.get(firmId);
        if (firmSet) {
          firmSet.delete(userId);
          if (firmSet.size === 0) {
            this.firmClients.delete(firmId);
          }
        }
      });

      ws.on('error', (error) => {
        console.error('Task WebSocket error:', error);
      });
    });

    // Periodic cleanup of closed connections
    setInterval(() => {
      this.cleanupClosedConnections();
    }, 30000); // Every 30 seconds
  }

  cleanupClosedConnections() {
    let cleaned = 0;
    for (const [userId, ws] of this.clients.entries()) {
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        this.clients.delete(userId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} closed task WebSocket connection(s)`);
    }
  }

  // Broadcast task update to all users in the same firm
  broadcastTaskUpdate(task, action = 'update', userId = null) {
    if (!task || !task.firm) {
      console.warn('⚠️ Cannot broadcast: task or firm is missing');
      return;
    }

    const firmId = task.firm._id ? task.firm._id.toString() : task.firm.toString();
    const firmUsers = this.firmClients.get(firmId);
    
    if (!firmUsers || firmUsers.size === 0) {
      console.log(`ℹ️ No active task WebSocket clients for firm ${firmId}`);
      return;
    }

    const message = JSON.stringify({
      type: 'task_update',
      action, // 'create', 'update', 'delete', 'status_change'
      data: task,
      userId: userId,
      timestamp: new Date().toISOString()
    });

    let sent = 0;
    for (const clientUserId of firmUsers) {
      const ws = this.clients.get(clientUserId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sent++;
      }
    }

    console.log(`📤 Broadcast task ${action} to ${sent} client(s) in firm ${firmId}`);
  }

  // Send task update to specific user
  sendToUser(userId, task, action = 'update') {
    const ws = this.clients.get(userId);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log(`ℹ️ User ${userId} not connected or connection not open`);
      return false;
    }

    const message = JSON.stringify({
      type: 'task_update',
      action,
      data: task,
      timestamp: new Date().toISOString()
    });

    ws.send(message);
    console.log(`📤 Sent task ${action} to user ${userId}`);
    return true;
  }

  // Get connection statistics
  getStats() {
    return {
      totalClients: this.clients.size,
      totalFirms: this.firmClients.size,
      firmBreakdown: Array.from(this.firmClients.entries()).map(([firmId, users]) => ({
        firmId,
        userCount: users.size
      }))
    };
  }

  // Health check
  startHealthCheck() {
    setInterval(() => {
      const stats = this.getStats();
      console.log(`💓 Task WebSocket Health: ${stats.totalClients} clients across ${stats.totalFirms} firms`);
    }, 60000); // Every minute
  }
}

export default new TaskWebSocketService();

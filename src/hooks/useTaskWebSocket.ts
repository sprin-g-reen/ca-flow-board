import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getValidatedToken } from '@/lib/auth';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:5000';

interface TaskWebSocketMessage {
  type: 'connected' | 'task_update' | 'pong';
  action?: 'create' | 'update' | 'delete' | 'status_change';
  data?: any;
  userId?: string;
  firmId?: string;
  message?: string;
  timestamp: string;
}

export const useTaskWebSocket = (enabled: boolean = true) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const queryClient = useQueryClient();
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled) {
      console.log('🔌 Task WebSocket disabled');
      return;
    }

    try {
      const token = getValidatedToken();
      if (!token) {
        console.warn('⚠️ No auth token available for WebSocket connection');
        return;
      }

      const wsUrl = `${WS_URL}/ws/tasks?token=${token}`;
      console.log('🔗 Connecting to task WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Task WebSocket connected');
        reconnectAttemptsRef.current = 0;
        
        // Start heartbeat
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Every 30 seconds

        ws.heartbeatInterval = heartbeatInterval;
      };

      ws.onmessage = (event) => {
        try {
          const message: TaskWebSocketMessage = JSON.parse(event.data);
          console.log('📨 Task WebSocket message received:', message);

          if (message.type === 'task_update') {
            // Invalidate and refetch tasks query to update UI
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            
            // Show notification based on action
            const action = message.action || 'updated';
            const taskTitle = message.data?.title || 'A task';
            
            console.log(`🔄 Task ${action}: ${taskTitle}`);
            
            // You can add toast notifications here if desired
            // toast.info(`Task ${action}: ${taskTitle}`);
          } else if (message.type === 'connected') {
            console.log('✅ Task WebSocket connection confirmed:', message.message);
          } else if (message.type === 'pong') {
            // Heartbeat response received
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Task WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('🔌 Task WebSocket disconnected:', event.code, event.reason);
        
        // Clear heartbeat
        if (ws.heartbeatInterval) {
          clearInterval(ws.heartbeatInterval);
        }

        // Attempt to reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached. Please refresh the page.');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [enabled, queryClient]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log('🔌 Closing task WebSocket connection');
      
      // Clear heartbeat
      if (wsRef.current.heartbeatInterval) {
        clearInterval(wsRef.current.heartbeatInterval);
      }
      
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect
  };
};

// Extend WebSocket interface to include custom properties
declare global {
  interface WebSocket {
    heartbeatInterval?: NodeJS.Timeout;
  }
}

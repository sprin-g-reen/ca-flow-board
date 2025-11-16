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

    console.log('� Task WebSocket temporarily disabled - using REST polling');
    
    // Poll for task updates every 10 seconds as fallback
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }, 10000);

    // Store interval ref for cleanup
    (wsRef as any).pollInterval = pollInterval;

  }, [enabled, queryClient]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log('🔌 Closing task WebSocket connection');
      
      // Clear poll interval if exists
      if ((wsRef as any).pollInterval) {
        clearInterval((wsRef as any).pollInterval);
      }
      
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
    isConnected: false,
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

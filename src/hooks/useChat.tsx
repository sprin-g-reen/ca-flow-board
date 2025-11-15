import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toast } from 'sonner';
import { getValidatedToken } from '@/lib/auth';
import { API_BASE_URL, buildWsUrl } from '@/config/api.config';

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
    role: string;
  };
  content: string;
  type: 'text' | 'file' | 'system';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  replyTo?: string;
  edited: boolean;
  editedAt?: string;
  isOnline?: boolean;
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  _id: string;
  name: string;
  type: 'general' | 'project' | 'direct';
  description?: string;
  participants: Array<{
    user: {
      _id: string;
      fullName: string;
      email: string;
      avatar?: string;
      role: string;
      isOnline: boolean;
      lastSeen?: string;
    };
    joinedAt: string;
    role: 'admin' | 'member';
  }>;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const useChat = () => {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectSignal, setReconnectSignal] = useState<number>(0);
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();

  // Fetch chat rooms
  const {
    data: rooms = [],
    isLoading: roomsLoading,
    refetch: refetchRooms
  } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const token = getValidatedToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(API_BASE_URL + '/chat/rooms', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms');
      }
      
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch messages for active room
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['chatMessages', activeRoom],
    queryFn: async () => {
      if (!activeRoom) return [];
      
      const token = getValidatedToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${activeRoom}/messages`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return response.json();
    },
    enabled: !!activeRoom && !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, content, type = 'text' }: {
      roomId: string;
      content: string;
      type?: 'text' | 'file';
    }) => {
      const token = getValidatedToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, type }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeRoom] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
    onError: (error) => {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    }
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async ({ name, type, participants }: {
      name: string;
      type: 'general' | 'project' | 'direct';
      participants: string[];
    }) => {
      const token = getValidatedToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(API_BASE_URL + '/chat/rooms', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, type, participants }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      toast.success('Chat room created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create chat room');
      console.error('Create room error:', error);
    }
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const token = getValidatedToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/read`, {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  // WebSocket for real-time updates
  useEffect(() => {
    if (!user) return;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;

    const backoff = (attempt: number) => Math.min(30000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 1000);

    const connect = () => {
      const wsToken = getValidatedToken();
      const wsUrl = wsToken ? buildWsUrl('chat', wsToken) : buildWsUrl('chat');
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to chat WebSocket');
        reconnectAttempts = 0;
        setIsConnected(true);
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              queryClient.invalidateQueries({ queryKey: ['chatMessages', data.roomId] });
              queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
              break;
            case 'user_online':
              setOnlineUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
              break;
            case 'user_offline':
              setOnlineUsers(prev => prev.filter(id => id !== data.userId));
              break;
            case 'users_online':
              setOnlineUsers(data.userIds);
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      
      ws.onclose = (ev) => {
        console.log('Disconnected from chat WebSocket', ev);
        setIsConnected(false);
        if (reconnectAttempts < maxReconnectAttempts) {
          const timeout = backoff(reconnectAttempts);
          reconnectAttempts += 1;
          console.log(`Reconnecting in ${timeout}ms (attempt ${reconnectAttempts})`);
          reconnectTimer = setTimeout(() => connect(), timeout);
        } else {
          console.warn('Max reconnect attempts reached for chat WebSocket');
          toast.error('Disconnected from chat. Reconnection attempts failed.');
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Close socket to trigger reconnect logic
        try { ws?.close(); } catch (e) { /* ignore */ }
      };
    };

  connect();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      try { ws?.close(); } catch (e) { /* ignore */ }
    };
  }, [user, queryClient, reconnectSignal]);


  const sendMessage = (roomId: string, content: string) => {
    if (!roomId) return;
    sendMessageMutation.mutate({ roomId, content });
  };

  const createRoom = (name: string, type: 'general' | 'project' | 'direct', participants: string[]) => {
    createRoomMutation.mutate({ name, type, participants });
  };

  const markAsRead = (roomId: string) => {
    markAsReadMutation.mutate(roomId);
  };

  const joinRoom = (roomId: string) => {
    setActiveRoom(roomId);
    markAsRead(roomId);
  };

  return {
    rooms,
    messages,
    activeRoom,
    onlineUsers,
    roomsLoading,
    messagesLoading,
    sendMessage,
    createRoom,
    markAsRead,
    joinRoom,
    refetchRooms,
    refetchMessages,
    isLoading: roomsLoading || messagesLoading,
    isSending: sendMessageMutation.isPending,
    isCreatingRoom: createRoomMutation.isPending,
    isConnected,
    reconnect: () => setReconnectSignal(s => s + 1),
  };
};
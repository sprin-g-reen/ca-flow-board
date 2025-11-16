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
  type: 'text' | 'file' | 'system' | 'ai';
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
    refetch: refetchRooms,
    error: roomsError
  } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const token = getValidatedToken();
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const url = API_BASE_URL + '/chat/rooms';
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch chat rooms: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch messages for active room
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
    error: messagesError
  } = useQuery({
    queryKey: ['chatMessages', activeRoom],
    queryFn: async () => {
      if (!activeRoom) {
        return [];
      }
      
      const token = getValidatedToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const url = `${API_BASE_URL}/chat/rooms/${activeRoom}/messages`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    enabled: !!activeRoom && !!user,
    retry: 3,
    retryDelay: 1000,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create room (${response.status})`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      // Only show toast for non-project rooms (project rooms are created silently for tasks)
      if (variables.type !== 'project') {
        toast.success('Chat room created successfully');
      }
    },
    onError: (error: any, variables) => {
      // Only show error toast for non-project rooms
      if (variables.type !== 'project') {
        toast.error(error.message || 'Failed to create chat room');
      }
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

  // REST API polling for updates
  useEffect(() => {
    if (!user) {
      return;
    }
    
    setIsConnected(false);
    
    // Poll for new messages every 5 seconds
    const pollInterval = setInterval(() => {
      if (activeRoom) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', activeRoom] });
      }
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user, queryClient, activeRoom]);


  // Async helpers (return promise) so callers can await created room or message
  const sendMessageAsync = async (roomId: string, content: string, type: 'text' | 'file' = 'text') => {
    if (!roomId) throw new Error('Room ID required');
    return sendMessageMutation.mutateAsync({ roomId, content, type } as any);
  };

  const sendMessage = (roomId: string, content: string) => {
    if (!roomId) return;
    sendMessageMutation.mutate({ roomId, content });
  };

  const createRoomAsync = async (payload: { name: string; type: 'general' | 'project' | 'direct'; participants: string[] }) => {
    return createRoomMutation.mutateAsync(payload as any);
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
  sendMessageAsync,
    createRoom,
  createRoomAsync,
    markAsRead,
    joinRoom,
    refetchRooms,
    refetchMessages,
    isLoading: roomsLoading || messagesLoading,
    isSending: sendMessageMutation.isPending,
    isCreatingRoom: createRoomMutation.isPending,
    isConnected: false, // Always false - WebSocket disabled
    reconnect: () => console.log('WebSocket disabled'),
    roomsError,
    messagesError,
  };
};
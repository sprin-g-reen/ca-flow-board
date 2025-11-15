import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video,
  Smile,
  Circle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'client';
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
  participants?: string[];
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image';
  isOwn: boolean;
}

export default function EmployeeChat() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock chat rooms - replace with real API data
  const [chatRooms] = useState<ChatRoom[]>([
    {
      id: '1',
      name: 'Team General',
      type: 'group',
      lastMessage: 'Meeting scheduled for 3 PM',
      lastMessageTime: new Date(Date.now() - 300000),
      unreadCount: 3,
      isOnline: true,
      participants: ['user1', 'user2', 'user3']
    },
    {
      id: '2',
      name: 'John Doe (Admin)',
      type: 'direct',
      lastMessage: 'Can you review the report?',
      lastMessageTime: new Date(Date.now() - 3600000),
      unreadCount: 1,
      isOnline: true
    },
    {
      id: '3',
      name: 'Client: ABC Corp',
      type: 'client',
      lastMessage: 'Thank you for the update',
      lastMessageTime: new Date(Date.now() - 7200000),
      unreadCount: 0,
      isOnline: false
    }
  ]);

  // Mock messages - replace with real API data
  const [messages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'user2',
      senderName: 'Sarah Wilson',
      content: 'Hey team! Quick reminder about today\'s client meeting.',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text',
      isOwn: false
    },
    {
      id: '2',
      senderId: user?.id || '',
      senderName: user?.fullName || 'You',
      content: 'Got it! I\'ll prepare the presentation.',
      timestamp: new Date(Date.now() - 1200000),
      type: 'text',
      isOwn: true
    },
    {
      id: '3',
      senderId: 'user3',
      senderName: 'Mike Johnson',
      content: 'I\'ll join from the office. See you all soon!',
      timestamp: new Date(Date.now() - 600000),
      type: 'text',
      isOwn: false
    }
  ]);

  useEffect(() => {
    // Select first room by default
    if (chatRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(chatRooms[0]);
    }
  }, [chatRooms, selectedRoom]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoom) return;

    // TODO: Implement actual message sending via API
    console.log('Sending message:', messageInput);
    setMessageInput('');
  };

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`p-4 cursor-pointer hover:bg-accent transition-colors border-b border-border ${
                selectedRoom?.id === room.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {room.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {room.isOnline && (
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">{room.name}</h3>
                    {room.lastMessageTime && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(room.lastMessageTime, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {room.lastMessage || 'No messages yet'}
                    </p>
                    {room.unreadCount > 0 && (
                      <Badge className="bg-blue-600 text-white text-xs h-5 min-w-5 flex items-center justify-center rounded-full">
                        {room.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                  {selectedRoom.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedRoom.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedRoom.type === 'group' 
                    ? `${selectedRoom.participants?.length || 0} participants`
                    : selectedRoom.isOnline 
                    ? 'Online' 
                    : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isOwn && (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                      {message.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[60%] ${message.isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!message.isOwn && (
                    <span className="text-xs text-muted-foreground mb-1 ml-1">
                      {message.senderName}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.isOwn
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                        : 'bg-card border border-border rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 ml-1">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </span>
                </div>

                {message.isOwn && (
                  <Avatar className="h-8 w-8 ml-2">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                      {user?.fullName?.charAt(0).toUpperCase() || 'Y'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Smile className="h-5 w-5" />
              </Button>
              
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
              />
              
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <div className="text-4xl mb-2">💬</div>
            <h3 className="text-lg font-semibold mb-1">No conversation selected</h3>
            <p className="text-sm text-muted-foreground">
              Choose a conversation from the list to start chatting
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

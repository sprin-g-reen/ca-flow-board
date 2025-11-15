import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
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
  Circle,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useChat, ChatRoom, ChatMessage } from '@/hooks/useChat';
import { toast } from 'sonner';

export default function EmployeeChat() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    rooms,
    messages,
    activeRoom,
    onlineUsers,
    roomsLoading,
    messagesLoading,
    sendMessage,
    joinRoom,
    isConnected,
    isSending
  } = useChat();

  // Get selected room data
  const selectedRoom = rooms.find((r: ChatRoom) => r._id === activeRoom);

  useEffect(() => {
    // Select first room by default
    if (rooms.length > 0 && !activeRoom) {
      joinRoom(rooms[0]._id);
    }
  }, [rooms, activeRoom, joinRoom]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeRoom) {
      toast.error('Please enter a message');
      return;
    }

    sendMessage(activeRoom, messageInput);
    setMessageInput('');
  };

  const filteredRooms = rooms.filter((room: ChatRoom) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.type === 'direct') {
      // For direct messages, show the other participant's name
      const otherParticipant = room.participants.find(
        p => p.user._id !== user?.id
      );
      return otherParticipant?.user.fullName || room.name;
    }
    return room.name;
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  if (roomsLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex relative">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-2 right-2 z-50">
          <Badge variant="destructive" className="flex items-center gap-1">
            <Circle className="h-2 w-2 fill-current" />
            Disconnected
          </Badge>
        </div>
      )}

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
          {filteredRooms.map((room: ChatRoom) => {
            const displayName = getRoomDisplayName(room);
            const roomOnline = room.type === 'direct' 
              ? room.participants.some(p => p.user._id !== user?.id && isUserOnline(p.user._id))
              : false;

            return (
              <div
                key={room._id}
                onClick={() => joinRoom(room._id)}
                className={`p-4 cursor-pointer hover:bg-accent transition-colors border-b border-border ${
                  selectedRoom?._id === room._id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {roomOnline && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">{displayName}</h3>
                      {room.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {room.lastMessage?.content || 'No messages yet'}
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
            );
          })}
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
                  {getRoomDisplayName(selectedRoom).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{getRoomDisplayName(selectedRoom)}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedRoom.type === 'general' 
                    ? `${selectedRoom.participants?.length || 0} participants`
                    : selectedRoom.participants?.some(p => p.user._id !== user?.id && isUserOnline(p.user._id))
                    ? 'Online' 
                    : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" title="Voice Call">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Video Call">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="More Options">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {messages.map((message: ChatMessage) => {
                  const isOwn = message.sender._id === user?.id;
                  return (
                    <div
                      key={message._id}
                      className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwn && (
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                            {message.sender.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`max-w-[60%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isOwn && (
                          <span className="text-xs text-muted-foreground mb-1 ml-1">
                            {message.sender.fullName}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                              : 'bg-card border border-border rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 ml-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {isOwn && (
                        <Avatar className="h-8 w-8 ml-2">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                            {user?.fullName?.charAt(0).toUpperCase() || 'Y'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" title="Attach File">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Add Emoji">
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
                disabled={isSending}
              />
              
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
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

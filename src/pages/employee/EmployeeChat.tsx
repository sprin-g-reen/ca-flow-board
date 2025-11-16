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
    isSending,
    roomsError,
    messagesError
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

  if (roomsError) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold mb-1">Failed to load chat</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {roomsError instanceof Error ? roomsError.message : 'An error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 border-r border-border flex flex-col bg-card shadow-sm">
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <h2 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Messages</h2>
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
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="font-semibold mb-1">No conversations yet</h3>
              <p className="text-sm text-muted-foreground">
                Start a new conversation to get started
              </p>
            </div>
          ) : (
            filteredRooms.map((room: ChatRoom) => {
            const displayName = getRoomDisplayName(room);
            const roomOnline = room.type === 'direct' 
              ? room.participants.some(p => p.user._id !== user?.id && isUserOnline(p.user._id))
              : false;

            return (
              <div
                key={room._id}
                onClick={() => joinRoom(room._id)}
                className={`p-4 cursor-pointer hover:bg-accent/50 transition-all duration-200 border-b border-border group ${
                  selectedRoom?._id === room._id ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {roomOnline && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500 ring-2 ring-card" />
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
                      <p className={`text-sm truncate ${room.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {room.lastMessage?.content || 'No messages yet'}
                      </p>
                      {room.unreadCount > 0 && (
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs h-5 min-w-5 flex items-center justify-center rounded-full ml-2 shadow-sm">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-gradient-to-r from-card to-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                  {getRoomDisplayName(selectedRoom).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{getRoomDisplayName(selectedRoom)}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {selectedRoom.type === 'general' 
                    ? (
                      <>
                        <span>{selectedRoom.participants?.length || 0} participants</span>
                      </>
                    )
                    : selectedRoom.participants?.some(p => p.user._id !== user?.id && isUserOnline(p.user._id))
                    ? (
                      <>
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                        <span>Online</span>
                      </>
                    )
                    : (
                      <>
                        <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
                        <span>Offline</span>
                      </>
                    )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Removed Voice/Video call buttons and More Options for employees */}
              {/* Employees can only send messages, not manage rooms or make calls */}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-muted/30 to-muted/10">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first to start the conversation!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message: ChatMessage) => {
                  const isOwn = message.sender._id === user?.id;
                  return (
                    <div
                      key={message._id}
                      className={`flex mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwn && (
                        <Avatar className="h-8 w-8 mr-2 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all">
                          <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                            {message.sender.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`max-w-[60%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isOwn && (
                          <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">
                            {message.sender.fullName}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            isOwn
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                              : 'bg-card border border-border rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 ml-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {isOwn && (
                        <Avatar className="h-8 w-8 ml-2 ring-2 ring-blue-500/20">
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

          {/* Message Input - Simple text-only for employees */}
          <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="pr-4 py-3 rounded-xl border-2 focus:border-blue-500 transition-colors"
                  disabled={isSending}
                />
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  Press Enter to send
                </p>
              </div>
              
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6 py-3 h-auto shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
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
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
              <div className="text-6xl">💬</div>
            </div>
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              No conversation selected
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Choose a conversation from the list to start chatting with your team
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
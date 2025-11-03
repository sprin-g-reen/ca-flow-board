import { useState, useRef, useEffect } from 'react';
import { useChat, ChatRoom, ChatMessage } from '@/hooks/useChat';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Search, 
  MoreVertical, 
  Hash, 
  Users, 
  Circle,
  Phone,
  Video,
  Info,
  Settings,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatSidebar = ({ isOpen, onToggle }: ChatSidebarProps) => {
  const {
    rooms,
    messages,
    activeRoom,
    onlineUsers,
    sendMessage,
    createRoom,
    joinRoom,
    isLoading,
    isSending
  } = useChat();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'general' | 'project' | 'direct'>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredRooms = rooms.filter((room: ChatRoom) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoomData = rooms.find((room: ChatRoom) => room._id === activeRoom);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeRoom) return;
    
    sendMessage(messageText);
    setMessageText('');
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    createRoom(newRoomName, newRoomType, []);
    setNewRoomName('');
    setShowCreateRoom(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h2 className="font-semibold">Team Chat</h2>
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <Input
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
                <Select value={newRoomType} onValueChange={(value: any) => setNewRoomType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="direct">Direct Message</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="w-full">
                  Create Room
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Rooms List */}
        <div className="w-64 border-r flex flex-col">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Rooms */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredRooms.map((room: ChatRoom) => (
                <button
                  key={room._id}
                  onClick={() => joinRoom(room._id)}
                  className={`w-full p-2 rounded-md text-left hover:bg-accent transition-colors ${
                    activeRoom === room._id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {room.type === 'general' && <Hash className="h-4 w-4 text-muted-foreground" />}
                      {room.type === 'project' && <Users className="h-4 w-4 text-muted-foreground" />}
                      {room.type === 'direct' && (
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={room.participants[1]?.user?.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(room.participants[1]?.user?.fullName || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          {isUserOnline(room.participants[1]?.user?._id) && (
                            <Circle className="absolute -bottom-1 -right-1 h-3 w-3 fill-green-500 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{room.name}</span>
                        {room.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {room.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {room.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeRoomData ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeRoomData.type === 'general' && <Hash className="h-4 w-4" />}
                  {activeRoomData.type === 'project' && <Users className="h-4 w-4" />}
                  {activeRoomData.type === 'direct' && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activeRoomData.participants[1]?.user?.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(activeRoomData.participants[1]?.user?.fullName || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h3 className="font-medium text-sm">{activeRoomData.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeRoomData.participants.length} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map((message: ChatMessage) => (
                    <div key={message._id} className="flex gap-2">
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarImage src={message.sender.avatar} />
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{message.sender.fullName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5 whitespace-pre-wrap">{message.content}</p>
                        {message.edited && (
                          <span className="text-xs text-muted-foreground italic">(edited)</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder={`Message #${activeRoomData.name}`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button type="submit" size="icon" disabled={!messageText.trim() || isSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Welcome to Team Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Select a room to start chatting with your team
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
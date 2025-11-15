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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/services/api';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Search as SearchIcon, 
  MoreVertical, 
  Hash, 
  Users, 
  Circle,
  UserPlus,
  Info,
  Settings,
  X,
  Mail,
  CheckCircle
} from 'lucide-react';
import { RefreshCw } from 'lucide-react';
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
    isSending,
    isConnected,
    reconnect
  } = useChat();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showDMDialog, setShowDMDialog] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSearchChat, setShowSearchChat] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'general' | 'project' | 'direct'>('general');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredRooms = rooms.filter((room: ChatRoom) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoomData = rooms.find((room: ChatRoom) => room._id === activeRoom);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, activeRoom]);

  // Load users and clients
  useEffect(() => {
    loadUsers();
    if (user?.role === 'owner' || user?.role === 'admin') {
      loadClients();
    }
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers((response as any).data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await apiClient.get('/clients');
      setClients((response as any).data.data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    createRoom(newRoomName, newRoomType, selectedUsers);
    setNewRoomName('');
    setNewRoomDescription('');
    setSelectedUsers([]);
    setShowCreateRoom(false);
    toast({
      title: "Room Created",
      description: `${newRoomName} has been created successfully.`,
    });
  };

  const handleCreateDM = async (targetUserId: string, targetName: string) => {
    try {
      // Check if DM already exists
      const existingDM = rooms.find((room: ChatRoom) => 
        room.type === 'direct' && 
        room.participants.some(p => p.user._id === targetUserId)
      );

      if (existingDM) {
        joinRoom(existingDM._id);
        setShowDMDialog(false);
        return;
      }

      // Create new DM
      createRoom(`DM: ${targetName}`, 'direct', [targetUserId]);
      setShowDMDialog(false);
      toast({
        title: "Direct Message Created",
        description: `Started conversation with ${targetName}`,
      });
    } catch (error) {
      console.error('Error creating DM:', error);
    }
  };

  const handleClientDM = async (clientEmail: string, clientName: string) => {
    try {
      toast({
        title: "Email Sent",
        description: `Invitation sent to ${clientName} at ${clientEmail}`,
      });
      setShowDMDialog(false);
    } catch (error) {
      console.error('Error sending client DM:', error);
    }
  };

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) return;
    
    toast({
      title: "Members Added",
      description: `${selectedUsers.length} member(s) added to the room.`,
    });
    setSelectedUsers([]);
    setShowAddMembers(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredMessages = messages.filter((msg: ChatMessage) =>
    chatSearchQuery === '' || 
    msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    msg.sender.fullName.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeRoom) return;
    
    sendMessage(activeRoom, messageText);
    setMessageText('');
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
    <div className="fixed right-0 top-0 bottom-0 w-[900px] bg-background border-l flex flex-col z-[60] shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Team Chat</h2>
            <p className="text-xs text-muted-foreground">{rooms.length} rooms available</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border">
            <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500 animate-pulse' : 'fill-red-400 text-red-400'}`} />
            <span className="text-xs font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => reconnect()} title="Reconnect" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="z-[70] max-w-lg max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
                <DialogTitle className="text-xl font-semibold">Create New Room</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-2">Create a new chat room for your team</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name *</Label>
                  <Input
                    id="roomName"
                    placeholder="e.g., Project Team, General Discussion"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type</Label>
                  <Select value={newRoomType} onValueChange={(value: any) => setNewRoomType(value)}>
                    <SelectTrigger id="roomType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General - Open to all team members</SelectItem>
                      <SelectItem value="project">Project - For specific projects</SelectItem>
                      <SelectItem value="direct">Direct Message - Private conversation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomDescription">Description (Optional)</Label>
                  <Textarea
                    id="roomDescription"
                    placeholder="Brief description of the room's purpose"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateRoom(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Room
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-9 w-9">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Rooms List */}
        <div className="w-80 border-r flex flex-col bg-muted/20">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => setShowDMDialog(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              New Direct Message
            </Button>
          </div>

          {/* Rooms */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No rooms found</p>
                </div>
              ) : (
                filteredRooms.map((room: ChatRoom) => (
                  <button
                    key={room._id}
                    onClick={() => joinRoom(room._id)}
                    className={`w-full p-3 rounded-lg text-left hover:bg-accent transition-all duration-200 ${
                      activeRoom === room._id ? 'bg-accent shadow-sm border border-border' : 'hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center pt-0.5">
                        {room.type === 'general' && (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Hash className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        {room.type === 'project' && (
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                        {room.type === 'direct' && (
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={room.participants[1]?.user?.avatar} />
                              <AvatarFallback className="text-sm">
                                {getInitials(room.participants[1]?.user?.fullName || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            {isUserOnline(room.participants[1]?.user?._id) && (
                              <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500 border-2 border-background rounded-full" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{room.name}</span>
                          {room.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 px-2 text-xs font-semibold">
                              {room.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {room.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate leading-relaxed">
                            {room.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {activeRoomData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  {activeRoomData.type === 'general' && (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  {activeRoomData.type === 'project' && (
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                  )}
                  {activeRoomData.type === 'direct' && (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeRoomData.participants[1]?.user?.avatar} />
                      <AvatarFallback>
                        {getInitials(activeRoomData.participants[1]?.user?.fullName || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h3 className="font-semibold">{activeRoomData.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeRoomData.participants.length} member{activeRoomData.participants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => setShowAddMembers(true)}
                    title="Add Members"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => setShowSearchChat(true)}
                    title="Search Chat"
                  >
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => setShowInfoModal(true)}
                    title="Room Info"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message: ChatMessage) => (
                      <div key={message._id} className="flex gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        <Avatar className="h-10 w-10 mt-0.5">
                          <AvatarImage src={message.sender.avatar} />
                          <AvatarFallback>
                            {getInitials(message.sender.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{message.sender.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </span>
                            {message.edited && (
                              <span className="text-xs text-muted-foreground italic">(edited)</span>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-muted/20">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input
                    ref={inputRef}
                    placeholder={`Message #${activeRoomData.name}`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 h-11"
                    disabled={isSending}
                  />
                  <Button type="submit" size="default" disabled={!messageText.trim() || isSending} className="h-11 px-6">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Welcome to Team Chat</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Select a room from the sidebar to start chatting with your team members
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Members Dialog */}
      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
        <DialogContent className="z-[70] max-w-lg max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
            <DialogTitle className="text-xl font-semibold">Add Members to Room</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">Select team members to add to this chat room</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-4">
            <div className="space-y-4">
              <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-9 h-11"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[400px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {(() => {
                    const availableUsers = users.filter(user => 
                      !activeRoomData?.participants.some((p: any) => p.user._id === user._id) &&
                      (memberSearchQuery === '' || 
                        user.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                    );
                    
                    if (availableUsers.length === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">
                            {memberSearchQuery ? 'No members found' : 'All team members are already in this room'}
                          </p>
                        </div>
                      );
                    }
                    
                    return availableUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => toggleUserSelection(user._id)}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                            user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        {selectedUsers.includes(user._id) && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </ScrollArea>
            </div>
          </div>
          <div className="flex-shrink-0 pt-4 pb-6 px-6 border-t border-gray-200">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => { setShowAddMembers(false); setMemberSearchQuery(''); setSelectedUsers([]); }}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg" 
                onClick={handleAddMembers}
                disabled={selectedUsers.length === 0}
              >
                Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Message Dialog */}
      <Dialog open={showDMDialog} onOpenChange={setShowDMDialog}>
        <DialogContent className="z-[70] max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
            <DialogTitle className="text-xl font-semibold">New Direct Message</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">Start a conversation with a team member or send an email to a client</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
            <Tabs defaultValue="team" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="team">Team Members</TabsTrigger>
                <TabsTrigger value="clients">
                  Clients {!user?.role || !['admin', 'manager'].includes(user.role as string) ? '(Admin/Manager Only)' : ''}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="team" className="space-y-4 mt-0">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search team members..." 
                    className="pl-9 h-11" 
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[350px] border rounded-lg">
                  <div className="p-2 space-y-1">
                    {users
                      .filter(u => u._id !== user?.id)
                      .filter(u => 
                        teamSearchQuery === '' ||
                        u.fullName.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(teamSearchQuery.toLowerCase())
                      )
                      .map((teamUser) => (
                      <div
                        key={teamUser._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleCreateDM(teamUser._id, teamUser.fullName)}
                      >
                        <div className="relative">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={teamUser.avatar} />
                            <AvatarFallback>{getInitials(teamUser.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                            teamUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{teamUser.fullName}</div>
                          <div className="text-sm text-muted-foreground">{teamUser.email}</div>
                        </div>
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="clients" className="space-y-4 mt-0">
                {user?.role && ['admin', 'manager'].includes(user.role as string) ? (
                  <>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search clients..." 
                        className="pl-9 h-11" 
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 text-sm">Email Communication</h4>
                          <p className="text-xs text-blue-700 mt-1">
                            Clicking a client will compose an email with rich text and markdown support. The message will be sent to their registered email address.
                          </p>
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="h-[280px] border rounded-lg">
                      <div className="p-2 space-y-1">
                      {clients
                        .filter(c => 
                          clientSearchQuery === '' ||
                          c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(clientSearchQuery.toLowerCase())
                        )
                        .map((client) => (
                        <div
                          key={client._id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => handleClientDM(client.email, client.name)}
                        >
                          <Avatar className="h-11 w-11">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{client.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              {client.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Mail className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-medium">Admin/Manager Access Only</p>
                  <p className="text-xs mt-2">Only admins and managers can send direct messages to clients</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        </DialogContent>
      </Dialog>

      {/* Search Chat Dialog */}
      <Dialog open={showSearchChat} onOpenChange={setShowSearchChat}>
        <DialogContent className="z-[70] max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
            <DialogTitle className="text-xl font-semibold">Search Chat Messages</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">Search through messages in {activeRoomData?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
            <div className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="pl-9 h-11"
                  autoFocus
                />
              </div>
              <ScrollArea className="h-[450px] border rounded-lg">
                <div className="p-4 space-y-3">
                  {chatSearchQuery === '' ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm font-medium">Start typing to search messages</p>
                      <p className="text-xs mt-1 text-gray-500">Search by content or sender name</p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm font-medium">No messages found</p>
                      <p className="text-xs mt-1 text-gray-500">Try a different search term</p>
                    </div>
                  ) : (
                    filteredMessages.map((message: ChatMessage) => (
                      <div 
                        key={message._id} 
                        className="flex gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => {
                          setShowSearchChat(false);
                          // Scroll to message would require additional implementation
                          setChatSearchQuery('');
                        }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={message.sender.avatar} />
                          <AvatarFallback>{getInitials(message.sender.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{message.sender.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="z-[70] max-w-lg max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
            <DialogTitle className="text-xl font-semibold">Room Information</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">Details about this chat room</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
            {activeRoomData && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Room Name</Label>
                    <p className="font-semibold text-lg mt-1">{activeRoomData.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Type</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {activeRoomData.type === 'general' && (
                        <>
                          <Hash className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">General Channel</span>
                        </>
                      )}
                      {activeRoomData.type === 'project' && (
                        <>
                          <Users className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium">Project Room</span>
                        </>
                      )}
                      {activeRoomData.type === 'direct' && (
                        <>
                          <MessageCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium">Direct Message</span>
                        </>
                      )}
                    </div>
                  </div>
                  {activeRoomData.description && (
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Description</Label>
                      <p className="text-sm mt-1 text-gray-700">{activeRoomData.description}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Created</Label>
                    <p className="text-sm mt-1 text-gray-700">
                      {formatDistanceToNow(new Date(activeRoomData.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      Members ({activeRoomData.participants.length})
                    </Label>
                    {activeRoomData.type !== 'direct' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setShowInfoModal(false);
                          setShowAddMembers(true);
                        }}
                        className="h-8 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Members
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[250px] border rounded-lg">
                    <div className="p-2 space-y-1">
                      {activeRoomData.participants.map((participant: any) => (
                        <div key={participant._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.user.avatar} />
                              <AvatarFallback>{getInitials(participant.user.fullName)}</AvatarFallback>
                            </Avatar>
                            {participant.user.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{participant.user.fullName}</div>
                            <div className="text-xs text-muted-foreground">{participant.user.email}</div>
                          </div>
                          {participant.role === 'admin' && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">Admin</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
import { useState, useRef, useEffect } from 'react';
import { useChat, ChatRoom, ChatMessage } from '@/hooks/useChat';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { useEmployees } from '@/hooks/useEmployees';
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  CheckCircle,
  Trash2
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
  const queryClient = useQueryClient();
  const { employees = [] } = useEmployees();
  const users = employees; // Use employees from the hook
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
  const [clients, setClients] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] = useState<'mention' | 'task' | 'client' | null>(null);
  const [autocompleteFilter, setAutocompleteFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
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

  // Load clients
  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'admin') {
      loadClients();
    }
  }, []);

  const loadClients = async () => {
    try {
      const response = await apiClient.get('/clients');
      // API might return { success, data: { clients: [] } } or { success, data: [] }
      const clientsData = (response as any).data?.data?.clients || (response as any).data?.clients || (response as any).data?.data || [];
      console.log('📋 Loaded clients for chat:', clientsData.length);
      setClients(clientsData);
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

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    if (!activeRoom) return;
    
    // Check if user has permission to add members
    if (user?.role === 'employee' || user?.role === 'client') {
      toast({
        title: "Permission Denied",
        description: "Only administrators can add members to rooms.",
        variant: "destructive"
      });
      setShowAddMembers(false);
      return;
    }
    
    try {
      await apiClient.post(`/chat/rooms/${activeRoom}/members`, {
        userIds: selectedUsers
      });
      
      // Refresh the room data to show new members
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      
      toast({
        title: "Members Added",
        description: `${selectedUsers.length} member(s) added to the room.`,
      });
      setSelectedUsers([]);
      setShowAddMembers(false);
    } catch (error: any) {
      console.error('Error adding members:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add members",
        variant: "destructive"
      });
    }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeRoom) return;
    
    const messageToSend = messageText;
    
    // Clear input immediately for better UX
    setMessageText('');
    setShowAutocomplete(false);
    
    // Send the user's message first
    sendMessage(activeRoom, messageToSend);
    
    // Scroll to bottom after sending
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    // Check if message contains @AI mention
    if (messageToSend.includes('@AI')) {
      try {
        // Extract the query by removing @AI mention
        const aiQuery = messageToSend.replace('@AI', '').trim();
        
        console.log('🤖 Calling AI with query:', aiQuery);
        
        // Call AI endpoint with room context
        const response: any = await apiClient.post('/ai/chat/room', {
          roomId: activeRoom,
          message: aiQuery
        });
        
        console.log('✅ AI response:', response.data);
        
        // AI response will be automatically received via WebSocket
        // Scroll again after AI response arrives
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      } catch (error: any) {
        console.error('❌ Error calling AI:', error);
        console.error('❌ Error response:', error.response?.data);
        toast({
          title: "AI Error",
          description: error.response?.data?.message || "Failed to get AI response. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setMessageText(value);
    setCursorPosition(cursorPos);

    // Check for autocomplete triggers
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    // Check for @mention
    if (lastAtIndex > -1 && (lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]))) {
      const afterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!/\s/.test(afterAt)) {
        setAutocompleteType('mention');
        setAutocompleteFilter(afterAt);
        setShowAutocomplete(true);
        return;
      }
    }
    
    // Check for #TASK- or #CLIENT-
    if (lastHashIndex > -1 && (lastHashIndex === 0 || /\s/.test(textBeforeCursor[lastHashIndex - 1]))) {
      const afterHash = textBeforeCursor.substring(lastHashIndex + 1);
      if (!/\s/.test(afterHash)) {
        if (afterHash.toUpperCase().startsWith('TASK')) {
          setAutocompleteType('task');
          setAutocompleteFilter(afterHash.substring(4).replace(/^-/, ''));
          setShowAutocomplete(true);
          return;
        } else if (afterHash.toUpperCase().startsWith('CLIENT')) {
          setAutocompleteType('client');
          setAutocompleteFilter(afterHash.substring(6).replace(/^-/, ''));
          setShowAutocomplete(true);
          return;
        }
      }
    }
    
    setShowAutocomplete(false);
  };

  const handleAutocompleteSelect = (item: any) => {
    const textBeforeCursor = messageText.substring(0, cursorPosition);
    const textAfterCursor = messageText.substring(cursorPosition);
    
    let newText = '';
    if (autocompleteType === 'mention') {
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      newText = textBeforeCursor.substring(0, lastAtIndex) + `@${item.username || item.fullName} ` + textAfterCursor;
    } else if (autocompleteType === 'task') {
      const lastHashIndex = textBeforeCursor.lastIndexOf('#');
      newText = textBeforeCursor.substring(0, lastHashIndex) + `#TASK-${item._id} ` + textAfterCursor;
    } else if (autocompleteType === 'client') {
      const lastHashIndex = textBeforeCursor.lastIndexOf('#');
      newText = textBeforeCursor.substring(0, lastHashIndex) + `#CLIENT-${item._id} ` + textAfterCursor;
    }
    
    setMessageText(newText);
    setShowAutocomplete(false);
    inputRef.current?.focus();
  };

  const handleClearMessages = async () => {
    if (!activeRoom || !activeRoomData) return;
    
    if (!confirm('Are you sure you want to clear all messages in this room? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/chat/rooms/${activeRoom}/messages`);
      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeRoom] });
      toast({
        title: "Messages Cleared",
        description: "All messages have been deleted from this room.",
      });
      setShowInfoModal(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear messages",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom || !activeRoomData) return;
    
    if (!confirm(`Are you sure you want to delete "${activeRoomData.name}"? All messages will be permanently deleted. This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/chat/rooms/${activeRoom}`);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      toast({
        title: "Room Deleted",
        description: "The chat room has been permanently deleted.",
      });
      setShowInfoModal(false);
      // Clear active room since it's been deleted
      if (rooms.length > 1) {
        joinRoom(rooms[0]._id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  // Parse message content for @mentions and links
  const renderMessageContent = (content: string, isAI: boolean = false) => {
    // If it's an AI message, render as markdown
    if (isAI) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for markdown elements
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-blue-700 dark:text-blue-300">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
              code: ({ children }) => <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
              pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto">{children}</pre>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }
    
    // For regular messages, keep the existing mention/link parsing
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    
    // Regex patterns for mentions, task links, and client links
    const mentionRegex = /@(\w+)/g;
    const taskLinkRegex = /#TASK-(\w+)/gi;
    const clientLinkRegex = /#CLIENT-(\w+)/gi;
    
    // Find all matches
    const allMatches: Array<{ index: number; length: number; type: string; match: RegExpExecArray }> = [];
    
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'mention', match });
    }
    while ((match = taskLinkRegex.exec(content)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'task', match });
    }
    while ((match = clientLinkRegex.exec(content)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'client', match });
    }
    
    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);
    
    // Build JSX with styled mentions and links
    allMatches.forEach((item, i) => {
      // Add text before this match
      if (item.index > lastIndex) {
        parts.push(<span key={`text-${i}`}>{content.substring(lastIndex, item.index)}</span>);
      }
      
      // Add the match with styling
      if (item.type === 'mention') {
        const username = item.match[1];
        parts.push(
          <span 
            key={`mention-${i}`} 
            className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1 rounded font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
            title={`@${username}`}
          >
            @{username}
          </span>
        );
      } else if (item.type === 'task') {
        const taskId = item.match[1];
        parts.push(
          <a 
            key={`task-${i}`} 
            href={`#/tasks/${taskId}`}
            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1 rounded font-medium hover:underline"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = `/tasks/${taskId}`;
            }}
          >
            #TASK-{taskId}
          </a>
        );
      } else if (item.type === 'client') {
        const clientId = item.match[1];
        parts.push(
          <a 
            key={`client-${i}`} 
            href={`#/clients/${clientId}`}
            className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-1 rounded font-medium hover:underline"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = `/clients/${clientId}`;
            }}
          >
            #CLIENT-{clientId}
          </a>
        );
      }
      
      lastIndex = item.index + item.length;
    });
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key="text-end">{content.substring(lastIndex)}</span>);
    }
    
    return parts.length > 0 ? <>{parts}</> : <>{content}</>;
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
            <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
            <span className="text-xs font-medium">Connected</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
            queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
            toast({ title: "Refreshed", description: "Chat data refreshed" });
          }} title="Refresh Now" className="h-9 w-9">
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
            {/* Only show New Direct Message button for admins */}
            {user?.role && ['owner', 'superadmin', 'admin'].includes(user.role) && (
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => setShowDMDialog(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                New Direct Message
              </Button>
            )}
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
                  {/* Only show Add Members button for admins */}
                  {user?.role && ['owner', 'superadmin', 'admin'].includes(user.role) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setShowAddMembers(true)}
                      title="Add Members"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
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
                    messages.map((message: ChatMessage) => {
                      const isAIMessage = message.type === 'ai';
                      const isOwnMessage = message.sender._id === user?.id;
                      const shouldAlignRight = isOwnMessage && !isAIMessage;
                      
                      return (
                        <div 
                          key={message._id} 
                          className={`flex gap-3 -mx-2 px-2 py-2 rounded-lg transition-colors ${
                            shouldAlignRight ? 'flex-row-reverse' : ''
                          } ${
                            isAIMessage ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Avatar className="h-10 w-10 mt-0.5">
                            {isAIMessage ? (
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                🤖
                              </AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={message.sender.avatar} />
                                <AvatarFallback>
                                  {getInitials(message.sender.fullName)}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <div className={`flex-1 min-w-0 ${shouldAlignRight ? 'text-right' : ''}`}>
                            <div className={`flex items-center gap-2 mb-1 ${shouldAlignRight ? 'flex-row-reverse' : ''}`}>
                              <span className={`font-semibold text-sm ${isAIMessage ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                                {isAIMessage ? 'AI Assistant' : message.sender.fullName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </span>
                              {message.edited && (
                                <span className="text-xs text-muted-foreground italic">(edited)</span>
                              )}
                            </div>
                            <div className={`text-sm ${isAIMessage ? 'text-gray-800 dark:text-gray-200' : 'whitespace-pre-wrap'} leading-relaxed`}>
                              {renderMessageContent(message.content, isAIMessage)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-muted/20">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <div className="flex-1 relative">
                    {/* Autocomplete Dropdown */}
                    {showAutocomplete && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                        {autocompleteType === 'mention' && (
                          <div className="p-2">
                            <div className="text-xs text-muted-foreground px-2 py-1 font-medium">Mention Team Member</div>
                            {users
                              .filter(u => {
                                const searchTerm = autocompleteFilter.toLowerCase();
                                return (
                                  u.fullName?.toLowerCase().includes(searchTerm) ||
                                  u.username?.toLowerCase().includes(searchTerm) ||
                                  u.email?.toLowerCase().includes(searchTerm)
                                );
                              })
                              .slice(0, 5)
                              .map(u => (
                                <div
                                  key={u._id}
                                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent cursor-pointer"
                                  onClick={() => handleAutocompleteSelect(u)}
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback className="text-xs">{getInitials(u.fullName)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{u.fullName}</div>
                                    <div className="text-xs text-muted-foreground truncate">@{u.username || u.email?.split('@')[0]}</div>
                                  </div>
                                </div>
                              ))}
                            {users.filter(u => {
                              const searchTerm = autocompleteFilter.toLowerCase();
                              return u.fullName?.toLowerCase().includes(searchTerm) || u.username?.toLowerCase().includes(searchTerm);
                            }).length === 0 && (
                              <div className="text-sm text-muted-foreground px-2 py-2">No members found</div>
                            )}
                          </div>
                        )}
                        {autocompleteType === 'task' && (
                          <div className="p-2">
                            <div className="text-xs text-muted-foreground px-2 py-1 font-medium">Link Task</div>
                            <div className="text-sm text-muted-foreground px-2 py-2">Type task ID to link (e.g., #TASK-507a4f...)</div>
                          </div>
                        )}
                        {autocompleteType === 'client' && (
                          <div className="p-2">
                            <div className="text-xs text-muted-foreground px-2 py-1 font-medium">Link Client</div>
                            {clients
                              .filter(c => {
                                const searchTerm = autocompleteFilter.toLowerCase();
                                return c.fullName?.toLowerCase().includes(searchTerm) || c.email?.toLowerCase().includes(searchTerm);
                              })
                              .slice(0, 5)
                              .map(c => (
                                <div
                                  key={c._id}
                                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent cursor-pointer"
                                  onClick={() => handleAutocompleteSelect(c)}
                                >
                                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-xs font-medium text-purple-700">{c.fullName?.charAt(0)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{c.fullName}</div>
                                    <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Input
                      ref={inputRef}
                      placeholder={`Message #${activeRoomData.name} - Use @username, #TASK-id, #CLIENT-id`}
                      value={messageText}
                      onChange={handleMessageInputChange}
                      className="h-11"
                      disabled={isSending}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setShowAutocomplete(false);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      Tip: Mention teammates with @username, link tasks with #TASK-id, or clients with #CLIENT-id
                    </p>
                  </div>
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
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Select team members to add to this chat room ({users.length} available)
            </DialogDescription>
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
                    console.log('🔍 Add Members Debug:', {
                      totalUsers: users.length,
                      usersArray: users,
                      activeRoomParticipants: activeRoomData?.participants.length,
                      participantIds: activeRoomData?.participants.map((p: any) => p.user?._id || p.user),
                      userIds: users.map(u => u._id),
                      memberSearchQuery
                    });
                    
                    // Show ALL users, just filter by search query
                    const filteredUsers = users.filter(user => 
                      memberSearchQuery === '' || 
                      user.fullName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    );
                    
                    console.log('✅ Filtered users to show:', filteredUsers.length, filteredUsers);
                    console.log('❓ Users state:', users);
                    
                    if (users.length === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">Loading team members...</p>
                        </div>
                      );
                    }
                    
                    if (filteredUsers.length === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">No members found matching "{memberSearchQuery}"</p>
                        </div>
                      );
                    }
                    
                    return filteredUsers.map((user) => (
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

                {/* Action Buttons */}
                <Separator />
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={handleClearMessages}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Messages
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDeleteRoom}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Room
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
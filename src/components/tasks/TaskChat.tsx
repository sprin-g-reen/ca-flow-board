import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Clock, Reply, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/store/slices/tasksSlice';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface TaskChatProps {
  task: Task;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  timestamp: string;
  type: 'message' | 'system';
  replyTo?: string;
  edited?: boolean;
  editedAt?: string;
}

// Mock chat messages - will be replaced with real API
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    content: 'Task has been assigned to the team. Please review the requirements and let me know if you have any questions.',
    sender: {
      id: '1',
      name: 'Task Owner',
      email: 'owner@firm.com',
      role: 'owner'
    },
    timestamp: '2025-03-14T09:00:00Z',
    type: 'message'
  },
  {
    id: '2',
    content: 'I\'ve started working on the GST filing. Will need the client\'s purchase invoices for Q4.',
    sender: {
      id: '2',
      name: 'Team Member',
      email: 'employee@firm.com',
      role: 'employee'
    },
    timestamp: '2025-03-14T10:30:00Z',
    type: 'message',
    replyTo: '1'
  },
  {
    id: '3',
    content: 'Client documents uploaded successfully',
    sender: {
      id: 'system',
      name: 'System',
      email: '',
      role: 'system'
    },
    timestamp: '2025-03-14T11:15:00Z',
    type: 'system'
  },
  {
    id: '4',
    content: 'Perfect! I can see the documents. Will have the filing ready by tomorrow.',
    sender: {
      id: '2',
      name: 'Team Member',
      email: 'employee@firm.com',
      role: 'employee'
    },
    timestamp: '2025-03-14T11:20:00Z',
    type: 'message',
    replyTo: '3'
  }
];

export default function TaskChat({ task }: TaskChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsTyping(true);

    try {
      // TODO: Implement actual message sending to backend
      const messageToSend: ChatMessage = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender: {
          id: user.id,
          name: user.fullName || 'Unknown User',
          email: user.email,
          role: user.role
        },
        timestamp: new Date().toISOString(),
        type: 'message',
        replyTo: replyingTo || undefined
      };

      setMessages(prev => [...prev, messageToSend]);
      setNewMessage('');
      setReplyingTo(null);
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      case 'client':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReplyToMessage = (replyToId: string) => {
    return messages.find(msg => msg.id === replyToId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900">Task Discussion</h3>
            <p className="text-sm text-gray-600">
              {messages.filter(m => m.type === 'message').length} messages • Last activity {
                messages.length > 0 
                  ? formatDistanceToNow(new Date(messages[messages.length - 1].timestamp), { addSuffix: true })
                  : 'No activity'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation about this task</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.type === 'system' ? (
                <div className="flex justify-center">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {message.content} • {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
                  </div>
                </div>
              ) : (
                <div className={`flex gap-3 ${message.sender.id === user?.id ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {message.sender.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-lg ${message.sender.id === user?.id ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {message.sender.name}
                      </span>
                      <Badge className={getRoleColor(message.sender.role)} variant="secondary">
                        {message.sender.role}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    
                    {message.replyTo && (
                      <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                        <Reply className="h-3 w-3 inline mr-1" />
                        Replying to: {getReplyToMessage(message.replyTo)?.content.slice(0, 50)}...
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-lg ${
                      message.sender.id === user?.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.edited && (
                        <p className="text-xs opacity-75 mt-1">
                          Edited {formatDistanceToNow(new Date(message.editedAt!), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReply(message.id)}
                        className="text-xs h-6 px-2"
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="p-3 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-blue-700">Replying to:</span>
              <span className="text-blue-600 ml-2">
                {getReplyToMessage(replyingTo)?.content.slice(0, 100)}...
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="resize-none"
              rows={2}
              disabled={isTyping}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isTyping}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div>
            {isTyping && 'Sending...'}
          </div>
          <div>
            Press Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
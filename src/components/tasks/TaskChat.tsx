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
import { useChat } from '@/hooks/useChat';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { getValidatedToken } from '@/lib/auth';
import { API_BASE_URL } from '@/config/api.config';
import apiClient from '@/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskChatProps {
  task: Task;
}

export default function TaskChat({ task }: TaskChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { rooms, messages: chatMessages = [], createRoomAsync, sendMessageAsync, joinRoom, activeRoom } = useChat();
  const [localRoomId, setLocalRoomId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageToSend = newMessage;
    
    // Clear input immediately for better UX
    setNewMessage('');
    setReplyingTo(null);
    setIsTyping(true);

    try {
      const roomId = localRoomId || activeRoom;
      if (!roomId) {
        toast.error('Chat room not ready');
        setIsTyping(false);
        return;
      }

      // Send the user's message first
      await sendMessageAsync(roomId, messageToSend.trim());
      
      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Check if message contains @AI mention
      if (messageToSend.includes('@AI')) {
        try {
          // Extract the query by removing @AI mention
          const aiQuery = messageToSend.replace('@AI', '').trim();
          
          // Call AI endpoint with room context and task ID
          await apiClient.post('/ai/chat/room', {
            roomId,
            message: aiQuery,
            taskId: task.id // Include task context for AI
          });
          
          // AI response will be automatically received via WebSocket
          // Scroll again after AI response arrives
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        } catch (aiError) {
          console.error('Error calling AI:', aiError);
          toast.error('Failed to get AI response');
        }
      }
      
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send task message', error);
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
    return chatMessages.find((msg: any) => (msg._id || msg.id) === replyToId || (msg.id && msg.id === replyToId));
  };

  // Ensure there's a chat room for this task using task name as room name
  // AND sync participants with task assignedTo/collaborators
  useEffect(() => {
    let isMounted = true;
    
    const setupRoom = async () => {
      try {
        if (!task) return;
        const taskId = (task.id || (task as any)._id || '').toString();
        if (!taskId) return;

        // Use task title as room name (create folder-like organization)
        const roomName = task.title || `Task ${taskId.slice(-6)}`;

        // Build list of all task participants (assignedTo + collaborators)
        const assigned = Array.isArray((task as any).assignedTo) ? (task as any).assignedTo : [];
        const collaborators = Array.isArray((task as any).collaborators) ? (task as any).collaborators : [];
        const allParticipants = [...assigned, ...collaborators];
        const participantIds = allParticipants
          .map((a: any) => (typeof a === 'string' ? a : a._id || a.id))
          .filter(Boolean)
          .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

        // Try to find existing room in user's rooms by name
        let room = (rooms || []).find((r: any) => r.name === roomName);

        if (!room) {
          // Create new room with all participants
          const created = await createRoomAsync({ 
            name: roomName, 
            type: 'project', 
            participants: participantIds 
          });
          room = created;
        } else {
          // Room exists - check if we need to add new participants
          const existingParticipantIds = (room.participants || [])
            .map((p: any) => p.user?._id || p.user)
            .filter(Boolean);
          
          const newParticipants = participantIds.filter(
            (id: string) => !existingParticipantIds.includes(id)
          );

          // Add any new participants to the room
          if (newParticipants.length > 0) {
            try {
              const token = getValidatedToken();
              await fetch(`${API_BASE_URL}/chat/rooms/${room._id || room.id}/members`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userIds: newParticipants })
              });
              console.log(`✅ Added ${newParticipants.length} new participants to task chat`);
            } catch (addError) {
              console.warn('Could not add new participants (might lack permissions):', addError);
              // Continue anyway - user can still use chat even if they can't add others
            }
          }
        }

        if (!isMounted) return;

        const rid = room._id || room.id;
        if (rid && rid !== localRoomId) {
          setLocalRoomId(rid);
          joinRoom(rid);
        }
      } catch (err) {
        console.error('Failed to setup task chat room', err);
      }
    };

    setupRoom();

    return () => {
      isMounted = false;
    };
  }, [
    task?.id || (task as any)?._id, 
    task?.title,
    JSON.stringify((task as any)?.assignedTo || []),
    JSON.stringify((task as any)?.collaborators || [])
  ]); // Re-run when task ID, title, or participants change

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Task Discussion</h3>
              <p className="text-sm text-gray-600">
                {chatMessages.filter((m: any) => (m.type || 'text') === 'message' || (m.type || 'text') === 'text').length} messages • Last activity {
                  chatMessages.length > 0 
                    ? formatDistanceToNow(new Date((chatMessages[chatMessages.length - 1].createdAt || chatMessages[chatMessages.length - 1].timestamp)), { addSuffix: true })
                    : 'No activity'
                }
              </p>
            </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
  {chatMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation about this task</p>
          </div>
          ) : (
          chatMessages.map((message: any) => {
            const isAIMessage = message.type === 'ai';
            return (
            <div key={message._id || message.id} className="space-y-2">
              {message.type === 'system' ? (
                <div className="flex justify-center">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {message.content} • {format(new Date(message.createdAt || message.timestamp), 'MMM dd, HH:mm')}
                  </div>
                </div>
              ) : (
                <div className={`flex gap-3 ${
                  isAIMessage ? '' : ((message.sender?._id || message.sender?.id) === user?.id ? 'flex-row-reverse' : '')
                } ${isAIMessage ? 'bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border-l-4 border-blue-500' : ''}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {isAIMessage ? (
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                        🤖
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {(message.sender?.fullName || message.sender?.name || '')
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                        }
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className={`flex-1 max-w-lg ${((message.sender?._id || message.sender?.id) === user?.id) ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${isAIMessage ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900'}`}>
                        {isAIMessage ? 'AI Assistant' : (message.sender?.fullName || message.sender?.name || 'Unknown')}
                      </span>
                      {!isAIMessage && (
                        <Badge className={getRoleColor(message.sender?.role || '')} variant="secondary">
                          {message.sender?.role || 'member'}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.createdAt || message.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    
                    {message.replyTo && (
                      <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                        <Reply className="h-3 w-3 inline mr-1" />
                        Replying to: {getReplyToMessage((message.replyTo && (message.replyTo._id || message.replyTo)) || message.replyTo)?.content?.slice(0, 50) || '…'}
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-lg ${
                      isAIMessage 
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                        : ((message.sender?._id || message.sender?.id) === user?.id) 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      {isAIMessage ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-blue-700 dark:text-blue-300">{children}</strong>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                              li: ({ children }) => <li className="ml-2">{children}</li>,
                              code: ({ children }) => <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
                              pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto">{children}</pre>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.edited && (
                        <p className="text-xs opacity-75 mt-1">
                          Edited {formatDistanceToNow(new Date(message.editedAt || message.updatedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReply(message._id || message.id)}
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
            );
          })
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
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Send, X, Bot, User, Loader, Sparkles, Trash2, Lock, LockOpen, Users, ClipboardList, TrendingUp, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getValidatedToken } from '@/lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  createdAt?: string;
}

export const AIChatbox = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [privacyOn, setPrivacyOn] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Quick action prompts with icons
  const quickActions = [
    { icon: Users, text: "List all my clients", gradient: "from-blue-500 to-cyan-500" },
    { icon: ClipboardList, text: "Show pending tasks", gradient: "from-purple-500 to-pink-500" },
    { icon: TrendingUp, text: "What's my revenue this month?", gradient: "from-green-500 to-emerald-500" },
    { icon: FileText, text: "Show overdue invoices", gradient: "from-orange-500 to-red-500" },
    { icon: Calendar, text: "Tasks due this week", gradient: "from-indigo-500 to-purple-500" },
    { icon: DollarSign, text: "Calculate total fees", gradient: "from-yellow-500 to-orange-500" },
  ];

  const handleQuickAction = (text: string) => {
    setInput(text);
    // Optionally auto-send
    setTimeout(() => {
      const sendEvent = new Event('submit');
      handleSend();
    }, 100);
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = getValidatedToken();
      if (!token) {
        toast.error('Authentication required. Please log in again.', { duration: 3000 });
        return;
      }

      // If no attachments, use streaming; else use JSON fallback
      if (attachments.length === 0) {
        const controller = new AbortController();
        const resp = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: userMessage.text, privacy: privacyOn }),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          if (resp.status === 503) throw new Error('AI service is not configured. Please contact your administrator.');
          throw new Error('Failed to get response from AI');
        }

        // Start a placeholder AI message and stream into it
        let aiText = '';
        setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        // Keep index of the last message (the placeholder AI)
        const aiIndex = messages.length + 1; // after user message is pushed
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          aiText += chunk;
          // update last message incrementally
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx] && updated[lastIdx].sender === 'ai') {
              updated[lastIdx] = { ...updated[lastIdx], text: aiText };
            }
            return updated;
          });
        }
      } else {
        const form = new FormData();
        form.append('prompt', userMessage.text);
        form.append('privacy', String(privacyOn));
        attachments.forEach((f) => form.append('attachments', f));

        const resp = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: form,
        });

        if (!resp.ok || !resp.body) {
          if (resp.status === 503) throw new Error('AI service is not configured. Please contact your administrator.');
          throw new Error('Failed to get response from AI');
        }

        // Stream even for attachments (server supports it)
        let aiText = '';
        setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          aiText += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx] && updated[lastIdx].sender === 'ai') {
              updated[lastIdx] = { ...updated[lastIdx], text: aiText };
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      toast.error('Failed to get response from AI.', { duration: 3000 });
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I am having trouble connecting. Please try again later.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setAttachments([]);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Load history when chat opens (only if privacy is OFF)
  useEffect(() => {
    const loadHistory = async () => {
      if (!isOpen || privacyOn) return; // Don't load if privacy is ON
      try {
        const token = getValidatedToken();
        if (!token) return;
        const resp = await fetch(`${API_BASE_URL}/ai/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (Array.isArray(data.history) && data.history.length > 0) {
          setMessages(data.history as Message[]);
          toast.success(`Loaded ${data.history.length} previous messages`, { duration: 2000 });
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    };
    loadHistory();
  }, [isOpen, privacyOn]);

  const handleClear = async () => {
    const messageCount = messages.length;
    setMessages([]);
    if (!privacyOn) {
      try {
        const token = getValidatedToken();
        if (!token) return;
        await fetch(`${API_BASE_URL}/ai/history`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success(`Cleared ${messageCount} messages and history`, { duration: 2000 });
      } catch (e) {
        toast.error('Failed to clear history on server', { duration: 3000 });
      }
    } else {
      toast.success(`Cleared ${messageCount} messages`, { duration: 2000 });
    }
  };

  // Handle privacy toggle
  const handlePrivacyToggle = (checked: boolean) => {
    setPrivacyOn(checked);
    if (checked) {
      // Turning privacy ON - clear local messages
      if (messages.length > 0) {
        toast.info('Privacy mode enabled. Messages cleared.', { duration: 2000 });
        setMessages([]);
      }
    } else {
      // Turning privacy OFF - load history
      toast.info('Privacy mode disabled. Loading history...', { duration: 2000 });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Modern Chat Panel */}
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 shadow-2xl flex flex-col z-50 border-l border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="relative flex flex-col border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <div className="flex items-center justify-between p-6 pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-2.5 rounded-full">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Assistant</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini • Data-aware</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Privacy Status Banner */}
              {!privacyOn && (
                <div className="px-6 pb-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <LockOpen className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                    <p className="text-xs text-orange-700 dark:text-orange-400">
                      Chat history is being saved for future reference
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full">
                        <Bot className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      How can I help you today?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                      I have complete awareness of your firm's data. Ask me anything!
                    </p>
                    <div className="grid grid-cols-2 gap-3 w-full max-w-md px-4">
                      {quickActions.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                          <motion.button
                            key={idx}
                            onClick={() => handleQuickAction(action.text)}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
                            <div className="relative z-10 flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${action.gradient} shadow-sm`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {action.text}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className="relative flex-shrink-0 mt-1"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-2 rounded-full shadow-lg">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </motion.div>
                    )}
                    <div className={`group relative max-w-[80%] ${msg.sender === 'user' ? 'order-first' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 shadow-lg transition-all duration-200 ${
                        msg.sender === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white group-hover:shadow-xl group-hover:scale-[1.02]' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 group-hover:shadow-xl group-hover:border-blue-200 dark:group-hover:border-blue-800'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      {msg.createdAt && (
                        <p className={`text-[10px] text-gray-400 mt-1.5 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    {msg.sender === 'user' && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className="relative flex-shrink-0 mt-1"
                      >
                        <div className="bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 p-2 rounded-full shadow-md">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-3"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-2 rounded-full shadow-lg">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-3.5 shadow-lg border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                            className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                            className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                            className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-500"
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Footer */}
            <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-950/80 backdrop-blur-xl">
              {/* Controls Row */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="privacy" 
                      checked={privacyOn} 
                      onCheckedChange={handlePrivacyToggle}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500"
                    />
                    <label htmlFor="privacy" className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
                      {privacyOn ? (
                        <>
                          <Lock className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-700 dark:text-green-500">Private Mode</span>
                        </>
                      ) : (
                        <>
                          <LockOpen className="h-3.5 w-3.5 text-orange-600" />
                          <span className="text-orange-700 dark:text-orange-500">Saving History</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClear}
                  className="h-7 text-xs hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 flex flex-wrap gap-2"
                >
                  {attachments.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <Paperclip className="h-3 w-3 mr-1.5 text-blue-600" />
                      <span className="text-blue-700 dark:text-blue-400">
                        {f.name.length > 20 ? f.name.substring(0, 20) + '...' : f.name}
                      </span>
                    </Badge>
                  ))}
                </motion.div>
              )}

              {/* Input Area */}
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your firm..."
                  className="pr-24 resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <label className="inline-flex">
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setAttachments(files as File[]);
                      }}
                    />
                    <Button 
                      asChild 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Attach images"
                    >
                      <span>
                        <Paperclip className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </span>
                    </Button>
                  </label>
                  <Button 
                    size="icon"
                    onClick={handleSend} 
                    disabled={isLoading || !input.trim()}
                    className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

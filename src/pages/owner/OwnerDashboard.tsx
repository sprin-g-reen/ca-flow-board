import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormDialog } from "@/components/shared/FormDialog";
import { AddClientForm } from "@/components/forms/AddClientForm";
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Plus,
  Target,
  TrendingUp,
  Users,
  AlertCircle,
  Bot,
  ArrowUp,
  CreditCard,
  Bell,
  AlertTriangle,
  Activity,
  Star,
  X,
  Sparkles
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { useTasks } from '@/hooks/useTasks';
import { AIDashboardCards } from '@/components/ai/AIDashboardCards';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/services/api';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

const OwnerDashboard = () => {
  const { clients } = useClients();
  const { quotations } = usePayments();
  const { tasks: realTimeTasks } = useTasks();
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  // Check AI configuration status on component mount
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/ai/status`);
        const data = await response.json();
        setAiConfigured(data.configured);
      } catch (error) {
        console.error('Error checking AI status:', error);
        setAiConfigured(false);
      }
    };
    checkAIStatus();
  }, []);
  
  // AI Summary Function
  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await apiClient.post('/ai/summary') as any;
      setAiSummary(response.summary);
      toast({
        title: "AI Summary Generated",
        description: "Your business summary has been generated successfully.",
      });
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      
      if (error.message.includes('AI service is not configured')) {
        toast({
          title: "AI Service Not Configured",
          description: "Please contact your administrator to set up the AI integration.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "AI Summary Failed",
          description: error.message || "Failed to generate AI summary. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // AI History Function
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleViewAIHistory = async () => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const response = await apiClient.get('/ai/history') as any;
      console.log('AI History Response:', response);
      
      // Extract history array from response
      const historyData = response?.data?.history || response?.history || [];
      setAiHistory(historyData);
      
      if (historyData.length === 0) {
        toast({
          title: "No History Found",
          description: "You haven't had any AI conversations yet. Start chatting with the AI assistant!",
        });
      } else {
        toast({
          title: "AI History Loaded",
          description: `Found ${historyData.length} conversation messages.`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching AI history:', error);
      toast({
        title: "Failed to Load History",
        description: error.message || "Could not retrieve AI conversation history.",
        variant: "destructive",
      });
      setShowHistoryModal(false);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Add safe array handling to prevent crashes
  const safeTasks = Array.isArray(realTimeTasks) ? realTimeTasks : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeQuotations = Array.isArray(quotations) ? quotations : [];
  
  // Calculate real-time metrics with safe arrays
  const totalTasks = safeTasks.length;
  const activeTasks = safeTasks.filter(t => t.status !== 'completed').length;
  const completedTasks = safeTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = safeTasks.filter(t => 
    new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;
  
  const totalRevenue = safeQuotations.reduce((sum, q) => sum + q.total_amount, 0);
  const pendingPayments = safeQuotations.filter(q => q.status === 'sent' || q.status === 'draft').reduce((sum, q) => sum + q.total_amount, 0);
  const activeQuotations = safeQuotations.filter(q => q.status === 'sent' || q.status === 'draft').length;
  
  // Get recent tasks
  const recentTasks = safeTasks.slice(0, 5);
  
  // Get top clients by project count
  const topClients = safeClients.slice(0, 4).map(client => ({
    id: client.id,
    name: client.name,
    industry: client.industry || 'General',
    contact: client.contact_person || 'N/A',
    activeProjects: safeTasks.filter(t => t.clientId === client.id && t.status !== 'completed').length,
    totalValue: safeQuotations.filter(q => q.client_id === client.id).reduce((sum, q) => sum + q.total_amount, 0),
  }));

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowAddClientDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalTasks}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {activeTasks} active
              </Badge>
              <span>•</span>
              <span>{completedTasks} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12.5%</span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{safeClients.length}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {activeQuotations} quotes pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              ₹{pendingPayments.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 text-orange-600" />
              <span>{activeQuotations} invoices pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Dashboard Cards */}
      <AIDashboardCards 
        onSummaryClick={handleGenerateAISummary}
        onHistoryClick={handleViewAIHistory}
        isGeneratingSummary={isGeneratingSummary}
        aiConfigured={aiConfigured}
      />

      {/* AI Business Summary - Enhanced UI */}
      {aiSummary && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 overflow-hidden">
          <CardHeader className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Business Summary
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Generated insights based on your current business data
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAiSummary(null)}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-inner">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {aiSummary.split('\n\n').map((paragraph, idx) => {
                  // Handle headers
                  if (paragraph.startsWith('##')) {
                    const text = paragraph.replace(/^##\s*/, '');
                    return (
                      <h2 key={idx} className="text-lg font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="inline-block w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                        {text}
                      </h2>
                    );
                  }
                  
                  // Handle bold sections
                  if (paragraph.includes('**')) {
                    return (
                      <div key={idx} className="mb-4">
                        {paragraph.split('\n').map((line, lineIdx) => {
                          // Handle list items with bold
                          if (line.trim().startsWith('•') || line.trim().startsWith('*')) {
                            const cleanLine = line.replace(/^[•*]\s*/, '');
                            const parts = cleanLine.split('**');
                            return (
                              <div key={lineIdx} className="flex items-start gap-3 mb-2 ml-4">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-2 flex-shrink-0"></span>
                                <p className="text-sm leading-relaxed flex-1">
                                  {parts.map((part, partIdx) => 
                                    partIdx % 2 === 1 ? (
                                      <strong key={partIdx} className="font-semibold text-gray-900 dark:text-gray-100">{part}</strong>
                                    ) : (
                                      <span key={partIdx}>{part}</span>
                                    )
                                  )}
                                </p>
                              </div>
                            );
                          }
                          
                          // Regular bold text
                          const parts = line.split('**');
                          return (
                            <p key={lineIdx} className="text-sm leading-relaxed mb-2 text-gray-700 dark:text-gray-300">
                              {parts.map((part, partIdx) => 
                                partIdx % 2 === 1 ? (
                                  <strong key={partIdx} className="font-semibold text-gray-900 dark:text-gray-100">{part}</strong>
                                ) : (
                                  <span key={partIdx}>{part}</span>
                                )
                              )}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }
                  
                  // Regular paragraphs
                  return (
                    <p key={idx} className="text-sm leading-relaxed mb-3 text-gray-700 dark:text-gray-300">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI History Modal */}
      {showHistoryModal && (
        <Card className="border-0 shadow-2xl bg-white dark:bg-gray-900">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">AI Conversation History</CardTitle>
                  <CardDescription className="text-sm">
                    {aiHistory.length} messages in your conversation history
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHistoryModal(false)}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 max-h-[600px] overflow-y-auto">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="text-sm text-muted-foreground">Loading conversation history...</p>
                </div>
              </div>
            ) : aiHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 p-4 rounded-full mb-4">
                  <MessageSquare className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Conversations Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Start a conversation with the AI assistant by clicking the sparkly icon in the navbar. 
                  Your chat history will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group messages by conversation threads (date-based) */}
                {(() => {
                  // Group messages by date
                  const groupedByDate: Record<string, any[]> = {};
                  aiHistory.forEach((message: any) => {
                    const date = message.createdAt 
                      ? new Date(message.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Unknown Date';
                    
                    if (!groupedByDate[date]) {
                      groupedByDate[date] = [];
                    }
                    groupedByDate[date].push(message);
                  });

                  return Object.entries(groupedByDate).map(([date, messages]) => (
                    <div key={date} className="space-y-3">
                      {/* Date Separator */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {date}
                          </p>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
                      </div>

                      {/* Messages for this date */}
                      <div className="space-y-4 pl-2">
                        {messages.map((message: any, idx: number) => {
                          const isUser = message.sender === 'user' || message.type === 'text';
                          const isAI = message.sender === 'ai' || message.type === 'system';
                          
                          return (
                            <div 
                              key={`${date}-${idx}`} 
                              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-50 slide-in-from-bottom-2`}
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              {isAI && (
                                <div className="flex-shrink-0 mt-1">
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-50 animate-pulse"></div>
                                    <div className="relative bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg shadow-md">
                                      <Sparkles className="h-4 w-4 text-white" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
                                <div className={`rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${
                                  isUser 
                                    ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white' 
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                                }`}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.content || message.text}
                                  </p>
                                </div>
                                {message.createdAt && (
                                  <p className={`text-[10px] text-gray-500 dark:text-gray-500 mt-1.5 flex items-center gap-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <Clock className="h-3 w-3" />
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                              {isUser && (
                                <div className="flex-shrink-0 mt-1">
                                  <div className="bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 p-2 rounded-lg shadow-sm">
                                    <Users className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress and Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Task Completion Progress
            </CardTitle>
            <CardDescription>
              Overall progress across all active projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={completionRate} 
                variant="success"
                className="h-3" 
              />
            </div>
            
            {overdueTasks > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Overdue Tasks</span>
                  <span className="font-medium text-red-600">{overdueTasks}</span>
                </div>
                <Progress 
                  value={overdueRate} 
                  variant="danger"
                  className="h-2" 
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{activeTasks}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{overdueTasks}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Quick Alerts
            </CardTitle>
            <CardDescription>
              Important notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {overdueTasks} tasks are overdue
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Review and update deadlines
                  </p>
                </div>
              </div>
            )}
            
            {activeQuotations > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <FileText className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {activeQuotations} quotations pending
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Follow up with clients
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  System running smoothly
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  All services operational
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Top Clients */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Recent Tasks
            </CardTitle>
            <CardDescription>
              Latest task updates and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length > 0 ? recentTasks.map((task, index) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-900/50">
                  <div className={`h-2 w-2 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'inprogress' ? 'bg-blue-500' :
                    task.status === 'review' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.clientName || 'No client'} • Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={
                    task.status === 'completed' ? 'default' :
                    task.status === 'inprogress' ? 'secondary' :
                    task.status === 'review' ? 'outline' : 'destructive'
                  } className="text-xs">
                    {task.status}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks yet</p>
                  <p className="text-xs">Create your first task to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Top Clients
            </CardTitle>
            <CardDescription>
              Your most active clients this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClients.length > 0 ? topClients.map((client, index) => (
                <div key={client.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-900/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                    <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.industry} • {client.activeProjects} active projects
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{client.totalValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total value</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No clients yet</p>
                  <p className="text-xs">Add your first client to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Client Dialog */}
      <FormDialog
        open={showAddClientDialog}
        onOpenChange={setShowAddClientDialog}
        title="Add New Client"
        description="Create a new client profile to start managing their projects and documents."
        showFooter={false}
        className="max-w-4xl"
      >
        <AddClientForm onSuccess={() => setShowAddClientDialog(false)} />
      </FormDialog>
    </div>
  );
};

// Wrapper component to handle onboarding check
const OwnerDashboardWithOnboarding = () => {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check localStorage first
        const onboardingComplete = localStorage.getItem('onboardingComplete');
        
        if (onboardingComplete === 'true') {
          setNeedsOnboarding(false);
          setIsCheckingSetup(false);
          return;
        }

        // Check if firm has complete profile
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/settings/firm`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const firm = await response.json();
          // Check if essential fields are filled
          const hasEssentialInfo = firm.name && firm.email && firm.phone && firm.panNumber && 
                                    firm.address && firm.address.street && firm.address.city;
          
          if (!hasEssentialInfo) {
            setNeedsOnboarding(true);
          } else {
            // Mark onboarding as complete if firm has all info
            localStorage.setItem('onboardingComplete', 'true');
            setNeedsOnboarding(false);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setNeedsOnboarding(false); // Default to dashboard if check fails
      } finally {
        setIsCheckingSetup(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    localStorage.setItem('onboardingComplete', 'true');
    toast({
      title: "Welcome to CA Flow Board! 🎉",
      description: "Your dashboard is ready. Let's get started!",
    });
  };

  if (isCheckingSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return <OwnerDashboard />;
};

export default OwnerDashboardWithOnboarding;
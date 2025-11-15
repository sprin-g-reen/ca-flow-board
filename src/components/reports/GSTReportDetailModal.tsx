import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User,
  Building,
  Receipt,
  Bot,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  FilePlus
} from 'lucide-react';
import { GSTReportRow } from './GSTReportTable';
import { AIChatbox } from '@/components/ai/AIChatbox';
import { API_BASE_URL } from '@/config/api.config';
import { getValidatedToken } from '@/lib/auth';

interface GSTReportDetailModalProps {
  row: GSTReportRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  due_date?: string;
  assigned_to?: any[];
  created_at?: string;
}

export const GSTReportDetailModal = ({ row, open, onOpenChange }: GSTReportDetailModalProps) => {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Fetch tasks for this client and month
  useEffect(() => {
    const fetchTasks = async () => {
      if (!row || !open) return;
      
      setLoadingTasks(true);
      try {
        const token = getValidatedToken();
        if (!token) return;

        const response = await fetch(
          `${API_BASE_URL}/tasks?client_id=${row.clientId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const tasksData = result.data?.tasks || [];
          
          // Filter tasks for the current month if we have date info
          const filteredTasks = tasksData.filter((task: Task) => {
            if (!task.created_at && !task.due_date) return true;
            // Simple month matching - can be enhanced
            const taskDate = new Date(task.created_at || task.due_date);
            return row.monthName.includes(taskDate.toLocaleString('default', { month: 'long' }));
          });
          
          setTasks(filteredTasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [row, open]);

  if (!row) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Check if invoice exists (invoiceNumber is not "N/A" and has actual data)
  const hasInvoice = row.invoiceNumber && row.invoiceNumber !== 'N/A' && row.invoiceRaised;
  const hasQuote = row.quoteRaised;

  const getTaskStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'inprogress':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'review':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'completed') return 'default';
    if (normalized === 'inprogress' || normalized === 'in_progress') return 'secondary';
    if (normalized === 'review') return 'outline';
    return 'outline';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold">
                  {hasInvoice ? 'Invoice Details' : hasQuote ? 'Quote Details' : 'Client Report Details'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-2">
                  {hasInvoice ? `Invoice #${row.invoiceNumber}` : hasQuote ? 'Quote raised' : 'No invoice/quote created yet'} • {row.monthName}
                </DialogDescription>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {!hasInvoice && (
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      // TODO: Navigate to create invoice with pre-filled client
                      window.location.href = `/owner/invoices?client=${row.clientId}`;
                    }}
                  >
                    <FilePlus className="h-4 w-4" />
                    Create Invoice
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiChatOpen(true)}
                  className="gap-2"
                >
                  <Bot className="h-4 w-4" />
                  Ask AI
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
          {!hasInvoice && !hasQuote ? (
            // Empty state when no invoice/quote exists
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Invoice or Quote Created</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                This client doesn't have an invoice or quote for {row.monthName}. Create one using the button above or view client information below.
              </p>
              
              {/* Quick Actions */}
              <div className="flex gap-3 mb-8">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    window.location.href = `/owner/invoices?client=${row.clientId}`;
                  }}
                >
                  <FilePlus className="h-4 w-4" />
                  Create Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    window.location.href = `/owner/tasks?client=${row.clientId}`;
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              </div>
              
              {/* Client Info Card */}
              <div className="w-full max-w-2xl border rounded-lg p-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{row.clientName}</h3>
                    <p className="text-sm text-muted-foreground">Client ID: {row.clientId}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">GSTIN</label>
                    <div className="text-base font-medium mt-1 font-mono">{row.gstin}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">GST Status</label>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={
                          row.gstStatus === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }
                      >
                        {row.gstStatus}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* GST Return Statuses */}
                  {row.gstReturnStatuses && row.gstReturnStatuses.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">GST Return Status</label>
                      <div className="flex flex-wrap gap-2">
                        {row.gstReturnStatuses.map((returnStatus) => (
                          <Badge 
                            key={returnStatus.type}
                            variant="outline" 
                            className={
                              returnStatus.status === 'Filed' 
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : returnStatus.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : returnStatus.status === 'Partial'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }
                          >
                            {returnStatus.type}: {returnStatus.status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Click "Ask AI" above to get insights about this client's GST compliance or to help create an invoice.
                  </p>
                </div>

                {/* Associated Tasks */}
                {tasks.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-3 block">
                        Associated Tasks ({tasks.length})
                      </label>
                      <div className="space-y-2">
                        {tasks.slice(0, 3).map((task) => (
                          <div key={task._id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="mt-0.5">{getTaskStatusIcon(task.status)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {task.description}
                                </div>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Badge variant={getTaskStatusBadge(task.status)} className="text-xs">
                                  {task.status}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </Badge>
                              </div>
                            </div>
                            {task.due_date && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString('en-IN', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                        {tasks.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              window.location.href = `/owner/tasks?client=${row.clientId}`;
                            }}
                          >
                            View all {tasks.length} tasks
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks {tasks.length > 0 && `(${tasks.length})`}
              </TabsTrigger>
              <TabsTrigger value="client">Client Info</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Total Amount</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(row.totalAmount)}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm">Tax Amount</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(row.taxAmount)}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Total with Tax</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(row.totalWithTax)}</div>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                    <div className="text-base font-medium mt-1">{row.invoiceNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={row.hasPaid ? 'default' : 'secondary'}>
                        {row.hasPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <div className="text-base font-medium mt-1">{formatDate(row.createdAt)}</div>
                  </div>
                  {row.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                      <div className="text-base font-medium mt-1">{formatDate(row.dueDate)}</div>
                    </div>
                  )}
                </div>

                {row.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <div className="text-base mt-1 p-3 bg-muted rounded-md">{row.notes}</div>
                  </div>
                )}

                {row.terms && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Terms & Conditions</label>
                    <div className="text-base mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">{row.terms}</div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4 mt-6">
              {row.items && row.items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Description</th>
                        <th className="text-right p-3 text-sm font-medium">Quantity</th>
                        <th className="text-right p-3 text-sm font-medium">Rate</th>
                        <th className="text-right p-3 text-sm font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.items.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{item.description || item.name}</td>
                          <td className="text-right p-3">{item.quantity}</td>
                          <td className="text-right p-3">{formatCurrency(item.rate || item.price)}</td>
                          <td className="text-right p-3 font-medium">
                            {formatCurrency((item.quantity || 1) * (item.rate || item.price || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No line items available
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Tasks for {row.clientName}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    window.location.href = `/owner/tasks?client=${row.clientId}`;
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              </div>

              {loadingTasks ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/owner/tasks?taskId=${task._id}`;
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getTaskStatusIcon(task.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.due_date)}
                              </div>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant={getTaskStatusBadge(task.status)} className="text-xs">
                              {task.status}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                              Priority: {task.priority}
                            </Badge>
                            {task.category && (
                              <Badge variant="outline" className="text-xs">
                                {task.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium mb-2">No Tasks Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No tasks associated with this client for {row.monthName}.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      window.location.href = `/owner/tasks?client=${row.clientId}`;
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Create First Task
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="client" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{row.clientName}</h3>
                    <p className="text-sm text-muted-foreground">Client ID: {row.clientId}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">GSTIN</label>
                    <div className="text-base font-medium mt-1 font-mono">{row.gstin}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">GST Status</label>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={
                          row.gstStatus === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }
                      >
                        {row.gstStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Need more client information? Click "Ask AI" to get detailed insights about this client.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chatbox */}
      <AIChatbox isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
    </>
  );
};

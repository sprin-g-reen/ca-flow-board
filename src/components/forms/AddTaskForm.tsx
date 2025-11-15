import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getValidatedToken } from '@/lib/auth';
import { useClients } from '@/hooks/useClients';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { API_BASE_URL } from '@/config/api.config';

const subtaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  order: z.number(),
  estimatedHours: z.number().optional(),
  completed: z.boolean().default(false),
});

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  category: z.enum(['gst', 'itr', 'roc', 'other'], {
    required_error: "Please select a category",
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: "Please select a priority",
  }),
  client_id: z.array(z.string()).optional(), // Changed to array for multiple clients
  assigned_to: z.array(z.string()).optional(),
  due_date: z.string().optional(),
  is_payable_task: z.boolean().default(false),
  price: z.number().optional(),
  payable_task_type: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().optional(),
  recurrence_interval: z.number().optional(),
  recurrence_unit: z.enum(['day', 'week', 'month', 'year']).optional(),
  recurrence_days: z.array(z.string()).optional(),
  recurrence_monthly_type: z.enum(['date', 'day']).optional(), // 15th of month vs 3rd Tuesday
  recurrence_monthly_date: z.number().optional(), // Which date (1-31)
  recurrence_monthly_week: z.number().optional(), // Which week (1-4)
  recurrence_monthly_day: z.string().optional(), // Which day (Mon, Tue, etc.)
  recurrence_yearly_month: z.number().optional(), // Which month (1-12)
  recurrence_yearly_date: z.number().optional(), // Which date (1-31)
  recurrence_end_type: z.enum(['never', 'after', 'on']).optional(),
  recurrence_end_count: z.number().optional(),
  recurrence_end_date: z.string().optional(),
  advance_creation_days: z.number().optional(), // Create task X days before due date
  save_as_template: z.boolean().default(false),
  template_name: z.string().optional(),
  is_draft: z.boolean().default(false),
  subtasks: z.array(subtaskSchema).optional(), // Add subtasks support
});

export function AddTaskForm({ onSuccess }: { onSuccess: () => void }) {
  
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { clients = [], isLoading: isLoadingClients } = useClients();
  const { employees = [] } = useEmployees();
  const { addTask } = useTasks();
  
  // Ensure clients is always an array
  const clientsArray = Array.isArray(clients) ? clients : [];
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      client_id: [], // Changed to array for multiple clients
      assigned_to: [],
      due_date: '',
      is_payable_task: false,
      price: undefined,
      payable_task_type: '',
      is_recurring: false,
      recurrence_pattern: 'weekly',
      recurrence_interval: 1,
      recurrence_unit: 'week',
      recurrence_days: [],
      recurrence_monthly_type: 'date',
      recurrence_monthly_date: 1,
      recurrence_monthly_week: 1,
      recurrence_monthly_day: 'Mon',
      recurrence_yearly_month: 1,
      recurrence_yearly_date: 1,
      recurrence_end_type: 'never',
      recurrence_end_count: 12,
      recurrence_end_date: '',
      advance_creation_days: 0,
      save_as_template: false,
      template_name: '',
      is_draft: false,
      subtasks: [], // Add subtasks default
    },
  });

  const isPayableTask = form.watch('is_payable_task');
  const isRecurring = form.watch('is_recurring');
  const saveAsTemplate = form.watch('save_as_template');
  const recurrenceEndType = form.watch('recurrence_end_type');
  const recurrencePattern = form.watch('recurrence_pattern');
  const recurrenceUnit = form.watch('recurrence_unit');
  const monthlyType = form.watch('recurrence_monthly_type');

  // Load template data based on category
  const loadCategoryTemplate = async (category: string) => {
    if (category === 'other') return; // Skip template loading for 'other'
    
    try {
      setIsLoadingTemplate(true);
      const token = getValidatedToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_BASE_URL}/templates/category/${category}?default_only=true`, { headers });

      if (response.ok) {
        const result = await response.json();
        const template = result.data;
        
        if (template) {
          // Pre-populate form with template data, but keep certain fields empty for user input
          form.reset({
            // Keep user-specific fields empty
            title: '',
            client_id: [], // Changed to array for multiple clients
            assigned_to: [],
            due_date: '',
            save_as_template: false,
            template_name: '',
            is_draft: false,
            
            // Load template data
            category: category as 'gst' | 'itr' | 'roc' | 'other',
            description: template.description || '',
            priority: template.priority || 'medium',
            is_payable_task: template.is_payable_task || false,
            price: template.price || 0,
            payable_task_type: template.payable_task_type || '',
            is_recurring: template.is_recurring || false,
            recurrence_pattern: template.recurrence_pattern || 'weekly',
            recurrence_interval: template.recurrence_interval || 1,
            recurrence_unit: template.recurrence_unit || 'week',
            recurrence_days: template.recurrence_days || [],
            recurrence_monthly_type: template.recurrence_monthly_type || 'date',
            recurrence_monthly_date: template.recurrence_monthly_date || 1,
            recurrence_monthly_week: template.recurrence_monthly_week || 1,
            recurrence_monthly_day: template.recurrence_monthly_day || 'Mon',
            recurrence_yearly_month: template.recurrence_yearly_month || 1,
            recurrence_yearly_date: template.recurrence_yearly_date || 1,
            recurrence_end_type: template.recurrence_end_type || 'never',
            recurrence_end_count: template.recurrence_end_count || 12,
            recurrence_end_date: template.recurrence_end_date || '',
            advance_creation_days: template.advance_creation_days || 0,
            // Load subtasks from template
            subtasks: template.subtasks ? template.subtasks.map((st: any) => ({
              title: st.title,
              description: st.description || '',
              dueDate: st.dueDate || '',
              order: st.order,
              estimatedHours: st.estimatedHours || 0,
              completed: false,
            })) : [],
          });
          
          const subtaskCount = template.subtasks?.length || 0;
          toast.success(`Template loaded: ${template.title}${subtaskCount > 0 ? ` with ${subtaskCount} subtask${subtaskCount > 1 ? 's' : ''}` : ''}`);
        } else {
          toast.info(`No template found for ${category.toUpperCase()} Filing`);
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Compute recurrence dates for preview
  const computeRecurrenceDates = () => {
    const values = form.getValues();
    const dates: string[] = [];
    
    if (!values.is_recurring) {
      setPreviewDates([]);
      return;
    }

    // Use due date if available, otherwise use current date
    const startDate = values.due_date ? new Date(values.due_date) : new Date();
    const interval = values.recurrence_interval || 1;
    const unit = values.recurrence_unit || 'week';
    const pattern = values.recurrence_pattern || 'weekly';
    const endType = values.recurrence_end_type || 'never';
    const endCount = values.recurrence_end_count || 10;
    const endDate = values.recurrence_end_date ? new Date(values.recurrence_end_date) : null;
    
    const currentDate = new Date(startDate);
    let count = 0;
    const maxDates = endType === 'after' ? endCount : 10; // Show max 10 dates for preview
    
    while (count < maxDates) {
      // Check if we've reached the end date
      if (endType === 'on' && endDate && currentDate > endDate) {
        break;
      }
      
      // Add the current date
      dates.push(currentDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }));
      
      // Calculate next date based on pattern and interval
      switch (unit) {
        case 'day':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + (interval * 7));
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        case 'year':
          currentDate.setFullYear(currentDate.getFullYear() + interval);
          break;
      }
      
      count++;
    }
    
    setPreviewDates(dates);
    setShowPreview(true);
  };

  // Auto-save as draft
  const saveDraft = async (values: z.infer<typeof formSchema>) => {
    if (!values.title.trim()) return; // Don't save empty drafts
    
    try {
      setIsDraftSaving(true);
      const draftData = {
        ...values,
        is_draft: true,
        created_by: user?.id,
      };
      
      // Save to server instead of localStorage
      const token = getValidatedToken();
      const headersDraft: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headersDraft['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: headersDraft,
        body: JSON.stringify(draftData),
      });

      if (response.ok) {
        toast.success('Draft saved successfully!');
      } else {
        throw new Error('Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsDraftSaving(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Handle multiple clients - create separate tasks for each
      const clientIds = values.client_id || [];
      
      if (clientIds.length === 0) {
        toast.error('Please select at least one client');
        return;
      }

      const createdTasks = [];
      let successCount = 0;
      let errorCount = 0;

      // Create tasks for each selected client
      for (const clientId of clientIds) {
        try {
          // Prepare the task data for this specific client
          const assignees = values.assigned_to || [];
          
          console.log('📝 Creating task with assignees:', assignees);
          console.log('📝 First assignee:', assignees[0]);
          console.log('📝 Collaborators:', assignees.slice(1));
          
          const taskData = {
            title: values.title,
            description: values.description,
            category: values.category,
            priority: values.priority,
            status: 'todo' as const,
            client_id: clientId, // Single client for this task (snake_case for backend)
            assigned_to: assignees, // snake_case for backend - backend will use first as assignedTo
            collaborators: assignees.length > 1 ? assignees.slice(1) : [], // Rest go to collaborators
            due_date: values.due_date, // snake_case for backend
            created_by: user?.id, // snake_case for backend
            is_payable_task: values.is_payable_task, // snake_case for backend
            price: values.price,
            payable_task_type: values.payable_task_type, // snake_case for backend
            is_recurring: values.is_recurring, // snake_case for backend
            recurrence_pattern: values.recurrence_pattern, // snake_case for backend
            // Include subtasks 
            subtasks: values.subtasks && values.subtasks.length > 0 ? values.subtasks : undefined,
          };
          
          console.log('📤 Sending task data:', JSON.stringify(taskData, null, 2));

          // Create the task
          const createdTask = await addTask(taskData);
          createdTasks.push(createdTask);
          successCount++;

          // Trigger real-time update for each task
          window.dispatchEvent(new CustomEvent('taskCreated', { detail: taskData }));

        } catch (error) {
          console.error(`Error creating task for client ${clientId}:`, error);
          errorCount++;
        }
      }

      // Create quotations for payable tasks
      if (values.is_payable_task && values.price && values.price > 0 && createdTasks.length > 0) {
        let quotationSuccessCount = 0;
        let quotationErrorCount = 0;

        for (const task of createdTasks) {
          try {
            // Get client details from the clients array
            const client = clientsArray.find(c => (c.id || c._id) === (task.client_id || task.client?._id || task.client?.id));
            
            if (!client) {
              console.warn('Client not found for task:', task.id);
              continue;
            }

            // Calculate due date (default to 30 days from now if not specified)
            const dueDate = values.due_date 
              ? new Date(values.due_date) 
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            // Prepare invoice items with subtasks if available
            const items = [];
            
            // Main task item
            items.push({
              description: values.title + (values.description ? ` - ${values.description}` : ''),
              quantity: 1,
              rate: values.price,
              amount: values.price,
              taxable: true,
              taxRate: 18,
              task: task.id || task._id,
            });

            // Add subtasks as line items if they exist
            if (values.subtasks && values.subtasks.length > 0) {
              values.subtasks.forEach((subtask, index) => {
                items.push({
                  description: `  └─ ${subtask.title}${subtask.description ? `: ${subtask.description}` : ''}`,
                  quantity: 1,
                  rate: 0, // Subtasks are included in main price
                  amount: 0,
                  taxable: false,
                  taxRate: 0,
                });
              });
            }

            // Create quotation
            const quotationData = {
              type: 'quotation',
              client: client.id || client._id,
              items: items,
              dueDate: dueDate.toISOString(),
              collectionMethod: values.payable_task_type || 'account_1',
              paymentTerms: 'Net 30',
              notes: `Quotation for task: ${values.title}${values.description ? '\n' + values.description : ''}`,
              gst: {
                applicable: true,
                cgst: 0,
                sgst: 0,
                igst: 0,
              },
            };

            const token2 = getValidatedToken();
            const headersInvoice: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token2) headersInvoice['Authorization'] = `Bearer ${token2}`;
            const response = await fetch(`${API_BASE_URL}/invoices`, {
              method: 'POST',
              headers: headersInvoice,
              body: JSON.stringify(quotationData),
            });

            if (response.ok) {
              const result = await response.json();
              quotationSuccessCount++;
              console.log('Quotation created successfully:', result.data);
            } else {
              throw new Error('Failed to create quotation');
            }
          } catch (error) {
            console.error('Error creating quotation:', error);
            quotationErrorCount++;
          }
        }

        // Show quotation creation results
        if (quotationSuccessCount > 0) {
          toast.success(
            quotationSuccessCount === 1
              ? 'Quotation created successfully!'
              : `${quotationSuccessCount} quotations created successfully!`,
            { duration: 5000 }
          );
        }
        if (quotationErrorCount > 0) {
          toast.error(`Failed to create ${quotationErrorCount} quotation${quotationErrorCount > 1 ? 's' : ''}`);
        }
      }

      // Send notifications for all created tasks
      if (values.assigned_to && values.assigned_to.length > 0 && createdTasks.length > 0) {
        try {
          const token3 = getValidatedToken();
          const headersNotif: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token3) headersNotif['Authorization'] = `Bearer ${token3}`;
          await fetch(`${API_BASE_URL}/notifications/send`, {
            method: 'POST',
            headers: headersNotif,
            body: JSON.stringify({
              type: 'task_assigned',
              recipients: values.assigned_to,
              data: {
                taskTitle: values.title,
                taskCount: createdTasks.length,
                assignedBy: user?.fullName || user?.email,
              },
            }),
          });
        } catch (error) {
          console.error('Error sending notifications:', error);
        }
      }

      // Save as template if requested (only save once)
      if (values.save_as_template && values.template_name) {
        try {
          const token4 = getValidatedToken();
          const headersTemplate: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token4) headersTemplate['Authorization'] = `Bearer ${token4}`;
          await fetch(`${API_BASE_URL}/templates`, {
            method: 'POST',
            headers: headersTemplate,
            body: JSON.stringify({
              name: values.template_name,
              type: 'task',
              data: values,
              created_by: user?.id,
            }),
          });
        } catch (error) {
          console.error('Error saving template:', error);
        }
      }

      // Show appropriate success/error messages
      if (successCount === clientIds.length) {
        const message = clientIds.length === 1 
          ? 'Task created successfully!' 
          : `${successCount} tasks created successfully for ${successCount} clients!`;
        toast.success(message);
        if (values.save_as_template && values.template_name) {
          toast.success('Template saved!');
        }
      } else if (successCount > 0) {
        toast.success(`${successCount} tasks created successfully`);
        if (errorCount > 0) {
          toast.error(`${errorCount} tasks failed to create`);
        }
      } else {
        toast.error('Failed to create any tasks');
        return;
      }
      
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast.error('Failed to create tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Clean Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create New Task</h2>
        <p className="text-gray-600 text-sm">Add a task for your team to work on</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Basic Information */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-8 space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Task Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter task title" 
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Category</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Load template when category changes
                            if (value && value !== 'other') {
                              loadCategoryTemplate(value);
                            }
                          }} 
                          value={field.value}
                          disabled={isLoadingTemplate}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                              <SelectValue placeholder={isLoadingTemplate ? "Loading template..." : "Select category"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gst">GST Filing</SelectItem>
                            <SelectItem value="itr">ITR Filing</SelectItem>
                            <SelectItem value="roc">ROC Filing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>Low</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span>Medium</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                <span>High</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>Urgent</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the task in detail..." 
                          className="min-h-[120px] border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subtasks Display */}
                {form.watch('subtasks') && form.watch('subtasks')!.length > 0 && (
                  <div className="space-y-3">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Subtasks ({form.watch('subtasks')!.length})
                    </FormLabel>
                    <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      {form.watch('subtasks')!.map((subtask, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white border border-blue-100 rounded-md">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {subtask.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900">{subtask.title}</h4>
                            {subtask.description && (
                              <p className="text-xs text-gray-600 mt-1">{subtask.description}</p>
                            )}
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                              {subtask.dueDate && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {subtask.dueDate}
                                </span>
                              )}
                              {subtask.estimatedHours && subtask.estimatedHours > 0 && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {subtask.estimatedHours}h
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-blue-600 mt-2 italic">
                        💡 These subtasks will be included with the task automatically
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Assignment */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Assignment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Client(s) 
                          <span className="text-xs text-gray-500 ml-1">(Select multiple to create separate tasks)</span>
                        </FormLabel>
                        <FormControl>
                          <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className="h-auto min-h-[44px] w-full justify-between border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              >
                                <div className="flex flex-wrap gap-1 flex-1 text-left py-1">
                                  {field.value && Array.isArray(field.value) && field.value.length > 0 ? (
                                    <>
                                      {field.value.map((clientId, index) => {
                                        const client = clientsArray.find(c => (c.id || c._id) === clientId);
                                        return (
                                          <Badge 
                                            key={`${clientId}-${index}`} 
                                            variant="secondary" 
                                            className="text-xs flex items-center gap-1 pr-1"
                                          >
                                            <span className="max-w-[120px] truncate">
                                              {client?.name || client?.client_code || 'Unknown'}
                                            </span>
                                            <X 
                                              className="h-3 w-3 cursor-pointer hover:text-red-500 flex-shrink-0" 
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const currentValues = field.value || [];
                                                const newValues = currentValues.filter(id => id !== clientId);
                                                field.onChange(newValues);
                                              }}
                                            />
                                          </Badge>
                                        );
                                      })}
                                    </>
                                  ) : (
                                    <span className="text-gray-500">Select clients...</span>
                                  )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search clients..." className="h-9" />
                                <CommandList className="max-h-[300px] overflow-y-auto">
                                  <CommandEmpty>
                                    {isLoadingClients ? 'Loading clients...' : 'No clients found.'}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {clientsArray.length > 0 ? (
                                      clientsArray.map((client) => {
                                        const clientId = client.id || client._id;
                                        if (!clientId) return null; // Skip if no ID
                                        const isSelected = (field.value || []).includes(clientId);
                                        return (
                                          <CommandItem
                                            key={`client-${clientId}`}
                                            value={`${client.name || ''} ${client.client_code || ''}`.trim().toLowerCase()}
                                            onSelect={() => {
                                              const currentValues = field.value || [];
                                              if (currentValues.includes(clientId)) {
                                                field.onChange(currentValues.filter(id => id !== clientId));
                                              } else {
                                                field.onChange([...currentValues, clientId]);
                                              }
                                            }}
                                            className="cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2 flex-1">
                                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-medium text-blue-700">
                                                  {client.name?.charAt(0) || 'C'}
                                                </span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="font-medium text-sm">{client.name || 'No Name'}</span>
                                                <span className="text-xs text-gray-500">{client.client_code}</span>
                                              </div>
                                            </div>
                                            <Check
                                              className={`ml-auto h-4 w-4 ${
                                                isSelected ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                          </CommandItem>
                                        );
                                      })
                                    ) : null}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                        {field.value && Array.isArray(field.value) && field.value.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1 flex flex-wrap gap-1">
                            <span>{field.value.length} client(s) selected - will create {field.value.length} separate task(s)</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Due Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Assign To</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                          {employees.map((employee) => (
                            <div key={employee._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                              <Checkbox
                                id={employee._id}
                                checked={field.value?.includes(employee._id) || false}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValues, employee._id]);
                                  } else {
                                    field.onChange(currentValues.filter(id => id !== employee._id));
                                  }
                                }}
                              />
                              <label 
                                htmlFor={employee._id}
                                className="flex items-center gap-2 cursor-pointer flex-1"
                              >
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-green-700">
                                    {employee.fullName?.charAt(0) || 'E'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{employee.fullName || employee.email}</div>
                                  <div className="text-xs text-gray-500">{employee.role}</div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {(!field.value || field.value.length === 0) && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          No assignee selected - task will be unassigned
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 3: Additional Options */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Additional Options</h3>
                
                {/* Template Conversion Option */}
                <FormField
                  control={form.control}
                  name="save_as_template"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-gray-200 rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-3 flex-1">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Save as Template
                        </FormLabel>
                        <p className="text-xs text-gray-500">
                          Convert this task into a reusable template for future use
                        </p>
                        {saveAsTemplate && (
                          <FormField
                            control={form.control}
                            name="template_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">Template Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter template name" 
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Payment & Recurrence Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="is_payable_task"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-gray-200 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Payable Task
                          </FormLabel>
                          <p className="text-xs text-gray-500">
                            Enable if this task requires payment from the client
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_recurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-gray-200 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Recurring Task
                          </FormLabel>
                          <p className="text-xs text-gray-500">
                            Enable if this task should repeat based on a schedule
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Configuration */}
          {isPayableTask && (
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Payment Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Price (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payable_task_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Payment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                              <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="account_1">Account 1</SelectItem>
                            <SelectItem value="account_2">Account 2</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="other_modes">Other Modes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recurrence Configuration */}
          {isRecurring && (
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Recurrence Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="recurrence_pattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Pattern</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrence_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Every</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="99"
                            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrence_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="day">Day(s)</SelectItem>
                            <SelectItem value="week">Week(s)</SelectItem>
                            <SelectItem value="month">Month(s)</SelectItem>
                            <SelectItem value="year">Year(s)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Weekly Configuration */}
                {(recurrencePattern === 'weekly' || recurrenceUnit === 'week') && (
                  <FormField
                    control={form.control}
                    name="recurrence_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Days of Week</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                              <div key={day} className="flex items-center space-x-2">
                                <Checkbox
                                  id={day}
                                  checked={field.value?.includes(day) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValues, day]);
                                    } else {
                                      field.onChange(currentValues.filter(d => d !== day));
                                    }
                                  }}
                                />
                                <label htmlFor={day} className="text-sm font-medium cursor-pointer">{day}</label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Monthly Configuration */}
                {(recurrencePattern === 'monthly' || recurrenceUnit === 'month') && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="recurrence_monthly_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Monthly Schedule</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="monthly_date"
                                  name="monthly_type"
                                  value="date"
                                  checked={field.value === 'date'}
                                  onChange={() => field.onChange('date')}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="monthly_date" className="text-sm font-medium text-gray-700">On date</label>
                                {monthlyType === 'date' && (
                                  <FormField
                                    control={form.control}
                                    name="recurrence_monthly_date"
                                    render={({ field: dateField }) => (
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          type="number"
                                          min="1"
                                          max="31"
                                          placeholder="15"
                                          className="w-16 h-8 border border-gray-300"
                                          {...dateField}
                                          onChange={(e) => dateField.onChange(parseInt(e.target.value) || 1)}
                                        />
                                        <span className="text-sm text-gray-600">of each month</span>
                                      </div>
                                    )}
                                  />
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="monthly_day"
                                  name="monthly_type"
                                  value="day"
                                  checked={field.value === 'day'}
                                  onChange={() => field.onChange('day')}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="monthly_day" className="text-sm font-medium text-gray-700">On the</label>
                                {monthlyType === 'day' && (
                                  <div className="flex items-center space-x-2">
                                    <FormField
                                      control={form.control}
                                      name="recurrence_monthly_week"
                                      render={({ field: weekField }) => (
                                        <Select onValueChange={(value) => weekField.onChange(parseInt(value))} defaultValue={weekField.value?.toString()}>
                                          <SelectTrigger className="w-20 h-8 border border-gray-300">
                                            <SelectValue placeholder="1st" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1">1st</SelectItem>
                                            <SelectItem value="2">2nd</SelectItem>
                                            <SelectItem value="3">3rd</SelectItem>
                                            <SelectItem value="4">4th</SelectItem>
                                            <SelectItem value="-1">Last</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="recurrence_monthly_day"
                                      render={({ field: dayField }) => (
                                        <Select onValueChange={dayField.onChange} defaultValue={dayField.value}>
                                          <SelectTrigger className="w-24 h-8 border border-gray-300">
                                            <SelectValue placeholder="Mon" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Mon">Monday</SelectItem>
                                            <SelectItem value="Tue">Tuesday</SelectItem>
                                            <SelectItem value="Wed">Wednesday</SelectItem>
                                            <SelectItem value="Thu">Thursday</SelectItem>
                                            <SelectItem value="Fri">Friday</SelectItem>
                                            <SelectItem value="Sat">Saturday</SelectItem>
                                            <SelectItem value="Sun">Sunday</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                    <span className="text-sm text-gray-600">of each month</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Yearly Configuration */}
                {(recurrencePattern === 'yearly' || recurrenceUnit === 'year') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="recurrence_yearly_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Month</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">January</SelectItem>
                              <SelectItem value="2">February</SelectItem>
                              <SelectItem value="3">March</SelectItem>
                              <SelectItem value="4">April</SelectItem>
                              <SelectItem value="5">May</SelectItem>
                              <SelectItem value="6">June</SelectItem>
                              <SelectItem value="7">July</SelectItem>
                              <SelectItem value="8">August</SelectItem>
                              <SelectItem value="9">September</SelectItem>
                              <SelectItem value="10">October</SelectItem>
                              <SelectItem value="11">November</SelectItem>
                              <SelectItem value="12">December</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurrence_yearly_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="31"
                              placeholder="15"
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Advance Creation */}
                <FormField
                  control={form.control}
                  name="advance_creation_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Advance Creation</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Create task</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="365"
                            placeholder="0"
                            className="w-20 h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                          <span className="text-sm text-gray-600">days before due date</span>
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        Set to 0 to create tasks on the due date. Set to 2 to create tasks 2 days early for preparation.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Configuration */}
                <FormField
                  control={form.control}
                  name="recurrence_end_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Ends</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="never"
                              name="end_type"
                              value="never"
                              checked={field.value === 'never'}
                              onChange={() => field.onChange('never')}
                              className="w-4 h-4 text-blue-600"
                            />
                            <label htmlFor="never" className="text-sm font-medium text-gray-700">Never</label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="after"
                              name="end_type"
                              value="after"
                              checked={field.value === 'after'}
                              onChange={() => field.onChange('after')}
                              className="w-4 h-4 text-blue-600"
                            />
                            <label htmlFor="after" className="text-sm font-medium text-gray-700">After</label>
                            {recurrenceEndType === 'after' && (
                              <FormField
                                control={form.control}
                                name="recurrence_end_count"
                                render={({ field: countField }) => (
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      max="999"
                                      className="w-20 h-8 border border-gray-300"
                                      {...countField}
                                      onChange={(e) => countField.onChange(parseInt(e.target.value) || 12)}
                                    />
                                    <span className="text-sm text-gray-600">times</span>
                                  </div>
                                )}
                              />
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="on_date"
                              name="end_type"
                              value="on"
                              checked={field.value === 'on'}
                              onChange={() => field.onChange('on')}
                              className="w-4 h-4 text-blue-600"
                            />
                            <label htmlFor="on_date" className="text-sm font-medium text-gray-700">On</label>
                            {recurrenceEndType === 'on' && (
                              <FormField
                                control={form.control}
                                name="recurrence_end_date"
                                render={({ field: dateField }) => (
                                  <Input
                                    type="date"
                                    className="w-40 h-8 border border-gray-300"
                                    {...dateField}
                                  />
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recurrence Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 font-medium">
                        Summary: This task will occur every {form.watch('recurrence_interval') || 1} {form.watch('recurrence_unit')}
                        {(recurrencePattern === 'weekly' || recurrenceUnit === 'week') && form.watch('recurrence_days')?.length > 0 && (
                          <span> on {form.watch('recurrence_days')?.join(', ')}</span>
                        )}
                        {(recurrencePattern === 'monthly' || recurrenceUnit === 'month') && (
                          <span>
                            {monthlyType === 'date' && form.watch('recurrence_monthly_date') && (
                              <span> on the {form.watch('recurrence_monthly_date')}th</span>
                            )}
                            {monthlyType === 'day' && form.watch('recurrence_monthly_week') && form.watch('recurrence_monthly_day') && (
                              <span> on the {form.watch('recurrence_monthly_week') === -1 ? 'last' : 
                                form.watch('recurrence_monthly_week') === 1 ? '1st' :
                                form.watch('recurrence_monthly_week') === 2 ? '2nd' :
                                form.watch('recurrence_monthly_week') === 3 ? '3rd' : '4th'} {form.watch('recurrence_monthly_day')}</span>
                            )}
                          </span>
                        )}
                        {(recurrencePattern === 'yearly' || recurrenceUnit === 'year') && form.watch('recurrence_yearly_month') && form.watch('recurrence_yearly_date') && (
                          <span> on {['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][form.watch('recurrence_yearly_month')]} {form.watch('recurrence_yearly_date')}</span>
                        )}
                        {recurrenceEndType === 'after' && (
                          <span>, ending after {form.watch('recurrence_end_count')} times</span>
                        )}
                        {recurrenceEndType === 'on' && form.watch('recurrence_end_date') && (
                          <span>, ending on {form.watch('recurrence_end_date')}</span>
                        )}
                      </p>
                      {form.watch('advance_creation_days') > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Tasks will be created {form.watch('advance_creation_days')} days before the due date
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={computeRecurrenceDates}
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      Preview Dates
                    </Button>
                  </div>
                  
                  {showPreview && previewDates.length > 0 && (
                    <div className="border-t border-blue-200 pt-4">
                      <p className="text-xs text-blue-600 font-medium mb-2">
                        {form.watch('due_date') ? 'Next' : 'Projected'} {previewDates.length} occurrences:
                        {!form.watch('due_date') && (
                          <span className="text-blue-500 italic"> (starting from today)</span>
                        )}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {previewDates.map((date, index) => (
                          <div 
                            key={index}
                            className="text-xs bg-white border border-blue-200 rounded px-2 py-1 text-blue-800"
                          >
                            {date}
                          </div>
                        ))}
                      </div>
                      {recurrenceEndType === 'never' && previewDates.length >= 10 && (
                        <p className="text-xs text-blue-500 mt-2 italic">
                          ... and continues indefinitely
                        </p>
                      )}
                    </div>
                  )}
                  
                  {showPreview && previewDates.length === 0 && (
                    <div className="border-t border-blue-200 pt-4">
                      <p className="text-xs text-blue-600">
                        Please configure recurrence settings to preview dates.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Section */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => saveDraft(form.getValues())}
                disabled={isDraftSaving || !form.watch('title')?.trim()}
                className="h-11 px-6 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {isDraftSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2" />
                    Saving Draft...
                  </>
                ) : (
                  <>
                    Save Draft
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.reset()}
                className="h-11 px-6 text-sm font-medium border-gray-300 hover:bg-gray-50"
              >
                Reset Form
              </Button>
            </div>

            <Button 
              type="submit" 
              className="h-11 px-8 text-sm font-medium bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating Tasks...
                </>
              ) : (
                <>
                  {(() => {
                    const clientCount = form.watch('client_id')?.length || 0;
                    if (clientCount === 0) return 'Create Task';
                    if (clientCount === 1) return 'Create Task';
                    return `Create ${clientCount} Tasks`;
                  })()}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
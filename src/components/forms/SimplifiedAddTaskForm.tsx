import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, X, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getValidatedToken } from '@/lib/auth';
import { useClients } from '@/hooks/useClients';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/config/api.config';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

// Simplified schema focusing on essentials
const formSchema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  category: z.enum(['gst', 'itr', 'roc', 'other'], {
    required_error: "Select a category",
  }),
  sub_category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  client_id: z.string().optional(),
  assigned_to: z.array(z.string()).optional(),
  due_date: z.string().min(1, "Due date required"),
  price: z.number().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().optional(),
});

interface SubCategoryConfig {
  name: string;
  due_date: string;
  price: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
}

export function SimplifiedAddTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<SubCategoryConfig[]>([]);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [editingSubCategoryIndex, setEditingSubCategoryIndex] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { clients = [] } = useClients();
  const { employees = [] } = useEmployees();
  
  const isEmployee = authUser?.role === 'employee';
  const isOwnerOrAdmin = authUser?.role === 'owner' || authUser?.role === 'admin';
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      sub_category: '',
      priority: 'medium',
      client_id: '',
      assigned_to: [],
      due_date: '',
      price: undefined,
      is_recurring: false,
      recurrence_pattern: '',
    },
  });

  const selectedCategory = form.watch('category');
  const dueDate = form.watch('due_date');

  // Fetch sub-categories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (selectedCategory && selectedCategory !== 'other') {
        try {
          const token = getValidatedToken();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          
          const response = await fetch(`${API_BASE_URL}/tasks/sub-categories/${selectedCategory}`, {
            headers
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setAvailableSubCategories(result.data);
            }
          }
        } catch (error) {
          console.error('Error fetching sub-categories:', error);
          setAvailableSubCategories([]);
        }
      } else {
        setAvailableSubCategories([]);
        setSelectedSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [selectedCategory]);

  const addSubCategory = () => {
    const subCategoryName = form.watch('sub_category');
    if (!subCategoryName) {
      toast.error('Please select a sub-category');
      return;
    }

    if (selectedSubCategories.some(sc => sc.name === subCategoryName)) {
      toast.error('This sub-category is already added');
      return;
    }

    setSelectedSubCategories([...selectedSubCategories, {
      name: subCategoryName,
      due_date: dueDate || '',
      price: 0,
      is_recurring: false,
    }]);
    
    form.setValue('sub_category', '');
    toast.success('Sub-category added');
  };

  const updateSubCategory = (index: number, field: keyof SubCategoryConfig, value: any) => {
    const updated = [...selectedSubCategories];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedSubCategories(updated);
  };

  const removeSubCategory = (index: number) => {
    setSelectedSubCategories(selectedSubCategories.filter((_, i) => i !== index));
    toast.success('Sub-category removed');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const token = getValidatedToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // If there are sub-categories, create tasks for each
      if (selectedSubCategories.length > 0) {
        let successCount = 0;
        
        for (const subCat of selectedSubCategories) {
          const taskData = {
            title: `${values.title} - ${subCat.name}`,
            description: values.description || '',
            category: values.category,
            sub_category: subCat.name,
            priority: values.priority,
            client_id: values.client_id || null,
            assigned_to: values.assigned_to || [],
            due_date: subCat.due_date,
            is_payable_task: subCat.price > 0,
            price: subCat.price,
            is_recurring: subCat.is_recurring,
            recurrence_pattern: subCat.recurrence_pattern || '',
          };

          const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              successCount++;
            }
          }
        }

        // Invalidate and refetch tasks
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
        await queryClient.refetchQueries({ queryKey: ['tasks'] });

        if (successCount === selectedSubCategories.length) {
          toast.success(`${successCount} task${successCount > 1 ? 's' : ''} created successfully!`);
          onSuccess();
        } else {
          toast.warning(`${successCount} of ${selectedSubCategories.length} tasks created`);
          onSuccess();
        }
      } else {
        // Single task creation
        const taskData = {
          title: values.title,
          description: values.description || '',
          category: values.category,
          sub_category: values.sub_category || null,
          priority: values.priority,
          client_id: values.client_id || null,
          assigned_to: values.assigned_to || [],
          due_date: values.due_date,
          is_payable_task: values.price && values.price > 0,
          price: values.price,
          is_recurring: values.is_recurring,
          recurrence_pattern: values.recurrence_pattern || '',
        };

        const response = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Invalidate and refetch tasks to ensure UI updates
          await queryClient.invalidateQueries({ queryKey: ['tasks'] });
          await queryClient.refetchQueries({ queryKey: ['tasks'] });
          
          if (result.success && result.data?.task) {
            toast.success('Task created successfully!');
            onSuccess();
          } else {
            console.warn('Task creation returned unexpected data:', result);
            toast.success('Task created successfully!');
            onSuccess();
          }
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || 'Failed to create task');
        }
      }
    } catch (error) {
      console.error('Task creation error:', error);
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <p className="text-sm text-muted-foreground">Start with the essentials</p>
      </div>

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Task Title *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., GST Filing for Q1 2024" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="gst">GST</SelectItem>
                <SelectItem value="itr">ITR</SelectItem>
                <SelectItem value="roc">ROC</SelectItem>
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
            <FormLabel>Priority *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Additional details about this task..." 
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Assignment & Timeline</h3>
        <p className="text-sm text-muted-foreground">Who and when</p>
      </div>

      <FormField
        control={form.control}
        name="client_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select client (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No Client</SelectItem>
                {clients.map((client: any) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.name || client.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="assigned_to"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assign To</FormLabel>
            <div className="space-y-2">
              {employees.map((employee: any) => (
                <div key={employee._id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value?.includes(employee._id)}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      if (checked) {
                        field.onChange([...current, employee._id]);
                      } else {
                        field.onChange(current.filter(id => id !== employee._id));
                      }
                    }}
                  />
                  <Label className="text-sm font-normal cursor-pointer">
                    {employee.fullName}
                  </Label>
                </div>
              ))}
            </div>
            <FormDescription>Select team members to assign this task</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="due_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Due Date *</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isEmployee && (
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  {...field}
                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormDescription>Quotation will be sent only if amount is filled</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Sub-Categories (Optional)</h3>
        <p className="text-sm text-muted-foreground">Break down into smaller tasks</p>
      </div>

      {availableSubCategories.length > 0 ? (
        <>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="sub_category"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSubCategories.map((subCat) => (
                        <SelectItem key={subCat} value={subCat}>
                          {subCat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="button" onClick={addSubCategory} variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          {selectedSubCategories.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Added Sub-Categories:</Label>
              {selectedSubCategories.map((subCat, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{subCat.name}</h4>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubCategory(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Due Date</Label>
                        <Input
                          type="date"
                          value={subCat.due_date}
                          onChange={(e) => updateSubCategory(index, 'due_date', e.target.value)}
                        />
                      </div>
                      {!isEmployee && (
                        <div>
                          <Label className="text-xs">Amount (₹)</Label>
                          <Input
                            type="number"
                            value={subCat.price}
                            onChange={(e) => updateSubCategory(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={subCat.is_recurring}
                        onCheckedChange={(checked) => updateSubCategory(index, 'is_recurring', checked)}
                      />
                      <Label className="text-sm font-normal">Recurring</Label>
                    </div>

                    {subCat.is_recurring && (
                      <div>
                        <Label className="text-xs">Recurrence Pattern</Label>
                        <Select
                          value={subCat.recurrence_pattern}
                          onValueChange={(value) => updateSubCategory(index, 'recurrence_pattern', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select pattern" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-medium">Sub-Categories Help:</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>Each sub-category becomes a separate task</li>
                <li>Configure individual due dates and amounts</li>
                <li>Set recurring patterns per sub-category</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No sub-categories available for {selectedCategory.toUpperCase()}</p>
          <p className="text-xs mt-1">Skip this step to create a single task</p>
        </div>
      )}
    </div>
  );

  const canProceedToStep2 = () => {
    const title = form.watch('title');
    const category = form.watch('category');
    return title && title.length >= 2 && category;
  };

  const canProceedToStep3 = () => {
    const dueDate = form.watch('due_date');
    return dueDate && dueDate.length > 0;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                step >= s ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
              )}>
                {s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 transition-colors",
                  step > s ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedToStep2() : !canProceedToStep3()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : selectedSubCategories.length > 0 ? `Create ${selectedSubCategories.length} Tasks` : 'Create Task'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

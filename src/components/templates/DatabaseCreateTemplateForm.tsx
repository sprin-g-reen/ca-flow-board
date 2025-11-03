
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ClientSelector } from '@/components/clients/ClientSelector';
import { useTemplates } from '@/hooks/useTemplates';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const subtaskSchema = z.object({
  title: z.string().min(1, 'Subtask title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  order: z.number(),
});

const templateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['gst', 'itr', 'roc', 'other']),
  deadline: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(['monthly', 'yearly', 'custom']).optional(),
  isPayableTask: z.boolean().default(false),
  payableTaskType: z.enum(['payable_task_1', 'payable_task_2']).optional(),
  price: z.number().optional(),
  assignedEmployeeId: z.string().optional(),
  subtasks: z.array(subtaskSchema).optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface Props {
  onSuccess?: () => void;
  templateId?: string;
}

export const DatabaseCreateTemplateForm: React.FC<Props> = ({ onSuccess, templateId }) => {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const { createTemplate, isCreating, updateTemplate, isUpdating, useTemplate } = useTemplates();
  const { employees } = useEmployees();
  
  // Fetch template data if editing
  const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(templateId || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      category: 'gst',
      isRecurring: false,
      isPayableTask: false,
      subtasks: [],
    },
  });

  // Use field array for subtasks
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'subtasks',
  });

  // Load template data when editing
  useEffect(() => {
    if (templateData && templateId) {
      console.log('Loading template data for editing:', templateData);
      
      // Map API data to form data
      const formData: Partial<TemplateFormData> = {
        title: templateData.title,
        description: templateData.description || '',
        category: templateData.category,
        deadline: templateData.deadline || '',
        isRecurring: templateData.is_recurring || false,
        recurrencePattern: templateData.recurrence_pattern,
        isPayableTask: templateData.is_payable_task || false,
        payableTaskType: templateData.payable_task_type,
        price: templateData.price,
        assignedEmployeeId: templateData.assigned_employee_id || '',
        subtasks: templateData.subtasks || [],
      };

      // Reset form with template data
      reset(formData);

      // Set client if exists
      if (templateData.client_id) {
        // You might need to fetch client data here
        setSelectedClient({ id: templateData.client_id });
      }
    }
  }, [templateData, templateId, reset]);

  const isRecurring = watch('isRecurring');
  const isPayableTask = watch('isPayableTask');

  // Helper function to add subtask with proper order
  const addSubtask = () => {
    append({ 
      title: '', 
      description: '', 
      dueDate: '', 
      order: fields.length + 1 
    });
  };

  const onSubmit = async (data: TemplateFormData) => {
    try {
      const templateRequestData = {
        title: data.title,
        description: data.description,
        category: data.category,
        client_id: selectedClient?.id,
        price: data.isPayableTask ? data.price : null,
        payable_task_type: data.isPayableTask ? data.payableTaskType : null,
        recurrence_pattern: data.isRecurring ? data.recurrencePattern : null,
        deadline: data.deadline,
        is_recurring: data.isRecurring,
        is_payable_task: data.isPayableTask,
        assigned_employee_id: data.assignedEmployeeId,
        subtasks: data.subtasks || [],
      };

      if (templateId) {
        // Update existing template
        updateTemplate({ id: templateId, ...templateRequestData });
        toast.success('Template updated successfully');
      } else {
        // Create new template
        createTemplate(templateRequestData);
        toast.success('Template created successfully');
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(`Failed to ${templateId ? 'update' : 'create'} template`);
    }
  };

  if (isLoadingTemplate) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading template...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{templateId ? 'Edit Template' : 'Create Task Template'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Template Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Monthly GST Filing"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the task template..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={watch('category')} 
              onValueChange={(value) => setValue('category', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gst">GST Filing</SelectItem>
                <SelectItem value="itr">ITR Filing</SelectItem>
                <SelectItem value="roc">ROC Filing</SelectItem>
                <SelectItem value="other">Other Tasks</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>


          <div className="space-y-2">
            <Label>Client (Optional)</Label>
            <ClientSelector
              onClientSelect={setSelectedClient}
              selectedClientId={selectedClient?.id}
              placeholder="Select a client for this template"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedEmployeeId">Assigned Employee (Optional)</Label>
            <Select 
              value={watch('assignedEmployeeId')} 
              onValueChange={(value) => setValue('assignedEmployeeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee._id} value={employee._id}>
                    {employee.employee_id || employee.fullName || employee.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              {...register('deadline')}
            />
          </div>

          {/* Subtasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Subtasks</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubtask}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subtask
              </Button>
            </div>
            
            {fields.length > 0 && (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <Input
                            placeholder="Subtask title"
                            {...register(`subtasks.${index}.title`)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Subtask description (optional)"
                          {...register(`subtasks.${index}.description`)}
                          rows={2}
                        />
                        <Input
                          type="date"
                          placeholder="Due date"
                          {...register(`subtasks.${index}.dueDate`)}
                        />
                      </div>
                    </div>
                    {errors.subtasks?.[index] && (
                      <div className="mt-2 text-sm text-red-600">
                        {errors.subtasks[index]?.title?.message}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
            
            {fields.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500 mb-2">No subtasks added yet</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSubtask}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Subtask
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={isRecurring}
              onCheckedChange={(checked) => setValue('isRecurring', checked)}
            />
            <Label>Recurring Task</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
              <Select 
                value={watch('recurrencePattern')} 
                onValueChange={(value) => setValue('recurrencePattern', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              checked={isPayableTask}
              onCheckedChange={(checked) => setValue('isPayableTask', checked)}
            />
            <Label>Payable Task</Label>
          </div>

          {isPayableTask && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payableTaskType">Payment Configuration</Label>
                <Select 
                  value={watch('payableTaskType')} 
                  onValueChange={(value) => setValue('payableTaskType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payable_task_1">Payment Config 1</SelectItem>
                    <SelectItem value="payable_task_2">Payment Config 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="Enter task price"
                />
              </div>
            </div>
          )}

          <Button type="submit" disabled={isCreating || isUpdating} className="w-full">
            {(isCreating || isUpdating) ? 
              (templateId ? 'Updating...' : 'Creating...') : 
              (templateId ? 'Update Template' : 'Create Template')
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

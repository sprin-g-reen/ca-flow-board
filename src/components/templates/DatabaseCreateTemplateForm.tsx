
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface Props {
  onSuccess?: () => void;
  templateId?: string;
}

export const DatabaseCreateTemplateForm: React.FC<Props> = ({ onSuccess, templateId }) => {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const { createTemplate, isCreating } = useTemplates();
  const { employees } = useEmployees();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      category: 'gst',
      isRecurring: false,
      isPayableTask: false,
    },
  });

  const isRecurring = watch('isRecurring');
  const isPayableTask = watch('isPayableTask');

  const onSubmit = async (data: TemplateFormData) => {
    try {
      const templateData = {
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
        subtasks: [],
      };

      createTemplate(templateData);
      toast.success('Template created successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

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
            <Select onValueChange={(value) => setValue('category', value as any)}>
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
            <Select onValueChange={(value) => setValue('assignedEmployeeId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.employee_id}
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
              <Select onValueChange={(value) => setValue('recurrencePattern', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence" />
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
                <Select onValueChange={(value) => setValue('payableTaskType', value as any)}>
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

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? 'Creating...' : templateId ? 'Update Template' : 'Create Template'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

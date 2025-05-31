import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTemplates } from '@/hooks/useTemplates';
import { useEmployees } from '@/hooks/useEmployees';
import { getCategoryOptions } from './CategoryWorkflows';
import { ClientSelector } from '@/components/ClientSelector';

const templateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['gst', 'itr', 'roc', 'other']),
  is_recurring: z.boolean(),
  recurrence_pattern: z.enum(['monthly', 'yearly', 'custom']).optional(),
  deadline: z.string().optional(),
  price: z.number().optional(),
  is_payable_task: z.boolean(),
  payable_task_type: z.enum(['payable_task_1', 'payable_task_2']).optional(),
  assigned_employee_id: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface DatabaseCreateTemplateFormProps {
  onSuccess: () => void;
  templateId?: string;
}

export const DatabaseCreateTemplateForm = ({ onSuccess, templateId }: DatabaseCreateTemplateFormProps) => {
  const [subtasks, setSubtasks] = useState<Array<{ title: string; description: string; order: number }>>([]);
  const [currentSubtask, setCurrentSubtask] = useState({ title: '', description: '' });
  const [selectedClient, setSelectedClient] = useState(null);
  
  const { createTemplate, isCreating } = useTemplates();
  const { employees } = useEmployees();
  const categoryOptions = getCategoryOptions();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      is_recurring: false,
      price: 0,
      is_payable_task: false,
    },
  });

  const isRecurring = form.watch('is_recurring');
  const isPayable = form.watch('is_payable_task');

  const addSubtask = () => {
    if (currentSubtask.title.trim()) {
      setSubtasks(prev => [...prev, {
        ...currentSubtask,
        order: prev.length + 1,
      }]);
      setCurrentSubtask({ title: '', description: '' });
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    // Pre-fill client data in the template
    if (client) {
      form.setValue('title', `${form.getValues('title')} - ${client.name}`);
    }
  };

  const onSubmit = (data: TemplateFormData) => {
    const templateData = {
      title: data.title,
      description: data.description,
      category: data.category,
      is_recurring: data.is_recurring,
      recurrence_pattern: data.recurrence_pattern,
      deadline: data.deadline,
      subtasks,
      price: data.price || 0,
      is_payable_task: data.is_payable_task,
      payable_task_type: data.payable_task_type,
      assigned_employee_id: data.assigned_employee_id,
      // Include client information if selected
      client_id: selectedClient?.id,
      client_name: selectedClient?.name,
      client_data: selectedClient ? {
        client_code: selectedClient.client_code,
        contact_person: selectedClient.contact_person,
        email: selectedClient.email,
        phone: selectedClient.phone,
        gst_number: selectedClient.gst_number,
        pan_number: selectedClient.pan_number,
        business_type: selectedClient.business_type,
      } : null,
    };

    console.log('Creating template with data:', templateData);
    createTemplate(templateData);
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client Selection Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium">Client Pre-filling (Optional)</h3>
          <p className="text-sm text-gray-600">
            Select a client to pre-fill their information in tasks created from this template
          </p>
          <ClientSelector
            onClientSelect={handleClientSelect}
            selectedClientId={selectedClient?.id}
            placeholder="Search and select a client for this template..."
          />
          {selectedClient && (
            <div className="mt-2 p-3 bg-white border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedClient.name}</h4>
                  <p className="text-sm text-gray-500">
                    {selectedClient.contact_person} • {selectedClient.client_code}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClient(null)}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter template title" {...field} />
              </FormControl>
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
                <Textarea placeholder="Enter template description" {...field} />
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
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
          name="assigned_employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Employee (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">No specific employee</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.employee_id}
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
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Recurring Template</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {isRecurring && (
          <FormField
            control={form.control}
            name="recurrence_pattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recurrence Pattern</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Deadline (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 15th of every month" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_payable_task"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Payable Task</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {isPayable && (
          <>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter price" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                  <FormLabel>Payment Configuration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="payable_task_1">Payment Config 1</SelectItem>
                      <SelectItem value="payable_task_2">Payment Config 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Subtasks Section */}
        <div className="space-y-4">
          <Label>Subtasks</Label>
          
          {/* Add new subtask */}
          <div className="border rounded-lg p-4 space-y-3">
            <Input
              placeholder="Subtask title"
              value={currentSubtask.title}
              onChange={(e) => setCurrentSubtask(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Subtask description"
              value={currentSubtask.description}
              onChange={(e) => setCurrentSubtask(prev => ({ ...prev, description: e.target.value }))}
            />
            <Button type="button" onClick={addSubtask} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Subtask
            </Button>
          </div>

          {/* Display existing subtasks */}
          {subtasks.length > 0 && (
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{subtask.title}</h4>
                    {subtask.description && (
                      <p className="text-sm text-muted-foreground">{subtask.description}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Form>
  );
};


import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { addTaskTemplate, TaskTemplate, SubTask } from '@/store/slices/tasksSlice';

const subtaskSchema = z.object({
  title: z.string().min(2, "Subtask title is required"),
  description: z.string().min(2, "Subtask description is required"),
  dueDate: z.string().optional(),
  order: z.number(),
});

const templateFormSchema = z.object({
  title: z.string().min(2, "Template title is required"),
  description: z.string().min(5, "Description is required"),
  category: z.enum(['gst_filing', 'itr_filing', 'roc_filing', 'other']),
  isRecurring: z.boolean(),
  recurrencePattern: z.enum(['monthly', 'yearly', 'custom']).optional(),
  deadline: z.string().optional(),
  subtasks: z.array(subtaskSchema),
  price: z.coerce.number().min(0, "Price must be positive").optional(),
  isPayableTask: z.boolean(),
  payableTaskType: z.enum(['payable_task_1', 'payable_task_2']).optional(),
  assignedEmployeeId: z.string().optional(),
});

interface CreateTemplateFormProps {
  onSuccess: () => void;
}

export function CreateTemplateForm({ onSuccess }: CreateTemplateFormProps) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      isRecurring: false,
      subtasks: [],
      price: 0,
      isPayableTask: false,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const isPayableTask = form.watch('isPayableTask');
  const category = form.watch('category');
  const isRecurring = form.watch('isRecurring');

  const addSubtask = () => {
    append({
      title: '',
      description: '',
      dueDate: '',
      order: fields.length + 1,
    });
  };

  const loadPresetSubtasks = (category: string) => {
    let presetSubtasks: Partial<SubTask>[] = [];

    switch (category) {
      case 'gst_filing':
        presetSubtasks = [
          {
            title: 'Collection of data from clients',
            description: 'Gather all necessary documents and data from client',
            dueDate: '5th of every month',
            order: 1,
          },
          {
            title: 'GSTR1 Filing',
            description: 'File GSTR1 return by 10th of every month',
            dueDate: '10th of every month',
            order: 2,
          },
          {
            title: 'GST 3B Filing & Tax Payment',
            description: 'File GST 3B and make tax payment by 20th of every month',
            dueDate: '20th of every month',
            order: 3,
          },
        ];
        break;
      case 'itr_filing':
        presetSubtasks = [
          {
            title: 'Collection of data from clients',
            description: 'Gather annual financial data and documents',
            order: 1,
          },
          {
            title: 'Finalization of accounts',
            description: 'Review and finalize all account statements',
            order: 2,
          },
          {
            title: 'Tax payment',
            description: 'Calculate and process tax payments',
            order: 3,
          },
          {
            title: 'ITR filing',
            description: 'Submit ITR forms before deadline',
            order: 4,
          },
        ];
        break;
      case 'roc_filing':
        presetSubtasks = [
          {
            title: 'Form 1 Filing',
            description: 'Prepare and submit Form 1',
            order: 1,
          },
          {
            title: 'Form 2 Filing',
            description: 'Prepare and submit Form 2',
            order: 2,
          },
          {
            title: 'Form 3 Filing',
            description: 'Prepare and submit Form 3',
            order: 3,
          },
        ];
        break;
    }

    // Clear existing subtasks and add presets
    form.setValue('subtasks', presetSubtasks);
  };

  const onSubmit = async (values: z.infer<typeof templateFormSchema>) => {
    try {
      setIsSubmitting(true);
      console.log('Creating template:', values);

      const newTemplate: TaskTemplate = {
        id: `template_${Date.now()}`,
        title: values.title,
        description: values.description,
        category: values.category,
        isRecurring: values.isRecurring,
        recurrencePattern: values.recurrencePattern,
        deadline: values.deadline,
        subtasks: values.subtasks.map((st, index) => ({
          id: `subtask_${Date.now()}_${index}`,
          title: st.title,
          description: st.description,
          dueDate: st.dueDate,
          isCompleted: false,
          order: st.order,
        })),
        price: values.price,
        isPayableTask: values.isPayableTask,
        payableTaskType: values.payableTaskType,
        assignedEmployeeId: values.assignedEmployeeId,
        createdBy: 'current_user', // This should come from auth context
        createdAt: new Date().toISOString(),
      };

      dispatch(addTaskTemplate(newTemplate));
      
      toast.success("Template created successfully");
      setIsSubmitting(false);
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error("Failed to create template");
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== 'other') {
                      loadPresetSubtasks(value);
                    }
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gst_filing">GST Filing</SelectItem>
                    <SelectItem value="itr_filing">ITR Filing</SelectItem>
                    <SelectItem value="roc_filing">ROC Filing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter template description" 
                  className="min-h-20" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Recurring Task</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {isRecurring && (
            <FormField
              control={form.control}
              name="recurrencePattern"
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
                <FormLabel>Custom Deadline</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 31st March" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isPayableTask"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Payable Task</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Generate quotations and payment links
                  </p>
                </div>
              </FormItem>
            )}
          />

          {isPayableTask && (
            <>
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payableTaskType"
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
                        <SelectItem value="payable_task_1">Branch 1 (Primary)</SelectItem>
                        <SelectItem value="payable_task_2">Branch 2 (Secondary)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Subtasks</CardTitle>
            <Button type="button" onClick={addSubtask} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Subtask
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-start gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`subtasks.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subtask Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter subtask title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`subtasks.${index}.dueDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 10th of every month" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`subtasks.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter subtask description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No subtasks added yet.</p>
                <p className="text-sm">Add subtasks to break down the template into manageable steps.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button 
            type="submit" 
            className="bg-ca-blue hover:bg-ca-blue-dark"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

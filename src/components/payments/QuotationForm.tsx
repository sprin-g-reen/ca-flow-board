
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTasks } from '@/hooks/useTasks';
import { usePayments } from '@/hooks/usePayments';
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';

const quotationSchema = z.object({
  task_id: z.string().min(1, 'Task is required'),
  client_id: z.string().min(1, 'Client is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  tax_rate: z.number().min(0).max(100),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  valid_until: z.string().optional(),
  payment_type: z.string().optional(),
  sent_via_whatsapp: z.boolean().default(false),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface Props {
  onSuccess?: () => void;
  initialTaskId?: string;
}

export const QuotationForm: React.FC<Props> = ({ onSuccess, initialTaskId }) => {
  const { tasks } = useTasks();
  const { clients } = useClients();
  const { createQuotation, isCreating } = usePayments();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      task_id: initialTaskId || '',
      tax_rate: 18,
      sent_via_whatsapp: false,
    },
  });

  const selectedTaskId = watch('task_id');
  const amount = watch('amount') || 0;
  const taxRate = watch('tax_rate') || 18;
  const taxAmount = (amount * taxRate) / 100;
  const totalAmount = amount + taxAmount;

  // Filter payable tasks - fixed property names
  const payableTasks = tasks.filter(task => task.isPayableTask && !task.quotationSent);

  const onSubmit = async (values: QuotationFormData) => {
    try {
      const quotationData = {
        ...values,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft' as const,
        is_deleted: false,
      };

      createQuotation(quotationData);
      toast.success('Quotation created successfully');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to create quotation');
    }
  };

  // Auto-fill when task is selected
  useEffect(() => {
    if (selectedTaskId) {
      const selectedTask = tasks.find(task => task.id === selectedTaskId);
      if (selectedTask) {
        setValue('client_id', selectedTask.clientId);
        if (selectedTask.price) {
          setValue('amount', selectedTask.price);
        }
      }
    }
  }, [selectedTaskId, tasks, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Quotation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task_id">Task *</Label>
            <Select onValueChange={(value) => setValue('task_id', value)} value={selectedTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a payable task" />
              </SelectTrigger>
              <SelectContent>
                {payableTasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title} - {task.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.task_id && (
              <p className="text-sm text-red-600">{errors.task_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Select onValueChange={(value) => setValue('client_id', value)} value={watch('client_id')}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p className="text-sm text-red-600">{errors.client_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                {...register('tax_rate', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <Label className="text-sm font-medium">Tax Amount</Label>
              <p className="text-lg">₹{taxAmount.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Total Amount</Label>
              <p className="text-lg font-bold">₹{totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              id="payment_terms"
              {...register('payment_terms')}
              placeholder="e.g., 30 days"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid_until">Valid Until</Label>
            <Input
              id="valid_until"
              type="date"
              {...register('valid_until')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_type">Payment Type</Label>
            <Select onValueChange={(value) => setValue('payment_type', value)}>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes for the quotation..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sent_via_whatsapp"
              checked={watch('sent_via_whatsapp')}
              onCheckedChange={(checked) => setValue('sent_via_whatsapp', !!checked)}
            />
            <Label htmlFor="sent_via_whatsapp">Send via WhatsApp</Label>
          </div>

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? 'Creating...' : 'Create Quotation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

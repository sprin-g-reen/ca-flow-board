
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuotations } from '@/hooks/usePayments';
import { useClients } from '@/hooks/useClients';
import { useTasks } from '@/hooks/useTasks';
import { Calculator, Send, Smartphone } from 'lucide-react';

const formSchema = z.object({
  task_id: z.string().min(1, "Please select a task"),
  client_id: z.string().min(1, "Please select a client"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  tax_rate: z.number().min(0).max(100).default(18),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  payment_type: z.enum(['payable_task_1', 'payable_task_2']),
  valid_until: z.string().optional(),
});

interface QuotationFormProps {
  onSuccess: () => void;
}

export function QuotationForm({ onSuccess }: QuotationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createQuotation } = useQuotations();
  const { clients } = useClients();
  const { tasks } = useTasks();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      task_id: '',
      client_id: '',
      amount: 0,
      tax_rate: 18,
      payment_terms: 'Net 30 days',
      notes: '',
      payment_type: 'payable_task_1',
      valid_until: '',
    },
  });

  const amount = form.watch('amount');
  const taxRate = form.watch('tax_rate');
  const taxAmount = (amount * taxRate) / 100;
  const totalAmount = amount + taxAmount;

  // Filter payable tasks
  const payableTasks = tasks.filter(task => task.isPayableTask && !task.quotationSent);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log('Creating quotation with values:', values);

      await createQuotation({
        task_id: values.task_id,
        client_id: values.client_id,
        amount: values.amount,
        tax_rate: values.tax_rate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_terms: values.payment_terms,
        notes: values.notes,
        payment_type: values.payment_type,
        status: 'draft',
        sent_via_whatsapp: false,
        valid_until: values.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      toast.success("Quotation created successfully");
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error("Failed to create quotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="task_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payable task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {payableTasks.map(task => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{task.title}</span>
                            <Badge variant="outline" className="ml-2">
                              ₹{task.price?.toLocaleString()}
                            </Badge>
                          </div>
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
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Amount (₹) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="18"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 18)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="payable_task_1">Account 1 (Primary)</SelectItem>
                      <SelectItem value="payable_task_2">Account 2 (Secondary)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Amount Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Base Amount:</span>
                  <span>₹{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Net 30 days" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid Until</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes or terms for the quotation"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button 
              type="submit" 
              className="bg-ca-blue hover:bg-ca-blue-dark"
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create Quotation"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

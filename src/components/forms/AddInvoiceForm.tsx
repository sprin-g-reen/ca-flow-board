import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Plus, Info, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateInvoice, useLastPricingByClient } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useSettings } from '@/hooks/useSettings';
import { generateInvoicePDF } from '@/utils/invoicePDF';

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate must be 0 or greater"),
  taxRate: z.coerce.number().min(0).max(28).default(18),
  hsn: z.string().optional(),
});

const formSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export function AddInvoiceForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clients, isLoading: isLoadingClients } = useClients();
  const { settings: firmSettings } = useSettings({ category: 'company' });
  const createInvoice = useCreateInvoice();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      items: [{ description: '', quantity: 1, rate: 0, taxRate: 18 }],
      notes: '',
      terms: '',
    },
  });
  
  const selectedClientId = form.watch('clientId');
  
  // Fetch last pricing for selected client
  const { data: lastPricing } = useLastPricingByClient(
    selectedClientId || '',
    { enabled: !!selectedClientId }
  );
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Auto-populate items when last pricing is available
  useEffect(() => {
    if (lastPricing?.success && lastPricing.data?.items && lastPricing.data.items.length > 0) {
      const itemsFromLastInvoice = lastPricing.data.items.map(item => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        taxRate: item.taxRate || 18,
        hsn: item.hsn || '',
      }));
      form.setValue('items', itemsFromLastInvoice);
      toast.info(`Loaded ${lastPricing.data.items.length} items from last invoice`);
    }
  }, [lastPricing, form]);
  
  // Calculate totals
  const items = form.watch('items');
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    return sum + (quantity * rate);
  }, 0);

  const taxAmount = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const taxRate = Number(item.taxRate) || 0;
    return sum + (quantity * rate * taxRate / 100);
  }, 0);

  const totalAmount = subtotal + taxAmount;
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const calculatedItems = values.items.map(item => ({
        ...item,
        amount: Number(item.quantity) * Number(item.rate),
      }));
      
      const invoiceData = {
        client: values.clientId,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        items: calculatedItems,
        notes: values.notes,
        terms: values.terms,
        subtotal,
        taxAmount,
        totalAmount,
        type: 'invoice' as const,
        status: 'draft' as const,
      };
      
      const response = await createInvoice.mutateAsync(invoiceData);
      
      if (response.success) {
        toast.success("Invoice created successfully");
        
        // Find client details for PDF
        const client = clients.find(c => c.id === values.clientId);
        
        // Generate PDF
        if (client) {
          const pdfData = {
            invoiceNumber: response.data.invoiceNumber,
            issueDate: values.issueDate,
            dueDate: values.dueDate,
            client: {
              name: client.name,
              email: client.email || '',
              phone: client.phone,
              address: client.address,
              gst_number: client.gst_number,
            },
            items: calculatedItems,
            subtotal,
            taxAmount,
            totalAmount,
            notes: values.notes,
            terms: values.terms,
          };

          const firmData = {
            name: firmSettings?.name || 'CA Firm',
            address: firmSettings?.address,
            email: firmSettings?.email,
            phone: firmSettings?.phone,
            gstNumber: firmSettings?.gstNumber,
          };

          generateInvoicePDF(pdfData, firmData);
        }

        form.reset();
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        {selectedClientId && lastPricing?.data && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 text-sm">Last Invoice Found</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Invoice #{lastPricing.data.invoiceNumber} dated {new Date(lastPricing.data.invoiceDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Items loaded automatically. You can modify them below.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select client"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Invoice Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', quantity: 1, rate: 0, taxRate: 18 })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
          
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 p-4 border rounded-md relative bg-gray-50/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Item description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="0.01" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`items.${index}.rate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.taxRate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST %</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tax %" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-end">
                  <span className="text-xs text-gray-500 mb-1">Amount</span>
                  <span className="font-medium">
                    ₹{(Number(form.watch(`items.${index}.quantity`)) * Number(form.watch(`items.${index}.rate`))).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Card className="p-4 bg-gray-50 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax Amount</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>Total Amount</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Notes visible on invoice" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms & Conditions</FormLabel>
                <FormControl>
                  <Textarea placeholder="Terms visible on invoice" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="pt-4 space-x-2 flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuccess}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-ca-blue hover:bg-ca-blue-dark"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create & Download PDF"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
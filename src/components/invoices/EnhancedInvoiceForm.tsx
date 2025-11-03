import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { CalendarIcon, Plus, Trash2, Calculator, FileText, Save, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { InvoicePreviewModal } from '@/components/invoices/InvoicePreviewModal';

interface InvoiceItem {
  title: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxable: boolean;
  hsn: string;
  taxRate: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  cess?: number;
}

interface InvoiceFormData {
  type: 'invoice' | 'quotation' | 'proforma';
  client: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  notes: string;
  terms: string;
  paymentTerms: string;
  collectionMethod: 'account_1' | 'account_2' | 'cash' | 'cheque';
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
}

interface EnhancedInvoiceFormProps {
  onSuccess: () => void;
  initialData?: Partial<InvoiceFormData>;
  isEditing?: boolean;
}

export const EnhancedInvoiceForm = ({ 
  onSuccess, 
  initialData, 
  isEditing = false 
}: EnhancedInvoiceFormProps) => {
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [isInterState, setIsInterState] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    total: 0
  });

  const { isAuthenticated } = useAuth();
  const createInvoiceMutation = useCreateInvoice();
  
  // Fetch clients using the proper hook
  const { clients, isLoading: clientsLoading } = useClients();

  const form = useForm<InvoiceFormData>({
    defaultValues: {
      type: 'quotation',
      client: '',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: [{
        title: '',
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
        taxable: true,
        hsn: '998314',
        taxRate: 18
      }],
      discount: {
        type: 'percentage',
        value: 0
      },
      notes: '',
      terms: 'Payment due within 30 days of invoice date.',
      paymentTerms: 'Net 30',
      collectionMethod: 'account_1',
      bankDetails: {
        accountName: 'CA Flow & Associates',
        accountNumber: '123456789012',
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0001234'
      },
      ...initialData
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  // Watch all form values to trigger calculations
  const watchedItems = form.watch('items');
  const watchedDiscount = form.watch('discount');
  const watchAllFields = form.watch(); // Watch everything to ensure updates

  // Calculate totals whenever items or discount changes
  useEffect(() => {
    // Ensure we have valid items array
    if (!watchedItems || !Array.isArray(watchedItems)) {
      return;
    }

    const subtotal = watchedItems.reduce((sum, item) => {
      const quantity = Number(item?.quantity) || 0;
      const rate = Number(item?.rate) || 0;
      const itemAmount = quantity * rate;
      return sum + (isNaN(itemAmount) ? 0 : itemAmount);
    }, 0);

    const discountValue = Number(watchedDiscount?.value) || 0;
    const discountAmount = watchedDiscount?.type === 'percentage' 
      ? (subtotal * discountValue) / 100
      : discountValue;

    const discountedAmount = subtotal - discountAmount;

    const taxAmount = watchedItems.reduce((sum, item) => {
      if (item?.taxable !== false) { // Default to taxable if undefined
        const quantity = Number(item?.quantity) || 0;
        const rate = Number(item?.rate) || 0;
        const taxRate = Number(item?.taxRate) || 0;
        const itemAmount = quantity * rate;
        const itemTax = (itemAmount * taxRate) / 100;
        return sum + (isNaN(itemTax) ? 0 : itemTax);
      }
      return sum;
    }, 0);

    const total = discountedAmount + taxAmount;

    setCalculations({
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      discountAmount: isNaN(discountAmount) ? 0 : discountAmount,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      total: isNaN(total) ? 0 : total
    });

    // Update item amounts
    watchedItems.forEach((item, index) => {
      const quantity = Number(item?.quantity) || 0;
      const rate = Number(item?.rate) || 0;
      const amount = quantity * rate;
      if (!isNaN(amount) && amount !== item?.amount) {
        form.setValue(`items.${index}.amount`, amount, { shouldValidate: false });
      }
    });
  }, [watchedItems, watchedDiscount, watchAllFields, form]);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const invoiceData = {
        ...data,
        client: data.client, // This will be the client ID string
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxAmount,
        discount: {
          ...data.discount,
          amount: calculations.discountAmount
        },
        totalAmount: calculations.total,
        paidAmount: 0,
        balanceAmount: calculations.total,
        gst: {
          cgst: calculations.taxAmount / 2,
          sgst: calculations.taxAmount / 2,
          igst: 0,
          applicable: true
        }
      };

      await createInvoiceMutation.mutateAsync(invoiceData as any);
      onSuccess();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  const addItem = () => {
    append({
      title: '',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      taxable: true,
      hsn: '998314',
      taxRate: 18
    });
  };

  // Debug log
  console.log('Clients from useClients hook:', clients);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Clean Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create New Invoice</h2>
        <p className="text-gray-600 text-sm">Generate a professional invoice for your client</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Basic Information */}
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Invoice</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">Invoice Type</Label>
                  <Select
                    value={form.watch('type')}
                    onValueChange={(value) => form.setValue('type', value as any)}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="quotation">Quotation</SelectItem>
                      <SelectItem value="proforma">Proforma Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client" className="text-sm font-medium text-gray-700">Client</Label>
                  <Select
                    value={form.watch('client')}
                    onValueChange={(value) => {
                      if (value !== 'no-clients') {
                        form.setValue('client', value);
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients && clients.length > 0 ? (
                        clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name || client.email}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-clients" disabled>
                          {clientsLoading ? 'Loading clients...' : 'No clients available'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Issue Date</Label>
                  <Popover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-11 justify-start text-left font-normal border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('issueDate') ? format(form.watch('issueDate'), 'dd/MM/yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('issueDate')}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue('issueDate', date);
                            setIssueDateOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Due Date</Label>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-11 justify-start text-left font-normal border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('dueDate') ? format(form.watch('dueDate'), 'dd/MM/yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('dueDate')}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue('dueDate', date);
                            setDueDateOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                <Switch
                  id="inter-state"
                  checked={isInterState}
                  onCheckedChange={setIsInterState}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="inter-state" className="text-sm font-medium text-gray-700">
                    Inter-state transaction (IGST)
                  </Label>
                  <p className="text-xs text-gray-500">
                    Enable if this is an inter-state transaction requiring IGST instead of CGST/SGST
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Invoice Items */}
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-8 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Invoice Items</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Item Title</Label>
                    <Input
                      {...form.register(`items.${index}.title`)}
                      placeholder="e.g., GST Filing Service, Tax Consultation"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <Textarea
                      {...form.register(`items.${index}.description`)}
                      placeholder="Item description"
                      className="min-h-[80px] border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Qty</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Rate (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        {...form.register(`items.${index}.rate`, { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">HSN/SAC Code</Label>
                      <Input
                        {...form.register(`items.${index}.hsn`)}
                        placeholder="Enter HSN/SAC code"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Tax Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`items.${index}.taxRate`, { valueAsNumber: true })}
                        placeholder="18"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Amount (₹)</Label>
                      <div className="font-medium py-3 px-3 bg-gray-50 rounded-md border border-gray-200 h-11 flex items-center">
                        ₹{((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.rate`) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" onClick={addItem} variant="outline" className="w-full h-11 border-gray-300 hover:border-gray-400">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Section 3: Tax Breakdown */}
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-8 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Tax Breakdown</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchedItems.map((item, index) => {
                const itemAmount = (item.quantity || 0) * (item.rate || 0);
                const taxAmount = (itemAmount * (item.taxRate || 0)) / 100;
                const cgstAmount = isInterState ? 0 : taxAmount / 2;
                const sgstAmount = isInterState ? 0 : taxAmount / 2;
                const igstAmount = isInterState ? taxAmount : 0;
                
                return (
                  item.hsn && (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          HSN: {item.hsn}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.description || 'Item ' + (index + 1)}
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        {isInterState ? (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">IGST ({item.taxRate || 0}%):</span>
                            <span className="font-medium">₹{igstAmount.toFixed(2)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">CGST ({(item.taxRate || 0) / 2}%):</span>
                              <span className="font-medium">₹{cgstAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">SGST ({(item.taxRate || 0) / 2}%):</span>
                              <span className="font-medium">₹{sgstAmount.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Calculations */}
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-8 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Calculations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Discount Type</Label>
                  <Select
                    value={form.watch('discount.type')}
                    onValueChange={(value) => form.setValue('discount.type', value as any)}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Discount Value 
                    {form.watch('discount.type') === 'percentage' ? ' (%)' : ' (₹)'}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    {...form.register('discount.value', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{calculations.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span>-₹{calculations.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (GST):</span>
                  <span className="font-medium">₹{calculations.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">₹{calculations.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Payment Details & Terms */}
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Payment Details & Terms</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Payment Terms</Label>
                  <Select
                    value={form.watch('paymentTerms')}
                    onValueChange={(value) => form.setValue('paymentTerms', value)}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15">Net 15 days</SelectItem>
                      <SelectItem value="Net 30">Net 30 days</SelectItem>
                      <SelectItem value="Net 45">Net 45 days</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Collection Method</Label>
                  <Select
                    value={form.watch('collectionMethod')}
                    onValueChange={(value) => form.setValue('collectionMethod', value as any)}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account_1">Account 1</SelectItem>
                      <SelectItem value="account_2">Account 2</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Bank Account Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Account Holder Name</Label>
                  <Input
                    {...form.register('bankDetails.accountName')}
                    placeholder="CA Flow & Associates"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Account Number</Label>
                  <Input
                    {...form.register('bankDetails.accountNumber')}
                    placeholder="123456789012"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Bank Name</Label>
                  <Input
                    {...form.register('bankDetails.bankName')}
                    placeholder="State Bank of India"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">IFSC Code</Label>
                  <Input
                    {...form.register('bankDetails.ifscCode')}
                    placeholder="SBIN0001234"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Additional Information</h3>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Notes</Label>
                <Textarea
                  {...form.register('notes')}
                  placeholder="Additional notes for the client"
                  rows={3}
                  className="resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Terms & Conditions</Label>
                <Textarea
                  {...form.register('terms')}
                  placeholder="Terms and conditions"
                  rows={3}
                  className="resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Section */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button 
            type="button" 
            variant="outline"
            onClick={onSuccess}
            className="h-11 px-6 text-sm font-medium border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          
          <div className="flex gap-4 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="h-11 px-6 text-sm font-medium border-gray-300 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            <Button
              type="submit"
              disabled={createInvoiceMutation.isPending}
              variant="outline"
              className="h-11 px-6 text-sm font-medium border-gray-300 hover:bg-gray-50"
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Save'} Draft
                </>
              )}
            </Button>
            
            <Button
              type="submit"
              disabled={createInvoiceMutation.isPending}
              className="h-11 px-8 text-sm font-medium bg-blue-600 hover:bg-blue-700"
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {form.watch('type') === 'quotation' 
                    ? (isEditing ? 'Update & Send Quotation' : 'Create & Send Quotation')
                    : (isEditing ? 'Update & Send Invoice' : 'Create & Send Invoice')
                  }
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        invoiceData={form.getValues()}
        calculations={calculations}
        isInterState={isInterState}
        clientData={clients.find((c: any) => c.id === form.watch('client'))}
      />
    </div>
  );
};
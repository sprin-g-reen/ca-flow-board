import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { FileText, Send, IndianRupee, Calendar } from 'lucide-react';
import { getValidatedToken } from '@/lib/auth';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api.config';



export const TaskInvoicing = ({ task, client }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [quotationData, setQuotationData] = useState({
    description: task.title || '',
    amount: task.price || 0,
    taxRate: 18,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const calculateTax = () => {
    return (quotationData.amount * quotationData.taxRate) / 100;
  };

  const calculateTotal = () => {
    return quotationData.amount + calculateTax();
  };

  const handleGenerateQuotation = async () => {
    if (!client) {
      toast.error('No client assigned to this task');
      return;
    }

    if (!quotationData.amount || quotationData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsGenerating(true);
    try {
      const token = getValidatedToken();
      
      const quotationPayload = {
        type: 'quotation',
        client: client.id || client._id,
        items: [{
          description: quotationData.description,
          quantity: 1,
          rate: quotationData.amount,
          amount: quotationData.amount,
          taxable: true,
          taxRate: quotationData.taxRate,
          task: task.id,
        }],
        dueDate: new Date(quotationData.dueDate).toISOString(),
        paymentTerms: 'Net 30',
        notes: quotationData.notes,
        gst: {
          applicable: true,
          cgst: quotationData.taxRate / 2,
          sgst: quotationData.taxRate / 2,
          igst: 0
        },
      };

      const response = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(quotationPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network response was not ok' }));
        throw new Error(errorData.message || 'Failed to generate quotation');
      }

      await response.json();
      toast.success('Quotation generated successfully!');
      
      setQuotationData({
        ...quotationData,
        notes: ''
      });
      
    } catch (error: any) {
      // Provide a clearer, user-friendly message for network/CORS errors
      console.error('Error generating quotation:', error);
      const isNetworkError = error instanceof TypeError || /failed to fetch/i.test(String(error.message || ''));

      if (isNetworkError) {
        toast.error('Network error: Unable to contact the backend. Ensure the backend is running or configure the Vite dev proxy / CORS.');
      } else {
        toast.error(`Error: ${error.message || 'Failed to generate quotation'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!client) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Send Quotation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Please assign a client to this task before generating a quotation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Send Quotation
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Auto-generated when task is completed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-sm text-gray-700 mb-2">Client Details</h3>
          <p className="text-gray-900 font-medium">
            {client.fullName || client.companyName}
          </p>
          <p className="text-sm text-gray-600">{client.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={quotationData.description}
              onChange={(e) => setQuotationData({ ...quotationData, description: e.target.value })}
              placeholder="Service description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  value={quotationData.amount}
                  onChange={(e) => setQuotationData({ ...quotationData, amount: Number(e.target.value) })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={quotationData.taxRate}
                onChange={(e) => setQuotationData({ ...quotationData, taxRate: Number(e.target.value) })}
                placeholder="18"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="dueDate"
                type="date"
                value={quotationData.dueDate}
                onChange={(e) => setQuotationData({ ...quotationData, dueDate: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={quotationData.notes}
              onChange={(e) => setQuotationData({ ...quotationData, notes: e.target.value })}
              placeholder="Additional notes or terms..."
              rows={3}
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">₹{quotationData.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax ({quotationData.taxRate}%):</span>
            <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-blue-200">
            <span>Total:</span>
            <span className="text-blue-600">₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <Button 
          onClick={handleGenerateQuotation} 
          disabled={isGenerating || !quotationData.amount}
          className="w-full"
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate & Send Quotation'}
        </Button>
      </CardContent>
    </Card>
  );
};

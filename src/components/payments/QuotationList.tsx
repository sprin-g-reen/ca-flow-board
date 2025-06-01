
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePayments } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, CreditCard, Eye, Send } from 'lucide-react';

export const QuotationList = () => {
  const { quotations, isLoading, sendViaWhatsApp, isSendingWhatsApp, createPaymentLink, isCreatingPayment } = usePayments();
  const { toast } = useToast();
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedQuotation || !whatsappMessage) return;

    const clientPhone = selectedQuotation.clients?.phone;
    if (!clientPhone) {
      toast({
        title: "Error",
        description: "Client phone number not found.",
        variant: "destructive",
      });
      return;
    }

    sendViaWhatsApp({
      quotationId: selectedQuotation.id,
      phoneNumber: clientPhone,
      message: whatsappMessage
    });
    setSelectedQuotation(null);
    setWhatsappMessage('');
  };

  const handleCreatePaymentLink = (quotationId: string) => {
    createPaymentLink(quotationId);
  };

  if (isLoading) {
    return <div>Loading quotations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quotations</h2>
      </div>

      <div className="grid gap-4">
        {quotations.map((quotation: any) => (
          <Card key={quotation.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {quotation.quotation_number}
                </CardTitle>
                <Badge className={getStatusColor(quotation.status)}>
                  {quotation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{quotation.clients?.name || 'Unknown Client'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">₹{quotation.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="font-medium">{quotation.valid_until || 'No expiry'}</p>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedQuotation(quotation);
                          setWhatsappMessage(`Hi ${quotation.clients?.name}, your quotation ${quotation.quotation_number} for ₹${quotation.total_amount.toLocaleString()} is ready. Please review and let us know if you have any questions.`);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send via WhatsApp</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="client">Client</Label>
                          <Input
                            id="client"
                            value={selectedQuotation?.clients?.name || ''}
                            disabled
                          />
                        </div>
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            value={whatsappMessage}
                            onChange={(e) => setWhatsappMessage(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button 
                          onClick={handleSendWhatsApp}
                          disabled={isSendingWhatsApp}
                          className="w-full"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSendingWhatsApp ? 'Sending...' : 'Send WhatsApp'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleCreatePaymentLink(quotation.id)}
                    disabled={isCreatingPayment}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Payment Link
                  </Button>
                </div>
              </div>

              {quotation.sent_via_whatsapp && (
                <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✓ Sent via WhatsApp on {new Date(quotation.whatsapp_sent_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {quotations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No quotations found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

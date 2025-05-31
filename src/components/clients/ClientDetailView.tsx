
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientCommunications } from '@/hooks/useClients';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Building2, CreditCard, FileText, MessageSquare, Send } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  client_code?: string;
  status?: string;
  gst_number?: string;
  pan_number?: string;
  business_type?: string;
  industry?: string;
  billing_address?: string;
  shipping_address?: string;
  credit_limit?: number;
  payment_terms?: number;
  website?: string;
  notes?: string;
  created_at?: string;
}

interface ClientDetailViewProps {
  client: Client;
  onClose: () => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ client, onClose }) => {
  const [communicationData, setCommunicationData] = useState({
    subject: '',
    message: '',
    communication_type: 'email'
  });
  const { addCommunication, isAdding } = useClientCommunications();

  const handleSendCommunication = async () => {
    if (!communicationData.subject || !communicationData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addCommunication({
        client_id: client.id,
        communication_type: communicationData.communication_type,
        subject: communicationData.subject,
        message: communicationData.message,
        recipient_email: client.email || '',
        recipient_phone: client.phone || '',
        status: 'sent'
      });

      setCommunicationData({
        subject: '',
        message: '',
        communication_type: 'email'
      });

      toast.success('Communication logged successfully');
    } catch (error) {
      toast.error('Failed to log communication');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{client.name}</h2>
          <p className="text-muted-foreground">Client Code: {client.client_code}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status || 'Active'}
          </Badge>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                    <p>{client.contact_person || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                    <p>{client.business_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <p>{client.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Website</label>
                    <p>{client.website || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{client.address || 'No address provided'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Legal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">GST Number</label>
                    <p>{client.gst_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                    <p>{client.pan_number || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Credit Limit</label>
                    <p>₹{client.credit_limit?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
                    <p>{client.payment_terms || 30} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="communications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Log New Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={communicationData.communication_type}
                      onChange={(e) => setCommunicationData(prev => ({
                        ...prev,
                        communication_type: e.target.value
                      }))}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone Call</option>
                      <option value="meeting">Meeting</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={communicationData.subject}
                      onChange={(e) => setCommunicationData(prev => ({
                        ...prev,
                        subject: e.target.value
                      }))}
                      placeholder="Communication subject"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={communicationData.message}
                    onChange={(e) => setCommunicationData(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    placeholder="Communication details..."
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleSendCommunication}
                  disabled={isAdding}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isAdding ? 'Logging...' : 'Log Communication'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Client Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Document management will be available soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

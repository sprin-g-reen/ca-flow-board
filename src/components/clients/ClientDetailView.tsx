
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialog } from '@/components/shared/FormDialog';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  MessageSquare,
  Users,
  Plus,
  Edit,
  Eye,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { useClientCommunications, useClientDocuments, useClientContacts } from '@/hooks/useClients';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  billing_address?: string;
  shipping_address?: string;
  company_registration_number?: string;
  gst_number?: string;
  pan_number?: string;
  business_type?: string;
  industry?: string;
  website?: string;
  notes?: string;
  client_code?: string;
  status?: string;
  payment_terms?: number;
  credit_limit?: number;
  created_at: string;
}

interface ClientDetailViewProps {
  client: Client;
  onClose: () => void;
}

export const ClientDetailView = ({ client, onClose }: ClientDetailViewProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddCommunication, setShowAddCommunication] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const { communications, addCommunication, isAdding: isAddingComm } = useClientCommunications(client.id);
  const { documents, addDocument, isAdding: isAddingDoc } = useClientDocuments(client.id);
  const { contacts, addContact, isAdding: isAddingContact } = useClientContacts(client.id);

  const handleAddCommunication = (formData: FormData) => {
    const data = {
      client_id: client.id,
      communication_type: formData.get('type') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      recipient_email: formData.get('recipient_email') as string,
      recipient_phone: formData.get('recipient_phone') as string,
    };
    
    addCommunication(data);
    setShowAddCommunication(false);
  };

  const handleAddContact = (formData: FormData) => {
    const data = {
      client_id: client.id,
      contact_name: formData.get('contact_name') as string,
      designation: formData.get('designation') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      department: formData.get('department') as string,
      is_primary: formData.get('is_primary') === 'true',
    };
    
    addContact(data);
    setShowAddContact(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{client.name}</h2>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline">{client.client_code}</Badge>
                <Badge className={client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {client.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created: {new Date(client.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Person</label>
                      <p>{client.contact_person || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business Type</label>
                      <p>{client.business_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Industry</label>
                      <p>{client.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Number</label>
                      <p>{client.company_registration_number || 'N/A'}</p>
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
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{client.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{client.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span>{client.website || 'No website'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <span className="text-sm">{client.address || 'No address'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tax Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">GST Number</label>
                      <p>{client.gst_number || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">PAN Number</label>
                      <p>{client.pan_number || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{client.notes || 'No notes available'}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Client Contacts</h3>
                <Button onClick={() => setShowAddContact(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
              
              <div className="grid gap-4">
                {contacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{contact.contact_name}</h4>
                          <p className="text-sm text-gray-500">{contact.designation}</p>
                          <div className="mt-2 space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        {contact.is_primary && (
                          <Badge variant="secondary">Primary</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="communications" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Communication History</h3>
                <Button onClick={() => setShowAddCommunication(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Communication
                </Button>
              </div>
              
              <div className="space-y-4">
                {communications.map((comm) => (
                  <Card key={comm.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{comm.communication_type}</Badge>
                            <Badge className={
                              comm.status === 'sent' ? 'bg-green-100 text-green-800' : 
                              comm.status === 'failed' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {comm.status}
                            </Badge>
                          </div>
                          {comm.subject && <h4 className="font-medium">{comm.subject}</h4>}
                          {comm.message && <p className="text-sm text-gray-600 mt-1">{comm.message}</p>}
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(comm.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Client Documents</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
              
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <div>
                            <h4 className="font-medium">{doc.document_name}</h4>
                            <p className="text-sm text-gray-500">{doc.document_type}</p>
                            <p className="text-xs text-gray-400">
                              Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={doc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {doc.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-5 w-5" />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                      <p>{client.payment_terms} days</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Credit Limit</label>
                      <p>₹{client.credit_limit?.toLocaleString() || '0'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">No recent transactions</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Communication Dialog */}
        <FormDialog
          open={showAddCommunication}
          onOpenChange={setShowAddCommunication}
          title="Log Communication"
          description="Record a communication with this client"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddCommunication(new FormData(e.currentTarget));
          }} className="space-y-4">
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Communication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
            <Input name="subject" placeholder="Subject" />
            <Textarea name="message" placeholder="Message content" />
            <Input name="recipient_email" type="email" placeholder="Recipient email (optional)" />
            <Input name="recipient_phone" placeholder="Recipient phone (optional)" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddCommunication(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingComm}>
                {isAddingComm ? 'Logging...' : 'Log Communication'}
              </Button>
            </div>
          </form>
        </FormDialog>

        {/* Add Contact Dialog */}
        <FormDialog
          open={showAddContact}
          onOpenChange={setShowAddContact}
          title="Add Contact"
          description="Add a new contact for this client"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddContact(new FormData(e.currentTarget));
          }} className="space-y-4">
            <Input name="contact_name" placeholder="Contact name" required />
            <Input name="designation" placeholder="Designation" />
            <Input name="email" type="email" placeholder="Email" />
            <Input name="phone" placeholder="Phone number" />
            <Input name="department" placeholder="Department" />
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_primary" value="true" id="is_primary" />
              <label htmlFor="is_primary" className="text-sm">Primary contact</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddContact(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingContact}>
                {isAddingContact ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </form>
        </FormDialog>
      </div>
    </div>
  );
};

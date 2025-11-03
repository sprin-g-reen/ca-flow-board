
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useClients, useClientCommunications, useClientDocuments, useClientContacts } from '@/hooks/useClients';
import { Edit, Save, X, Plus, Phone, Mail, MessageSquare, Calendar, FileText, Upload, Download, Trash2, User, Star, Building, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ClientDetailViewProps {
  client: any;
  onClose: () => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ client, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(client);
  const [newCommunication, setNewCommunication] = useState({
    type: 'internal_note' as 'email' | 'phone' | 'whatsapp' | 'meeting' | 'document' | 'internal_note',
    subject: '',
    message: '',
    recipient_email: client.email || '',
    recipient_phone: client.phone || '',
    isInternal: true,
  });
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    contactName: '',
    designation: '',
    department: '',
    email: '',
    phone: '',
    mobile: '',
    notes: '',
    isPrimary: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { updateClient, isUpdating } = useClients();
  const { communications, addCommunication, isAdding: isAddingCommunication } = useClientCommunications(client.id);
  const { documents, uploadDocument, deleteDocument, isUploading, isDeleting } = useClientDocuments(client.id);
  const { contacts, addContact, deleteContact, setPrimary, isAdding: isAddingContact } = useClientContacts(client.id);

  const handleSave = () => {
    updateClient({ id: client.id, ...editedClient });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleAddCommunication = () => {
    if (!newCommunication.subject || !newCommunication.message) {
      toast.error('Please fill in subject and message');
      return;
    }

    const communicationData = {
      communicationType: newCommunication.type,
      subject: newCommunication.subject,
      message: newCommunication.message,
      recipientEmail: newCommunication.recipient_email,
      recipientPhone: newCommunication.recipient_phone,
      isInternal: newCommunication.isInternal,
      status: 'sent'
    };

    addCommunication(communicationData);
    
    setNewCommunication({
      type: 'internal_note',
      subject: '',
      message: '',
      recipient_email: client.email || '',
      recipient_phone: client.phone || '',
      isInternal: true,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentName', file.name);
    formData.append('documentType', 'other');
    formData.append('description', `Uploaded: ${file.name}`);

    uploadDocument({ formData });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddContact = () => {
    if (!newContact.contactName) {
      toast.error('Please enter contact name');
      return;
    }

    addContact(newContact);
    setNewContact({
      contactName: '',
      designation: '',
      department: '',
      email: '',
      phone: '',
      mobile: '',
      notes: '',
      isPrimary: false,
    });
    setShowAddContact(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Client Details</h2>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isUpdating}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Client Code</Label>
                      <Input value={client.client_code} disabled />
                    </div>
                    
                    <div>
                      <Label>Company Name</Label>
                      {isEditing ? (
                        <Input
                          value={editedClient.name}
                          onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                        />
                      ) : (
                        <Input value={client.name} disabled />
                      )}
                    </div>

                    <div>
                      <Label>Contact Person</Label>
                      {isEditing ? (
                        <Input
                          value={editedClient.contact_person || ''}
                          onChange={(e) => setEditedClient({ ...editedClient, contact_person: e.target.value })}
                        />
                      ) : (
                        <Input value={client.contact_person || ''} disabled />
                      )}
                    </div>

                    <div>
                      <Label>Email</Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedClient.email || ''}
                          onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                        />
                      ) : (
                        <Input value={client.email || ''} disabled />
                      )}
                    </div>

                    <div>
                      <Label>Phone</Label>
                      {isEditing ? (
                        <Input
                          value={editedClient.phone || ''}
                          onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                        />
                      ) : (
                        <Input value={client.phone || ''} disabled />
                      )}
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Business Type</Label>
                      {isEditing ? (
                        <Input
                          value={editedClient.business_type || ''}
                          onChange={(e) => setEditedClient({ ...editedClient, business_type: e.target.value })}
                        />
                      ) : (
                        <Input value={client.business_type || ''} disabled />
                      )}
                    </div>

                    <div>
                      <Label>Industry</Label>
                      {isEditing ? (
                        <Input
                          value={editedClient.industry || ''}
                          onChange={(e) => setEditedClient({ ...editedClient, industry: e.target.value })}
                        />
                      ) : (
                        <Input value={client.industry || ''} disabled />
                      )}
                    </div>

                    <div>
                      <Label>GST Number</Label>
                      {isEditing ? (
                        <Input
                          value={editedClient.gst_number || ''}
                          onChange={(e) => setEditedClient({ ...editedClient, gst_number: e.target.value })}
                        />
                      ) : (
                        <Input value={client.gst_number || ''} disabled />
                      )}
                    </div>

                    <div>
                      <Label>PAN Number</Label>
                      {isEditing ? (
                        <Input
                          value={editedClient.pan_number || ''}
                          onChange={(e) => setEditedClient({ ...editedClient, pan_number: e.target.value })}
                        />
                      ) : (
                        <Input value={client.pan_number || ''} disabled />
                      )}
                    </div>

                    <div>
                      <Label>Company Registration Number</Label>
                      {isEditing ? (
                        <Input
                          value={editedClient.company_registration_number || ''}
                          onChange={(e) => setEditedClient({ ...editedClient, company_registration_number: e.target.value })}
                        />
                      ) : (
                        <Input value={client.company_registration_number || ''} disabled />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="communications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Internal Communication History
                    <Badge variant="outline">
                      {communications.length} records
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add New Communication Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <Label>Type</Label>
                        <Select value={newCommunication.type} onValueChange={(value: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'document' | 'internal_note') => 
                          setNewCommunication({ ...newCommunication, type: value })
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal_note">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Internal Note
                              </div>
                            </SelectItem>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                              </div>
                            </SelectItem>
                            <SelectItem value="phone">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Phone Call
                              </div>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                WhatsApp
                              </div>
                            </SelectItem>
                            <SelectItem value="meeting">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Meeting
                              </div>
                            </SelectItem>
                            <SelectItem value="document">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Document
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Subject</Label>
                        <Input
                          value={newCommunication.subject}
                          onChange={(e) => setNewCommunication({ ...newCommunication, subject: e.target.value })}
                          placeholder="Communication subject"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Message / Notes</Label>
                        <Textarea
                          value={newCommunication.message}
                          onChange={(e) => setNewCommunication({ ...newCommunication, message: e.target.value })}
                          placeholder="Communication details or internal notes"
                          rows={3}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Button 
                          onClick={handleAddCommunication} 
                          className="w-full"
                          disabled={isAddingCommunication}
                        >
                          {isAddingCommunication ? 'Adding...' : 'Add Communication'}
                        </Button>
                      </div>
                    </div>

                    {/* Communications List */}
                    <div className="space-y-3">
                      {communications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No communications recorded yet.
                        </div>
                      ) : (
                        communications.map((comm: any) => (
                          <div key={comm._id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={comm.isInternal ? 'default' : 'secondary'}>
                                    {comm.communicationType.replace('_', ' ')}
                                  </Badge>
                                  {comm.isInternal && (
                                    <Badge variant="outline" className="text-xs">
                                      Internal
                                    </Badge>
                                  )}
                                  <span className="text-sm text-gray-500">
                                    by {comm.createdBy?.name || 'Unknown'}
                                  </span>
                                </div>
                                <h4 className="font-medium">{comm.subject}</h4>
                                <p className="text-sm text-gray-600 mt-1">{comm.message}</p>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                {format(new Date(comm.createdAt), 'MMM dd, yyyy HH:mm')}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Client Documents
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {documents.length} files
                      </Badge>
                      <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.rtf"
                  />
                  
                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">No documents uploaded yet.</p>
                      <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Your First Document
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc: any) => (
                        <div key={doc._id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{doc.documentName}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{doc.documentType.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <span>Uploaded by {doc.uploadedBy?.name || 'Unknown'}</span>
                                <span>•</span>
                                <span>{format(new Date(doc.createdAt), 'MMM dd, yyyy')}</span>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/documents/${doc._id}/download`, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDocument(doc._id)}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Additional Contacts
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {contacts.length} contacts
                      </Badge>
                      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Contact
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add New Contact</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Contact Name *</Label>
                              <Input
                                value={newContact.contactName}
                                onChange={(e) => setNewContact({ ...newContact, contactName: e.target.value })}
                                placeholder="Enter contact name"
                              />
                            </div>
                            <div>
                              <Label>Designation</Label>
                              <Input
                                value={newContact.designation}
                                onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                                placeholder="Job title"
                              />
                            </div>
                            <div>
                              <Label>Department</Label>
                              <Input
                                value={newContact.department}
                                onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                                placeholder="Department"
                              />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={newContact.email}
                                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                placeholder="Email address"
                              />
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <Input
                                value={newContact.phone}
                                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                placeholder="Phone number"
                              />
                            </div>
                            <div>
                              <Label>Mobile</Label>
                              <Input
                                value={newContact.mobile}
                                onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                                placeholder="Mobile number"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>Notes</Label>
                              <Textarea
                                value={newContact.notes}
                                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                                placeholder="Additional notes"
                                rows={3}
                              />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="isPrimary"
                                checked={newContact.isPrimary}
                                onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                              />
                              <Label htmlFor="isPrimary">Set as primary contact</Label>
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                              <Button onClick={handleAddContact} disabled={isAddingContact} className="flex-1">
                                {isAddingContact ? 'Adding...' : 'Add Contact'}
                              </Button>
                              <Button variant="outline" onClick={() => setShowAddContact(false)} className="flex-1">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">No additional contacts added yet.</p>
                      <Button onClick={() => setShowAddContact(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Contact
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contacts.map((contact: any) => (
                        <div key={contact._id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{contact.contactName}</h4>
                                {contact.isPrimary && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {contact.designation && <span>{contact.designation}</span>}
                                {contact.designation && contact.department && <span> • </span>}
                                {contact.department && <span>{contact.department}</span>}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                {contact.email && (
                                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-blue-600">
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </a>
                                )}
                                {contact.phone && (
                                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!contact.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPrimary(contact._id)}
                                title="Set as primary"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteContact(contact._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail,
  Edit,
  Eye,
  Copy,
  Trash2,
  Plus,
  Send,
  FileText
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'notification' | 'reminder' | 'quotation' | 'invoice' | 'custom';
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const EmailTemplateManager = () => {
  const { toast } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Task Assignment Notification',
      subject: 'New Task Assigned: {{task_title}}',
      body: `Dear {{employee_name}},

A new task has been assigned to you:

Task: {{task_title}}
Client: {{client_name}}
Due Date: {{due_date}}
Priority: {{priority}}

Description:
{{task_description}}

Please login to your dashboard to view the complete details and start working on this task.

Best regards,
{{company_name}} Team`,
      category: 'notification',
      variables: ['employee_name', 'task_title', 'client_name', 'due_date', 'priority', 'task_description', 'company_name'],
      isActive: true,
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Deadline Reminder',
      subject: 'Reminder: Task Due Soon - {{task_title}}',
      body: `Dear {{employee_name}},

This is a reminder that the following task is due in {{days_remaining}} days:

Task: {{task_title}}
Client: {{client_name}}
Due Date: {{due_date}}
Current Status: {{task_status}}

Please ensure this task is completed on time to avoid any delays.

If you need any assistance or have concerns about meeting the deadline, please contact your supervisor immediately.

Best regards,
{{company_name}} Team`,
      category: 'reminder',
      variables: ['employee_name', 'task_title', 'client_name', 'due_date', 'days_remaining', 'task_status', 'company_name'],
      isActive: true,
      createdAt: '2025-01-16T11:00:00Z',
      updatedAt: '2025-01-16T11:00:00Z'
    },
    {
      id: '3',
      name: 'Quotation Sent',
      subject: 'Quotation for {{service_type}} - {{quotation_number}}',
      body: `Dear {{client_name}},

Thank you for your interest in our services. Please find attached the quotation for {{service_type}}.

Quotation Details:
- Quotation Number: {{quotation_number}}
- Service: {{service_type}}
- Amount: ₹{{amount}}
- Valid Until: {{valid_until}}

To proceed with this quotation, please click the link below:
{{payment_link}}

If you have any questions or need clarification on any aspect of this quotation, please don't hesitate to contact us.

We look forward to serving you.

Best regards,
{{company_name}}
{{contact_details}}`,
      category: 'quotation',
      variables: ['client_name', 'service_type', 'quotation_number', 'amount', 'valid_until', 'payment_link', 'company_name', 'contact_details'],
      isActive: true,
      createdAt: '2025-01-17T09:00:00Z',
      updatedAt: '2025-01-17T09:00:00Z'
    },
    {
      id: '4',
      name: 'Invoice Generated',
      subject: 'Invoice {{invoice_number}} - Payment Due',
      body: `Dear {{client_name}},

Your invoice has been generated and is ready for payment.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Amount: ₹{{total_amount}}
- Due Date: {{due_date}}

You can download your invoice and make payment using the link below:
{{invoice_link}}

Payment can be made via:
- Online payment (Credit/Debit Card, UPI, Net Banking)
- Bank transfer to our account

For any queries regarding this invoice, please contact us at {{contact_email}} or {{contact_phone}}.

Thank you for your business.

Best regards,
{{company_name}}`,
      category: 'invoice',
      variables: ['client_name', 'invoice_number', 'total_amount', 'due_date', 'invoice_link', 'contact_email', 'contact_phone', 'company_name'],
      isActive: true,
      createdAt: '2025-01-18T14:00:00Z',
      updatedAt: '2025-01-18T14:00:00Z'
    }
  ]);

  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'custom' as 'notification' | 'reminder' | 'quotation' | 'invoice' | 'custom'
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'notification': return 'bg-blue-100 text-blue-800';
      case 'reminder': return 'bg-orange-100 text-orange-800';
      case 'quotation': return 'bg-green-100 text-green-800';
      case 'invoice': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(false);
    setIsPreview(false);
    setEditForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsPreview(false);
  };

  const handlePreview = () => {
    setIsPreview(true);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;

    const updatedTemplate = {
      ...selectedTemplate,
      ...editForm,
      updatedAt: new Date().toISOString()
    };

    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    ));

    setSelectedTemplate(updatedTemplate);
    setIsEditing(false);

    toast({
      title: "Template Updated",
      description: "Email template has been saved successfully.",
    });
  };

  const handleDuplicate = (template: EmailTemplate) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTemplates(prev => [...prev, newTemplate]);

    toast({
      title: "Template Duplicated",
      description: "Template has been duplicated successfully.",
    });
  };

  const handleDelete = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }

    toast({
      title: "Template Deleted",
      description: "Email template has been deleted successfully.",
    });
  };

  const renderPreview = () => {
    if (!selectedTemplate) return null;

    const previewData = {
      employee_name: 'Employee Name',
      task_title: 'GST Filing for ABC Corp',
      client_name: 'ABC Corporation',
      due_date: '2025-02-15',
      priority: 'High',
      task_description: 'Complete monthly GST filing and submit returns by due date.',
      company_name: 'Your Firm Name',
      days_remaining: '3',
      task_status: 'In Progress',
      quotation_number: 'QUO-2025-001',
      amount: '15000',
      valid_until: '2025-02-28',
      payment_link: 'https://example.com/pay/abc123',
      contact_details: 'Email: contact@yourfirm.com | Phone: +91 00000 00000'
    };

    let previewSubject = editForm.subject;
    let previewBody = editForm.body;

    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewSubject = previewSubject.replace(regex, value);
      previewBody = previewBody.replace(regex, value);
    });

    return (
      <div className="space-y-4">
        <div>
          <Label className="font-medium">Subject:</Label>
          <div className="p-3 bg-gray-50 border rounded mt-1">{previewSubject}</div>
        </div>
        <div>
          <Label className="font-medium">Body:</Label>
          <div className="p-3 bg-gray-50 border rounded mt-1 whitespace-pre-wrap">{previewBody}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Template List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Templates
            </CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{template.name}</h4>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getCategoryColor(template.category)}`}
                >
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {template.subject}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {template.variables.length} variables
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(template);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Template Editor */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedTemplate ? (
                isEditing ? 'Edit Template' : isPreview ? 'Preview Template' : 'View Template'
              ) : (
                'Select a template'
              )}
            </CardTitle>
            {selectedTemplate && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={isPreview}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  disabled={isEditing}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {isEditing && (
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedTemplate ? (
            <div className="text-center text-muted-foreground py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a template from the list to view or edit</p>
            </div>
          ) : isPreview ? (
            renderPreview()
          ) : isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="templateSubject">Subject Line</Label>
                <Input
                  id="templateSubject"
                  value={editForm.subject}
                  onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Use {{variable_name}} for dynamic content"
                />
              </div>
              <div>
                <Label htmlFor="templateBody">Email Body</Label>
                <Textarea
                  id="templateBody"
                  value={editForm.body}
                  onChange={(e) => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Use {{variable_name}} for dynamic content"
                  rows={12}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Template Name:</Label>
                <p className="text-muted-foreground">{selectedTemplate.name}</p>
              </div>
              <div>
                <Label className="font-medium">Category:</Label>
                <Badge 
                  variant="secondary" 
                  className={`ml-2 ${getCategoryColor(selectedTemplate.category)}`}
                >
                  {selectedTemplate.category}
                </Badge>
              </div>
              <Separator />
              <div>
                <Label className="font-medium">Subject:</Label>
                <p className="text-muted-foreground mt-1">{selectedTemplate.subject}</p>
              </div>
              <div>
                <Label className="font-medium">Body:</Label>
                <div className="mt-1 p-3 bg-gray-50 border rounded whitespace-pre-wrap text-sm">
                  {selectedTemplate.body}
                </div>
              </div>
              <div>
                <Label className="font-medium">Available Variables:</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTemplate.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
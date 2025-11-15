// Field definitions for all entities in the Views system
// This provides comprehensive metadata about queryable fields

export const fieldDefinitions = {
  clients: [
    { name: 'name', type: 'text', label: 'Client Name', searchable: true, sortable: true },
    { name: 'email', type: 'text', label: 'Email', searchable: true, sortable: true },
    { name: 'phone', type: 'text', label: 'Phone', searchable: true },
    { name: 'status', type: 'select', label: 'Status', options: ['active', 'inactive', 'suspended'], sortable: true },
    { name: 'businessType', type: 'select', label: 'Business Type', options: ['proprietorship', 'partnership', 'private_limited', 'public_limited', 'llp', 'trust', 'society', 'huf', 'other'], sortable: true },
    { name: 'industry', type: 'text', label: 'Industry', searchable: true, sortable: true },
    { name: 'gstNumber', type: 'text', label: 'GST Number', searchable: true },
    { name: 'hasGST', type: 'computed', label: 'Has GST Enabled', computeFn: 'hasGSTNumber', options: ['yes', 'no'] },
    { name: 'panNumber', type: 'text', label: 'PAN Number', searchable: true },
    { name: 'cinNumber', type: 'text', label: 'CIN Number', searchable: true },
    { name: 'paymentTerms', type: 'number', label: 'Payment Terms (days)', sortable: true },
    { name: 'creditLimit', type: 'number', label: 'Credit Limit', sortable: true },
    { name: 'address', type: 'text', label: 'Address', searchable: true },
    { name: 'website', type: 'text', label: 'Website', searchable: true },
    { name: 'contactPerson', type: 'text', label: 'Contact Person', searchable: true },
    { name: 'createdAt', type: 'date', label: 'Created Date', sortable: true },
    { name: 'updatedAt', type: 'date', label: 'Updated Date', sortable: true },
    { name: 'clientCode', type: 'text', label: 'Client Code', searchable: true, sortable: true },
    { name: 'companyRegistrationNumber', type: 'text', label: 'Company Registration Number', searchable: true },
  ],
  
  invoices: [
    { name: 'invoiceNumber', type: 'text', label: 'Invoice Number', searchable: true, sortable: true },
    { name: 'amount', type: 'number', label: 'Amount', sortable: true },
    { name: 'status', type: 'select', label: 'Status', options: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], sortable: true },
    { name: 'dueDate', type: 'date', label: 'Due Date', sortable: true },
    { name: 'invoiceDate', type: 'date', label: 'Invoice Date', sortable: true },
    { name: 'paidAmount', type: 'number', label: 'Paid Amount', sortable: true },
    { name: 'balanceAmount', type: 'number', label: 'Balance Amount', sortable: true },
    { name: 'clientId', type: 'reference', label: 'Client', refEntity: 'clients', searchable: true },
    { name: 'createdAt', type: 'date', label: 'Created Date', sortable: true },
    { name: 'updatedAt', type: 'date', label: 'Updated Date', sortable: true },
    { name: 'paymentMethod', type: 'select', label: 'Payment Method', options: ['cash', 'check', 'bank_transfer', 'upi', 'card', 'other'] },
    { name: 'taxAmount', type: 'number', label: 'Tax Amount', sortable: true },
    { name: 'discount', type: 'number', label: 'Discount', sortable: true },
  ],
  
  tasks: [
    { name: 'title', type: 'text', label: 'Task Title', searchable: true, sortable: true },
    { name: 'description', type: 'text', label: 'Description', searchable: true },
    { name: 'status', type: 'select', label: 'Status', options: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'], sortable: true },
    { name: 'priority', type: 'select', label: 'Priority', options: ['low', 'medium', 'high', 'urgent'], sortable: true },
    { name: 'dueDate', type: 'date', label: 'Due Date', sortable: true },
    { name: 'startDate', type: 'date', label: 'Start Date', sortable: true },
    { name: 'completedAt', type: 'date', label: 'Completed Date', sortable: true },
    { name: 'assignedTo', type: 'reference', label: 'Assigned To', refEntity: 'users' },
    { name: 'clientId', type: 'reference', label: 'Client', refEntity: 'clients', searchable: true },
    { name: 'createdAt', type: 'date', label: 'Created Date', sortable: true },
    { name: 'updatedAt', type: 'date', label: 'Updated Date', sortable: true },
    { name: 'category', type: 'text', label: 'Category', searchable: true, sortable: true },
    { name: 'tags', type: 'array', label: 'Tags', searchable: true },
    { name: 'isRecurring', type: 'boolean', label: 'Is Recurring', options: ['yes', 'no'] },
  ],
  
  users: [
    { name: 'name', type: 'text', label: 'Full Name', searchable: true, sortable: true },
    { name: 'fullName', type: 'text', label: 'Full Name', searchable: true, sortable: true },
    { name: 'username', type: 'text', label: 'Username', searchable: true, sortable: true },
    { name: 'email', type: 'text', label: 'Email', searchable: true, sortable: true },
    { name: 'role', type: 'select', label: 'Role', options: ['owner', 'employee', 'client', 'admin', 'superadmin'], sortable: true },
    { name: 'status', type: 'computed', label: 'Status', computeFn: 'userStatus', options: ['active', 'inactive'] },
    { name: 'isActive', type: 'boolean', label: 'Is Active', options: ['yes', 'no'] },
    { name: 'phone', type: 'text', label: 'Phone', searchable: true },
    { name: 'department', type: 'select', label: 'Department', options: ['taxation', 'audit', 'advisory', 'compliance', 'general'], sortable: true },
    { name: 'expertise', type: 'array', label: 'Expertise', searchable: true },
    { name: 'employeeId', type: 'text', label: 'Employee ID', searchable: true, sortable: true },
    { name: 'salary', type: 'number', label: 'Salary', sortable: true },
    { name: 'joinDate', type: 'date', label: 'Join Date', sortable: true },
    { name: 'createdAt', type: 'date', label: 'Created Date', sortable: true },
    { name: 'lastLogin', type: 'date', label: 'Last Login', sortable: true },
    { name: 'lastSeen', type: 'date', label: 'Last Seen', sortable: true },
    { name: 'isOnline', type: 'boolean', label: 'Is Online', options: ['yes', 'no'] },
    { name: 'isEmailVerified', type: 'boolean', label: 'Email Verified', options: ['yes', 'no'] },
  ],
  
  chat_messages: [
    { name: 'content', type: 'text', label: 'Message Content', searchable: true },
    { name: 'type', type: 'select', label: 'Message Type', options: ['text', 'file', 'system'], sortable: true },
    { name: 'sender', type: 'reference', label: 'Sender', refEntity: 'users' },
    { name: 'room', type: 'reference', label: 'Chat Room', refEntity: 'chat_rooms' },
    { name: 'createdAt', type: 'date', label: 'Sent At', sortable: true },
    { name: 'edited', type: 'boolean', label: 'Is Edited', options: ['yes', 'no'] },
    { name: 'isDeleted', type: 'boolean', label: 'Is Deleted', options: ['yes', 'no'] },
  ],
  
  chat_rooms: [
    { name: 'name', type: 'text', label: 'Room Name', searchable: true, sortable: true },
    { name: 'type', type: 'select', label: 'Room Type', options: ['general', 'project', 'direct'], sortable: true },
    { name: 'description', type: 'text', label: 'Description', searchable: true },
    { name: 'createdBy', type: 'reference', label: 'Created By', refEntity: 'users' },
    { name: 'createdAt', type: 'date', label: 'Created Date', sortable: true },
    { name: 'isArchived', type: 'boolean', label: 'Is Archived', options: ['yes', 'no'] },
    { name: 'participantCount', type: 'computed', label: 'Number of Participants', computeFn: 'countParticipants' },
  ],
  
  communications: [
    { name: 'subject', type: 'text', label: 'Subject', searchable: true, sortable: true },
    { name: 'type', type: 'select', label: 'Type', options: ['email', 'sms', 'whatsapp', 'letter'], sortable: true },
    { name: 'status', type: 'select', label: 'Status', options: ['draft', 'sent', 'delivered', 'failed', 'bounced'], sortable: true },
    { name: 'clientId', type: 'reference', label: 'Client', refEntity: 'clients' },
    { name: 'sentBy', type: 'reference', label: 'Sent By', refEntity: 'users' },
    { name: 'sentAt', type: 'date', label: 'Sent Date', sortable: true },
    { name: 'createdAt', type: 'date', label: 'Created Date', sortable: true },
    { name: 'recipientEmail', type: 'text', label: 'Recipient Email', searchable: true },
  ],
  
  documents: [
    { name: 'fileName', type: 'text', label: 'File Name', searchable: true, sortable: true },
    { name: 'fileType', type: 'text', label: 'File Type', searchable: true, sortable: true },
    { name: 'fileSize', type: 'number', label: 'File Size (bytes)', sortable: true },
    { name: 'category', type: 'text', label: 'Category', searchable: true, sortable: true },
    { name: 'clientId', type: 'reference', label: 'Client', refEntity: 'clients' },
    { name: 'uploadedBy', type: 'reference', label: 'Uploaded By', refEntity: 'users' },
    { name: 'createdAt', type: 'date', label: 'Upload Date', sortable: true },
    { name: 'tags', type: 'array', label: 'Tags', searchable: true },
    { name: 'isPublic', type: 'boolean', label: 'Is Public', options: ['yes', 'no'] },
  ],
  
  notifications: [
    { name: 'title', type: 'text', label: 'Title', searchable: true, sortable: true },
    { name: 'message', type: 'text', label: 'Message', searchable: true },
    { name: 'type', type: 'select', label: 'Type', options: ['info', 'success', 'warning', 'error'], sortable: true },
    { name: 'isRead', type: 'boolean', label: 'Is Read', options: ['yes', 'no'] },
    { name: 'userId', type: 'reference', label: 'User', refEntity: 'users' },
    { name: 'createdAt', type: 'date', label: 'Created Date', sortable: true },
    { name: 'readAt', type: 'date', label: 'Read Date', sortable: true },
  ],
  
  user_activity: [
    { name: 'userId', type: 'reference', label: 'User', refEntity: 'users' },
    { name: 'action', type: 'text', label: 'Action', searchable: true, sortable: true },
    { name: 'entity', type: 'text', label: 'Entity Type', searchable: true, sortable: true },
    { name: 'entityId', type: 'text', label: 'Entity ID', searchable: true },
    { name: 'ipAddress', type: 'text', label: 'IP Address', searchable: true },
    { name: 'userAgent', type: 'text', label: 'User Agent', searchable: true },
    { name: 'createdAt', type: 'date', label: 'Activity Date', sortable: true },
    { name: 'metadata', type: 'object', label: 'Additional Data' },
  ],
  
  gst_reports: [
    { name: 'clientId', type: 'reference', label: 'Client', refEntity: 'clients' },
    { name: 'reportType', type: 'select', label: 'Report Type', options: ['GSTR1', 'GSTR2', 'GSTR3B', 'GSTR9'], sortable: true },
    { name: 'period', type: 'text', label: 'Period (MM-YYYY)', searchable: true, sortable: true },
    { name: 'status', type: 'select', label: 'Status', options: ['pending', 'filed', 'revised'], sortable: true },
    { name: 'filedDate', type: 'date', label: 'Filed Date', sortable: true },
    { name: 'totalTax', type: 'number', label: 'Total Tax Amount', sortable: true },
    { name: 'createdAt', type: 'date', label: 'Created Date', sortable: true },
  ],
  
  analytics: [
    { name: 'metric', type: 'text', label: 'Metric Name', searchable: true, sortable: true },
    { name: 'value', type: 'number', label: 'Value', sortable: true },
    { name: 'category', type: 'text', label: 'Category', searchable: true, sortable: true },
    { name: 'date', type: 'date', label: 'Date', sortable: true },
    { name: 'entityType', type: 'text', label: 'Entity Type', searchable: true },
    { name: 'entityId', type: 'text', label: 'Entity ID', searchable: true },
  ],
};

// Helper function to compute derived fields
export function computeField(entity, fieldName, document) {
  const computeFunctions = {
    clients: {
      hasGSTNumber: (doc) => doc.gstNumber ? 'yes' : 'no',
    },
    chat_rooms: {
      countParticipants: (doc) => doc.participants ? doc.participants.length : 0,
    },
    users: {
      userStatus: (doc) => doc.isActive ? 'active' : 'inactive',
    },
  };
  
  if (computeFunctions[entity] && computeFunctions[entity][fieldName]) {
    return computeFunctions[entity][fieldName](document);
  }
  
  return null;
}

// Get all fields for an entity
export function getEntityFields(entity) {
  return fieldDefinitions[entity] || [];
}

// Get field by name
export function getFieldDefinition(entity, fieldName) {
  const fields = fieldDefinitions[entity] || [];
  return fields.find(f => f.name === fieldName);
}

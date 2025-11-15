import { getValidatedToken, setValidatedToken, clearToken } from '@/lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Type definitions for API requests and responses
interface LoginCredentials {
  username: string;
  password: string;
}

interface UserData {
  email: string;
  password: string;
  name?: string;
  fullName?: string;
  role?: string;
  firmId?: string;
  firmName?: string;
  phone?: string;
}

interface ApiParams {
  [key: string]: string | number | boolean;
}

// API client class for making HTTP requests
class ApiClient {
  private baseURL: string;

  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Get auth token from localStorage with validation
  getAuthToken(): string | null {
    return getValidatedToken();
  }

  // Set auth token with validation
  setAuthToken(token: string | null): void {
    if (token) {
      if (!setValidatedToken(token)) {
        console.error('Failed to set invalid token in API client');
        return;
      }
    } else {
      clearToken();
    }
  }

  // Make HTTP request with proper headers
  async request(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
      ...options,
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle response based on content type
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '60';
          throw new Error(`Too many requests. Please try again in ${retryAfter} seconds.`);
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          clearToken();
          // Don't redirect on auth check endpoints
          if (!endpoint.includes('/auth/me')) {
            window.location.href = '/login';
          }
        }
        
        // Throw error with response data or default message
        throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API Request error:', error);
      
      // Handle network errors (CORS, connection refused, etc.)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  // GET request
  async get(endpoint: string, params: ApiParams = {}): Promise<unknown> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint: string, data: unknown = {}): Promise<unknown> {
    return this.request(endpoint, {
      method: 'POST',
      body: data as BodyInit,
    });
  }

  // PUT request
  async put(endpoint: string, data: unknown = {}): Promise<unknown> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data as BodyInit,
    });
  }

  // DELETE request
  async delete(endpoint: string): Promise<unknown> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // File upload
  async upload(endpoint: string, formData: FormData): Promise<unknown> {
    const token = this.getAuthToken();
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          clearToken();
          window.location.href = '/login';
        }
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();

// Auth API methods
export const authAPI = {
  login: (credentials: LoginCredentials) => apiClient.post('/auth/login', credentials),
  register: (userData: UserData) => apiClient.post('/auth/register', userData),
  logout: () => {
    clearToken();
    return Promise.resolve({ success: true });
  },
  getCurrentUser: () => apiClient.get('/auth/me'),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
};

// Users API methods
export const usersAPI = {
  getUsers: (params?: ApiParams) => apiClient.get('/users', params),
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  createUser: (userData: UserData) => apiClient.post('/users', userData),
  updateUser: (id: string, userData: Partial<UserData>) => apiClient.put(`/users/${id}`, userData),
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
  bulkImport: (users: Record<string, unknown>[]) => apiClient.post('/users/bulk-import', { users }),
  bulkDelete: (userIds: string[]) => apiClient.post('/users/bulk-delete', { userIds }),
  bulkUpdateStatus: (userIds: string[], isActive: boolean) => apiClient.post('/users/bulk-status', { userIds, isActive }),
  bulkUpdateDepartment: (userIds: string[], department: string) => apiClient.post('/users/bulk-department', { userIds, department }),
};

// Clients API methods
export const clientsAPI = {
  getClients: (params?: ApiParams) => apiClient.get('/clients', params),
  getClient: (id: string) => apiClient.get(`/clients/${id}`),
  createClient: (clientData: Record<string, unknown>) => apiClient.post('/clients', clientData),
  updateClient: (id: string, clientData: Record<string, unknown>) => apiClient.put(`/clients/${id}`, clientData),
  deleteClient: (id: string) => apiClient.delete(`/clients/${id}`),
  bulkImport: (clients: Record<string, unknown>[]) => apiClient.post('/clients/bulk-import', { clients }),
  bulkDelete: (clientIds: string[]) => apiClient.post('/clients/bulk-delete', { clientIds }),
  bulkUpdateStatus: (clientIds: string[], status: string) => apiClient.post('/clients/bulk-status', { clientIds, status }),
  bulkArchive: (clientIds: string[], archived: boolean) => apiClient.post('/clients/bulk-archive', { clientIds, archived }),
  lookupGST: (gstNumber: string) => apiClient.post('/clients/lookup/gst', { gstNumber }),
  lookupCIN: (cinNumber: string) => apiClient.post('/clients/lookup/cin', { cinNumber }),
};

// Tasks API methods
export const tasksAPI = {
  getTasks: (params?: ApiParams) => apiClient.get('/tasks', params),
  getTask: (id: string) => apiClient.get(`/tasks/${id}`),
  createTask: (taskData: Record<string, unknown>) => apiClient.post('/tasks', taskData),
  updateTask: (id: string, taskData: Record<string, unknown>) => apiClient.put(`/tasks/${id}`, taskData),
  deleteTask: (id: string) => apiClient.delete(`/tasks/${id}`),
  assignTask: (id: string, assignData: Record<string, unknown>) => apiClient.put(`/tasks/${id}/assign`, assignData),
  updateTaskStatus: (id: string, status: string) => apiClient.put(`/tasks/${id}/status`, { status }),
};

// Invoices API methods
export const invoicesAPI = {
  getInvoices: (params?: ApiParams) => apiClient.get('/invoices', params),
  getInvoice: (id: string) => apiClient.get(`/invoices/${id}`),
  createInvoice: (invoiceData: Record<string, unknown>) => apiClient.post('/invoices', invoiceData),
  updateInvoice: (id: string, invoiceData: Record<string, unknown>) => apiClient.put(`/invoices/${id}`, invoiceData),
  deleteInvoice: (id: string) => apiClient.delete(`/invoices/${id}`),
  sendInvoice: (id: string) => apiClient.post(`/invoices/${id}/send`),
  markAsPaid: (id: string, paymentData: Record<string, unknown>) => apiClient.post(`/invoices/${id}/payment`, paymentData),
};

// Dashboard API methods
export const dashboardAPI = {
  getDashboardData: (params?: ApiParams) => apiClient.get('/dashboard', params),
  getAnalytics: (params?: ApiParams) => apiClient.get('/dashboard/analytics', params),
  getReports: (params?: ApiParams) => apiClient.get('/dashboard/reports', params),
};

// Documents API methods
export const documentsAPI = {
  getClientDocuments: (clientId: string, params?: ApiParams) => apiClient.get(`/documents/client/${clientId}`, params),
  uploadDocument: (clientId: string, formData: FormData) => apiClient.upload(`/documents/client/${clientId}/upload`, formData),
  downloadDocument: (id: string) => apiClient.get(`/documents/${id}/download`),
  updateDocument: (id: string, data: Record<string, unknown>) => apiClient.put(`/documents/${id}`, data),
  deleteDocument: (id: string) => apiClient.delete(`/documents/${id}`),
};

// Communications API methods
export const communicationsAPI = {
  getClientCommunications: (clientId: string, params?: ApiParams) => apiClient.get(`/communications/client/${clientId}`, params),
  createCommunication: (clientId: string, data: Record<string, unknown>) => apiClient.post(`/communications/client/${clientId}`, data),
  markAsRead: (id: string) => apiClient.put(`/communications/${id}/read`),
  updateCommunication: (id: string, data: Record<string, unknown>) => apiClient.put(`/communications/${id}`, data),
  deleteCommunication: (id: string) => apiClient.delete(`/communications/${id}`),
  getUnreadCount: () => apiClient.get('/communications/unread/count'),
};

// Contacts API methods
export const contactsAPI = {
  getClientContacts: (clientId: string, params?: ApiParams) => apiClient.get(`/contacts/client/${clientId}`, params),
  createContact: (clientId: string, data: Record<string, unknown>) => apiClient.post(`/contacts/client/${clientId}`, data),
  updateContact: (id: string, data: Record<string, unknown>) => apiClient.put(`/contacts/${id}`, data),
  deleteContact: (id: string) => apiClient.delete(`/contacts/${id}`),
  setPrimaryContact: (id: string) => apiClient.put(`/contacts/${id}/primary`),
};

// Automation API methods
export const automationAPI = {
  getAutomationSettings: () => apiClient.get('/automation'),
  updateAutomationSettings: (settings: Record<string, unknown>) => apiClient.put('/automation', settings),
  getRecurringTasks: () => apiClient.get('/automation/recurring-tasks'),
  createRecurringTask: (taskData: Record<string, unknown>) => apiClient.post('/automation/recurring-tasks', taskData),
};

// Payments API methods
export const paymentsAPI = {
  createOrder: (orderData: { invoiceId: string; amount: number }) => 
    apiClient.post('/payments/create-order', orderData),
  createPaymentLink: (linkData: { invoiceId: string }) => 
    apiClient.post('/payments/create-payment-link', linkData),
  verifyPayment: (paymentData: { 
    razorpay_order_id: string; 
    razorpay_payment_id: string; 
    razorpay_signature: string; 
  }) => apiClient.post('/payments/verify', paymentData),
  getConfig: () => apiClient.get('/payments/config'),
};

export default apiClient;
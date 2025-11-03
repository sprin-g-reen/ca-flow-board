
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  taskId?: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal?: number;
  discount?: number;
  total: number;
  notes?: string;
  termsAndConditions?: string;
  paymentDetails?: string;
  paidAmount?: number;
  paidDate?: string;
  paymentMethod?: string;
  createdBy: string;
  createdAt: string;
}

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  invoices: [],
  isLoading: false,
  error: null,
};

// Mock data for development
const mockInvoices: Invoice[] = [
  {
    id: '1001',
    invoiceNumber: 'INV-2025-001',
    clientId: '101',
    clientName: 'ABC Corp',
    status: 'sent',
    issueDate: '2025-04-01T10:00:00Z',
    dueDate: '2025-04-15T10:00:00Z',
    items: [
      {
        id: '1001-1',
        description: 'Monthly GST Filing',
        taskId: '1',
        quantity: 1,
        rate: 5000,
        amount: 5000,
        taxRate: 18,
        taxAmount: 900,
      },
      {
        id: '1001-2',
        description: 'Consultation',
        quantity: 2,
        rate: 2000,
        amount: 4000,
        taxRate: 18,
        taxAmount: 720,
      },
    ],
    subtotal: 9000,
    taxTotal: 1620,
    total: 10620,
    notes: 'Please pay by due date to avoid late fees.',
    termsAndConditions: 'Standard terms apply',
    paymentDetails: 'Bank transfer to Account #12345678',
    createdBy: '201',
    createdAt: '2025-04-01T09:30:00Z',
  },
  {
    id: '1002',
    invoiceNumber: 'INV-2025-002',
    clientId: '102',
    clientName: 'XYZ Industries',
    status: 'paid',
    issueDate: '2025-03-15T11:30:00Z',
    dueDate: '2025-03-30T11:30:00Z',
    items: [
      {
        id: '1002-1',
        description: 'Quarterly Tax Planning',
        taskId: '3',
        quantity: 1,
        rate: 7500,
        amount: 7500,
        taxRate: 18,
        taxAmount: 1350,
      },
    ],
    subtotal: 7500,
    taxTotal: 1350,
    total: 8850,
    paidAmount: 8850,
    paidDate: '2025-03-29T14:20:00Z',
    paymentMethod: 'Online Transfer',
    createdBy: '202',
    createdAt: '2025-03-15T10:45:00Z',
  },
];

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    ...initialState,
    invoices: mockInvoices,
  },
  reducers: {
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.invoices = action.payload;
    },
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.invoices.push(action.payload);
    },
    updateInvoice: (state, action: PayloadAction<Invoice>) => {
      const index = state.invoices.findIndex((invoice) => invoice.id === action.payload.id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
      }
    },
    deleteInvoice: (state, action: PayloadAction<string>) => {
      state.invoices = state.invoices.filter((invoice) => invoice.id !== action.payload);
    },
    updateInvoiceStatus: (
      state,
      action: PayloadAction<{ invoiceId: string; status: InvoiceStatus }>
    ) => {
      const { invoiceId, status } = action.payload;
      const invoice = state.invoices.find((i) => i.id === invoiceId);
      if (invoice) {
        invoice.status = status;
        if (status === 'paid') {
          invoice.paidDate = new Date().toISOString();
          invoice.paidAmount = invoice.total;
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setInvoices,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  setLoading,
  setError,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;

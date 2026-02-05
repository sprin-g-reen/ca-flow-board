
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hsn?: string;
  taxRate?: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date;
  client: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    gst_number?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
}

interface FirmData {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  panNumber?: string;
  logo?: string;
}

export const generateInvoicePDF = (invoice: InvoiceData, firm: FirmData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Helper for right-aligned text
  const rightAlign = (text: string, y: number) => {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - 20 - textWidth, y);
  };

  // Header - Firm Details
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  doc.text(firm.name, 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  let currentY = 32;
  
  if (firm.address) {
    const lines = doc.splitTextToSize(firm.address, 80);
    doc.text(lines, 20, currentY);
    currentY += lines.length * 5;
  }
  
  if (firm.email) {
    doc.text(`Email: ${firm.email}`, 20, currentY);
    currentY += 5;
  }
  
  if (firm.phone) {
    doc.text(`Phone: ${firm.phone}`, 20, currentY);
    currentY += 5;
  }
  
  if (firm.gstNumber) {
    doc.text(`GSTIN: ${firm.gstNumber}`, 20, currentY);
    currentY += 5;
  }

  // Invoice Label and Number
  doc.setFontSize(24);
  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  rightAlign('INVOICE', 30);
  
  doc.setFontSize(12);
  doc.setTextColor(60);
  rightAlign(`# ${invoice.invoiceNumber}`, 40);

  // Dates
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  rightAlign(`Date: ${format(new Date(invoice.issueDate), 'dd/MM/yyyy')}`, 50);
  rightAlign(`Due Date: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}`, 55);

  // Client Details (Bill To)
  currentY = Math.max(currentY + 10, 70);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40);
  doc.text('Bill To:', 20, currentY);
  
  currentY += 7;
  doc.setFontSize(11);
  doc.text(invoice.client.name, 20, currentY);
  
  currentY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  
  if (invoice.client.address) {
    const addressLines = doc.splitTextToSize(invoice.client.address, 80);
    doc.text(addressLines, 20, currentY);
    currentY += addressLines.length * 5;
  }
  
  if (invoice.client.email) {
    doc.text(`Email: ${invoice.client.email}`, 20, currentY);
    currentY += 5;
  }
  
  if (invoice.client.gst_number) {
    doc.text(`GSTIN: ${invoice.client.gst_number}`, 20, currentY);
    currentY += 5;
  }

  // Items Table
  currentY += 10;
  autoTable(doc, {
    startY: currentY,
    head: [['Description', 'HSN/SAC', 'Quantity', 'Rate', 'Amount']],
    body: invoice.items.map(item => [
      item.description,
      item.hsn || '-',
      item.quantity,
      `₹. ${item.rate.toFixed(2)}`,
      `₹. ${item.amount.toFixed(2)}`
    ]),
    headStyles: { fillColor: [63, 81, 181], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 },
    theme: 'striped'
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Summary
  const summaryX = pageWidth - 80;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  
  doc.text('Subtotal:', summaryX, currentY);
  doc.text(`₹. ${invoice.subtotal.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
  
  currentY += 7;
  doc.text('Tax (GST):', summaryX, currentY);
  doc.text(`₹. ${invoice.taxAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
  
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Total Amount:', summaryX, currentY);
  doc.text(`₹. ${invoice.totalAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

  // Notes and Terms
  currentY += 20;
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(noteLines, 20, currentY);
    currentY += noteLines.length * 5 + 5;
  }

  if (invoice.terms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text('Terms & Conditions:', 20, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const termLines = doc.splitTextToSize(invoice.terms, pageWidth - 40);
    doc.text(termLines, 20, currentY);
  }

  // Footer
  const footerText = 'Thank you for your business!';
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });

  // Save PDF
  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
};

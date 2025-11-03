import React, { useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Send, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services/settings';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: any;
  calculations: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  };
  isInterState: boolean;
  clientData?: any;
}

// Template 1: Simple Invoice (Like Stripe)
const SimpleInvoiceTemplate = ({ 
  invoiceData, 
  calculations, 
  isInterState, 
  clientData, 
  accountData, 
  branding,
  displayNumber 
}: any) => {
  return (
    <div className="bg-white p-8 max-w-3xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Border */}
      <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 -mx-8 -mt-8 mb-8" 
           style={{ background: `linear-gradient(to right, ${branding.primaryColor || '#3b82f6'}, ${branding.secondaryColor || '#1e40af'})` }} />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {branding.logoFile ? (
            <img src={branding.logoFile} alt="Logo" className="h-12 mb-4" />
          ) : (
            <div className="text-2xl font-bold mb-2" style={{ color: branding.primaryColor || '#3b82f6' }}>
              {accountData?.companyName || 'CA Flow Board'}
            </div>
          )}
          <div className="text-sm text-gray-600 font-medium">
            {accountData?.companyName || 'CA Flow Board'}
          </div>
        </div>
        
        <div className="text-right">
          {branding.logoFile && (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2"
                 style={{ backgroundColor: `${branding.primaryColor}20` }}>
              <span className="text-2xl font-bold" style={{ color: branding.primaryColor }}>
                {accountData?.companyName?.charAt(0) || 'S'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Info */}
      <div className="text-3xl font-bold mb-6">
        {invoiceData.type === 'quotation' ? 'Quotation' : 
         invoiceData.type === 'proforma' ? 'Proforma Invoice' : 'Invoice'}
      </div>
      
      <div className="space-y-1 mb-6">
        <div className="text-sm">
          <span className="font-semibold">Invoice number</span> {displayNumber}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Date due</span>{' '}
          {format(invoiceData.dueDate, 'MMMM d, yyyy')}
        </div>
      </div>

      {/* From/To */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="font-semibold text-sm mb-2">{accountData?.companyName || 'CA Flow Board'}</div>
        </div>
        <div>
          <div className="font-semibold text-sm mb-2">Bill to</div>
          <div className="text-sm text-gray-700">{clientData?.name || clientData?.contact_person || 'Client'}</div>
          <div className="text-sm text-gray-600">{clientData?.email}</div>
        </div>
      </div>

      {/* Amount Due */}
      <div className="text-3xl font-bold mb-2">
        ₹{calculations.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} due {format(invoiceData.dueDate, 'MMMM d, yyyy')}
      </div>
      
      {invoiceData.type === 'quotation' && (
        <a href="#" className="text-indigo-600 hover:underline text-sm font-medium inline-block mb-6"
           style={{ color: branding.primaryColor }}>
          Pay online
        </a>
      )}

      <div className="text-sm mb-8">Thanks for your business!</div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2 text-sm font-semibold">Description</th>
            <th className="text-right py-2 text-sm font-semibold">Qty</th>
            <th className="text-right py-2 text-sm font-semibold">Unit price</th>
            <th className="text-right py-2 text-sm font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.items?.map((item: any, idx: number) => (
            <tr key={idx}>
              <td className="py-3 text-sm">{item.title || item.description}</td>
              <td className="text-right py-3 text-sm">{item.quantity}</td>
              <td className="text-right py-3 text-sm">₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="text-right py-3 text-sm">₹{(item.quantity * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{calculations.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {calculations.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount</span>
              <span>-₹{calculations.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {calculations.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>₹{calculations.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2">
            <span>Total</span>
            <span>₹{calculations.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Amount due</span>
            <span>₹{calculations.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {invoiceData.type !== 'quotation' && invoiceData?.bankDetails?.bankName && (
        <div className="border-t border-gray-300 pt-6">
          <div className="font-semibold text-sm mb-3">Bank Details for Payment</div>
          <div className="space-y-1 text-xs">
            {invoiceData.bankDetails.accountName && (
              <div><span className="font-medium">Account Holder:</span> {invoiceData.bankDetails.accountName}</div>
            )}
            {invoiceData.bankDetails.bankName && (
              <div><span className="font-medium">Bank Name:</span> {invoiceData.bankDetails.bankName}</div>
            )}
            {invoiceData.bankDetails.accountNumber && (
              <div><span className="font-medium">Account Number:</span> {invoiceData.bankDetails.accountNumber}</div>
            )}
            {invoiceData.bankDetails.ifscCode && (
              <div><span className="font-medium">IFSC Code:</span> {invoiceData.bankDetails.ifscCode}</div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-12 pt-6 border-t border-gray-200">
        {displayNumber} · ₹{calculations.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} due {format(invoiceData.dueDate, 'MMMM d, yyyy')}
      </div>
    </div>
  );
};

// Template 2: Professional GST Invoice (Like TATA)
const ProfessionalGSTTemplate = ({ 
  invoiceData, 
  calculations, 
  isInterState, 
  clientData, 
  accountData, 
  branding,
  displayNumber 
}: any) => {
  // Calculate tax breakdown
  const calculateItemTax = (item: any) => {
    const itemTotal = item.quantity * item.rate;
    const taxRate = item.taxRate || 18;
    const taxAmount = (itemTotal * taxRate) / 100;
    
    if (isInterState) {
      return { igst: taxAmount, cgst: 0, sgst: 0 };
    } else {
      return { igst: 0, cgst: taxAmount / 2, sgst: taxAmount / 2 };
    }
  };

  const totalTaxable = calculations.subtotal;
  const totalTax = calculations.taxAmount;

  return (
    <div className="bg-white p-0 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
      {/* Border */}
      <div className="border-2 border-gray-800">
        {/* Header */}
        <div className="border-b-2 border-gray-800">
          <div className="bg-gray-100 text-center py-1 font-bold text-sm">
            {invoiceData.type === 'quotation' ? 'QUOTATION' : invoiceData.type === 'proforma' ? 'PROFORMA INVOICE' : 'TAX INVOICE'}
            <span className="float-right mr-4 text-xs font-normal">ORIGINAL FOR RECIPIENT</span>
          </div>
          
          <div className="grid grid-cols-2 border-t border-gray-800">
            {/* Company Details */}
            <div className="p-4 border-r border-gray-800">
              <div className="flex items-start gap-3 mb-2">
                {branding.logoFile ? (
                  <img src={branding.logoFile} alt="Logo" className="h-12 w-12 object-contain" />
                ) : (
                  <div className="h-12 w-12 bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                    {accountData?.companyName?.charAt(0) || 'C'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-sm">{accountData?.companyName?.toUpperCase()}</div>
                  {accountData?.gstNumber && <div className="text-xs">GSTIN {accountData.gstNumber}</div>}
                </div>
              </div>
              <div className="text-xs space-y-0.5">
                <div>{accountData?.address || ''}</div>
                {accountData?.city && accountData?.state && <div>{accountData?.city}, {accountData?.state}</div>}
                {accountData?.phone && <div><span className="font-semibold">Mobile</span> {accountData.phone}</div>}
                {accountData?.email && <div><span className="font-semibold">Email</span> {accountData.email}</div>}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><span className="font-semibold">Invoice #:</span></div>
                <div>{displayNumber}</div>
                
                <div><span className="font-semibold">Invoice Date:</span></div>
                <div>{format(invoiceData.issueDate, 'dd MMM yyyy')}</div>
                
                <div><span className="font-semibold">Place of Supply:</span></div>
                <div>
                  {isInterState 
                    ? 'INTERSTATE' 
                    : clientData?.gst_data?.state_code 
                    ? `${clientData.gst_data.state_code}` 
                    : clientData?.state 
                    ? clientData.state 
                    : 'Not specified'}
                </div>
                
                <div><span className="font-semibold">Due Date:</span></div>
                <div>{format(invoiceData.dueDate, 'dd MMM yyyy')}</div>
              </div>
              
              {clientData?.shipping_address && (
                <div className="mt-3 text-xs">
                  <div className="font-semibold mb-1">Shipping address:</div>
                  <div>{clientData.shipping_address}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="border-b border-gray-800 p-4 bg-gray-50">
          <div className="font-semibold text-xs mb-2">Customer Details:</div>
          <div className="text-xs space-y-0.5">
            <div className="font-semibold">{clientData?.name || clientData?.contact_person || 'Customer Name'}</div>
            {clientData?.gstin && <div><span className="font-semibold">GSTIN:</span> {clientData.gstin}</div>}
            {clientData?.billing_address && (
              <>
                <div><span className="font-semibold">Billing address:</span></div>
                <div>{clientData.billing_address}</div>
              </>
            )}
            {clientData?.phone && <div><span className="font-semibold">Ph:</span> {clientData.phone}</div>}
            {clientData?.email && <div><span className="font-semibold">Email:</span> {clientData.email}</div>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-800">
              <th className="border-r border-gray-800 py-2 px-2 text-center w-8">#</th>
              <th className="border-r border-gray-800 py-2 px-2 text-left">Item</th>
              <th className="border-r border-gray-800 py-2 px-2 text-center w-20">HSN/SAC</th>
              <th className="border-r border-gray-800 py-2 px-2 text-right w-16">Rate/ Item</th>
              <th className="border-r border-gray-800 py-2 px-2 text-center w-12">Qty</th>
              <th className="border-r border-gray-800 py-2 px-2 text-right w-24">Taxable Value</th>
              <th className="border-r border-gray-800 py-2 px-2 text-right w-24">Tax Amount</th>
              <th className="py-2 px-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items?.map((item: any, idx: number) => {
              const itemTotal = item.quantity * item.rate;
              const tax = calculateItemTax(item);
              const taxAmount = tax.igst || (tax.cgst + tax.sgst);
              
              return (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="border-r border-gray-300 py-3 px-2 text-center align-top">{idx + 1}</td>
                  <td className="border-r border-gray-300 py-3 px-2 align-top">
                    <div className="font-semibold">{item.title || 'Item'}</div>
                    {item.description && (
                      <div className="text-xs text-gray-600 mt-1">
                        {item.description.split('\n').map((line: string, i: number) => (
                          <div key={i}>• {line}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="border-r border-gray-300 py-3 px-2 text-center align-top">{item.hsn || '87038070'}</td>
                  <td className="border-r border-gray-300 py-3 px-2 text-right align-top">
                    {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border-r border-gray-300 py-3 px-2 text-center align-top">{item.quantity}</td>
                  <td className="border-r border-gray-300 py-3 px-2 text-right align-top">
                    {itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border-r border-gray-300 py-3 px-2 text-right align-top">
                    {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({item.taxRate || 18}%)
                  </td>
                  <td className="py-3 px-2 text-right align-top font-semibold">
                    {(itemTotal + taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary Row */}
        <div className="border-b border-gray-800 py-2 px-2 text-xs">
          Total items / Qty : {invoiceData.items?.length || 0} / {invoiceData.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
        </div>

        {/* Tax Summary and Total */}
        <div className="grid grid-cols-2">
          {/* Tax Breakdown */}
          <div className="border-r border-gray-800 p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-1">HSN/SAC</th>
                  <th className="text-right py-1">Taxable Value</th>
                  <th className="text-center py-1" colSpan={2}>
                    {isInterState ? 'Integrated Tax' : 'Central Tax / State Tax'}
                  </th>
                  <th className="text-right py-1">Total Tax Amount</th>
                </tr>
                {!isInterState && (
                  <tr className="border-b border-gray-800 text-xs">
                    <th></th>
                    <th></th>
                    <th className="text-center py-1">Rate</th>
                    <th className="text-center py-1">Amount</th>
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {invoiceData.items?.map((item: any, idx: number) => {
                  const itemTotal = item.quantity * item.rate;
                  const tax = calculateItemTax(item);
                  const taxRate = item.taxRate || 18;
                  
                  return (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="py-1">{item.hsn || '87038070'}</td>
                      <td className="text-right py-1">{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
                      {isInterState ? (
                        <>
                          <td className="text-center py-1">{taxRate}%</td>
                          <td className="text-right py-1">{tax.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </>
                      ) : (
                        <>
                          <td className="text-center py-1">{taxRate / 2}%</td>
                          <td className="text-right py-1">{tax.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </>
                      )}
                      <td className="text-right py-1">{(tax.igst || tax.cgst + tax.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
                <tr className="font-bold border-t-2 border-gray-800">
                  <td className="py-1">TOTAL</td>
                  <td className="text-right py-1">{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="text-center py-1"></td>
                  <td className="text-right py-1">{isInterState ? totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : (totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="text-right py-1">{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Amount */}
          <div className="p-4 flex flex-col justify-between">
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span>Taxable Amount</span>
                <span className="font-bold">₹{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span className="font-bold">-₹{calculations.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{isInterState ? 'IGST 18.0%' : 'CGST + SGST'}</span>
                <span className="font-bold">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t-2 border-gray-800">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">Total</span>
                <span className="font-bold text-lg">₹{calculations.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="mt-4 text-xs">
              <div className="font-semibold mb-1">Total amount (in words): INR {numberToWords(calculations.total)} Only.</div>
            </div>

            {invoiceData.type === 'invoice' && (
              <div className="mt-4 bg-green-100 text-green-800 text-center py-1 px-2 rounded flex items-center justify-center gap-1">
                <span className="text-lg">✓</span>
                <span className="font-semibold text-xs">Amount Paid</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="grid grid-cols-3 border-t-2 border-gray-800">
          {/* Bank Details */}
          <div className="border-r border-gray-800 p-4">
            <div className="font-semibold text-xs mb-2">Bank Details:</div>
            <div className="text-xs space-y-0.5">
              {invoiceData?.bankDetails?.bankName && <div><span className="font-semibold">Bank:</span> {invoiceData.bankDetails.bankName}</div>}
              {invoiceData?.bankDetails?.accountNumber && <div><span className="font-semibold">Account #:</span> {invoiceData.bankDetails.accountNumber}</div>}
              {invoiceData?.bankDetails?.ifscCode && <div><span className="font-semibold">IFSC:</span> {invoiceData.bankDetails.ifscCode}</div>}
              {invoiceData?.bankDetails?.accountName && <div><span className="font-semibold">Account Holder:</span> {invoiceData.bankDetails.accountName}</div>}
              {!invoiceData?.bankDetails?.bankName && !invoiceData?.bankDetails?.accountNumber && (
                <div className="text-gray-400 italic">Bank details not provided</div>
              )}
            </div>
          </div>

          {/* QR Code / Payment Link */}
          <div className="border-r border-gray-800 p-4 flex flex-col items-center justify-center">
            <div className="text-xs font-semibold mb-2">Pay using UPI:</div>
            <div className="w-24 h-24 border-2 border-gray-300 flex items-center justify-center bg-gray-50">
              {/* QR Code Placeholder */}
              <div className="text-center">
                <div className="text-xs text-gray-500">QR Code</div>
                <div className="text-xs text-gray-400">Scan to Pay</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">For {accountData?.companyName?.toUpperCase()}</div>
          </div>

          {/* Signature */}
          <div className="p-4 flex flex-col justify-end">
            <div className="text-xs text-right">
              <div className="h-20 mb-2"></div>
              <div className="font-semibold text-xs border-t border-gray-400 pt-1 inline-block min-w-[120px]">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="grid grid-cols-2 border-t border-gray-800">
          <div className="border-r border-gray-800 p-4">
            <div className="font-semibold text-xs mb-2">Notes:</div>
            <div className="text-xs">{invoiceData.notes || 'Thank you for the Business'}</div>
          </div>
          <div className="p-4">
            <div className="font-semibold text-xs mb-2">Terms and Conditions:</div>
            <div className="text-xs space-y-1">
              {(branding.termsAndConditions || invoiceData.terms || 
                '1. Goods once sold cannot be taken back or exchanged.\n2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.\n3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.\n4. Subject to local Jurisdiction.')
                .split('\n')
                .map((term: string, i: number) => (
                  <div key={i}>{term}</div>
                ))}
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="border-t border-gray-800 py-1 px-2 text-xs text-center">
          Page 1 / 1 &nbsp;&nbsp; This is a digitally signed document.
        </div>
      </div>
    </div>
  );
};

// Helper function to convert numbers to words (simplified)
const numberToWords = (num: number): string => {
  // Simplified version - in production, use a proper library
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  // For simplicity, just handle up to lakhs
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = Math.floor((num % 1000) / 100);
  const remainder = Math.floor(num % 100);
  
  let words = '';
  
  if (crores > 0) words += `${units[crores]} Crore `;
  if (lakhs > 0) words += `${lakhs < 20 ? teens[lakhs - 10] || units[lakhs] : tens[Math.floor(lakhs / 10)] + ' ' + units[lakhs % 10]} Lakh `;
  if (thousands > 0) words += `${thousands < 20 ? teens[thousands - 10] || units[thousands] : tens[Math.floor(thousands / 10)] + ' ' + units[thousands % 10]} Thousand `;
  if (hundreds > 0) words += `${units[hundreds]} Hundred `;
  if (remainder > 0) {
    if (remainder < 10) words += units[remainder];
    else if (remainder < 20) words += teens[remainder - 10];
    else words += `${tens[Math.floor(remainder / 10)]} ${units[remainder % 10]}`;
  }
  
  return words.trim();
};

export const InvoicePreviewModal = ({
  isOpen,
  onClose,
  invoiceData,
  calculations,
  isInterState,
  clientData,
}: InvoicePreviewModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch settings to get account branding
  const { data: settings } = useQuery({
    queryKey: ['settings', 'company'],
    queryFn: () => settingsService.getSettings('company'),
  });

  const collectionMethod = invoiceData.collectionMethod || 'account_1';
  const accountData = settings?.invoiceAccounts?.[collectionMethod];
  const branding = accountData?.branding || {};

  // Generate stable invoice number (memoized so it doesn't change on re-renders)
  const displayNumber = useMemo(() => {
    const timestamp = Date.now().toString().slice(-8);
    return invoiceData.type === 'quotation' 
      ? `QUO-${timestamp}` 
      : invoiceData.type === 'proforma'
      ? `PRO-${timestamp}`
      : `INV-${timestamp}`;
  }, [invoiceData.type]); // Only regenerate if type changes

  // Determine which template to use based on collection method
  const useSimpleTemplate = collectionMethod === 'account_1';

  // Handle print
  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice ${displayNumber}</title>
              <style>
                @media print {
                  body { margin: 0; padding: 20px; }
                  @page { margin: 0; }
                }
                body { font-family: system-ui, -apple-system, sans-serif; }
              </style>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice Preview</DialogTitle>
          <DialogDescription>Preview your invoice before sending</DialogDescription>
        </DialogHeader>

        {/* Action Bar */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Invoice Preview</h3>
            <Badge variant="outline" className="ml-2">
              {collectionMethod === 'account_1' ? 'Simple Template' : 'Professional GST Template'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Invoice Preview Container */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)] bg-gray-100 p-6">
          <div ref={printRef} className="shadow-lg">
            {useSimpleTemplate ? (
              <SimpleInvoiceTemplate
                invoiceData={invoiceData}
                calculations={calculations}
                isInterState={isInterState}
                clientData={clientData}
                accountData={accountData}
                branding={branding}
                displayNumber={displayNumber}
              />
            ) : (
              <ProfessionalGSTTemplate
                invoiceData={invoiceData}
                calculations={calculations}
                isInterState={isInterState}
                clientData={clientData}
                accountData={accountData}
                branding={branding}
                displayNumber={displayNumber}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

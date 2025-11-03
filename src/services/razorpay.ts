// Razorpay integration service for frontend

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

export interface RazorpayConfig {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  private isScriptLoaded = false;
  private scriptPromise: Promise<void> | null = null;

  // Load Razorpay script
  async loadScript(): Promise<void> {
    if (this.isScriptLoaded) {
      return Promise.resolve();
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  // Initialize payment
  async initializePayment(config: RazorpayConfig): Promise<void> {
    try {
      await this.loadScript();
      
      if (!window.Razorpay) {
        throw new Error('Razorpay script not loaded');
      }

      const rzp = new window.Razorpay(config);
      rzp.open();
    } catch (error) {
      console.error('Razorpay initialization error:', error);
      throw error;
    }
  }

  // Create payment for invoice
  async createInvoicePayment({
    orderId,
    amount,
    currency = 'INR',
    invoiceNumber,
    clientName,
    clientEmail,
    clientPhone,
    firmName,
    onSuccess,
    onFailure,
  }: {
    orderId: string;
    amount: number;
    currency?: string;
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    firmName: string;
    onSuccess: (response: RazorpayResponse) => void;
    onFailure: (error: Error) => void;
  }): Promise<void> {
    const config: RazorpayConfig = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount * 100, // Convert to paise
      currency,
      name: firmName,
      description: `Payment for Invoice ${invoiceNumber}`,
      order_id: orderId,
      handler: (response: RazorpayResponse) => {
        onSuccess(response);
      },
      prefill: {
        name: clientName,
        email: clientEmail,
        contact: clientPhone,
      },
      notes: {
        invoice_number: invoiceNumber,
      },
      theme: {
        color: '#2563eb', // CA Flow blue color
      },
      modal: {
        ondismiss: () => {
          onFailure(new Error('Payment cancelled by user'));
        },
      },
    };

    try {
      await this.initializePayment(config);
    } catch (error) {
      onFailure(error);
    }
  }

  // Format amount for display
  formatAmount(amount: number, currency = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  // Check if Razorpay is available
  isAvailable(): boolean {
    return !!(import.meta.env.VITE_RAZORPAY_KEY_ID && 
             import.meta.env.VITE_RAZORPAY_KEY_ID !== 'rzp_test_your_key_id_here');
  }

  // Get Razorpay key for frontend
  getKey(): string {
    return import.meta.env.VITE_RAZORPAY_KEY_ID;
  }

  // Validate payment response
  isValidResponse(response: RazorpayResponse): boolean {
    return !!(
      response.razorpay_payment_id &&
      response.razorpay_order_id &&
      response.razorpay_signature
    );
  }

  // Calculate GST for Indian businesses
  calculateGST(amount: number, gstRate = 18) {
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;
    
    return {
      baseAmount: amount,
      gstRate,
      gstAmount,
      totalAmount,
      formattedBase: this.formatAmount(amount),
      formattedGST: this.formatAmount(gstAmount),
      formattedTotal: this.formatAmount(totalAmount),
    };
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
export default razorpayService;
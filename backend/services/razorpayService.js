import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayService {
  constructor() {
    this.accounts = {
      account_1: this.initializeAccount('RAZORPAY_ACCOUNT_1_KEY_ID', 'RAZORPAY_ACCOUNT_1_KEY_SECRET'),
      account_2: this.initializeAccount('RAZORPAY_ACCOUNT_2_KEY_ID', 'RAZORPAY_ACCOUNT_2_KEY_SECRET'),
      default: this.initializeAccount('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET')
    };

    // Set primary account (fallback for cash/cheque if no Razorpay support)
    this.razorpay = this.accounts.default || this.accounts.account_1 || this.accounts.account_2;

    if (!this.razorpay) {
      console.warn('⚠️  No Razorpay credentials configured. Payment features will be disabled.');
    } else {
      console.log('💳 Razorpay service initialized successfully');
    }
  }

  initializeAccount(keyIdEnv, keySecretEnv) {
    const keyId = process.env[keyIdEnv];
    const keySecret = process.env[keySecretEnv];

    console.log(`🔍 Checking ${keyIdEnv}:`, keyId ? 'SET' : 'NOT SET');
    console.log(`🔍 Checking ${keySecretEnv}:`, keySecret ? 'SET' : 'NOT SET');

    if (!keyId || !keySecret) {
      return null;
    }

    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  // Get the appropriate Razorpay instance based on collection method
  getRazorpayInstance(collectionMethod) {
    switch (collectionMethod) {
      case 'account_1':
        return this.accounts.account_1;
      case 'account_2':
        return this.accounts.account_2;
      case 'cash':
        // For cash, we might still use Razorpay for record-keeping or QR codes
        return this.accounts.default || this.accounts.account_1;
      case 'cheque':
        // For cheque, we might use Razorpay for tracking
        return this.accounts.default || this.accounts.account_1;
      default:
        return this.razorpay;
    }
  }

  // Create a payment order
  async createOrder(amount, currency = 'INR', receipt, notes = {}, collectionMethod = 'default') {
    const razorpayInstance = this.getRazorpayInstance(collectionMethod);
    
    if (!razorpayInstance) {
      throw new Error(`Razorpay not configured for collection method: ${collectionMethod}`);
    }

    try {
      const options = {
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        receipt,
        notes: {
          ...notes,
          collection_method: collectionMethod
        },
        payment_capture: 1, // Auto capture payment
      };

      const order = await razorpayInstance.orders.create(options);
      return {
        success: true,
        order,
        collection_method: collectionMethod
      };
    } catch (error) {
      console.error(`Razorpay order creation error for ${collectionMethod}:`, error);
      return {
        success: false,
        error: error.message,
        collection_method: collectionMethod
      };
    }
  }

  // Create a quotation with Razorpay integration
  async createQuotation({
    amount,
    currency = 'INR',
    description,
    customer,
    collectionMethod = 'default',
    validityPeriod = 30, // days
    lineItems = [],
    notes = {}
  }) {
    const razorpayInstance = this.getRazorpayInstance(collectionMethod);
    
    if (!razorpayInstance) {
      console.warn(`Razorpay not configured for ${collectionMethod}, creating quotation without payment link`);
      return {
        success: true,
        quotation: {
          id: `quot_${Date.now()}`,
          amount: amount * 100,
          currency,
          description,
          customer,
          collection_method: collectionMethod,
          validity_period: validityPeriod,
          line_items: lineItems,
          status: 'created',
          created_at: new Date().toISOString()
        },
        payment_link: null,
        collection_method: collectionMethod
      };
    }

    try {
      // For quotations, we create a payment link with extended validity
      const paymentLinkOptions = {
        amount: Math.round(amount * 100),
        currency,
        description: `Quotation: ${description}`,
        customer: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        expire_by: Math.floor(Date.now() / 1000) + (validityPeriod * 24 * 60 * 60), // Convert days to seconds
        notes: {
          ...notes,
          type: 'quotation',
          collection_method: collectionMethod,
          validity_days: validityPeriod
        },
        callback_url: process.env.FRONTEND_URL + '/quotations/callback',
        callback_method: 'get'
      };

      const paymentLink = await razorpayInstance.paymentLink.create(paymentLinkOptions);
      
      return {
        success: true,
        quotation: {
          id: paymentLink.id,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          description: paymentLink.description,
          customer: paymentLink.customer,
          collection_method: collectionMethod,
          validity_period: validityPeriod,
          line_items: lineItems,
          status: paymentLink.status,
          short_url: paymentLink.short_url,
          created_at: paymentLink.created_at
        },
        payment_link: paymentLink,
        collection_method: collectionMethod
      };
    } catch (error) {
      console.error(`Quotation creation error for ${collectionMethod}:`, error);
      return {
        success: false,
        error: error.message,
        collection_method: collectionMethod
      };
    }
  }

  // Create a payment link
  async createPaymentLink({
    amount,
    currency = 'INR',
    description,
    customer,
    notify = { sms: true, email: true },
    reminder_enable = true,
    callback_url,
    callback_method = 'get',
  }) {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const options = {
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        description,
        customer,
        notify,
        reminder_enable,
        callback_url,
        callback_method,
      };

      const paymentLink = await this.razorpay.paymentLink.create(options);
      return {
        success: true,
        paymentLink,
      };
    } catch (error) {
      console.error('Razorpay payment link creation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpaySignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(webhookBody, webhookSignature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(webhookBody)
        .digest('hex');

      return expectedSignature === webhookSignature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  // Get payment details
  async getPayment(paymentId) {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment,
      };
    } catch (error) {
      console.error('Get payment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Capture payment (for manual capture)
  async capturePayment(paymentId, amount) {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const payment = await this.razorpay.payments.capture(
        paymentId,
        Math.round(amount * 100), // Amount in paise
        'INR'
      );
      return {
        success: true,
        payment,
      };
    } catch (error) {
      console.error('Payment capture error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create refund
  async createRefund(paymentId, amount, notes = {}) {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: Math.round(amount * 100), // Amount in paise
        notes,
      });
      return {
        success: true,
        refund,
      };
    } catch (error) {
      console.error('Refund creation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get all payments for an order
  async getOrderPayments(orderId) {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const payments = await this.razorpay.orders.fetchPayments(orderId);
      return {
        success: true,
        payments: payments.items,
      };
    } catch (error) {
      console.error('Get order payments error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate invoice number for CA firm
  generateInvoiceNumber(firmPrefix = 'INV', year = new Date().getFullYear()) {
    const timestamp = Date.now().toString().slice(-6);
    const yearSuffix = year.toString().slice(-2);
    return `${firmPrefix}${yearSuffix}${timestamp}`;
  }

  // Calculate GST amounts for Indian businesses
  calculateGST(amount, gstRate = 18) {
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;
    
    // For intra-state transactions
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    
    return {
      baseAmount: amount,
      gstRate,
      gstAmount,
      cgst,
      sgst,
      igst: 0, // For inter-state transactions
      totalAmount,
    };
  }

  // Format amount for display (in rupees)
  formatAmount(paiseAmount) {
    return (paiseAmount / 100).toFixed(2);
  }

  // Convert amount to paise
  toPaise(rupeeAmount) {
    return Math.round(rupeeAmount * 100);
  }
}

// Export singleton instance
export default new RazorpayService();
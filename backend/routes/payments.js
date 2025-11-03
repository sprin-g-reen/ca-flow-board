import express from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import { requireEmployeeOrAbove } from '../middleware/authorize.js';
import razorpayService from '../services/razorpayService.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Create Razorpay order for invoice payment
// @route   POST /api/payments/create-order
// @access  Private
router.post('/create-order', auth, [
  body('invoiceId').isMongoId(),
  body('amount').isNumeric().isFloat({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { invoiceId, amount } = req.body;

    // Find the invoice
    const invoice = await Invoice.findById(invoiceId)
      .populate('client', 'fullName email phone')
      .populate('firm', 'name');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Verify amount matches invoice balance
    if (Math.abs(amount - invoice.balanceAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match invoice balance'
      });
    }

    // Create Razorpay order
    const receipt = `${invoice.invoiceNumber}_${Date.now()}`;
    const notes = {
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.client._id.toString(),
      firmId: invoice.firm._id.toString(),
    };

    const orderResult = await razorpayService.createOrder(amount, 'INR', receipt, notes);

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    // Store Razorpay order ID in invoice
    invoice.razorpay.orderId = orderResult.order.id;
    await invoice.save();

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.order.id,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          dueDate: invoice.dueDate,
          client: invoice.client
        }
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create payment link for invoice
// @route   POST /api/payments/create-payment-link
// @access  Private (Employee+)
router.post('/create-payment-link', auth, requireEmployeeOrAbove, [
  body('invoiceId').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { invoiceId } = req.body;

    // Find the invoice
    const invoice = await Invoice.findById(invoiceId)
      .populate('client', 'fullName email phone')
      .populate('firm', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    // Create payment link
    const customer = {
      name: invoice.client.fullName,
      email: invoice.client.email,
      contact: invoice.client.phone || ''
    };

    const description = `Payment for Invoice ${invoice.invoiceNumber} - ${invoice.firm.name}`;
    const callbackUrl = `${process.env.FRONTEND_URL}/payment-success`;

    const linkResult = await razorpayService.createPaymentLink({
      amount: invoice.balanceAmount,
      description,
      customer,
      callback_url: callbackUrl,
    });

    if (!linkResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment link',
        error: linkResult.error
      });
    }

    // Store payment link ID in invoice
    invoice.razorpay.paymentLinkId = linkResult.paymentLink.id;
    await invoice.save();

    res.json({
      success: true,
      message: 'Payment link created successfully',
      data: {
        paymentLink: linkResult.paymentLink,
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.balanceAmount
        }
      }
    });
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Verify payment and update invoice
// @route   POST /api/payments/verify
// @access  Public (webhook)
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find invoice by Razorpay order ID
    const invoice = await Invoice.findOne({ 'razorpay.orderId': razorpay_order_id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found for this payment'
      });
    }

    // Get payment details from Razorpay
    const paymentResult = await razorpayService.getPayment(razorpay_payment_id);

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment details'
      });
    }

    const payment = paymentResult.payment;
    const paidAmount = razorpayService.formatAmount(payment.amount);

    // Update invoice with payment details
    invoice.razorpay.paymentId = razorpay_payment_id;
    invoice.razorpay.signature = razorpay_signature;
    
    // Add payment record
    invoice.payments.push({
      amount: parseFloat(paidAmount),
      date: new Date(payment.created_at * 1000),
      method: 'online',
      reference: razorpay_payment_id,
      notes: `Razorpay payment - ${payment.method}`,
      recordedBy: invoice.client
    });

    // Update paid amount and status
    invoice.paidAmount += parseFloat(paidAmount);
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    if (invoice.balanceAmount <= 0.01) {
      invoice.status = 'paid';
      invoice.paidDate = new Date();
    } else {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    res.json({
      success: true,
      message: 'Payment verified and invoice updated successfully',
      data: {
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          paidAmount: invoice.paidAmount,
          balanceAmount: invoice.balanceAmount
        }
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during payment verification'
    });
  }
});

// @desc    Handle Razorpay webhooks
// @route   POST /api/payments/webhook
// @access  Public (webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = req.body;

    // Verify webhook signature
    const isValidWebhook = razorpayService.verifyWebhookSignature(webhookBody, webhookSignature);

    if (!isValidWebhook) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = JSON.parse(webhookBody);
    console.log('Razorpay webhook received:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'refund.created':
        await handleRefundCreated(event.payload.refund.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// Helper function to handle payment captured
async function handlePaymentCaptured(payment) {
  try {
    const invoice = await Invoice.findOne({ 'razorpay.orderId': payment.order_id });
    if (invoice && !invoice.razorpay.paymentId) {
      invoice.razorpay.paymentId = payment.id;
      await invoice.save();
      console.log(`Payment captured for invoice ${invoice.invoiceNumber}`);
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

// Helper function to handle payment failed
async function handlePaymentFailed(payment) {
  try {
    console.log(`Payment failed for order ${payment.order_id}:`, payment.error_description);
    // Add logic to notify client or update invoice status if needed
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Helper function to handle refund created
async function handleRefundCreated(refund) {
  try {
    const invoice = await Invoice.findOne({ 'razorpay.paymentId': refund.payment_id });
    if (invoice) {
      const refundAmount = razorpayService.formatAmount(refund.amount);
      // Add logic to update invoice with refund information
      console.log(`Refund created for invoice ${invoice.invoiceNumber}: ₹${refundAmount}`);
    }
  } catch (error) {
    console.error('Error handling refund created:', error);
  }
}

// @desc    Get payment configuration for frontend
// @route   GET /api/payments/config
// @access  Private
router.get('/config', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      currency: 'INR',
      enabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    }
  });
});

export default router;
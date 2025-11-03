import express from 'express';
import auth from '../middleware/auth.js';
import Invoice from '../models/Invoice.js';
import RazorpayService from '../services/razorpayService.js';

const router = express.Router();

// @desc    Get invoices with filtering and sorting
// @route   GET /api/invoices
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      search, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 10 
    } = req.query;

    // Build query
    const query = { firm: req.user.firmId._id };

    // Add search filter
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const invoices = await Invoice.find(query)
      .populate('client', 'name email phone')
      .populate('createdBy', 'fullName email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      firm: req.user.firmId._id
    })
      .populate('client', 'name email phone address')
      .populate('createdBy', 'fullName email')
      .populate('items.task', 'title taskId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { collectionMethod, type, ...invoiceBody } = req.body;
    
    const invoiceData = {
      ...invoiceBody,
      type: type || 'invoice',
      collectionMethod: collectionMethod || 'account_1',
      firm: req.user.firmId._id,
      createdBy: req.user._id
    };

    const invoice = await Invoice.create(invoiceData);

    // Populate the created invoice
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name email phone')
      .populate('createdBy', 'fullName email');

    // Handle Razorpay integration for quotations
    let razorpayResult = null;
    if (type === 'quotation' && populatedInvoice.client) {
      try {
        const customerData = {
          name: populatedInvoice.client.name,
          email: populatedInvoice.client.email,
          phone: populatedInvoice.client.phone
        };

        const lineItems = populatedInvoice.items?.map(item => ({
          name: item.description,
          amount: item.amount * 100, // Convert to paise
          currency: 'INR'
        })) || [];

        razorpayResult = await RazorpayService.createQuotation({
          amount: populatedInvoice.totalAmount,
          description: `Quotation #${populatedInvoice.invoiceNumber}`,
          customer: customerData,
          collectionMethod: collectionMethod || 'account_1',
          validityPeriod: 30,
          lineItems,
          notes: {
            invoice_id: invoice._id.toString(),
            firm_id: req.user.firmId._id.toString()
          }
        });

        // Update invoice with Razorpay data if successful
        if (razorpayResult.success && razorpayResult.payment_link) {
          populatedInvoice.razorpayData = {
            paymentLinkId: razorpayResult.quotation.id,
            shortUrl: razorpayResult.quotation.short_url,
            collectionMethod: collectionMethod
          };
          await populatedInvoice.save();
        }
      } catch (razorpayError) {
        console.error('Razorpay quotation creation error:', razorpayError);
        // Don't fail the invoice creation if Razorpay fails
      }
    }

    res.status(201).json({
      success: true,
      data: populatedInvoice,
      razorpay: razorpayResult,
      message: type === 'quotation' 
        ? 'Quotation created successfully' + (razorpayResult?.success ? ' with payment link' : '')
        : 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, firm: req.user.firmId._id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('client', 'name email phone')
      .populate('createdBy', 'fullName email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      firm: req.user.firmId._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
// @access  Private
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, firm: req.user.firmId._id },
      { status },
      { new: true, runValidators: true }
    )
      .populate('client', 'name email phone')
      .populate('createdBy', 'fullName email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice status updated successfully'
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Add payment to invoice
// @route   POST /api/invoices/:id/payments
// @access  Private
router.post('/:id/payments', auth, async (req, res) => {
  try {
    const { amount, method, reference, notes } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      firm: req.user.firmId._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Add payment
    invoice.payments.push({
      amount,
      method,
      reference,
      notes,
      recordedBy: req.user._id
    });

    // Update paid amount
    invoice.paidAmount += amount;

    await invoice.save();

    // Populate and return updated invoice
    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name email phone')
      .populate('createdBy', 'fullName email')
      .populate('payments.recordedBy', 'fullName email');

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Bulk delete invoices
// @route   POST /api/invoices/bulk-delete
// @access  Private
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide invoice IDs to delete'
      });
    }

    // Delete invoices that belong to the user's firm
    const result = await Invoice.deleteMany({
      _id: { $in: invoiceIds },
      firm: req.user.firmId._id
    });

    res.json({
      success: true,
      message: `${result.deletedCount} invoice(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Bulk update invoice status
// @route   POST /api/invoices/bulk-status
// @access  Private
router.post('/bulk-status', auth, async (req, res) => {
  try {
    const { invoiceIds, status } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide invoice IDs to update'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status to update'
      });
    }

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'partially_paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Update invoices that belong to the user's firm
    const result = await Invoice.updateMany(
      {
        _id: { $in: invoiceIds },
        firm: req.user.firmId._id
      },
      { 
        status,
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} invoice(s) updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
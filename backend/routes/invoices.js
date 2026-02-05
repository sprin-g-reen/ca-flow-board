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
      if (status === 'amount_not_filled') {
        // Filter invoices where totalAmount is 0 or not set
        query.$or = [
          { totalAmount: 0 },
          { totalAmount: { $exists: false } },
          { totalAmount: null }
        ];
      } else {
        query.status = status;
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const invoices = await Invoice.find(query)
      .populate({
        path: 'client',
        select: 'fullName name email phone',
        // Use fullName as the primary name field, fallback to name
      })
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
      .populate({
        path: 'client',
        select: 'fullName name email phone address'
      })
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

// @desc    Get last invoice pricing for same client and task
// @route   GET /api/invoices/last-pricing/:clientId/:taskId
// @access  Private
router.get('/last-pricing/:clientId/:taskId', auth, async (req, res) => {
  try {
    const { clientId, taskId } = req.params;

    // Find the most recent invoice for this client with an item linked to this task
    const lastInvoice = await Invoice.findOne({
      firm: req.user.firmId._id,
      client: clientId,
      'items.task': taskId,
      status: { $in: ['sent', 'paid', 'partially_paid', 'overdue'] } // Only consider finalized invoices
    })
      .sort({ createdAt: -1 }) // Most recent first
      .select('items invoiceNumber createdAt');

    if (!lastInvoice) {
      return res.json({
        success: true,
        data: null,
        message: 'No previous invoice found for this client and task'
      });
    }

    // Find the specific item(s) related to the task
    const taskItems = lastInvoice.items.filter(
      item => item.task && item.task.toString() === taskId
    );

    if (taskItems.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No pricing data found for this task in previous invoices'
      });
    }

    // Return the pricing information
    res.json({
      success: true,
      data: {
        invoiceNumber: lastInvoice.invoiceNumber,
        invoiceDate: lastInvoice.createdAt,
        items: taskItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          taxable: item.taxable,
          hsn: item.hsn,
          taxRate: item.taxRate
        }))
      },
      message: 'Previous pricing fetched successfully'
    });
  } catch (error) {
    console.error('Get last pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get last invoice pricing for client (without specific task)
// @route   GET /api/invoices/last-pricing/:clientId
// @access  Private
router.get('/last-pricing/:clientId', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { category, subCategory } = req.query;

    // Build query
    const query = {
      firm: req.user.firmId._id,
      client: clientId,
      status: { $in: ['sent', 'paid', 'partially_paid', 'overdue'] }
    };

    // Find the most recent invoice for this client
    const lastInvoice = await Invoice.findOne(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.task',
        select: 'title category sub_category'
      })
      .select('items invoiceNumber createdAt');

    if (!lastInvoice) {
      return res.json({
        success: true,
        data: null,
        message: 'No previous invoice found for this client'
      });
    }

    // If category filter is provided, filter items by task category
    let filteredItems = lastInvoice.items;
    if (category) {
      filteredItems = lastInvoice.items.filter(item => {
        if (!item.task) return false;
        if (item.task.category !== category) return false;
        if (subCategory && item.task.sub_category !== subCategory) return false;
        return true;
      });
    }

    if (filteredItems.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No matching pricing data found in previous invoices'
      });
    }

    res.json({
      success: true,
      data: {
        invoiceNumber: lastInvoice.invoiceNumber,
        invoiceDate: lastInvoice.createdAt,
        items: filteredItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          taxable: item.taxable,
          hsn: item.hsn,
          taxRate: item.taxRate,
          taskInfo: item.task ? {
            title: item.task.title,
            category: item.task.category,
            subCategory: item.task.sub_category
          } : null
        }))
      },
      message: 'Previous pricing fetched successfully'
    });
  } catch (error) {
    console.error('Get last pricing error:', error);
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
  console.log('📝 Creating new invoice:', { type: req.body.type, client: req.body.client });
  try {
    const { collectionMethod, type, client, ...invoiceBody } = req.body;
    
    if (!client) {
      console.log('❌ Validation failed: Client is missing');
      return res.status(400).json({
        success: false,
        message: 'Client is required to create an invoice'
      });
    }

    // Calculate subtotal if not provided
    let subtotal = invoiceBody.subtotal || 0;
    if (!subtotal && invoiceBody.items && Array.isArray(invoiceBody.items)) {
      subtotal = invoiceBody.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (invoiceBody.discount) {
      if (invoiceBody.discount.type === 'percentage') {
        discountAmount = (subtotal * (invoiceBody.discount.value || 0)) / 100;
      } else {
        discountAmount = invoiceBody.discount.value || 0;
      }
    }

    const discountedAmount = subtotal - discountAmount;

    // Calculate tax
    let taxAmount = invoiceBody.taxAmount || 0;
    if (!taxAmount && invoiceBody.items && Array.isArray(invoiceBody.items)) {
      taxAmount = invoiceBody.items.reduce((sum, item) => {
        if (item.taxable) {
          return sum + ((item.amount || 0) * (item.taxRate || 18)) / 100;
        }
        return sum;
      }, 0);
    }

    // Calculate total
    const totalAmount = invoiceBody.totalAmount || (discountedAmount + taxAmount);

    const invoiceData = {
      ...invoiceBody,
      client,
      type: type || 'invoice',
      collectionMethod: collectionMethod || 'account_1',
      firm: req.user.firmId._id,
      createdBy: req.user._id,
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount: invoiceBody.paidAmount || 0,
      balanceAmount: totalAmount - (invoiceBody.paidAmount || 0),
      discount: {
        type: invoiceBody.discount?.type || 'percentage',
        value: invoiceBody.discount?.value || 0,
        amount: discountAmount
      }
    };

    console.log('💾 Saving invoice to database...');
    const invoice = await Invoice.create(invoiceData);
    console.log('✅ Invoice saved:', invoice._id);

    // Populate the created invoice
    console.log('🔍 Populating invoice data...');
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate({
        path: 'client',
        select: 'fullName name email phone'
      })
      .populate('createdBy', 'fullName email');

    // Handle Razorpay integration for quotations
    let razorpayResult = null;
    if (type === 'quotation' && populatedInvoice.client) {
      console.log('💳 Initializing Razorpay quotation...');
      try {
        const customerData = {
          name: populatedInvoice.client.name || populatedInvoice.client.fullName,
          email: populatedInvoice.client.email,
          phone: populatedInvoice.client.phone || '0000000000'
        };

        const lineItems = populatedInvoice.items?.map(item => ({
          name: item.title || item.description,
          amount: Math.round(item.amount * 100), // Convert to paise
          currency: 'INR'
        })) || [];

        console.log('📡 Calling Razorpay API...');
        razorpayResult = await callRazorpayWithTimeout(
          RazorpayService.createQuotation({
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
          })
        );
        console.log('✅ Razorpay API responded:', razorpayResult.success ? 'SUCCESS' : 'FAILED');

        // Update invoice with Razorpay data if successful
        if (razorpayResult.success && razorpayResult.payment_link) {
          populatedInvoice.razorpayData = {
            paymentLinkId: razorpayResult.quotation.id,
            shortUrl: razorpayResult.quotation.short_url,
            collectionMethod: collectionMethod
          };
          await populatedInvoice.save();
          console.log('💾 Updated invoice with Razorpay data');
        }
      } catch (razorpayError) {
        console.error('❌ Razorpay quotation creation error:', razorpayError.message);
        // Don't fail the invoice creation if Razorpay fails
      }
    }

    console.log('🚀 Sending success response');
    res.status(201).json({
      success: true,
      data: populatedInvoice,
      razorpay: razorpayResult,
      message: type === 'quotation' 
        ? 'Quotation created successfully' + (razorpayResult?.success ? ' with payment link' : '')
        : 'Invoice created successfully'
    });
  } catch (error) {
    console.error('❌ Create invoice error:', error.message);
    
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error: ' + messages.join(', '),
        error: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      error: error.message
    });
  }
});

// Helper to call Razorpay with a timeout
const callRazorpayWithTimeout = async (task, timeoutMs = 10000) => {
  return Promise.race([
    task,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Razorpay API timeout')), timeoutMs)
    )
  ]);
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  console.log('📝 Updating invoice:', req.params.id);
  try {
    const { type, collectionMethod, client } = req.body;
    
    // Remove immutable fields
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.invoiceNumber;
    delete updateData.firm;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Basic validation
    if (client === '') {
      return res.status(400).json({
        success: false,
        message: 'Client cannot be empty'
      });
    }

    console.log('💾 Updating database record...');
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, firm: req.user.firmId._id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'client',
        select: 'fullName name email phone'
      })
      .populate('createdBy', 'fullName email');

    if (!invoice) {
      console.log('❌ Invoice not found');
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or unauthorized'
      });
    }

    // Handle Razorpay link generation if it's a quotation and status is 'sent'
    let razorpayResult = null;
    if (invoice.type === 'quotation' && req.body.status === 'sent' && !invoice.razorpayData?.paymentLinkId) {
      console.log('💳 Generating Razorpay link for updated quotation...');
      try {
        const customerData = {
          name: invoice.client.fullName || invoice.client.name || 'Client',
          email: invoice.client.email,
          phone: invoice.client.phone || '0000000000' // Razorpay requires a contact
        };

        const lineItems = invoice.items?.map(item => ({
          name: item.title || item.description,
          amount: Math.round(item.amount * 100),
          currency: 'INR'
        })) || [];

        razorpayResult = await callRazorpayWithTimeout(
          RazorpayService.createQuotation({
            amount: invoice.totalAmount,
            description: `Quotation #${invoice.invoiceNumber}`,
            customer: customerData,
            collectionMethod: invoice.collectionMethod || 'account_1',
            validityPeriod: 30,
            lineItems,
            notes: {
              invoice_id: invoice._id.toString(),
              firm_id: req.user.firmId._id.toString(),
              updated: 'true'
            }
          })
        );

        if (razorpayResult.success && razorpayResult.payment_link) {
          invoice.razorpayData = {
            paymentLinkId: razorpayResult.quotation.id,
            shortUrl: razorpayResult.quotation.short_url,
            collectionMethod: invoice.collectionMethod
          };
          await invoice.save();
          console.log('✅ Updated with Razorpay link');
        }
      } catch (err) {
        console.error('⚠️ Razorpay integration skipped/failed during update:', err.message);
      }
    }

    console.log('🚀 Sending success response');
    res.json({
      success: true,
      data: invoice,
      razorpay: razorpayResult,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('❌ Update invoice error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error: ' + messages.join(', '),
        error: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
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
      .populate({
        path: 'client',
        select: 'fullName name email phone'
      })
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
      .populate({
        path: 'client',
        select: 'fullName name email phone'
      })
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
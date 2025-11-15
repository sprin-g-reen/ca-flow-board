import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import auth from '../middleware/auth.js';
import Task from '../models/Task.js';
import TaskTemplate from '../models/TaskTemplate.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

// Configure multer for task document uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'task-documents');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `task-doc-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/rtf'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, images, and text files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, assignedTo, client, page = 1, limit = 20, includeArchived = false, search } = req.query;
    
    // Build filter
    const filter = { firm: req.user.firmId._id };
    
    // Exclude archived tasks by default unless explicitly requested
    if (includeArchived !== 'true') {
      filter.isArchived = { $ne: true };
    }
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (client) filter.client = client;

    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'fullName email')
      .populate('collaborators', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .populate('client', 'name email phone gstNumber')
      .populate('firm', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
router.post('/', auth, [
  body('title').notEmpty().withMessage('Task title is required'),
  body('category').notEmpty().withMessage('Task category is required'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
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

    const {
      title,
      description,
      category,
      priority,
      client_id,
      assigned_to,
      collaborators,
      due_date,
      is_payable_task,
      price,
      payable_task_type,
      template_id,
      is_recurring,
      recurrence_pattern,
      subtasks
    } = req.body;

    // Map frontend category to backend type
    const typeMapping = {
      'gst': 'gst_filing',
      'itr': 'income_tax_return',
      'roc': 'compliance',
      'other': 'other'
    };

    const taskData = {
      title,
      description: description || '',
      type: typeMapping[category] || 'other',
      priority,
      status: 'todo', // Changed from 'pending' to 'todo'
      dueDate: due_date ? new Date(due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      assignedBy: req.user._id,
      firm: req.user.firmId._id,
      billable: is_payable_task || false,
      isRecurring: is_recurring || false
    };

    // Add optional fields
    if (client_id && client_id !== 'none') {
      taskData.client = client_id;
    }
    // If no client specified, leave client field undefined (optional)

    // Handle assignedTo - validate and assign first person
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      const firstAssignee = assigned_to[0];
      // Validate that it's a valid ObjectId and not 'none'
      if (firstAssignee && firstAssignee !== 'none' && /^[0-9a-fA-F]{24}$/.test(firstAssignee)) {
        taskData.assignedTo = firstAssignee;
        console.log('✅ Assigned task to:', firstAssignee);
      } else {
        console.log('⚠️ Invalid assignee ID:', firstAssignee);
      }
    }

    // Handle collaborators - everyone after the first assignee
    if (collaborators && Array.isArray(collaborators) && collaborators.length > 0) {
      // Filter out any 'none' values and validate ObjectIds
      const validCollaborators = collaborators.filter(id => 
        id && id !== 'none' && /^[0-9a-fA-F]{24}$/.test(id)
      );
      if (validCollaborators.length > 0) {
        taskData.collaborators = validCollaborators;
        console.log('✅ Added collaborators:', validCollaborators);
      }
    }

    if (price) {
      taskData.fixedPrice = price;
    }

    if (template_id && template_id !== 'none' && template_id !== '') {
      // Only set template if it's a valid ObjectId format (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(template_id)) {
        taskData.template = template_id;
      }
      // If template_id is not a valid ObjectId, we'll skip it (it might be a frontend-only template)
    }

    // Handle recurring pattern
    if (is_recurring && recurrence_pattern) {
      taskData.recurringPattern = {
        frequency: recurrence_pattern,
        interval: 1
      };
    }

    // Add custom fields for subtasks (since the model doesn't have a subtasks field, we'll store in customFields)
    if (subtasks && subtasks.length > 0) {
      taskData.customFields = new Map();
      taskData.customFields.set('subtasks', subtasks);
    }

    const task = await Task.create(taskData);
    
    // Populate the created task
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'fullName email')
      .populate('collaborators', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .populate('client', 'name email phone gstNumber')
      .populate('firm', 'name');

    // ============ AUTO QUOTE DRAFT CREATION ============
    // If this is a payable task, automatically create a quote draft
    if (is_payable_task && price && price > 0) {
      try {
        console.log('💰 Creating quote draft for payable task:', populatedTask.title);
        
        // Import Invoice model
        const Invoice = (await import('../models/Invoice.js')).default;
        
        // Calculate items - main task + subtasks
        const invoiceItems = [{
          description: title + (description ? ` - ${description}` : ''),
          quantity: 1,
          rate: price,
          amount: price,
          taxable: true,
          taxRate: 18,
          task: task._id
        }];

        // Add subtasks as line items if they exist
        if (subtasks && subtasks.length > 0) {
          subtasks.forEach((subtask, index) => {
            invoiceItems.push({
              description: `  └─ ${subtask.title}${subtask.description ? `: ${subtask.description}` : ''}`,
              quantity: 1,
              rate: 0, // Subtasks are included in main price
              amount: 0,
              taxable: false,
              taxRate: 0,
              order: index + 1
            });
          });
        }

        // Calculate totals
        const subtotal = price;
        const taxAmount = (price * 18) / 100; // 18% GST
        const totalAmount = subtotal + taxAmount;

        // Generate invoice number
        const invoiceCount = await Invoice.countDocuments({ firm: req.user.firmId._id });
        const invoiceNumber = `QD-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

        // Create quote draft
        const quoteDraft = await Invoice.create({
          invoiceNumber,
          invoiceDate: new Date(),
          type: 'quote_draft',
          status: 'quote_draft',
          client: taskData.client,
          relatedTask: task._id,
          firm: req.user.firmId._id,
          createdBy: req.user._id,
          
          items: invoiceItems,
          subtotal,
          taxAmount,
          totalAmount,
          
          dueDate: taskData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentTerms: 'Net 30',
          notes: `Quote draft for task: ${title}${description ? '\n' + description : ''}`,
          
          gst: {
            applicable: true,
            rate: 18,
            cgst: (taxAmount / 2),
            sgst: (taxAmount / 2),
            igst: 0
          },
          
          adminApproval: {
            status: 'pending'
          }
        });

        console.log('✅ Quote draft created successfully:', quoteDraft.invoiceNumber);
        console.log('   Quote ID:', quoteDraft._id);
        console.log('   Amount: ₹', totalAmount);
        
        // Link invoice to task (if Task model has linkedInvoice field)
        // Uncomment when Task model is updated
        // task.linkedInvoice = quoteDraft._id;
        // await task.save();

      } catch (invoiceError) {
        console.error('❌ Failed to create quote draft:', invoiceError);
        // Don't fail the task creation if invoice creation fails
        // Log the error and continue
      }
    }
    // ============ END AUTO QUOTE DRAFT CREATION ============

    // ============ REAL-TIME WEBSOCKET BROADCAST ============
    // Broadcast new task to all connected clients in the same firm
    try {
      const taskWS = req.app.get('taskWS');
      if (taskWS) {
        taskWS.broadcastTaskUpdate(populatedTask, 'create', req.user._id.toString());
      }
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError);
      // Don't fail the request if WebSocket broadcast fails
    }
    // ============ END WEBSOCKET BROADCAST ============

    // Send notification to assigned user
    if (populatedTask.assignedTo && populatedTask.assignedTo._id.toString() !== req.user._id.toString()) {
      try {
        await NotificationService.notifyTaskAssignment(
          populatedTask._id,
          populatedTask.assignedTo._id,
          req.user._id,
          {
            title: populatedTask.title,
            description: populatedTask.description,
            priority: populatedTask.priority,
            dueDate: populatedTask.dueDate,
            category: populatedTask.type
          }
        );
      } catch (notificationError) {
        console.error('Error sending task assignment notification:', notificationError);
        // Don't fail the task creation if notification fails
      }
    }

    // Send notifications to collaborators
    if (populatedTask.collaborators && populatedTask.collaborators.length > 0) {
      for (const collaborator of populatedTask.collaborators) {
        if (collaborator._id.toString() !== req.user._id.toString()) {
          try {
            await NotificationService.createNotification({
              recipientId: collaborator._id,
              senderId: req.user._id,
              type: 'task_assigned',
              title: `Added as collaborator: ${populatedTask.title}`,
              message: `You have been added as a collaborator to task: ${populatedTask.title}`,
              relatedEntity: {
                entityType: 'Task',
                entityId: populatedTask._id
              },
              priority: populatedTask.priority,
              metadata: {
                taskId: populatedTask._id,
                dueDate: populatedTask.dueDate,
                category: populatedTask.type
              }
            });
          } catch (notificationError) {
            console.error('Error sending collaborator notification:', notificationError);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: populatedTask }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'fullName email')
      .populate('collaborators', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .populate('client', 'name email phone gstNumber')
      .populate('firm', 'name');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only allow updating if user is assigned to task, assigned by user, or is admin/owner
    const canUpdate = task.assignedTo?.toString() === req.user._id.toString() ||
                     task.assignedBy?.toString() === req.user._id.toString() ||
                     ['admin', 'owner', 'superadmin'].includes(req.user.role);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Log the update request for debugging
    console.log('Task update request:', {
      taskId: req.params.id,
      updates: req.body,
      userId: req.user._id
    });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'fullName email')
     .populate('collaborators', 'fullName email')
     .populate('assignedBy', 'fullName email')
     .populate('client', 'fullName email companyName')
     .populate('firm', 'name');

    console.log('Task updated successfully:', {
      taskId: updatedTask._id,
      assignedTo: updatedTask.assignedTo,
      collaborators: updatedTask.collaborators
    });

    // ============ REAL-TIME WEBSOCKET BROADCAST ============
    // Broadcast task update to all connected clients in the same firm
    try {
      const taskWS = req.app.get('taskWS');
      if (taskWS) {
        const action = req.body.status && req.body.status !== task.status ? 'status_change' : 'update';
        taskWS.broadcastTaskUpdate(updatedTask, action, req.user._id.toString());
      }
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError);
      // Don't fail the request if WebSocket broadcast fails
    }
    // ============ END WEBSOCKET BROADCAST ============

    // Send notifications for task updates (only for status changes to avoid spam)
    if (req.body.status && req.body.status !== task.status) {
      const oldStatus = task.status;
      const newStatus = req.body.status;
      
      // Notify task completion
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        // Notify the person who assigned the task
        if (updatedTask.assignedBy && updatedTask.assignedBy._id.toString() !== req.user._id.toString()) {
          try {
            await NotificationService.notifyTaskCompletion(
              updatedTask._id,
              updatedTask.assignedBy._id,
              req.user._id,
              {
                title: updatedTask.title
              }
            );
          } catch (notificationError) {
            console.error('Error sending task completion notification:', notificationError);
          }
        }

        // ============ QUOTE DRAFT → QUOTE READY WORKFLOW ============
        // Check if this task has a related quote draft
        try {
          const Invoice = (await import('../models/Invoice.js')).default;
          const User = (await import('../models/User.js')).default;
          const emailService = (await import('../services/emailService.js')).default;
          
          const quoteDraft = await Invoice.findOne({
            relatedTask: updatedTask._id,
            type: 'quote_draft'
          }).populate('client', 'name email phone');

          if (quoteDraft) {
            console.log('📋 Found quote draft for completed task:', quoteDraft.invoiceNumber);
            
            // Generate Razorpay payment link
            const razorpayService = (await import('../services/razorpayService.js')).default;
            
            const paymentLink = await razorpayService.createQuotation({
              amount: quoteDraft.totalAmount,
              currency: 'INR',
              description: `Payment for ${updatedTask.title}`,
              customer: {
                name: quoteDraft.client.name,
                email: quoteDraft.client.email,
                contact: quoteDraft.client.phone
              },
              notify: {
                sms: false,
                email: false // We'll send our own email
              },
              reminder_enable: false,
              notes: {
                taskId: updatedTask._id.toString(),
                quoteId: quoteDraft._id.toString(),
                client: quoteDraft.client.name
              },
              callback_url: `${process.env.FRONTEND_URL}/payment/success`,
              callback_method: 'get'
            });

            console.log('💳 Payment link generated:', paymentLink.short_url);

            // Update quote status: draft → ready
            quoteDraft.type = 'quote_ready';
            quoteDraft.status = 'quote_ready';
            quoteDraft.adminApproval.status = 'pending';
            quoteDraft.razorpayData = {
              paymentLinkId: paymentLink.id,
              orderId: paymentLink.order_id,
              shortUrl: paymentLink.short_url,
              collectionMethod: updatedTask.billable ? 'account_1' : 'default',
              status: 'created',
              createdAt: new Date()
            };
            await quoteDraft.save();

            console.log('✅ Quote status updated: draft → ready');

            // Find admin/owner to notify
            const admin = await User.findOne({
              firm: req.user.firmId._id,
              role: { $in: ['owner', 'admin'] }
            }).sort({ role: 1 }); // Owner first, then admin

            if (admin) {
              // Send email notification to admin
              const emailResult = await emailService.sendQuoteReadyForApproval({
                adminEmail: admin.email,
                adminName: admin.fullName || admin.email,
                taskTitle: updatedTask.title,
                clientName: quoteDraft.client.name,
                quoteNumber: quoteDraft.invoiceNumber,
                quoteAmount: quoteDraft.totalAmount,
                quoteId: quoteDraft._id.toString(),
                taskId: updatedTask._id.toString()
              });

              if (emailResult.success) {
                console.log('📧 Admin approval email sent successfully');
              } else if (!emailResult.skipped) {
                console.error('📧 Failed to send admin email:', emailResult.error);
              }

              // Create in-app notification
              try {
                const Notification = (await import('../models/Notification.js')).default;
                await Notification.create({
                  recipient: admin._id,
                  sender: req.user._id,
                  type: 'quote_ready',
                  title: 'Quote Ready for Approval',
                  message: `Task "${updatedTask.title}" completed. Quote ready for approval - ₹${quoteDraft.totalAmount.toLocaleString('en-IN')}`,
                  relatedEntity: {
                    entityType: 'Invoice',
                    entityId: quoteDraft._id
                  },
                  priority: 'high',
                  metadata: {
                    quoteId: quoteDraft._id,
                    taskId: updatedTask._id,
                    amount: quoteDraft.totalAmount,
                    clientName: quoteDraft.client.name
                  }
                });
                console.log('🔔 In-app notification created for admin');
              } catch (notifError) {
                console.error('Failed to create in-app notification:', notifError);
              }
            }

            console.log('🎉 Quote workflow completed successfully!');
          } else {
            console.log('ℹ️  No quote draft found for this task (might not be a payable task)');
          }
        } catch (invoiceWorkflowError) {
          console.error('❌ Quote workflow error:', invoiceWorkflowError);
          // Don't fail the task update if invoice workflow fails
        }
        // ============ END QUOTE WORKFLOW ============
      }
      
      // Notify status updates to assigned user and collaborators
      const recipients = [];
      if (updatedTask.assignedTo && updatedTask.assignedTo._id.toString() !== req.user._id.toString()) {
        recipients.push(updatedTask.assignedTo._id);
      }
      if (updatedTask.collaborators) {
        updatedTask.collaborators.forEach(collaborator => {
          if (collaborator._id.toString() !== req.user._id.toString()) {
            recipients.push(collaborator._id);
          }
        });
      }

      // Send update notifications to all recipients
      for (const recipientId of [...new Set(recipients)]) { // Remove duplicates
        try {
          await NotificationService.notifyTaskUpdate(
            updatedTask._id,
            recipientId,
            req.user._id,
            `status changed from "${oldStatus}" to "${newStatus}"`,
            {
              title: updatedTask.title,
              dueDate: updatedTask.dueDate
            }
          );
        } catch (notificationError) {
          console.error('Error sending task update notification:', notificationError);
        }
      }
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('firm', 'name');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only allow deletion if user is admin/owner or assigned by user
    const canDelete = task.assignedBy?.toString() === req.user._id.toString() ||
                     ['admin', 'owner', 'superadmin'].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    // ============ REAL-TIME WEBSOCKET BROADCAST ============
    // Broadcast task deletion to all connected clients in the same firm
    try {
      const taskWS = req.app.get('taskWS');
      if (taskWS) {
        taskWS.broadcastTaskUpdate({ ...task.toObject(), _id: req.params.id }, 'delete', req.user._id.toString());
      }
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError);
      // Don't fail the request if WebSocket broadcast fails
    }
    // ============ END WEBSOCKET BROADCAST ============

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Archive/Unarchive task
// @route   PUT /api/tasks/:id/archive
// @access  Private
router.put('/:id/archive', auth, async (req, res) => {
  try {
    const { isArchived = true } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only allow archiving if user is admin/owner or assigned by user
    const canArchive = task.assignedBy?.toString() === req.user._id.toString() ||
                      ['admin', 'owner', 'superadmin'].includes(req.user.role);

    if (!canArchive) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to archive this task'
      });
    }

    // Update archive status
    task.isArchived = isArchived;
    if (isArchived) {
      task.archivedAt = new Date();
      task.archivedBy = req.user._id;
    } else {
      task.archivedAt = undefined;
      task.archivedBy = undefined;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'fullName email')
      .populate('collaborators', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .populate('client', 'fullName email companyName')
      .populate('archivedBy', 'fullName email');

    res.json({
      success: true,
      data: populatedTask,
      message: `Task ${isArchived ? 'archived' : 'unarchived'} successfully`
    });
  } catch (error) {
    console.error('Archive task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get recurring schedules (placeholder)
// @route   GET /api/tasks/recurring-schedules
// @access  Private
router.get('/recurring-schedules', auth, async (req, res) => {
  try {
    // For now, return empty array as this feature is not fully implemented
    res.json({
      success: true,
      data: [],
      message: 'Recurring schedules retrieved successfully'
    });
  } catch (error) {
    console.error('Get recurring schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Generate recurring tasks (actual implementation)
// @route   POST /api/tasks/generate-recurring
// @access  Private
router.post('/generate-recurring', auth, async (req, res) => {
  try {
    console.log('🔄 Starting recurring task generation...');
    
    // Find all active recurring templates for this firm
    const recurringTemplates = await TaskTemplate.find({
      firm: req.user.firmId._id,
      is_recurring: true,
      is_active: true,
      is_deleted: false
    }).populate('assigned_employee_id', 'fullName email employee_id')
      .populate('client_id', 'name email');

    console.log(`📋 Found ${recurringTemplates.length} recurring templates`);

    if (recurringTemplates.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No recurring templates found'
      });
    }

    const generatedTasks = [];
    const currentDate = new Date();

    for (const template of recurringTemplates) {
      console.log(`⚙️ Processing template: ${template.title} (${template.recurrence_pattern})`);
      
      // Check if we should generate a task based on recurrence pattern
      let shouldGenerate = false;
      let dueDate = new Date();
      
      if (template.recurrence_pattern === 'monthly') {
        // For monthly tasks, check if we're in a new month
        // For demo purposes, we'll generate if no task exists this month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Check if task already exists for this month
        const existingTask = await Task.findOne({
          template: template._id,
          firm: req.user.firmId._id,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
        
        if (!existingTask) {
          shouldGenerate = true;
          // Set due date to end of current month
          dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        }
      } else if (template.recurrence_pattern === 'yearly') {
        // For yearly tasks, check if we're in a new year
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
        
        const existingTask = await Task.findOne({
          template: template._id,
          firm: req.user.firmId._id,
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        });
        
        if (!existingTask) {
          shouldGenerate = true;
          // Set due date based on template category
          if (template.category === 'itr') {
            dueDate = new Date(currentDate.getFullYear(), 6, 31); // July 31st
          } else if (template.category === 'roc') {
            dueDate = new Date(currentDate.getFullYear(), 8, 30); // September 30th
          } else {
            dueDate = new Date(currentDate.getFullYear(), 11, 31); // December 31st
          }
        }
      }

      if (shouldGenerate) {
        console.log(`✅ Generating task for template: ${template.title}`);
        
        // Create task data
        const taskData = {
          title: template.title,
          description: template.description || '',
          type: template.category === 'gst' ? 'gst_filing' :
                template.category === 'itr' ? 'income_tax_return' :
                template.category === 'roc' ? 'compliance' : 'other',
          priority: 'medium',
          status: 'todo',
          dueDate: dueDate,
          assignedBy: req.user._id,
          firm: req.user.firmId._id,
          billable: template.is_payable_task || false,
          isRecurring: true,
          template: template._id,
          fixedPrice: template.price || null,
        };

        // Add assigned user if template has one, otherwise assign to the user creating the task
        if (template.assigned_employee_id) {
          taskData.assignedTo = template.assigned_employee_id._id;
        } else {
          // Assign to the user who is generating the tasks as fallback
          taskData.assignedTo = req.user._id;
        }

        // Add client if template has one
        if (template.client_id) {
          taskData.client = template.client_id._id;
        }

        // Add subtasks as custom fields
        if (template.subtasks && template.subtasks.length > 0) {
          taskData.customFields = new Map();
          taskData.customFields.set('subtasks', template.subtasks);
        }

        // Create the task
        const createdTask = await Task.create(taskData);
        
        // Populate the created task
        const populatedTask = await Task.findById(createdTask._id)
          .populate('assignedTo', 'fullName email')
          .populate('assignedBy', 'fullName email')
          .populate('client', 'name email phone gstNumber')
          .populate('template', 'title category');

        generatedTasks.push(populatedTask);
        
        // Update template usage count
        await template.incrementUsage();
        
        console.log(`✨ Created task: ${createdTask.title} (ID: ${createdTask._id})`);
      } else {
        console.log(`⏭️ Skipping template: ${template.title} (already generated for this period)`);
      }
    }

    console.log(`🎉 Task generation completed. Generated ${generatedTasks.length} tasks`);

    res.json({
      success: true,
      data: generatedTasks,
      message: `Generated ${generatedTasks.length} recurring tasks`
    });
  } catch (error) {
    console.error('❌ Generate recurring tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Bulk delete tasks
// @route   POST /api/tasks/bulk-delete
// @access  Private
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task IDs to delete'
      });
    }

    // Delete tasks that belong to the user's firm and user has permission to delete
    const result = await Task.deleteMany({
      _id: { $in: taskIds },
      firm: req.user.firmId._id,
      $or: [
        { assignedBy: req.user._id },
        { assignedTo: req.user._id }
      ]
    });

    res.json({
      success: true,
      message: `${result.deletedCount} task(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Bulk update task status
// @route   POST /api/tasks/bulk-status
// @access  Private
router.post('/bulk-status', auth, async (req, res) => {
  try {
    const { taskIds, status } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task IDs to update'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status to update'
      });
    }

    const validStatuses = ['todo', 'inprogress', 'review', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Update tasks that belong to the user's firm and user has permission to modify
    const updateData = { 
      status,
      updatedAt: new Date()
    };

    // If marking as completed, set completion date
    if (status === 'completed') {
      updateData.completedDate = new Date();
      updateData.progressPercentage = 100;
    } else {
      updateData.completedDate = null;
    }

    const result = await Task.updateMany(
      {
        _id: { $in: taskIds },
        firm: req.user.firmId._id,
        $or: [
          { assignedBy: req.user._id },
          { assignedTo: req.user._id }
        ]
      },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} task(s) updated successfully`,
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

// @desc    Bulk assign tasks
// @route   POST /api/tasks/bulk-assign
// @access  Private
router.post('/bulk-assign', auth, async (req, res) => {
  try {
    const { taskIds, assignedTo } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task IDs to assign'
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user ID to assign tasks to'
      });
    }

    // Update tasks that belong to the user's firm and user has permission to assign
    const result = await Task.updateMany(
      {
        _id: { $in: taskIds },
        firm: req.user.firmId._id,
        $or: [
          { assignedBy: req.user._id },
          { assignedTo: req.user._id },
          // Allow owners and admins to bulk assign any task
          ...((['owner', 'admin', 'superadmin'].includes(req.user.role)) ? [{}] : [])
        ]
      },
      { 
        assignedTo,
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} task(s) assigned successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk assign tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Bulk archive tasks
// @route   POST /api/tasks/bulk-archive
// @access  Private
router.post('/bulk-archive', auth, async (req, res) => {
  try {
    const { taskIds, isArchived = true } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task IDs to archive'
      });
    }

    const updateData = {
      isArchived,
      updatedAt: new Date()
    };

    if (isArchived) {
      updateData.archivedAt = new Date();
      updateData.archivedBy = req.user._id;
    } else {
      updateData.archivedAt = null;
      updateData.archivedBy = null;
    }

    // Update tasks that belong to the user's firm and user has permission to archive
    const result = await Task.updateMany(
      {
        _id: { $in: taskIds },
        firm: req.user.firmId._id,
        $or: [
          { assignedBy: req.user._id },
          // Allow owners and admins to bulk archive any task
          ...((['owner', 'admin', 'superadmin'].includes(req.user.role)) ? [{}] : [])
        ]
      },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} task(s) ${isArchived ? 'archived' : 'unarchived'} successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk archive tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Upload document to task
// @route   POST /api/tasks/:id/documents
// @access  Private
router.post('/:id/documents', auth, upload.single('file'), async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      firm: req.user.firmId._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const document = {
      name: req.file.originalname,
      url: `/uploads/task-documents/${req.file.filename}`,
      type: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.documents.push(document);
    await task.save();

    // Populate the uploaded document
    const updatedTask = await Task.findById(task._id)
      .populate('documents.uploadedBy', 'fullName email');

    // Broadcast via WebSocket
    if (global.taskWebSocketService) {
      global.taskWebSocketService.broadcastTaskUpdate(updatedTask);
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: updatedTask.documents[updatedTask.documents.length - 1]
    });
  } catch (error) {
    console.error('Upload task document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get task documents
// @route   GET /api/tasks/:id/documents
// @access  Private
router.get('/:id/documents', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      firm: req.user.firmId._id
    })
      .populate('documents.uploadedBy', 'fullName email')
      .select('documents');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task.documents || []
    });
  } catch (error) {
    console.error('Get task documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete task document
// @route   DELETE /api/tasks/:id/documents/:documentId
// @access  Private
router.delete('/:id/documents/:documentId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      firm: req.user.firmId._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const documentIndex = task.documents.findIndex(
      doc => doc._id.toString() === req.params.documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = task.documents[documentIndex];
    
    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), document.url);
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
      // Continue even if file deletion fails
    }

    // Remove document from array
    task.documents.splice(documentIndex, 1);
    await task.save();

    // Broadcast via WebSocket
    if (global.taskWebSocketService) {
      const updatedTask = await Task.findById(task._id)
        .populate('assignedTo', 'fullName email')
        .populate('client', 'name email');
      global.taskWebSocketService.broadcastTaskUpdate(updatedTask);
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete task document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Download task document
// @route   GET /api/tasks/:id/documents/:documentId/download
// @access  Private
router.get('/:id/documents/:documentId/download', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      firm: req.user.firmId._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const document = task.documents.find(
      doc => doc._id.toString() === req.params.documentId
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const filePath = path.join(process.cwd(), document.url);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(filePath, document.name);
  } catch (error) {
    console.error('Download task document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
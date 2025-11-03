import express from 'express';
import ClientCommunication from '../models/ClientCommunication.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @desc    Get client communications
// @route   GET /api/communications/client/:clientId
// @access  Private
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 20, type, isInternal } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      clientId,
      firmId: req.user.firmId
    };

    if (type && type !== 'all') {
      query.communicationType = type;
    }

    if (isInternal !== undefined) {
      query.isInternal = isInternal === 'true';
    }

    const communications = await ClientCommunication.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('readBy.userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await ClientCommunication.countDocuments(query);

    res.json({
      success: true,
      data: communications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get communications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communications',
      error: error.message
    });
  }
});

// @desc    Create new communication
// @route   POST /api/communications/client/:clientId
// @access  Private
router.post('/client/:clientId', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      communicationType,
      subject,
      message,
      recipientEmail,
      recipientPhone,
      status,
      isInternal,
      metadata
    } = req.body;

    const communication = new ClientCommunication({
      clientId,
      communicationType,
      subject,
      message,
      recipientEmail,
      recipientPhone,
      status: status || 'sent',
      isInternal: isInternal || false,
      metadata: metadata || {},
      firmId: req.user.firmId,
      createdBy: req.user._id
    });

    await communication.save();

    // Populate the response
    await communication.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'clientId', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: communication,
      message: 'Communication created successfully'
    });
  } catch (error) {
    console.error('Create communication error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create communication',
      error: error.message
    });
  }
});

// @desc    Mark communication as read
// @route   PUT /api/communications/:id/read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const communication = await ClientCommunication.findOne({
      _id: req.params.id,
      firmId: req.user.firmId
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    // Check if user already marked as read
    const alreadyRead = communication.readBy.find(
      read => read.userId.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      communication.readBy.push({
        userId: req.user._id,
        readAt: new Date()
      });
      
      // Update general read status if this is the first read
      if (!communication.isRead && communication.readBy.length === 1) {
        communication.isRead = true;
      }
      
      await communication.save();
    }

    res.json({
      success: true,
      message: 'Communication marked as read'
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark communication as read',
      error: error.message
    });
  }
});

// @desc    Update communication
// @route   PUT /api/communications/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      subject,
      message,
      recipientEmail,
      recipientPhone,
      status,
      metadata
    } = req.body;

    const communication = await ClientCommunication.findOneAndUpdate(
      {
        _id: req.params.id,
        firmId: req.user.firmId,
        createdBy: req.user._id // Only creator can edit
      },
      {
        subject,
        message,
        recipientEmail,
        recipientPhone,
        status,
        metadata,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: communication,
      message: 'Communication updated successfully'
    });
  } catch (error) {
    console.error('Update communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update communication',
      error: error.message
    });
  }
});

// @desc    Delete communication
// @route   DELETE /api/communications/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const communication = await ClientCommunication.findOneAndDelete({
      _id: req.params.id,
      firmId: req.user.firmId,
      createdBy: req.user._id // Only creator can delete
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Communication deleted successfully'
    });
  } catch (error) {
    console.error('Delete communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete communication',
      error: error.message
    });
  }
});

// @desc    Get unread communications count
// @route   GET /api/communications/unread/count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await ClientCommunication.countDocuments({
      firmId: req.user.firmId,
      isInternal: true,
      'readBy.userId': { $ne: req.user._id }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

export default router;
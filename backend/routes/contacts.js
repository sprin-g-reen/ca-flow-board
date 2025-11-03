import express from 'express';
import ClientContact from '../models/ClientContact.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @desc    Get client contacts
// @route   GET /api/contacts/client/:clientId
// @access  Private
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 20, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      clientId,
      firmId: req.user.firmId
    };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const contacts = await ClientContact.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ isPrimary: -1, createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await ClientContact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message
    });
  }
});

// @desc    Create new contact
// @route   POST /api/contacts/client/:clientId
// @access  Private
router.post('/client/:clientId', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      contactName,
      designation,
      department,
      email,
      phone,
      mobile,
      alternateEmail,
      whatsapp,
      isPrimary,
      notes,
      birthday,
      anniversary,
      linkedIn
    } = req.body;

    const contact = new ClientContact({
      clientId,
      contactName,
      designation,
      department,
      email,
      phone,
      mobile,
      alternateEmail,
      whatsapp,
      isPrimary: isPrimary || false,
      notes,
      birthday: birthday ? new Date(birthday) : null,
      anniversary: anniversary ? new Date(anniversary) : null,
      linkedIn,
      firmId: req.user.firmId,
      createdBy: req.user._id
    });

    await contact.save();

    // Populate the response
    await contact.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact created successfully'
    });
  } catch (error) {
    console.error('Create contact error:', error);
    
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
      message: 'Failed to create contact',
      error: error.message
    });
  }
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      contactName,
      designation,
      department,
      email,
      phone,
      mobile,
      alternateEmail,
      whatsapp,
      isPrimary,
      isActive,
      notes,
      birthday,
      anniversary,
      linkedIn
    } = req.body;

    const updateData = {
      contactName,
      designation,
      department,
      email,
      phone,
      mobile,
      alternateEmail,
      whatsapp,
      isPrimary,
      isActive,
      notes,
      birthday: birthday ? new Date(birthday) : null,
      anniversary: anniversary ? new Date(anniversary) : null,
      linkedIn,
      updatedBy: req.user._id
    };

    const contact = await ClientContact.findOneAndUpdate(
      {
        _id: req.params.id,
        firmId: req.user.firmId
      },
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message
    });
  }
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const contact = await ClientContact.findOneAndDelete({
      _id: req.params.id,
      firmId: req.user.firmId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    });
  }
});

// @desc    Set primary contact
// @route   PUT /api/contacts/:id/primary
// @access  Private
router.put('/:id/primary', auth, async (req, res) => {
  try {
    const contact = await ClientContact.findOne({
      _id: req.params.id,
      firmId: req.user.firmId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Remove primary status from other contacts for this client
    await ClientContact.updateMany(
      { 
        clientId: contact.clientId, 
        _id: { $ne: contact._id },
        firmId: req.user.firmId
      },
      { isPrimary: false }
    );

    // Set this contact as primary
    contact.isPrimary = true;
    contact.updatedBy = req.user._id;
    await contact.save();

    res.json({
      success: true,
      message: 'Primary contact updated successfully'
    });
  } catch (error) {
    console.error('Set primary contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set primary contact',
      error: error.message
    });
  }
});

export default router;
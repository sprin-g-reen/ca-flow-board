import express from 'express';
import auth from '../middleware/auth.js';
import RecurrencePattern from '../models/RecurrencePattern.js';

const router = express.Router();

// Get all recurrence patterns for the firm
router.get('/', auth, async (req, res) => {
  try {
    const { type, isActive = true } = req.query;
    
    const filter = { 
      firm: req.user.firmId._id,
      isActive: isActive === 'true'
    };
    
    if (type) {
      filter.type = type;
    }
    
    const patterns = await RecurrencePattern.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ type: 1, name: 1 });
    
    res.json({
      success: true,
      data: { patterns }
    });
  } catch (error) {
    console.error('Error fetching recurrence patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recurrence patterns',
      error: error.message
    });
  }
});

// Get single recurrence pattern
router.get('/:id', auth, async (req, res) => {
  try {
    const pattern = await RecurrencePattern.findOne({
      _id: req.params.id,
      firm: req.user.firmId._id
    }).populate('createdBy', 'fullName email');
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Recurrence pattern not found'
      });
    }
    
    res.json({
      success: true,
      data: { pattern }
    });
  } catch (error) {
    console.error('Error fetching recurrence pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recurrence pattern',
      error: error.message
    });
  }
});

// Create new recurrence pattern
router.post('/', auth, async (req, res) => {
  try {
    const patternData = {
      ...req.body,
      firm: req.user.firmId._id,
      createdBy: req.user._id
    };
    
    const pattern = await RecurrencePattern.create(patternData);
    await pattern.populate('createdBy', 'fullName email');
    
    res.status(201).json({
      success: true,
      message: 'Recurrence pattern created successfully',
      data: { pattern }
    });
  } catch (error) {
    console.error('Error creating recurrence pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating recurrence pattern',
      error: error.message
    });
  }
});

// Update recurrence pattern
router.put('/:id', auth, async (req, res) => {
  try {
    const pattern = await RecurrencePattern.findOneAndUpdate(
      {
        _id: req.params.id,
        firm: req.user.firmId._id
      },
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email');
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Recurrence pattern not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Recurrence pattern updated successfully',
      data: { pattern }
    });
  } catch (error) {
    console.error('Error updating recurrence pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating recurrence pattern',
      error: error.message
    });
  }
});

// Delete recurrence pattern
router.delete('/:id', auth, async (req, res) => {
  try {
    const pattern = await RecurrencePattern.findOneAndDelete({
      _id: req.params.id,
      firm: req.user.firmId._id
    });
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Recurrence pattern not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Recurrence pattern deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recurrence pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting recurrence pattern',
      error: error.message
    });
  }
});

// Create CA preset patterns for a firm
router.post('/create-presets', auth, async (req, res) => {
  try {
    // Only allow admins/owners to create presets
    if (!['admin', 'owner', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const presets = await RecurrencePattern.createCAPresets(
      req.user.firmId._id,
      req.user._id
    );
    
    res.json({
      success: true,
      message: `Created ${presets.length} CA preset patterns`,
      data: { presets }
    });
  } catch (error) {
    console.error('Error creating preset patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating preset patterns',
      error: error.message
    });
  }
});

// Preview next occurrences for a pattern
router.post('/:id/preview', auth, async (req, res) => {
  try {
    const { startDate, count = 5 } = req.body;
    
    const pattern = await RecurrencePattern.findOne({
      _id: req.params.id,
      firm: req.user.firmId._id
    });
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Recurrence pattern not found'
      });
    }
    
    const fromDate = startDate ? new Date(startDate) : new Date();
    const occurrences = [];
    
    let currentDate = new Date(fromDate);
    for (let i = 0; i < count; i++) {
      currentDate = pattern.getNextOccurrence(currentDate);
      occurrences.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1); // Move to next day for next calculation
    }
    
    res.json({
      success: true,
      data: { 
        pattern: pattern.name,
        occurrences,
        description: pattern.frequencyDescription
      }
    });
  } catch (error) {
    console.error('Error previewing pattern occurrences:', error);
    res.status(500).json({
      success: false,
      message: 'Error previewing pattern occurrences',
      error: error.message
    });
  }
});

export default router;
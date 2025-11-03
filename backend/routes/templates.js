import express from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import TaskTemplate from '../models/TaskTemplate.js';

const router = express.Router();

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category, active_only = 'true', page = 1, limit = 50 } = req.query;
    
    // Build filter
    const filter = { 
      firm: req.user.firmId._id,
      is_deleted: false
    };
    
    if (active_only === 'true') {
      filter.is_active = true;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    const templates = await TaskTemplate.find(filter)
      .populate('assigned_employee_id', 'fullName email employee_id')
      .populate('client_id', 'name email')
      .populate('created_by', 'fullName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await TaskTemplate.countDocuments(filter);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await TaskTemplate.findById(req.params.id)
      .populate('assigned_employee_id', 'fullName email employee_id')
      .populate('client_id', 'name email')
      .populate('created_by', 'fullName email');
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if template belongs to user's firm
    if (template.firm.toString() !== req.user.firmId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this template'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new template
// @route   POST /api/templates
// @access  Private
router.post('/', auth, [
  body('title').notEmpty().withMessage('Template title is required'),
  body('category').isIn(['gst', 'itr', 'roc', 'other']).withMessage('Invalid category'),
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
      is_recurring,
      recurrence_pattern,
      is_payable_task,
      price,
      payable_task_type,
      assigned_employee_id,
      client_id,
      deadline,
      subtasks,
      estimated_hours,
      complexity,
      tags,
      custom_fields
    } = req.body;

    const templateData = {
      title,
      description: description || '',
      category,
      is_recurring: is_recurring || false,
      is_payable_task: is_payable_task || false,
      created_by: req.user._id,
      firm: req.user.firmId._id
    };

    // Add optional fields
    if (is_recurring && recurrence_pattern) {
      templateData.recurrence_pattern = recurrence_pattern;
    }

    if (is_payable_task) {
      templateData.price = price;
      templateData.payable_task_type = payable_task_type;
    }

    if (assigned_employee_id && assigned_employee_id !== 'none') {
      templateData.assigned_employee_id = assigned_employee_id;
    }

    if (client_id && client_id !== 'none') {
      templateData.client_id = client_id;
    }

    if (deadline) {
      templateData.deadline = deadline;
    }

    if (subtasks && Array.isArray(subtasks)) {
      templateData.subtasks = subtasks;
    }

    if (estimated_hours) {
      templateData.estimated_hours = estimated_hours;
    }

    if (complexity) {
      templateData.complexity = complexity;
    }

    if (tags && Array.isArray(tags)) {
      templateData.tags = tags;
    }

    if (custom_fields) {
      templateData.custom_fields = custom_fields;
    }

    const template = await TaskTemplate.create(templateData);
    
    // Populate the created template
    const populatedTemplate = await TaskTemplate.findById(template._id)
      .populate('assigned_employee_id', 'fullName email employee_id')
      .populate('client_id', 'name email')
      .populate('created_by', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: populatedTemplate
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const template = await TaskTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if template belongs to user's firm
    if (template.firm.toString() !== req.user.firmId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this template'
      });
    }

    // Only allow updating if user created the template or is admin/owner
    const canUpdate = template.created_by.toString() === req.user._id.toString() ||
                     ['admin', 'owner', 'superadmin'].includes(req.user.role);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this template'
      });
    }

    const updatedTemplate = await TaskTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assigned_employee_id', 'fullName email employee_id')
     .populate('client_id', 'name email')
     .populate('created_by', 'fullName email');

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete template (soft delete)
// @route   DELETE /api/templates/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await TaskTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if template belongs to user's firm
    if (template.firm.toString() !== req.user.firmId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this template'
      });
    }

    // Only allow deletion if user created the template or is admin/owner
    const canDelete = template.created_by.toString() === req.user._id.toString() ||
                     ['admin', 'owner', 'superadmin'].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this template'
      });
    }

    // Soft delete
    template.is_deleted = true;
    template.is_active = false;
    await template.save();

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle template active status
// @route   PUT /api/templates/:id/toggle-active
// @access  Private
router.put('/:id/toggle-active', auth, async (req, res) => {
  try {
    const template = await TaskTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if template belongs to user's firm
    if (template.firm.toString() !== req.user.firmId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this template'
      });
    }

    // Only allow status change if user created the template or is admin/owner
    const canUpdate = template.created_by.toString() === req.user._id.toString() ||
                     ['admin', 'owner', 'superadmin'].includes(req.user.role);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this template'
      });
    }

    template.is_active = !template.is_active;
    await template.save();

    const populatedTemplate = await TaskTemplate.findById(template._id)
      .populate('assigned_employee_id', 'fullName email employee_id')
      .populate('client_id', 'name email')
      .populate('created_by', 'fullName email');

    res.json({
      success: true,
      message: `Template ${template.is_active ? 'activated' : 'deactivated'} successfully`,
      data: populatedTemplate
    });
  } catch (error) {
    console.error('Toggle template active status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get templates by category
// @route   GET /api/templates/category/:category
// @access  Private
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const { active_only = 'true', default_only = 'false' } = req.query;
    
    // Build filter
    const filter = { 
      firm: req.user.firmId._id,
      category: category,
      is_deleted: false
    };
    
    if (active_only === 'true') {
      filter.is_active = true;
    }

    // If requesting default template only, get the most recently used or created one
    if (default_only === 'true') {
      const template = await TaskTemplate.findOne(filter)
        .populate('assigned_employee_id', 'fullName email employee_id')
        .populate('client_id', 'name email')
        .populate('created_by', 'fullName email')
        .sort({ last_used: -1, createdAt: -1 })
        .limit(1);

      return res.json({
        success: true,
        data: template
      });
    }
    
    const templates = await TaskTemplate.find(filter)
      .populate('assigned_employee_id', 'fullName email employee_id')
      .populate('client_id', 'name email')
      .populate('created_by', 'fullName email')
      .sort({ last_used: -1, createdAt: -1 });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Duplicate template
// @route   POST /api/templates/:id/duplicate
// @access  Private
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const originalTemplate = await TaskTemplate.findById(req.params.id);
    
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if template belongs to user's firm
    if (originalTemplate.firm.toString() !== req.user.firmId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this template'
      });
    }

    // Create duplicate with modified title
    const duplicateData = originalTemplate.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    
    duplicateData.title = `${duplicateData.title} (Copy)`;
    duplicateData.created_by = req.user._id;
    duplicateData.usage_count = 0;
    duplicateData.last_used = undefined;

    const duplicateTemplate = await TaskTemplate.create(duplicateData);
    
    const populatedTemplate = await TaskTemplate.findById(duplicateTemplate._id)
      .populate('assigned_employee_id', 'fullName email employee_id')
      .populate('client_id', 'name email')
      .populate('created_by', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      data: populatedTemplate
    });
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
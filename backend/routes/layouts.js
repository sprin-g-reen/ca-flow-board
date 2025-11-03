import express from 'express';
import LayoutPreference from '../models/LayoutPreference.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all layout preferences for a user
router.get('/', auth, async (req, res) => {
  try {
    const layouts = await LayoutPreference.find({ userId: req.user._id })
      .sort({ layoutType: 1, isDefault: -1, layoutName: 1 });
    
    res.json({
      success: true,
      data: layouts
    });
  } catch (error) {
    console.error('Error fetching layout preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch layout preferences'
    });
  }
});

// Get layout preferences by type
router.get('/type/:layoutType', auth, async (req, res) => {
  try {
    const { layoutType } = req.params;
    
    if (!['task-board', 'client-view', 'dashboard'].includes(layoutType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid layout type'
      });
    }
    
    const layouts = await LayoutPreference.find({ 
      userId: req.user._id, 
      layoutType 
    }).sort({ isDefault: -1, layoutName: 1 });
    
    res.json({
      success: true,
      data: layouts
    });
  } catch (error) {
    console.error('Error fetching layout preferences by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch layout preferences'
    });
  }
});

// Get default layout for a type
router.get('/default/:layoutType', auth, async (req, res) => {
  try {
    const { layoutType } = req.params;
    
    let layout = await LayoutPreference.findOne({ 
      userId: req.user._id, 
      layoutType,
      isDefault: true 
    });
    
    // If no default layout exists, return default settings
    if (!layout) {
      layout = {
        layoutType,
        settings: {
          boardView: 'kanban',
          visibleColumns: [
            { key: 'title', label: 'Task', width: 300, sortable: true, visible: true },
            { key: 'status', label: 'Status', width: 120, sortable: true, visible: true },
            { key: 'priority', label: 'Priority', width: 100, sortable: true, visible: true },
            { key: 'assignedTo', label: 'Assigned To', width: 200, sortable: true, visible: true },
            { key: 'client', label: 'Client', width: 150, sortable: true, visible: true },
            { key: 'dueDate', label: 'Due Date', width: 120, sortable: true, visible: true }
          ],
          defaultFilters: {},
          defaultSort: { field: 'dueDate', direction: 'asc' },
          cardSize: 'normal',
          showSubtasks: true,
          showClientInfo: true,
          showDueDates: true,
          colorScheme: 'default'
        }
      };
    }
    
    res.json({
      success: true,
      data: layout
    });
  } catch (error) {
    console.error('Error fetching default layout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default layout'
    });
  }
});

// Create a new layout preference
router.post('/', auth, async (req, res) => {
  try {
    const { layoutName, layoutType, settings, isDefault } = req.body;
    
    // Validate required fields
    if (!layoutName || !layoutType || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Layout name, type, and settings are required'
      });
    }
    
    // If setting as default, remove default from other layouts of same type
    if (isDefault) {
      await LayoutPreference.updateMany(
        { userId: req.user._id, layoutType },
        { isDefault: false }
      );
    }
    
    const layout = new LayoutPreference({
      userId: req.user._id,
      layoutName,
      layoutType,
      settings,
      isDefault: isDefault || false
    });
    
    await layout.save();
    
    res.status(201).json({
      success: true,
      data: layout,
      message: 'Layout preference created successfully'
    });
  } catch (error) {
    console.error('Error creating layout preference:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A layout with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create layout preference'
    });
  }
});

// Update a layout preference
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { layoutName, settings, isDefault } = req.body;
    
    const layout = await LayoutPreference.findOne({ 
      _id: id, 
      userId: req.user._id 
    });
    
    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout preference not found'
      });
    }
    
    // If setting as default, remove default from other layouts of same type
    if (isDefault && !layout.isDefault) {
      await LayoutPreference.updateMany(
        { userId: req.user._id, layoutType: layout.layoutType, _id: { $ne: id } },
        { isDefault: false }
      );
    }
    
    // Update the layout
    if (layoutName) layout.layoutName = layoutName;
    if (settings) layout.settings = settings;
    if (typeof isDefault === 'boolean') layout.isDefault = isDefault;
    
    await layout.save();
    
    res.json({
      success: true,
      data: layout,
      message: 'Layout preference updated successfully'
    });
  } catch (error) {
    console.error('Error updating layout preference:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A layout with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update layout preference'
    });
  }
});

// Delete a layout preference
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const layout = await LayoutPreference.findOneAndDelete({ 
      _id: id, 
      userId: req.user._id 
    });
    
    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout preference not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Layout preference deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting layout preference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete layout preference'
    });
  }
});

// Set a layout as default
router.patch('/:id/default', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const layout = await LayoutPreference.findOne({ 
      _id: id, 
      userId: req.user._id 
    });
    
    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout preference not found'
      });
    }
    
    // Remove default from other layouts of same type
    await LayoutPreference.updateMany(
      { userId: req.user._id, layoutType: layout.layoutType, _id: { $ne: id } },
      { isDefault: false }
    );
    
    // Set this layout as default
    layout.isDefault = true;
    await layout.save();
    
    res.json({
      success: true,
      data: layout,
      message: 'Layout set as default successfully'
    });
  } catch (error) {
    console.error('Error setting default layout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default layout'
    });
  }
});

export default router;
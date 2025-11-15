import express from 'express';
import auth from '../middleware/auth.js';
import { requireOwnerOrAdmin } from '../middleware/authorize.js';
import RecurrencePattern from '../models/RecurrencePattern.js';
import Task from '../models/Task.js';
import TaskTemplate from '../models/TaskTemplate.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// @desc    Get automation settings
// @route   GET /api/automation/settings
// @access  Private (Owner/Admin)
router.get('/settings', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const firmId = req.user.firmId;
    const settings = await Settings.findOne({ firm: firmId });
    
    const automationSettings = settings?.data?.automation || {
      enabled: false,
      autoRunTime: '09:00',
      emailNotifications: true,
      taskGeneration: true
    };

    res.json({
      success: true,
      data: automationSettings
    });
  } catch (error) {
    console.error('Error fetching automation settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation settings'
    });
  }
});

// @desc    Update automation settings
// @route   PUT /api/automation/settings
// @access  Private (Owner/Admin)
router.put('/settings', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const firmId = req.user.firmId;
    const { enabled, autoRunTime, emailNotifications, taskGeneration } = req.body;

    const settings = await Settings.findOne({ firm: firmId });
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    if (!settings.data.automation) {
      settings.data.automation = {};
    }

    settings.data.automation = {
      enabled,
      autoRunTime,
      emailNotifications,
      taskGeneration
    };

    await settings.save();

    res.json({
      success: true,
      data: settings.data.automation,
      message: 'Automation settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating automation settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update automation settings'
    });
  }
});

// @desc    Get all recurring schedules
// @route   GET /api/automation/schedules
// @access  Private
router.get('/schedules', auth, async (req, res) => {
  try {
    const firmId = req.user.firmId;

    const patterns = await RecurrencePattern.find({ 
      firm: firmId 
    }).populate('createdBy', 'fullName email').lean();

    // Get associated templates for each pattern
    const templates = await TaskTemplate.find({ 
      firm: firmId,
      recurrencePattern: { $in: patterns.map(p => p._id) }
    }).populate('client', 'name').populate('assignedTo', 'fullName').lean();

    // Map patterns to schedules with template data
    const schedules = patterns.map(pattern => {
      const relatedTemplates = templates.filter(t => 
        t.recurrencePattern && t.recurrencePattern.toString() === pattern._id.toString()
      );

      return {
        id: pattern._id,
        templateName: relatedTemplates[0]?.title || pattern.name,
        clientName: relatedTemplates[0]?.client?.name || 'Multiple Clients',
        category: relatedTemplates[0]?.category || 'OTHER',
        pattern: pattern.frequencyDescription || pattern.name,
        nextRun: pattern.getNextOccurrence(),
        lastRun: relatedTemplates[0]?.lastGenerated,
        isActive: pattern.isActive,
        assignedEmployees: relatedTemplates[0]?.assignedTo?.map(u => u.fullName) || [],
        patternDetails: pattern
      };
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recurring schedules'
    });
  }
});

// @desc    Toggle schedule active status
// @route   PUT /api/automation/schedules/:id/toggle
// @access  Private (Owner/Admin)
router.put('/schedules/:id/toggle', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const firmId = req.user.firmId;

    const pattern = await RecurrencePattern.findOne({ _id: id, firm: firmId });
    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    pattern.isActive = !pattern.isActive;
    await pattern.save();

    res.json({
      success: true,
      data: pattern,
      message: `Schedule ${pattern.isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle schedule'
    });
  }
});

// @desc    Generate recurring tasks now
// @route   POST /api/automation/generate
// @access  Private (Owner/Admin)
router.post('/generate', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const firmId = req.user.firmId;

    // Get all active patterns
    const patterns = await RecurrencePattern.find({ 
      firm: firmId,
      isActive: true 
    });

    // Get templates associated with these patterns
    const templates = await TaskTemplate.find({
      firm: firmId,
      recurrencePattern: { $in: patterns.map(p => p._id) }
    }).populate('client').populate('assignedTo');

    let generatedCount = 0;
    const createdTasks = [];

    for (const template of templates) {
      const nextDate = template.recurrencePattern ? 
        await RecurrencePattern.findById(template.recurrencePattern).then(p => p?.getNextOccurrence()) :
        null;

      if (!nextDate) continue;

      // Check if task for this date already exists
      const existing = await Task.findOne({
        template: template._id,
        dueDate: { 
          $gte: new Date(nextDate.setHours(0, 0, 0, 0)),
          $lt: new Date(nextDate.setHours(23, 59, 59, 999))
        }
      });

      if (existing) continue;

      // Create new task from template
      const task = await Task.create({
        title: template.title,
        description: template.description,
        category: template.category,
        priority: template.priority,
        status: 'pending',
        dueDate: nextDate,
        client: template.client,
        assignedTo: template.assignedTo,
        template: template._id,
        firm: firmId,
        createdBy: req.user._id,
        tags: [...(template.tags || []), 'auto-generated']
      });

      createdTasks.push(task);
      generatedCount++;

      // Update template last generated date
      template.lastGenerated = new Date();
      await template.save();
    }

    res.json({
      success: true,
      message: `Generated ${generatedCount} recurring tasks`,
      data: {
        count: generatedCount,
        tasks: createdTasks
      }
    });
  } catch (error) {
    console.error('Error generating recurring tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recurring tasks'
    });
  }
});

// @desc    Get automation statistics
// @route   GET /api/automation/stats
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const firmId = req.user.firmId;

    const totalSchedules = await RecurrencePattern.countDocuments({ firm: firmId });
    const activeSchedules = await RecurrencePattern.countDocuments({ 
      firm: firmId, 
      isActive: true 
    });

    const patterns = await RecurrencePattern.find({ 
      firm: firmId,
      isActive: true 
    });

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let dueThisWeek = 0;
    for (const pattern of patterns) {
      const nextRun = pattern.getNextOccurrence();
      if (nextRun <= weekFromNow) {
        dueThisWeek++;
      }
    }

    res.json({
      success: true,
      data: {
        totalSchedules,
        activeSchedules,
        dueThisWeek
      }
    });
  } catch (error) {
    console.error('Error fetching automation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation statistics'
    });
  }
});

export default router;
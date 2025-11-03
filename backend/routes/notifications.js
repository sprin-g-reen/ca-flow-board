import express from 'express';
import protect from '../middleware/auth.js';
import NotificationService from '../services/notificationService.js';
import EmailService from '../services/emailService.js';

const router = express.Router();

// Get user notifications
router.get('/', protect, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, unreadOnly } = req.query;
    
    const result = await NotificationService.getUserNotifications(req.user._id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Get unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const result = await NotificationService.getUserNotifications(req.user._id, {
      unreadOnly: true,
      limit: 1
    });

    res.json({ count: result.unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
  }
});

// Archive notification
router.put('/:id/archive', protect, async (req, res) => {
  try {
    const notification = await NotificationService.archiveNotification(req.params.id, req.user._id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({ message: 'Error archiving notification', error: error.message });
  }
});

// Delete notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await NotificationService.deleteNotification(req.params.id, req.user._id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

// Send reminder
router.post('/:id/remind', protect, async (req, res) => {
  try {
    const notification = await NotificationService.sendReminder(req.params.id, req.user._id);
    res.json({ message: 'Reminder sent successfully', notification });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ message: 'Error sending reminder', error: error.message });
  }
});

// Test email configuration (admin only)
router.post('/test-email', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const result = await EmailService.testConnection();
    
    if (result.success) {
      // Send test email
      const emailResult = await EmailService.sendEmail({
        to: req.user.email,
        subject: 'CA Flow Board - Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #667eea; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">CA Flow Board</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2>Email Configuration Test</h2>
              <p>Congratulations! Your email configuration is working correctly.</p>
              <p><strong>Test sent at:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      });

      res.json({
        message: 'Email configuration test completed',
        connectionTest: result,
        emailTest: emailResult
      });
    } else {
      res.status(500).json({
        message: 'Email configuration test failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({ message: 'Error testing email', error: error.message });
  }
});

// Create manual notification (admin only)
router.post('/create', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const {
      recipientId,
      type = 'system_announcement',
      title,
      message,
      priority = 'medium',
      sendEmail = true
    } = req.body;

    if (!recipientId || !title || !message) {
      return res.status(400).json({ message: 'recipientId, title, and message are required' });
    }

    const notification = await NotificationService.createNotification({
      recipientId,
      senderId: req.user._id,
      type,
      title,
      message,
      priority,
      sendEmail
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

export default router;
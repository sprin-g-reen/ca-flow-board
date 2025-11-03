import Notification from '../models/Notification.js';
import User from '../models/User.js';
import EmailService from './emailService.js';

class NotificationService {
  // Create a new notification
  async createNotification({
    recipientId,
    senderId = null,
    type,
    title,
    message,
    relatedEntity = null,
    priority = 'medium',
    metadata = {},
    sendEmail = true
  }) {
    try {
      // Create the notification
      const notification = new Notification({
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        relatedEntity,
        priority,
        metadata
      });

      await notification.save();

      // Populate recipient data for email sending
      await notification.populate('recipient', 'email fullName notificationPreferences');
      await notification.populate('sender', 'fullName email');

      // Send email if user preferences allow and sendEmail is true
      if (sendEmail && this.shouldSendEmail(notification)) {
        await this.sendEmailNotification(notification);
      }

      // TODO: Send real-time notification via websocket

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Check if email should be sent based on user preferences
  shouldSendEmail(notification) {
    const user = notification.recipient;
    const preferences = user.notificationPreferences || {};
    
    // Default to true if no preferences set
    if (!preferences.email) return true;
    
    // Check specific notification type preferences
    const typeKey = notification.type.replace('_', '');
    return preferences.email[typeKey] !== false;
  }

  // Send email notification
  async sendEmailNotification(notification) {
    try {
      const user = notification.recipient;
      const sender = notification.sender;
      
      let emailResult;
      
      switch (notification.type) {
        case 'task_assigned':
          emailResult = await EmailService.sendTaskAssignmentEmail(
            user.email,
            user.fullName,
            notification.title,
            notification.message,
            notification.metadata.dueDate,
            sender ? sender.fullName : 'System'
          );
          break;
          
        case 'task_due_soon':
        case 'task_overdue':
          emailResult = await EmailService.sendTaskDueReminderEmail(
            user.email,
            user.fullName,
            notification.title,
            notification.metadata.dueDate
          );
          break;
          
        case 'task_completed':
          emailResult = await EmailService.sendTaskCompletionEmail(
            user.email,
            user.fullName,
            notification.title,
            sender ? sender.fullName : 'System'
          );
          break;
          
        default:
          // Generic email for other notification types
          emailResult = await EmailService.sendEmail({
            to: user.email,
            subject: notification.title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #667eea; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">CA Flow Board</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                  <h2>Hello ${user.fullName},</h2>
                  <p>${notification.message}</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                       style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      View Dashboard
                    </a>
                  </div>
                </div>
              </div>
            `
          });
      }

      if (emailResult.success) {
        notification.emailSent = true;
        notification.emailSentAt = new Date();
        await notification.save();
      }

      return emailResult;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Task-related notification helpers
  async notifyTaskAssignment(taskId, recipientId, senderId, taskData) {
    return this.createNotification({
      recipientId,
      senderId,
      type: 'task_assigned',
      title: `New Task: ${taskData.title}`,
      message: `You have been assigned a new task: ${taskData.title}`,
      relatedEntity: {
        entityType: 'Task',
        entityId: taskId
      },
      priority: taskData.priority || 'medium',
      metadata: {
        taskId,
        dueDate: taskData.dueDate,
        category: taskData.category
      }
    });
  }

  async notifyTaskUpdate(taskId, recipientId, senderId, updateType, taskData) {
    return this.createNotification({
      recipientId,
      senderId,
      type: 'task_updated',
      title: `Task Updated: ${taskData.title}`,
      message: `Task "${taskData.title}" has been ${updateType}`,
      relatedEntity: {
        entityType: 'Task',
        entityId: taskId
      },
      priority: 'low',
      metadata: {
        taskId,
        updateType,
        dueDate: taskData.dueDate
      },
      sendEmail: false // Usually don't email for updates
    });
  }

  async notifyTaskCompletion(taskId, recipientId, senderId, taskData) {
    return this.createNotification({
      recipientId,
      senderId,
      type: 'task_completed',
      title: `Task Completed: ${taskData.title}`,
      message: `Task "${taskData.title}" has been completed`,
      relatedEntity: {
        entityType: 'Task',
        entityId: taskId
      },
      priority: 'medium',
      metadata: {
        taskId,
        completedAt: new Date()
      }
    });
  }

  async notifyTaskDue(taskId, recipientId, taskData, isOverdue = false) {
    return this.createNotification({
      recipientId,
      type: isOverdue ? 'task_overdue' : 'task_due_soon',
      title: `Task ${isOverdue ? 'Overdue' : 'Due Soon'}: ${taskData.title}`,
      message: `Task "${taskData.title}" is ${isOverdue ? 'overdue' : 'due soon'}`,
      relatedEntity: {
        entityType: 'Task',
        entityId: taskId
      },
      priority: isOverdue ? 'urgent' : 'high',
      metadata: {
        taskId,
        dueDate: taskData.dueDate
      }
    });
  }

  // Get notifications for a user
  async getUserNotifications(userId, { status = null, limit = 50, offset = 0, unreadOnly = false } = {}) {
    try {
      const query = { recipient: userId };
      
      if (status) {
        query.status = status;
      }
      
      if (unreadOnly) {
        query.status = 'unread';
      }

      const notifications = await Notification.find(query)
        .populate('sender', 'fullName email avatar')
        .populate('relatedEntity.entityId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ 
        recipient: userId, 
        status: 'unread' 
      });

      return {
        notifications,
        total,
        unreadCount,
        hasMore: total > offset + notifications.length
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { status: 'read' },
        { new: true }
      );
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, status: 'unread' },
        { status: 'read' }
      );
      
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Archive notification
  async archiveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { status: 'archived' },
        { new: true }
      );
      
      return notification;
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId
      });
      
      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Send reminder for notification
  async sendReminder(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      }).populate('recipient', 'email fullName');

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Send email reminder
      await this.sendEmailNotification(notification);

      // Update reminder count and timestamp
      notification.reminderCount += 1;
      notification.lastReminderAt = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }
}

export default new NotificationService();
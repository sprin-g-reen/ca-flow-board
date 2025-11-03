import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.setupTransporter();
  }

  setupTransporter() {
    // Check if email credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  Email service not configured - SMTP credentials missing');
      console.warn('💡 Add SMTP_USER and SMTP_PASS to .env to enable email notifications');
      this.isConfigured = false;
      return;
    }

    try {
      // Setup email transporter with environment variables
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
      console.log(`📧 SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
      console.log(`📤 From: ${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}`);
    } catch (error) {
      console.error('❌ Failed to setup email service:', error.message);
      this.isConfigured = false;
    }
  }

  async sendEmail({ to, subject, text, html, attachments = [] }) {
    try {
      // Check if email service is configured
      if (!this.isConfigured || !this.transporter) {
        console.warn('⚠️  Email not sent - service not configured');
        console.warn('💡 Configure SMTP credentials in .env to enable email notifications');
        return { 
          success: false, 
          error: 'Email service not configured',
          skipped: true 
        };
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'CA Flow Board'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully to:', to);
      console.log('   Subject:', subject);
      console.log('   Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        console.error('💡 Gmail App Password Error - Steps to fix:');
        console.error('   1. Go to https://myaccount.google.com/apppasswords');
        console.error('   2. Generate a new App Password for "Mail"');
        console.error('   3. Update SMTP_PASS in .env with the new password (16 chars, no spaces)');
        console.error('   4. Make sure 2-Step Verification is enabled on your Google account');
      } else if (error.code === 'ECONNECTION') {
        console.error('💡 Connection Error - Check your internet or SMTP settings');
      }
      
      return { success: false, error: error.message };
    }
  }

  // Template methods for different notification types
  async sendTaskAssignmentEmail(userEmail, userName, taskTitle, taskDescription, dueDate, assignedBy) {
    const subject = `New Task Assigned: ${taskTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">CA Flow Board</h1>
          <p style="color: white; margin: 5px 0;">Task Assignment Notification</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            You have been assigned a new task by <strong>${assignedBy}</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">${taskTitle}</h3>
            <p style="color: #666; margin: 0 0 15px 0;">${taskDescription}</p>
            ${dueDate ? `<p style="color: #e74c3c; margin: 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Task
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            This is an automated notification from CA Flow Board. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendTaskDueReminderEmail(userEmail, userName, taskTitle, dueDate) {
    const subject = `Task Due Reminder: ${taskTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">CA Flow Board</h1>
          <p style="color: white; margin: 5px 0;">Task Due Reminder</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            This is a reminder that the following task is due soon:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f39c12; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">${taskTitle}</h3>
            <p style="color: #e74c3c; margin: 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks" 
               style="background: #f39c12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Task
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendTaskCompletionEmail(userEmail, userName, taskTitle, completedBy) {
    const subject = `Task Completed: ${taskTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">CA Flow Board</h1>
          <p style="color: white; margin: 5px 0;">Task Completion Notification</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Great news! The following task has been completed by <strong>${completedBy}</strong>:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #27ae60; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">${taskTitle}</h3>
            <p style="color: #27ae60; margin: 0;"><strong>Status:</strong> Completed ✓</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks" 
               style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Task
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  // Test email configuration
  async testConnection() {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.warn('⚠️  Email service not configured - cannot test connection');
        return { 
          success: false, 
          error: 'Email service not configured. Add SMTP credentials to .env' 
        };
      }
      
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      console.log('📧 Email service is ready to send notifications');
      return { success: true };
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      
      if (error.code === 'EAUTH') {
        console.error('🔑 Authentication failed - Invalid Gmail App Password');
        console.error('');
        console.error('📝 How to fix:');
        console.error('   1. Go to: https://myaccount.google.com/apppasswords');
        console.error('   2. Sign in to your Google account');
        console.error('   3. Select "Mail" and "Other (Custom name)"');
        console.error('   4. Generate a new 16-character App Password');
        console.error('   5. Update .env file: SMTP_PASS=your-16-char-password');
        console.error('   6. Restart the backend server');
        console.error('');
        console.error('⚠️  Note: 2-Step Verification must be enabled on your Google account');
      }
      
      return { success: false, error: error.message };
    }
  }

  // ================== NEW QUOTE/INVOICE WORKFLOW EMAILS ==================

  // 1. Send quote ready notification to admin
  async sendQuoteReadyForApproval({
    adminEmail,
    adminName,
    taskTitle,
    clientName,
    quoteNumber,
    quoteAmount,
    quoteId,
    taskId
  }) {
    const subject = `🔔 Action Required: Quote Ready for Approval - ${taskTitle}`;
    const approvalUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/quotes/pending`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">CA Flow Board</h1>
          <p style="color: white; margin: 10px 0 0; font-size: 16px;">Quote Approval Required</p>
        </div>
        
        <div style="padding: 40px 30px; background: #f8f9fa;">
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <p style="color: #856404; margin: 0; font-weight: bold;">⏰ Action Required</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${adminName},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            A task has been completed and a quote is ready for your review and approval.
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #dee2e6; margin: 25px 0;">
            <h3 style="color: #667eea; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #f0f0f0;">
              Quote Details
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Quote Number:</td>
                <td style="padding: 10px 0; color: #333;">${quoteNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Client:</td>
                <td style="padding: 10px 0; color: #333;">${clientName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Task:</td>
                <td style="padding: 10px 0; color: #333;">${taskTitle}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600; border-top: 2px solid #f0f0f0; padding-top: 15px;">Amount:</td>
                <td style="padding: 10px 0; color: #27ae60; font-weight: bold; font-size: 20px; border-top: 2px solid #f0f0f0; padding-top: 15px;">
                  ₹${quoteAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${approvalUrl}" 
               style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
              Review & Approve Quote
            </a>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #1976d2; font-size: 14px;">
              💡 <strong>Quick Actions:</strong> You can approve and send the quote immediately, 
              or schedule it to be sent later at your convenience.
            </p>
          </div>
          
          <p style="color: #888; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            This is an automated notification from CA Flow Board. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject,
      html
    });
  }

  // 2. Send quote to client with payment link
  async sendQuoteToClient({
    clientEmail,
    clientName,
    firmName,
    quoteNumber,
    quoteDate,
    validUntil,
    items,
    subtotal,
    taxAmount,
    totalAmount,
    paymentLink,
    notes,
    terms,
    quoteId
  }) {
    const subject = `Quotation from ${firmName} - ${quoteNumber}`;
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #333;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: center; color: #666;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: #666;">₹${item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; color: #333; font-weight: 600;">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">${firmName}</h1>
          <p style="color: #ecf0f1; margin: 10px 0 0; font-size: 18px; font-weight: 600;">QUOTATION</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <div style="margin-bottom: 40px;">
            <p style="color: #2c3e50; font-size: 18px; margin: 0 0 5px 0;">Dear ${clientName},</p>
            <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 15px 0;">
              Thank you for choosing our services. Please find below the quotation for the services requested.
            </p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <div>
              <p style="margin: 0; color: #666; font-size: 13px;">QUOTATION NUMBER</p>
              <p style="margin: 5px 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${quoteNumber}</p>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 13px;">DATE</p>
              <p style="margin: 5px 0 0; color: #2c3e50; font-size: 16px;">${new Date(quoteDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 13px;">VALID UNTIL</p>
              <p style="margin: 5px 0 0; color: #e74c3c; font-size: 16px; font-weight: 600;">${new Date(validUntil).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin: 30px 0; background: white; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #34495e; color: white;">
                <th style="padding: 15px; text-align: left; font-weight: 600;">DESCRIPTION</th>
                <th style="padding: 15px; text-align: center; font-weight: 600;">QTY</th>
                <th style="padding: 15px; text-align: right; font-weight: 600;">RATE</th>
                <th style="padding: 15px; text-align: right; font-weight: 600;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="text-align: right; margin: 30px 0;">
            <table style="margin-left: auto; min-width: 350px;">
              <tr>
                <td style="padding: 10px; color: #666; font-size: 15px;">Subtotal:</td>
                <td style="padding: 10px; text-align: right; color: #333; font-size: 15px;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #666; font-size: 15px;">GST (18%):</td>
                <td style="padding: 10px; text-align: right; color: #333; font-size: 15px;">₹${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="border-top: 2px solid #2c3e50;">
                <td style="padding: 15px; color: #2c3e50; font-size: 18px; font-weight: 600;">Total Amount:</td>
                <td style="padding: 15px; text-align: right; color: #27ae60; font-size: 22px; font-weight: 700;">₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>
          
          ${paymentLink ? `
          <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 40px 0; box-shadow: 0 6px 12px rgba(39, 174, 96, 0.3);">
            <p style="color: white; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              💳 Ready to Proceed? Pay Securely Online
            </p>
            <a href="${paymentLink}" 
               style="background: white; color: #27ae60; padding: 18px 50px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 700; font-size: 18px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.3s;">
              PAY NOW - ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </a>
            <p style="color: #e8f5e9; font-size: 13px; margin: 15px 0 0; font-style: italic;">
              🔒 Secure payment powered by Razorpay
            </p>
          </div>
          ` : ''}
          
          ${notes ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; font-weight: 600; margin: 0 0 10px 0;">📝 Notes:</p>
            <p style="color: #856404; margin: 0; line-height: 1.6;">${notes}</p>
          </div>
          ` : ''}
          
          ${terms ? `
          <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="color: #666; font-weight: 600; margin: 0 0 10px 0;">Terms & Conditions:</p>
            <p style="color: #666; margin: 0; font-size: 13px; line-height: 1.6;">${terms}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #dee2e6; text-align: center;">
            <p style="color: #666; font-size: 15px; margin: 0 0 10px;">Thank you for your business!</p>
            <p style="color: #999; font-size: 13px; margin: 0;">
              If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
            This is a system-generated quotation. For any queries, please contact ${firmName}.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: clientEmail,
      subject,
      html
    });
  }

  // 3. Send payment confirmation to client
  async sendPaymentConfirmationToClient({
    clientEmail,
    clientName,
    firmName,
    invoiceNumber,
    paymentAmount,
    paymentDate,
    paymentMethod,
    transactionId,
    invoiceId
  }) {
    const subject = `Payment Received - Invoice ${invoiceNumber} from ${firmName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center;">
          <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">✓</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px;">Payment Confirmed!</h1>
          <p style="color: #e8f5e9; margin: 10px 0 0; font-size: 16px;">Thank you for your payment</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Dear ${clientName},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We have successfully received your payment. Here are the details:
          </p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #27ae60; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Invoice Number:</td>
                <td style="padding: 10px 0; color: #333; text-align: right; font-weight: 600;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Payment Amount:</td>
                <td style="padding: 10px 0; color: #27ae60; text-align: right; font-size: 20px; font-weight: 700;">₹${paymentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Payment Date:</td>
                <td style="padding: 10px 0; color: #333; text-align: right;">${new Date(paymentDate).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Payment Method:</td>
                <td style="padding: 10px 0; color: #333; text-align: right;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Transaction ID:</td>
                <td style="padding: 10px 0; color: #3498db; text-align: right; font-family: monospace; font-size: 12px;">${transactionId}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/invoices/${invoiceId}" 
               style="background: #3498db; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Download Invoice
            </a>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #1976d2; font-size: 14px; line-height: 1.6;">
              📧 A copy of your invoice has been attached to this email for your records.
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #dee2e6; text-align: center;">
            <p style="color: #666; font-size: 15px; margin: 0 0 10px;">Thank you for your business!</p>
            <p style="color: #999; font-size: 13px; margin: 0;">
              ${firmName}
            </p>
          </div>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated payment confirmation. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: clientEmail,
      subject,
      html
    });
  }

  // 4. Send payment notification to admin
  async sendPaymentNotificationToAdmin({
    adminEmail,
    adminName,
    clientName,
    invoiceNumber,
    paymentAmount,
    paymentDate,
    paymentMethod,
    transactionId,
    invoiceId
  }) {
    const subject = `💰 Payment Received - ${clientName} - ₹${paymentAmount.toLocaleString('en-IN')}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💰 Payment Received</h1>
          <p style="color: #e8f5e9; margin: 10px 0 0; font-size: 16px;">Quote successfully converted to Invoice</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${adminName},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! A payment has been successfully processed and the quote has been automatically converted to an invoice.
          </p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #27ae60; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Client:</td>
                <td style="padding: 10px 0; color: #333; text-align: right; font-weight: 600;">${clientName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Invoice Number:</td>
                <td style="padding: 10px 0; color: #333; text-align: right;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Amount Paid:</td>
                <td style="padding: 10px 0; color: #27ae60; text-align: right; font-size: 20px; font-weight: 700;">₹${paymentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Payment Date:</td>
                <td style="padding: 10px 0; color: #333; text-align: right;">${new Date(paymentDate).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Method:</td>
                <td style="padding: 10px 0; color: #333; text-align: right;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 600;">Transaction ID:</td>
                <td style="padding: 10px 0; color: #3498db; text-align: right; font-family: monospace; font-size: 11px;">${transactionId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724; font-weight: 600;">✓ Automated Actions Completed:</p>
            <ul style="margin: 10px 0 0 20px; padding: 0; color: #155724;">
              <li style="margin: 5px 0;">Quote converted to Invoice</li>
              <li style="margin: 5px 0;">Payment marked as received</li>
              <li style="margin: 5px 0;">Client confirmation email sent</li>
              <li style="margin: 5px 0;">Analytics updated</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/invoices/${invoiceId}" 
               style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              View Invoice Details
            </a>
          </div>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CA Flow Board.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject,
      html
    });
  }
}

export default new EmailService();
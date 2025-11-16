import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import auth from '../middleware/auth.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import AIUsage from '../models/AIUsage.js';
import gstService from '../services/gstService.js';
import { logChatMessage, logFunctionCall } from '../utils/chatLogger.js';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Check if API key is configured
const isConfigured = () => {
  return process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE';
};

// Status endpoint to check AI configuration
router.get('/status', (req, res) => {
  res.json({
    configured: isConfigured(),
    message: isConfigured() 
      ? 'AI service is configured and ready' 
      : 'AI service requires configuration. Please set GEMINI_API_KEY in environment variables.'
  });
});

// Tighten rate limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 requests/minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer for optional attachments (memory storage)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 5 } });

// Utility: ensure an AI Assistant chat room exists for the user
async function ensureAssistantRoom(user) {
  let room = await ChatRoom.findOne({
    name: 'AI Assistant',
    type: 'general',
    'participants.user': user._id,
  });

  if (!room) {
    room = new ChatRoom({
      name: 'AI Assistant',
      type: 'general',
      description: 'Private AI assistant chat',
      participants: [{ user: user._id, role: 'admin', joinedAt: new Date() }],
      createdBy: user._id,
    });
    await room.save();
  }
  return room;
}

// Helper: map history from DB to Gemini contents format
function mapHistoryToContents(history) {
  const contents = [];
  for (const msg of history) {
    const role = msg.type === 'system' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: msg.content }] });
  }
  return contents;
}

// Helper: Gather user's firm data for context - FULL SYSTEM AWARENESS
async function gatherUserDataContext(user) {
  try {
    const firmId = user.firmId?._id || user.firmId;
    
    // By default exclude soft-deleted or archived data
    const clientQuery = { firmId, isDeleted: false };
    const taskQuery = { firm: firmId, isArchived: { $ne: true } };
    const invoiceQuery = { firm: firmId };

    // CRITICAL SECURITY: If the requesting user is an employee, restrict context to only their data
    if (user.role === 'employee') {
      // Employees can only see tasks assigned to them or that they created
      taskQuery.$or = [ 
        { assignedTo: user._id }, 
        { assignedBy: user._id },
        { collaborators: user._id }
      ];
      
      // Employees can only see invoices they created
      invoiceQuery.createdBy = user._id;
    }

    // Fetch tasks first to get client IDs for employees
    const tasks = await Task.find(taskQuery)
      .select('title status priority dueDate assignedTo client clientName firm')
      .populate('client', '_id')
      .sort({ createdAt: -1 });

    // CRITICAL SECURITY: For employees, restrict clients to only those with assigned tasks
    if (user.role === 'employee') {
      const clientIds = [...new Set(
        tasks
          .map(t => t.client?._id || t.client)
          .filter(Boolean)
      )];
      clientQuery._id = { $in: clientIds };
    }

    // Fetch remaining data
    const [clients, invoices, users] = await Promise.all([
      Client.find(clientQuery).select('name email phone status industry gstin createdAt').sort({ createdAt: -1 }),
      Invoice.find(invoiceQuery).select('invoiceNumber amount status dueDate clientName createdBy relatedTask').sort({ createdAt: -1 }),
      User.find({ firmId, role: { $in: ['owner', 'admin', 'employee'] } }).select('fullName email role department isOnline').sort({ role: 1 })
    ]);

    // Categorize clients
  const activeClients = clients.filter(c => c.status === 'active');
  const inactiveClients = clients.filter(c => c.status === 'inactive');
    
    // Categorize tasks
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'inprogress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed');
    
    // Categorize invoices
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'draft');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);

    // Build comprehensive context with ALL data
    const allClientsContext = clients.map((c, idx) => 
      `${idx + 1}. ${c.name} - ${c.status}${c.gstin ? ` (GSTIN: ${c.gstin})` : ''}${c.industry ? ` [${c.industry}]` : ''}`
    ).join('\n');

    const allTasksContext = tasks.slice(0, 20).map((t, idx) => 
      `${idx + 1}. ${t.title} - ${t.status} (${t.priority || 'normal'} priority)${t.dueDate ? ` Due: ${new Date(t.dueDate).toLocaleDateString()}` : ''}`
    ).join('\n');

    const allInvoicesContext = invoices.slice(0, 20).map((i, idx) => 
      `${idx + 1}. #${i.number} - ₹${i.amount?.toLocaleString()} - ${i.clientName || 'N/A'} [${i.status}]`
    ).join('\n');

    // Create role-specific context message
    const roleContext = user.role === 'employee' 
      ? `You are assisting ${user.fullName}, an EMPLOYEE at ${user.firmId?.name || 'the firm'}. 

⚠️ IMPORTANT: You can ONLY see and discuss:
• Tasks assigned to this employee (${tasks.length} tasks)
• Clients related to those tasks (${clients.length} clients)
• Invoices created by this employee (${invoices.length} invoices)

Do NOT provide information about other employees' tasks, clients, or firm-wide data that this employee doesn't have access to.`
      : `You are an AI assistant for ${user.firmId?.name || 'Your Firm'}, a Chartered Accountant firm. You have COMPLETE AWARENESS of the entire system as an admin/owner.`;

    return `
${roleContext}

═══════════════════════════════════════════════════════════════════════
${user.role === 'employee' ? 'YOUR ASSIGNED DATA' : 'FIRM OVERVIEW'}
═══════════════════════════════════════════════════════════════════════
• ${user.role === 'employee' ? 'Your' : 'Total'} Clients: ${clients.length} (${activeClients.length} active, ${inactiveClients.length} inactive)
• ${user.role === 'employee' ? 'Your' : 'Total'} Tasks: ${tasks.length} (${pendingTasks.length} pending, ${completedTasks.length} completed, ${overdueTasks.length} overdue)
• ${user.role === 'employee' ? 'Your' : 'Total'} Invoices: ${invoices.length} (${paidInvoices.length} paid, ${pendingInvoices.length} pending, ${overdueInvoices.length} overdue)
${user.role !== 'employee' ? `• Total Revenue: ₹${totalRevenue.toLocaleString()}\n• Team Members: ${users.length}` : ''}

═══════════════════════════════════════════════════════════════════════
${user.role === 'employee' ? 'YOUR ASSIGNED CLIENTS' : 'ALL CLIENTS'} (${clients.length} total)
═══════════════════════════════════════════════════════════════════════
${allClientsContext || 'No clients yet'}

═══════════════════════════════════════════════════════════════════════
${user.role === 'employee' ? 'YOUR TASKS' : 'RECENT TASKS'} (showing ${Math.min(tasks.length, 20)} of ${tasks.length})
═══════════════════════════════════════════════════════════════════════
${allTasksContext || 'No tasks yet'}
${tasks.length > 20 ? `\n... and ${tasks.length - 20} more tasks` : ''}

═══════════════════════════════════════════════════════════════════════
${user.role === 'employee' ? 'YOUR INVOICES' : 'RECENT INVOICES'} (showing ${Math.min(invoices.length, 20)} of ${invoices.length})
═══════════════════════════════════════════════════════════════════════
${allInvoicesContext || 'No invoices yet'}
${invoices.length > 20 ? `\n... and ${invoices.length - 20} more invoices` : ''}

${user.role !== 'employee' ? `═══════════════════════════════════════════════════════════════════════
TEAM MEMBERS (${users.length} total)
═══════════════════════════════════════════════════════════════════════
${users.map((u, idx) => `${idx + 1}. ${u.fullName} (${u.role}${u.department ? ` - ${u.department}` : ''}) - ${u.email}${u.isOnline ? ' 🟢 Online' : ''}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════
You have complete awareness of ALL clients, tasks, and invoices listed above. When asked about clients, tasks, or invoices:
1. You can list ALL of them (all ${clients.length} clients are shown above)
2. Provide accurate counts and statistics
3. Reference specific data points from the lists above
4. For detailed information, use the function calling tools (getClientData, listClients, etc.)
5. Be helpful, professional, and data-driven in your responses

If asked to "list clients", provide the complete list from the ALL CLIENTS section above. You are fully aware of the entire system!
`;
  } catch (error) {
    console.error('Error gathering user data context:', error);
    return 'You are an AI assistant for a Chartered Accountant firm. Help with queries about clients, tasks, invoices, and general CA firm operations.';
  }
}

// ==================== FUNCTION CALLING SYSTEM ====================

// Define function schemas for Gemini
const functionDeclarations = [
  {
    name: 'getGSTINData',
    description: 'Fetch comprehensive GSTIN (GST Identification Number) data including company details, filing status, financial years, and registration information. Use this when user asks about GST details, GSTIN lookup, company registration, filing status, or tax compliance.',
    parameters: {
      type: 'object',
      properties: {
        gstin: {
          type: 'string',
          description: 'The 15-character GSTIN to lookup (format: 2 digits + 10 alphanumeric PAN + 1 digit + 1 letter + Z + 1 alphanumeric). Example: 29ABCDE1234F1Z5'
        }
      },
      required: ['gstin']
    }
  },
  {
    name: 'getClientData',
    description: 'Retrieve detailed information about a specific client by name or ID. Returns client profile, contact details, business type, associated tasks, invoices, and status. Use when user asks about a specific client, their details, or contact information.',
    parameters: {
      type: 'object',
      properties: {
        clientNameOrId: {
          type: 'string',
          description: 'Client name (partial match supported) or MongoDB ObjectId of the client'
        }
      },
      required: ['clientNameOrId']
    }
  },
  {
    name: 'getClientOnlineStatus',
    description: 'Check which clients or team members are currently online and active in the system. Returns list of active users with their roles and last activity time.',
    parameters: {
      type: 'object',
      properties: {
        includeClients: {
          type: 'boolean',
          description: 'Include client users in the results (default: true)'
        },
        includeTeam: {
          type: 'boolean',
          description: 'Include team members (employees, admins) in the results (default: true)'
        }
      },
      required: []
    }
  },
  {
    name: 'getClientStats',
    description: 'Get comprehensive statistics about clients including total count, active/inactive breakdown, industry distribution, revenue by client, top clients, and growth metrics.',
    parameters: {
      type: 'object',
      properties: {
        timePeriod: {
          type: 'string',
          enum: ['week', 'month', 'quarter', 'year', 'all'],
          description: 'Time period for stats calculation (default: all)'
        }
      },
      required: []
    }
  },
  {
    name: 'getFeesData',
    description: 'Retrieve fee and revenue information including pending fees, collected fees, outstanding invoices, revenue breakdown by client/service, and payment status. Use for financial queries about fees, payments, or revenue.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'pending', 'paid', 'overdue'],
          description: 'Filter invoices by payment status (default: all)'
        },
        clientName: {
          type: 'string',
          description: 'Optional: Filter fees for a specific client'
        }
      },
      required: []
    }
  },
  {
    name: 'searchClients',
    description: 'Search for clients using flexible criteria including name, email, phone, GSTIN, industry, or status. Returns matching client list with basic details.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (searches across name, email, phone, GSTIN)'
        },
        industry: {
          type: 'string',
          description: 'Filter by industry/sector'
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'prospect', 'all'],
          description: 'Filter by client status'
        }
      },
      required: []
    }
  },
  {
    name: 'listClients',
    description: 'List all clients with pagination support. Use this when user asks to "list clients", "show all clients", "next N clients", "first N clients", or "clients from X to Y". Returns paginated list of clients.',
    parameters: {
      type: 'object',
      properties: {
        skip: {
          type: 'number',
          description: 'Number of clients to skip (for pagination). Default 0. Use skip=6 for "next 6", skip=12 for "next 6 after that", etc.'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of clients to return. Default 10. User might ask for 5, 6, 10, 20, etc.'
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'prospect', 'all'],
          description: 'Filter by client status. Default "all".'
        }
      },
      required: []
    }
  }
];

// Function handlers - execute the actual logic
const functionHandlers = {
  async getGSTINData({ gstin }, user) {
    console.log(`🔍 AI Function Call: getGSTINData for GSTIN: ${gstin}`);
    
    if (!gstService.validateGSTIN(gstin)) {
      return { 
        error: 'Invalid GSTIN format. Expected format: 29ABCDE1234F1Z5 (15 characters)',
        valid: false 
      };
    }

    try {
      const result = await gstService.getComprehensiveGSTInfo(gstin);
      
      if (result.success) {
        const data = result.data;
        return {
          success: true,
          gstin: gstin,
          companyName: data.taxpayerDetails.company_name || data.taxpayerDetails.lgnm,
          tradeName: data.taxpayerDetails.tradeName || data.taxpayerDetails.tradeNam,
          businessType: data.taxpayerDetails.businessType || data.taxpayerDetails.ctb,
          status: data.taxpayerDetails.status || data.taxpayerDetails.sts,
          registrationDate: data.taxpayerDetails.registrationDate || data.taxpayerDetails.rgdt,
          address: data.taxpayerDetails.address || data.taxpayerDetails.pradr?.adr,
          state: data.taxpayerDetails.state,
          pan: data.taxpayerDetails.pan,
          contactName: data.taxpayerDetails.contactName || 'Not available',
          email: data.taxpayerDetails.email || 'Not available',
          phone: data.taxpayerDetails.phone || 'Not available',
          yearsInBusiness: data.totalYearsInBusiness,
          filingDataAvailable: data.filingData?.length > 0,
          dataQuality: data.dataQuality
        };
      } else {
        return { 
          error: result.error || 'Failed to fetch GSTIN data',
          success: false 
        };
      }
    } catch (error) {
      console.error('Error in getGSTINData:', error);
      return { 
        error: `Failed to lookup GSTIN: ${error.message}`,
        success: false 
      };
    }
  },

  async getClientData({ clientNameOrId }, user) {
    console.log(`👤 AI Function Call: getClientData for: ${clientNameOrId}`);
    
    try {
      const firmId = user.firmId?._id || user.firmId;
      let client;

      // Try to find by ID first (exclude soft-deleted)
      if (clientNameOrId.match(/^[0-9a-fA-F]{24}$/)) {
        client = await Client.findOne({ _id: clientNameOrId, firmId, isDeleted: false })
          .populate('primaryContact')
          .lean();
      }

      // If not found, search by name (case-insensitive, partial match)
      if (!client) {
        client = await Client.findOne({ 
          firmId,
          isDeleted: false,
          name: { $regex: clientNameOrId, $options: 'i' }
        })
        .populate('primaryContact')
        .lean();
      }

      if (!client) {
        return { 
          error: `Client "${clientNameOrId}" not found`,
          success: false 
        };
      }

      // If the user is an employee, ensure they are allowed to access this client (only their clients)
      if (user.role === 'employee') {
        const relatedTask = await Task.findOne({ firm: firmId, client: client._id, $or: [{ assignedTo: user._id }, { assignedBy: user._id }] }).lean();
        if (!relatedTask && String(client.createdBy) !== String(user._id)) {
          return { error: 'Access denied: employees can only query clients related to them', success: false };
        }
      }

      // Get associated tasks and invoices
      const taskQuery = { firm: firmId, client: client._id, isArchived: { $ne: true } };
      const invoiceQuery = { firm: firmId, client: client._id };

      // Employees limited to their tasks/invoices
      if (user.role === 'employee') {
        taskQuery.$or = [{ assignedTo: user._id }, { assignedBy: user._id }];
        invoiceQuery.$or = [{ createdBy: user._id }];
      }

      const [tasks, invoices] = await Promise.all([
        Task.find(taskQuery).limit(10).lean(),
        Invoice.find(invoiceQuery).limit(10).lean()
      ]);

      return {
        success: true,
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          status: client.status,
          businessType: client.businessType,
          industry: client.industry,
          gstin: client.gstin || 'Not provided',
          pan: client.pan || 'Not provided',
          address: client.address || 'Not provided',
          contactName: client.contactName || client.primaryContact?.name || 'Not provided',
          createdAt: client.createdAt,
          notes: client.notes || 'No notes'
        },
        associatedTasks: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending' || t.status === 'inprogress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          recentTasks: tasks.slice(0, 5).map(t => ({
            title: t.title,
            status: t.status,
            dueDate: t.dueDate
          }))
        },
        associatedInvoices: {
          total: invoices.length,
          paid: invoices.filter(i => i.status === 'paid').length,
          pending: invoices.filter(i => i.status !== 'paid').length,
          totalAmount: invoices.reduce((sum, i) => sum + (i.amount || 0), 0),
          recentInvoices: invoices.slice(0, 5).map(i => ({
            number: i.invoiceNumber,
            amount: i.amount,
            status: i.status,
            dueDate: i.dueDate
          }))
        }
      };
    } catch (error) {
      console.error('Error in getClientData:', error);
      return { 
        error: `Failed to retrieve client data: ${error.message}`,
        success: false 
      };
    }
  },

  async getClientOnlineStatus({ includeClients = true, includeTeam = true }, user) {
    console.log(`🟢 AI Function Call: getClientOnlineStatus`);
    
    try {
      const firmId = user.firmId?._id || user.firmId;
      
      // Get users who have been active in the last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const query = { 
        firmId,
        lastActive: { $gte: fifteenMinutesAgo }
      };

      // Filter by role if needed
      if (!includeClients || !includeTeam) {
        query.role = includeClients 
          ? 'client' 
          : { $in: ['owner', 'admin', 'employee'] };
      }

      const activeUsers = await User.find(query)
        .select('name email role lastActive')
        .lean();

      return {
        success: true,
        onlineCount: activeUsers.length,
        onlineUsers: activeUsers.map(u => ({
          name: u.name,
          email: u.email,
          role: u.role,
          lastActive: u.lastActive,
          minutesAgo: Math.round((Date.now() - new Date(u.lastActive).getTime()) / 60000)
        })),
        criteria: 'Active in the last 15 minutes'
      };
    } catch (error) {
      console.error('Error in getClientOnlineStatus:', error);
      return { 
        error: `Failed to get online status: ${error.message}`,
        success: false 
      };
    }
  },

  async getClientStats({ timePeriod = 'all' }, user) {
    console.log(`📊 AI Function Call: getClientStats for period: ${timePeriod}`);
    
    try {
      const firmId = user.firmId?._id || user.firmId;
      
      // Calculate date range
      let dateFilter = {};
      if (timePeriod !== 'all') {
        const now = new Date();
        let startDate;
        switch (timePeriod) {
          case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
          case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
          case 'quarter': startDate = new Date(now.setMonth(now.getMonth() - 3)); break;
          case 'year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
        }
        dateFilter = { createdAt: { $gte: startDate } };
      }

      // Get clients data (exclude soft-deleted)
      const clients = await Client.find({ firmId, isDeleted: false, ...dateFilter }).lean();
      const allClients = await Client.find({ firmId, isDeleted: false }).lean();
      const invoices = await Invoice.find({ firm: firmId }).lean();

      // If employee, narrow scope to their related data
      if (user.role === 'employee') {
        const taskClientIds = await Task.find({ firm: firmId, $or: [{ assignedTo: user._id }, { assignedBy: user._id }] }).distinct('client');
        // Filter clients and invoices
        clients = clients.filter(c => taskClientIds.some(id => String(id) === String(c._id)) || String(c.createdBy) === String(user._id));
        allClients = allClients.filter(c => taskClientIds.some(id => String(id) === String(c._id)) || String(c.createdBy) === String(user._id));
        // Filter invoices to those created by the employee or related to their tasks
        const taskIds = await Task.find({ firm: firmId, $or: [{ assignedTo: user._id }, { assignedBy: user._id }] }).distinct('_id');
        invoices = invoices.filter(i => String(i.createdBy) === String(user._id) || (i.relatedTask && taskIds.some(tid => String(tid) === String(i.relatedTask))));
      }

      // Group by industry
      const industryBreakdown = clients.reduce((acc, c) => {
        const industry = c.industry || 'Uncategorized';
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {});

      // Calculate revenue per client
      const revenueByClient = {};
      invoices.forEach(inv => {
        if (inv.status === 'paid' && inv.clientName) {
          revenueByClient[inv.clientName] = (revenueByClient[inv.clientName] || 0) + (inv.amount || 0);
        }
      });

      const topClients = Object.entries(revenueByClient)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, revenue]) => ({ name, revenue }));

      return {
        success: true,
        timePeriod,
        totalClients: allClients.length,
        newClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active').length,
        inactiveClients: clients.filter(c => c.status === 'inactive').length,
        prospectClients: clients.filter(c => c.status === 'prospect').length,
        industryBreakdown,
        topClientsByRevenue: topClients,
        totalRevenue: Object.values(revenueByClient).reduce((a, b) => a + b, 0),
        averageRevenuePerClient: topClients.length > 0 
          ? Math.round(Object.values(revenueByClient).reduce((a, b) => a + b, 0) / topClients.length)
          : 0
      };
    } catch (error) {
      console.error('Error in getClientStats:', error);
      return { 
        error: `Failed to get client stats: ${error.message}`,
        success: false 
      };
    }
  },

  async getFeesData({ status = 'all', clientName }, user) {
    console.log(`💰 AI Function Call: getFeesData (status: ${status}, client: ${clientName || 'all'})`);
    
    try {
      const firmId = user.firmId?._id || user.firmId;
      
      let query = { firm: firmId };
      if (status !== 'all') {
        query.status = status;
      }
      if (clientName) {
        query.clientName = { $regex: clientName, $options: 'i' };
      }

      // Exclude invoices that relate to soft-deleted clients
      // If clientName is provided, attempt to find matching client and ensure not deleted
      if (clientName) {
        const client = await Client.findOne({ firmId, name: { $regex: clientName, $options: 'i' }, isDeleted: false }).lean();
        if (!client) {
          return { success: true, summary: { totalInvoices: 0 }, recentInvoices: [] };
        }
        query.client = client._id;
      }

      let invoices = await Invoice.find(query).lean();

      // If employee, restrict invoices to those created by them or related to their tasks
      if (user.role === 'employee') {
        const taskIds = await Task.find({ firm: firmId, $or: [{ assignedTo: user._id }, { assignedBy: user._id }] }).distinct('_id');
        invoices = invoices.filter(i => String(i.createdBy) === String(user._id) || (i.relatedTask && taskIds.some(tid => String(tid) === String(i.relatedTask))));
      }

      // Calculate stats
      const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
      const paidInvoices = invoices.filter(i => i.status === 'paid');
      const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'draft');
      const overdueInvoices = invoices.filter(i => i.status === 'overdue');

      const paidAmount = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
      const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
      const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

      return {
        success: true,
        filter: { status, clientName: clientName || 'all' },
        summary: {
          totalInvoices: invoices.length,
          totalAmount,
          paidCount: paidInvoices.length,
          paidAmount,
          pendingCount: pendingInvoices.length,
          pendingAmount,
          overdueCount: overdueInvoices.length,
          overdueAmount,
          collectionRate: invoices.length > 0 
            ? Math.round((paidInvoices.length / invoices.length) * 100) 
            : 0
        },
        recentInvoices: invoices.slice(0, 10).map(i => ({
          number: i.invoiceNumber,
          clientName: i.clientName,
          amount: i.amount,
          status: i.status,
          dueDate: i.dueDate,
          issuedDate: i.createdAt
        }))
      };
    } catch (error) {
      console.error('Error in getFeesData:', error);
      return { 
        error: `Failed to get fees data: ${error.message}`,
        success: false 
      };
    }
  },

  async searchClients({ query, industry, status = 'all' }, user) {
    console.log(`🔎 AI Function Call: searchClients (query: ${query}, industry: ${industry}, status: ${status})`);
    
    try {
      const firmId = user.firmId?._id || user.firmId;
      
  let searchQuery = { firmId, isDeleted: false };
      
      // Text search across multiple fields
      if (query) {
        searchQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
          { gstin: { $regex: query, $options: 'i' } }
        ];
      }
      
      if (industry) {
        searchQuery.industry = { $regex: industry, $options: 'i' };
      }
      
      if (status !== 'all') {
        searchQuery.status = status;
      }

      let clients = await Client.find(searchQuery)
        .limit(50)
        .select('name email phone status industry gstin businessType createdBy')
        .lean();

      // If employee, narrow to only clients related to them
      if (user.role === 'employee') {
        const taskClientIds = await Task.find({ firm: firmId, $or: [{ assignedTo: user._id }, { assignedBy: user._id }] }).distinct('client');
        clients = clients.filter(c => taskClientIds.some(id => String(id) === String(c._id)) || String(c.createdBy) === String(user._id));
      }

      return {
        success: true,
        matchCount: clients.length,
        searchCriteria: { query: query || 'none', industry: industry || 'all', status },
        clients: clients.map(c => ({
          id: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          status: c.status,
          industry: c.industry || 'Not specified',
          gstin: c.gstin || 'Not provided',
          businessType: c.businessType || 'Not specified'
        }))
      };
    } catch (error) {
      console.error('Error in searchClients:', error);
      return { 
        error: `Failed to search clients: ${error.message}`,
        success: false 
      };
    }
  },

  async listClients({ skip = 0, limit = 10, status = 'all' }, user) {
    console.log(`📋 AI Function Call: listClients (skip: ${skip}, limit: ${limit}, status: ${status})`);
    
    try {
      const firmId = user.firmId?._id || user.firmId;
      
      let query = { firmId, isDeleted: false };
      if (status !== 'all') {
        query.status = status;
      }

      // Get total count for pagination info
  const totalCount = await Client.countDocuments(query);
      
      // Get paginated clients
      const clients = await Client.find(query)
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .select('name email phone status industry gstin businessType createdAt')
        .lean();
      
      // If user is employee, filter clients to only those related to their tasks or created by them
      let filteredClients = clients;
      if (user.role === 'employee') {
        const taskClientIds = await Task.find({ firm: firmId, $or: [{ assignedTo: user._id }, { assignedBy: user._id }]}).distinct('client');
        filteredClients = clients.filter(c => taskClientIds.some(id => String(id) === String(c._id)) || String(c.createdBy) === String(user._id));
      }

      return {
        success: true,
        totalClients: totalCount,
        returnedCount: clients.length,
        skip,
        limit,
        hasMore: (skip + clients.length) < totalCount,
        nextSkip: skip + clients.length,
        clients: clients.map((c, idx) => ({
          number: skip + idx + 1, // Sequential number
          id: c._id,
          name: c.name,
          email: c.email || 'Not provided',
          phone: c.phone || 'Not provided',
          status: c.status,
          industry: c.industry || 'Not specified',
          gstin: c.gstin || 'Not provided',
          businessType: c.businessType || 'Not specified',
          addedDate: c.createdAt
        }))
      };
    } catch (error) {
      console.error('Error in listClients:', error);
      return { 
        error: `Failed to list clients: ${error.message}`,
        success: false 
      };
    }
  }
};

// Execute a function call
async function executeFunction(functionCall, user) {
  const { name, args } = functionCall;
  console.log(`⚡ Executing function: ${name}`, args);
  
  const handler = functionHandlers[name];
  if (!handler) {
    const error = { error: `Function ${name} not found` };
    logFunctionCall(user, name, args, error);
    return error;
  }
  
  try {
    const result = await handler(args, user);
    
    // Log function call (encrypted)
    logFunctionCall(user, name, args, result);
    
    return result;
  } catch (error) {
    console.error(`Error executing function ${name}:`, error);
    const errorResult = { error: `Function execution failed: ${error.message}` };
    logFunctionCall(user, name, args, errorResult);
    return errorResult;
  }
}

// ==================== END FUNCTION CALLING SYSTEM ====================

router.post('/chat', auth, aiLimiter, async (req, res) => {
  const { prompt, privacy } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  if (!isConfigured()) {
    return res.status(503).json({ 
      message: 'AI service is not configured. Please set up GEMINI_API_KEY in environment variables.' 
    });
  }

  const startTime = Date.now();
  let usageRecord = null;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const user = req.user;
    const firmId = user.firmId._id || user.firmId;

    // Create usage record
    usageRecord = new AIUsage({
      user: user._id,
      firm: firmId,
      query: prompt,
      queryType: 'chat',
      privacy,
      metadata: {
        model: GEMINI_MODEL,
        endpoint: '/api/ai/chat',
        userAgent: req.headers['user-agent']
      }
    });

    // Gather user's firm data context
    const dataContext = await gatherUserDataContext(user);

    // Optionally include recent history (last 8) if privacy toggle is off
    let contents = [];
    
    // Add system context
    contents.push({
      role: 'user',
      parts: [{ text: dataContext }]
    });
    
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand. I have access to your firm\'s data and I\'m ready to help.' }]
    });
    
    if (!privacy) {
      const room = await ensureAssistantRoom(user);
      const history = await ChatMessage.find({ room: room._id }).sort({ createdAt: -1 }).limit(8).sort({ createdAt: 1 });
      const historyContents = mapHistoryToContents(history);
      contents.push(...historyContents);
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Update usage record
    usageRecord.response = text.substring(0, 500); // Store truncated response
    usageRecord.responseTime = responseTime;
    usageRecord.status = 'success';
    await usageRecord.save();

    // Persist history only if privacy is off
    if (!privacy) {
      const room = await ensureAssistantRoom(user);
      const userMsg = new ChatMessage({ room: room._id, sender: user._id, content: prompt, type: 'text' });
      const aiMsg = new ChatMessage({ room: room._id, sender: user._id, content: text, type: 'system' });
      await userMsg.save();
      await aiMsg.save();
      room.lastMessage = aiMsg._id;
      await room.save();
    }

    res.json({ response: text });
  } catch (error) {
    console.error('Error with Gemini API:', error);
    
    // Log error in usage record
    if (usageRecord) {
      usageRecord.status = 'error';
      usageRecord.errorMessage = error.message;
      usageRecord.responseTime = Date.now() - startTime;
      await usageRecord.save().catch(err => console.error('Failed to save error usage record:', err));
    }
    
    res.status(500).json({ message: 'Failed to get response from AI' });
  }
});

// Streaming endpoint with function calling support
router.post('/chat/stream', auth, aiLimiter, upload.array('attachments'), async (req, res) => {
  // Allow both JSON and multipart/form-data
  const privacy = (req.body.privacy === 'true' || req.body.privacy === true);
  const prompt = req.body.prompt || (req.body && req.body.text);

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  if (!isConfigured()) {
    return res.status(503).json({ 
      message: 'AI service is not configured. Please set up GEMINI_API_KEY in environment variables.' 
    });
  }

  const startTime = Date.now();
  let usageRecord = null;
  const functionsCalled = [];

  try {
    // Initialize model with function calling
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      tools: [{ functionDeclarations }]
    });
    const user = req.user;
    const firmId = user.firmId._id || user.firmId;

    // Create usage record
    usageRecord = new AIUsage({
      user: user._id,
      firm: firmId,
      query: prompt,
      queryType: 'chat',
      privacy,
      metadata: {
        model: GEMINI_MODEL,
        endpoint: '/api/ai/chat/stream',
        userAgent: req.headers['user-agent']
      }
    });

    // Gather user's firm data context
    const dataContext = await gatherUserDataContext(user);

    // Build contents with optional history when privacy is off
    let contents = [];
    
    // Add system context as the first message
    contents.push({
      role: 'user',
      parts: [{ text: dataContext }]
    });
    
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand. I have access to your firm\'s data and I can also call functions to lookup GSTIN data, client information, online status, statistics, and fees. I\'m ready to help you with any questions. How can I assist you today?' }]
    });
    
    if (!privacy) {
      const room = await ensureAssistantRoom(user);
      const history = await ChatMessage.find({ room: room._id }).sort({ createdAt: -1 }).limit(8).sort({ createdAt: 1 });
      const historyContents = mapHistoryToContents(history);
      contents.push(...historyContents);
    }

    // Add user prompt part
    const userParts = [{ text: prompt }];

    // Inline attachments (images only for now)
    const files = req.files || [];
    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        const base64 = file.buffer.toString('base64');
        userParts.push({ inlineData: { data: base64, mimeType: file.mimetype } });
      }
    }

    contents.push({ role: 'user', parts: userParts });

    // Start streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders?.();

    // Persist the user message early (if privacy off)
    let room;
    if (!privacy) {
      room = await ensureAssistantRoom(user);
      await new ChatMessage({ room: room._id, sender: user._id, content: prompt, type: 'text' }).save();
    }

    // Log user message (encrypted to chatlog.log)
    logChatMessage(user, prompt, 'user');

    let fullText = '';
    let maxIterations = 5; // Prevent infinite loops
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      
      const result = await model.generateContent({ contents });
      const response = result.response;
      
      // Check if there are function calls
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        console.log(`🔧 AI wants to call ${functionCalls.length} function(s)`);
        
        // Execute all function calls
        const functionResponses = [];
        for (const fc of functionCalls) {
          const functionResult = await executeFunction(fc, user);
          functionResponses.push({
            name: fc.name,
            response: functionResult
          });
          
          // Track function call
          functionsCalled.push({
            name: fc.name,
            arguments: fc.args,
            timestamp: new Date()
          });
          
          // Stream a notification to user that function was called
          const notification = `\n\n[🔍 Called function: ${fc.name}]\n\n`;
          res.write(notification);
          fullText += notification;
        }
        
        // Add model's function call request to history
        contents.push({
          role: 'model',
          parts: functionCalls.map(fc => ({
            functionCall: { name: fc.name, args: fc.args }
          }))
        });
        
        // Add function responses to history
        contents.push({
          role: 'user',
          parts: functionResponses.map(fr => ({
            functionResponse: { name: fr.name, response: fr.response }
          }))
        });
        
        // Continue to get final response with function results
        continue;
      }
      
      // No function calls, stream the text response
      const text = response.text();
      if (text) {
        fullText += text;
        res.write(text);
      }
      
      break; // Exit loop after getting final text response
    }

    res.end();

    // Calculate response time and save usage record
    const responseTime = Date.now() - startTime;
    usageRecord.response = fullText.substring(0, 500); // Store truncated response
    usageRecord.responseTime = responseTime;
    usageRecord.status = 'success';
    usageRecord.functionsCalled = functionsCalled;
    await usageRecord.save();

    // Log AI response (encrypted to chatlog.log)
    logChatMessage(user, fullText, 'ai');

    // Persist AI response if privacy is off
    if (!privacy && room) {
      const aiMsg = new ChatMessage({ 
        room: room._id, 
        sender: user._id, 
        content: fullText, 
        type: 'system' 
      });
      await aiMsg.save();
      room.lastMessage = aiMsg._id;
      await room.save();
    }

  } catch (error) {
    console.error('Error with Gemini streaming API:', error);
    
    // Log error in usage record
    if (usageRecord) {
      usageRecord.status = 'error';
      usageRecord.errorMessage = error.message;
      usageRecord.responseTime = Date.now() - startTime;
      usageRecord.functionsCalled = functionsCalled;
      await usageRecord.save().catch(err => console.error('Failed to save error usage record:', err));
    }
    
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to get streaming response from AI' });
    } else {
      res.write('\n\n[❌ Error: AI service encountered an issue]');
      res.end();
    }
  }
});

router.post('/summary', auth, aiLimiter, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ 
      message: 'AI service is not configured. Please set up GEMINI_API_KEY in environment variables.' 
    });
  }

  try {
    const firmId = req.user.firmId._id;
    
    // Gather data from different collections
    const [clients, tasks, invoices, users] = await Promise.all([
      Client.find({ firmId }).limit(10),
      Task.find({ firm: firmId }).limit(10),
      Invoice.find({ firm: firmId }).limit(10),
      User.find({ firmId }).limit(10)
    ]);

    // Create a summary of the data
    const dataOverview = {
      clients: {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        sample: clients.slice(0, 3).map(c => ({ name: c.name, status: c.status }))
      },
      tasks: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        sample: tasks.slice(0, 3).map(t => ({ title: t.title, status: t.status, priority: t.priority }))
      },
      invoices: {
        total: invoices.length,
        paid: invoices.filter(i => i.status === 'paid').length,
        overdue: invoices.filter(i => i.status === 'overdue').length,
        totalAmount: invoices.reduce((sum, i) => sum + (i.amount || 0), 0)
      },
      users: {
        total: users.length,
        active: users.filter(u => u.isActive).length
      }
    };

    const prompt = `Generate a business summary for a CA firm based on this data: ${JSON.stringify(dataOverview)}. 
    Focus on key insights, trends, and actionable recommendations. Keep it concise but informative.`;

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      success: true, 
      summary: text,
      data: dataOverview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ message: 'Failed to generate AI summary' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const room = await ensureAssistantRoom(req.user);
    const messages = await ChatMessage.find({ room: room._id })
      .sort({ createdAt: 1 })
      .select('content type createdAt');

    const history = messages.map(m => ({
      sender: m.type === 'system' ? 'ai' : 'user',
      text: m.content,
      createdAt: m.createdAt
    }));

    res.json({ success: true, history });
  } catch (err) {
    console.error('Error fetching AI history:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch AI history' });
  }
});

// Clear history endpoint (respects privacy on client side)
router.delete('/history', auth, async (req, res) => {
  try {
    const room = await ensureAssistantRoom(req.user);
    await ChatMessage.deleteMany({ room: room._id });
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing AI history:', err);
    res.status(500).json({ success: false, message: 'Failed to clear AI history' });
  }
});

// @desc    Get AI usage analytics
// @route   GET /api/ai/analytics
// @access  Private (Owner/Admin)
router.get('/analytics', auth, async (req, res) => {
  try {
    const { timeRange = '30days', userRole } = req.query;
    const firmId = req.user.firmId._id || req.user.firmId;

    // Only owners and admins can view analytics
    if (!['owner', 'superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only owners and admins can view AI analytics.' 
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Base query for firm
    const baseQuery = {
      firm: firmId,
      createdAt: { $gte: startDate }
    };

    // Get all usage data
    const allUsage = await AIUsage.find(baseQuery)
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalQueries = allUsage.length;
    const successfulQueries = allUsage.filter(u => u.status === 'success').length;
    const failedQueries = allUsage.filter(u => u.status === 'error').length;
    const successRate = totalQueries > 0 ? ((successfulQueries / totalQueries) * 100).toFixed(1) : 0;

    // Average response time (only successful queries)
    const responseTimes = allUsage
      .filter(u => u.status === 'success' && u.responseTime)
      .map(u => u.responseTime);
    const averageResponseTime = responseTimes.length > 0
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(2)
      : 0;

    // Top queries (group by query text, take top 10)
    const queryFrequency = {};
    allUsage.forEach(usage => {
      const query = usage.query.substring(0, 100); // Truncate long queries
      queryFrequency[query] = (queryFrequency[query] || 0) + 1;
    });

    const topQueries = Object.entries(queryFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Usage by user role
    const usageByRole = {};
    allUsage.forEach(usage => {
      const role = usage.user?.role || 'unknown';
      usageByRole[role] = (usageByRole[role] || 0) + 1;
    });

    const usageByUser = Object.entries(usageByRole).map(([role, queries]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      queries
    }));

    // Usage over time (daily for last 30 days)
    const usageOverTime = [];
    const daysToShow = timeRange === '7days' ? 7 : timeRange === '90days' ? 90 : 30;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const count = allUsage.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= date && createdAt < nextDate;
      }).length;
      
      usageOverTime.push({
        date: date.toISOString().split('T')[0],
        queries: count
      });
    }

    // Most active users
    const userActivity = {};
    allUsage.forEach(usage => {
      const userId = usage.user?._id?.toString();
      const userName = usage.user?.fullName || 'Unknown User';
      
      if (userId) {
        if (!userActivity[userId]) {
          userActivity[userId] = { name: userName, queries: 0, role: usage.user?.role };
        }
        userActivity[userId].queries++;
      }
    });

    const topUsers = Object.values(userActivity)
      .sort((a, b) => b.queries - a.queries)
      .slice(0, 10);

    // Query types breakdown
    const queryTypes = {};
    allUsage.forEach(usage => {
      const type = usage.queryType || 'chat';
      queryTypes[type] = (queryTypes[type] || 0) + 1;
    });

    // Function calls statistics
    const functionCalls = {};
    allUsage.forEach(usage => {
      if (usage.functionsCalled && usage.functionsCalled.length > 0) {
        usage.functionsCalled.forEach(fn => {
          functionCalls[fn.name] = (functionCalls[fn.name] || 0) + 1;
        });
      }
    });

    const topFunctions = Object.entries(functionCalls)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      success: true,
      data: {
        summary: {
          totalQueries,
          totalResponses: successfulQueries,
          failedQueries,
          successRate: parseFloat(successRate),
          averageResponseTime: parseFloat(averageResponseTime),
          timeRange,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        },
        topQueries,
        usageByUser,
        usageOverTime,
        topUsers,
        queryTypes,
        topFunctions
      }
    });

  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI analytics',
      error: error.message
    });
  }
});

// @desc    AI chat response in room context (@AI mentions)
// @route   POST /api/ai/chat/room
// @access  Private
router.post('/chat/room', auth, aiLimiter, async (req, res) => {
  const { roomId, message, taskId } = req.body;

  if (!message || !roomId) {
    return res.status(400).json({ 
      success: false,
      message: 'Message and roomId are required' 
    });
  }

  if (!isConfigured()) {
    return res.status(503).json({ 
      success: false,
      message: 'AI service is not configured. Please set up GEMINI_API_KEY in environment variables.' 
    });
  }

  const startTime = Date.now();
  let usageRecord = null;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const user = req.user;
    const firmId = user.firmId._id || user.firmId;

    // Create usage record
    usageRecord = new AIUsage({
      user: user._id,
      firm: firmId,
      query: message,
      queryType: 'chat',
      privacy: false,
      metadata: {
        model: GEMINI_MODEL,
        endpoint: '/api/ai/chat/room',
        userAgent: req.headers['user-agent'],
        roomId,
        taskId
      }
    });

    // Verify user is participant in the room
    const room = await ChatRoom.findOne({
      _id: roomId,
      'participants.user': user._id
    }).populate('participants.user', 'fullName email role');

    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found or you are not a participant' 
      });
    }

    // Build context
    let contextParts = [];

    // 1. System context with firm data
    const dataContext = await gatherUserDataContext(user);
    contextParts.push(`SYSTEM CONTEXT:\n${dataContext}`);

    // 2. Room context
    const roomContext = `\nROOM CONTEXT:\n- Room Name: ${room.name}\n- Room Type: ${room.type}\n- Participants: ${room.participants.map(p => p.user.fullName).join(', ')}`;
    contextParts.push(roomContext);

    // 3. Task context (if this is a task chat)
    if (taskId) {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'fullName email')
        .populate('collaborators', 'fullName email')
        .populate('client', 'fullName companyName');
      
      if (task) {
        const taskContext = `\nTASK CONTEXT:\n- Title: ${task.title}\n- Status: ${task.status}\n- Priority: ${task.priority}\n- Due Date: ${task.dueDate}\n- Assigned To: ${task.assignedTo?.fullName || 'Unassigned'}\n- Client: ${task.client?.fullName || task.client?.companyName || 'No client'}\n- Description: ${task.description || 'No description'}`;
        contextParts.push(taskContext);
      }
    }

    // 4. Recent chat history (last 30 messages)
    const recentMessages = await ChatMessage.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'fullName role')
      .sort({ createdAt: 1 }); // Re-sort chronologically

    if (recentMessages.length > 0) {
      const chatHistory = recentMessages
        .map(msg => `${msg.sender.fullName} (${msg.sender.role}): ${msg.content}`)
        .join('\n');
      contextParts.push(`\nRECENT CHAT HISTORY:\n${chatHistory}`);
    }

    // Build Gemini contents
    let contents = [];
    
    // Add context as initial message
    contents.push({
      role: 'user',
      parts: [{ text: contextParts.join('\n\n') }]
    });
    
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand. I have full context of the conversation, task details, and firm data. How can I help?' }]
    });

    // Add user's query
    contents.push({ 
      role: 'user', 
      parts: [{ text: message }] 
    });

    // Generate response
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const aiResponse = response.text();

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Update usage record
    usageRecord.response = aiResponse.substring(0, 500);
    usageRecord.responseTime = responseTime;
    usageRecord.status = 'success';
    await usageRecord.save();

    // Save AI response as chat message
    const aiMessage = new ChatMessage({
      room: roomId,
      sender: user._id, // AI messages attributed to the user who invoked it
      content: aiResponse,
      type: 'ai',
      readBy: [{ user: user._id, readAt: new Date() }]
    });
    await aiMessage.save();
    await aiMessage.populate('sender', 'fullName email avatar role');

    // Update room's last message
    room.lastMessage = aiMessage._id;
    room.updatedAt = new Date();
    await room.save();

    // Broadcast via WebSocket
    const chatWS = req.app.get('chatWS');
    if (chatWS) {
      chatWS.broadcast({
        type: 'new_message',
        roomId,
        message: aiMessage
      });
    }

    res.json({
      success: true,
      message: aiMessage,
      responseTime
    });

  } catch (error) {
    console.error('Error with AI room chat:', error);
    
    // Log error in usage record
    if (usageRecord) {
      usageRecord.status = 'error';
      usageRecord.errorMessage = error.message;
      usageRecord.responseTime = Date.now() - startTime;
      await usageRecord.save().catch(err => console.error('Failed to save error usage record:', err));
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to get AI response',
      error: error.message 
    });
  }
});

export default router;

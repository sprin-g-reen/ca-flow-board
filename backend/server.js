import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables BEFORE any other imports
const envPath = path.join(__dirname, '../.env');
console.log('📁 Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('🔑 RAZORPAY_KEY_ID after load:', process.env.RAZORPAY_KEY_ID || 'NOT SET');
console.log('🔑 RAZORPAY_ACCOUNT_1_KEY_ID after load:', process.env.RAZORPAY_ACCOUNT_1_KEY_ID || 'NOT SET');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import clientRoutes from './routes/clients.js';
import taskRoutes from './routes/tasks.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';
import dashboardRoutes from './routes/dashboard.js';
import documentRoutes from './routes/documents.js';
import communicationRoutes from './routes/communications.js';
import contactRoutes from './routes/contacts.js';
import automationRoutes from './routes/automation.js';
import gstRoutes from './routes/gst.js';
import settingsRoutes from './routes/settings.js';
import cinRoutes from './routes/cin.js';
import layoutRoutes from './routes/layouts.js';
import templateRoutes from './routes/templates.js';
import notificationRoutes from './routes/notifications.js';
import recurrencePatternRoutes from './routes/recurrencePatterns.js';
import chatRoutes from './routes/chat.js';
import viewRoutes from './routes/views.js';
import vitalsRoutes from './routes/vitals.js';
import aiRoutes from './routes/ai.js';
import recycleBinRoutes from './routes/recycleBin.js';
import reportsRoutes from './routes/reports.js';
import logsRoutes from './routes/logs.js';
import twoFactorRoutes from './routes/twoFactor.js';
import auditLogsRoutes from './routes/auditLogs.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { seedTemplatesForAllFirms } from './seeds/index.js';
import chatWebSocketService from './services/chatWebSocket.js';
import taskWebSocketService from './services/taskWebSocket.js';
import automationScheduler from './services/automationScheduler.js';
import recurringTaskService from './services/recurringTaskService.js';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and seed templa
// tes
const initializeApp = async () => {
  try {
    await connectDB();
    
    // Check if we need to seed templates
    const TaskTemplate = (await import('./models/TaskTemplate.js')).default;
    const Firm = (await import('./models/Firm.js')).default;
    
    const firmCount = await Firm.countDocuments();
    
    if (firmCount === 0) {
      console.log('ℹ️  No firms found. Templates will be seeded after firm creation.');
      return;
    }
    
    // Check if any firm is missing templates
    const firms = await Firm.find({ isActive: true });
    let firmsNeedingTemplates = 0;
    
    for (const firm of firms) {
      const firmTemplateCount = await TaskTemplate.countDocuments({ 
        firm: firm._id, 
        is_deleted: false 
      });
      if (firmTemplateCount === 0) {
        firmsNeedingTemplates++;
      }
    }
    
    if (firmsNeedingTemplates > 0) {
      console.log(`📝 ${firmsNeedingTemplates} firm(s) need templates. Seeding...`);
      const result = await seedTemplatesForAllFirms();
      if (result.success && result.seeded > 0) {
        console.log(`✅ Successfully seeded templates for ${result.seeded} firm(s)`);
      }
    } else {
      const totalTemplates = await TaskTemplate.countDocuments({ is_deleted: false });
      console.log(`📊 All firms have templates. Total: ${totalTemplates} templates across ${firmCount} firms`);
    }
    
    // Initialize automation scheduler
    console.log('🤖 Starting automation scheduler...');
    await automationScheduler.initialize();
    
    // Initialize recurring task service
    console.log('🔄 Starting recurring task service...');
    await recurringTaskService.initialize();
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};

// Initialize app and start server
const startServer = async () => {
  await initializeApp();

  // Create HTTP server and initialize WebSocket
  const server = createServer(app);

  // Initialize chat WebSocket service
  chatWebSocketService.initialize(server);
  chatWebSocketService.startHealthCheck();

  // Initialize task WebSocket service
  taskWebSocketService.initialize(server);
  taskWebSocketService.startHealthCheck();

  // Make WebSocket services available to routes
  app.set('chatWS', chatWebSocketService);
  app.set('taskWS', taskWebSocketService);

  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CA Flow Board backend server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🔗 WebSocket server ready for chat connections`);
    console.log(`🔗 WebSocket server ready for task updates`);
    console.log(`🌍 Server accessible on all network interfaces (0.0.0.0)`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('📛 Shutdown signal received: closing HTTP server and stopping schedulers');
    automationScheduler.stopAll();
    recurringTaskService.stopAll();
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60) // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply CORS EARLY to ensure preflight passes and headers are set
app.use(cors(corsOptions));
// Explicitly handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Development fallback: ensure CORS headers are present on ALL /api responses
// This helps when some error paths or middleware return responses without the CORS headers
// and avoids 'No Access-Control-Allow-Origin header is present' in dev environments.
app.use('/api', (req, res, next) => {
  try {
    const origin = req.headers.origin || '';
    // Mirror the request origin (preferred) or fall back to '*' for local dev
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', Array.isArray(corsOptions.allowedHeaders) ? corsOptions.allowedHeaders.join(', ') : (corsOptions.allowedHeaders || 'Content-Type, Authorization'));
    res.setHeader('Access-Control-Allow-Methods', Array.isArray(corsOptions.methods) ? corsOptions.methods.join(', ') : (corsOptions.methods || 'GET,POST,PUT,DELETE,OPTIONS'));
  } catch (e) {
    // no-op; header setting should not break the request flow
  }
  next();
});

// Apply rate limiting to API routes (but not health checks)
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for health and cors-test endpoints
  if (req.path === '/health' || req.path === '/cors-test') {
    return next();
  }
  return limiter(req, res, next);
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend server is running', 
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.headers.origin,
      allowedOrigins: corsOptions.origin
    }
  });
});

app.get('/api/cors-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'CORS is working correctly', 
    headers: {
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cin', cinRoutes);
app.use('/api/layouts', layoutRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recurrence-patterns', recurrencePatternRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/views', viewRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recycle-bin', recycleBinRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'CA Flow Board API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// CORS debug endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    message: 'CORS is working correctly',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: {
      'Access-Control-Allow-Origin': res.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.get('Access-Control-Allow-Headers')
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
startServer();

export default app;
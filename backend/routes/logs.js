import express from 'express';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get MongoDB operation logs (using change streams and profiling)
router.get('/operations', auth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    // Get recent operations from system profile collection
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // Try to get profiling data
    let operations = [];
    try {
      const profileCollection = db.collection('system.profile');
      operations = await profileCollection
        .find({})
        .sort({ ts: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .toArray();
    } catch (profileError) {
      console.log('Profiling not enabled, using operation stats instead');
    }
    
    // If profiling is not available, provide current operation stats
    if (operations.length === 0) {
      try {
        const currentOps = await adminDb.command({ currentOp: 1 });
        operations = currentOps.inprog || [];
      } catch (opsError) {
        console.log('Cannot get current operations:', opsError.message);
      }
    }
    
    res.json({ 
      success: true, 
      data: operations,
      note: operations.length === 0 ? 'Enable MongoDB profiling to see detailed logs' : null
    });
  } catch (err) {
    console.error('Get operations error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get connection stats
router.get('/stats', auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // Get server status
    const serverStatus = await adminDb.command({ serverStatus: 1 });
    
    // Get database stats
    const dbStats = await db.stats();
    
    // Extract useful metrics
    const stats = {
      connections: {
        current: serverStatus.connections?.current || 0,
        available: serverStatus.connections?.available || 0,
        totalCreated: serverStatus.connections?.totalCreated || 0,
      },
      operations: {
        insert: serverStatus.opcounters?.insert || 0,
        query: serverStatus.opcounters?.query || 0,
        update: serverStatus.opcounters?.update || 0,
        delete: serverStatus.opcounters?.delete || 0,
        getmore: serverStatus.opcounters?.getmore || 0,
        command: serverStatus.opcounters?.command || 0,
      },
      network: {
        bytesIn: serverStatus.network?.bytesIn || 0,
        bytesOut: serverStatus.network?.bytesOut || 0,
        numRequests: serverStatus.network?.numRequests || 0,
      },
      memory: {
        resident: serverStatus.mem?.resident || 0,
        virtual: serverStatus.mem?.virtual || 0,
      },
      database: {
        collections: dbStats.collections || 0,
        dataSize: dbStats.dataSize || 0,
        storageSize: dbStats.storageSize || 0,
        indexes: dbStats.indexes || 0,
        indexSize: dbStats.indexSize || 0,
        documents: dbStats.objects || 0,
      },
      uptime: serverStatus.uptime || 0,
      version: serverStatus.version || 'unknown',
    };
    
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get recent database activities (from our application perspective)
router.get('/activities', auth, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const db = mongoose.connection.db;
    
    // Get collections
    const collections = await db.listCollections().toArray();
    
    // Get recent documents from each collection with timestamps
    const activities = [];
    
    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (collName.startsWith('system.')) continue; // Skip system collections
      
      try {
        const collection = db.collection(collName);
        
        // Get recent documents with more details
        const recentDocs = await collection
          .find({})
          .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
          .limit(5)
          .toArray();
        
        for (const doc of recentDocs) {
          const timestamp = doc.updatedAt || doc.createdAt || doc._id.getTimestamp();
          const createdAt = doc.createdAt || doc._id.getTimestamp();
          const isUpdate = doc.updatedAt && doc.createdAt && 
                          new Date(doc.updatedAt).getTime() > new Date(doc.createdAt).getTime();
          
          // Calculate execution time (difference between created and updated)
          let executionTime = 0;
          if (isUpdate && doc.createdAt && doc.updatedAt) {
            executionTime = new Date(doc.updatedAt).getTime() - new Date(doc.createdAt).getTime();
          }
          
          // Extract meaningful data based on collection type
          let dataPreview = '';
          let userInfo = '';
          
          if (collName === 'users') {
            dataPreview = doc.email || doc.username || 'User record';
            userInfo = doc.profiles?.full_name || doc.employee_id || '';
          } else if (collName === 'clients') {
            dataPreview = doc.name || 'Client record';
            userInfo = doc.email || doc.phone || '';
          } else if (collName === 'tasks') {
            dataPreview = doc.title || 'Task record';
            userInfo = doc.status || '';
          } else if (collName === 'invoices') {
            dataPreview = `Invoice #${doc.invoice_id || doc._id}`;
            userInfo = doc.total_amount ? `₹${doc.total_amount}` : '';
          } else if (collName === 'payments') {
            dataPreview = `Payment #${doc.payment_id || doc._id}`;
            userInfo = doc.amount ? `₹${doc.amount}` : '';
          } else if (collName === 'clientdocuments') {
            dataPreview = doc.title || doc.file_name || 'Document';
            userInfo = doc.file_type || '';
          } else if (collName === 'chatmessages') {
            dataPreview = doc.message ? doc.message.substring(0, 50) + '...' : 'Message';
            userInfo = doc.sender_name || '';
          } else {
            // Generic preview for other collections
            dataPreview = doc.name || doc.title || doc.description || 
                         (doc.status ? `Status: ${doc.status}` : 'Record');
            userInfo = doc.type || '';
          }
          
          // Get document size
          const docSize = JSON.stringify(doc).length;
          
          activities.push({
            collection: collName,
            timestamp,
            operation: isUpdate ? 'update' : 'insert',
            dataPreview,
            details: userInfo,
            executionTime: executionTime > 0 ? executionTime : null,
            size: docSize,
            affectedFields: Object.keys(doc).length,
          });
        }
      } catch (collError) {
        // Skip collections that cause errors
        continue;
      }
    }
    
    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ 
      success: true, 
      data: activities.slice(0, parseInt(limit)) 
    });
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

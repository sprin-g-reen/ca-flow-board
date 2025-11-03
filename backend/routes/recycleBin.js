import express from 'express';
import auth from '../middleware/auth.js';
import Client from '../models/Client.js';
import ClientDocument from '../models/ClientDocument.js';
import User from '../models/User.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Helper to get file size
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

// Helper to scan uploads directory for orphaned files
const scanOrphanedFiles = async (firmId) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const files = await fs.readdir(uploadsDir, { withFileTypes: true });
    const orphaned = [];

    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(uploadsDir, file.name);
        const size = await getFileSize(filePath);
        
        // Check if file is referenced in database
        const isReferenced = await ClientDocument.exists({ fileName: file.name });
        
        if (!isReferenced) {
          orphaned.push({
            name: file.name,
            path: filePath,
            size,
            type: 'orphaned_file'
          });
        }
      }
    }

    return orphaned;
  } catch (error) {
    console.error('Error scanning orphaned files:', error);
    return [];
  }
};

// @desc    Get all deleted items (recycle bin)
// @route   GET /api/recycle-bin
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const query = {
      firmId: req.user.firmId,
      isDeleted: true
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.deletedAt = {};
      if (startDate) query.deletedAt.$gte = new Date(startDate);
      if (endDate) query.deletedAt.$lte = new Date(endDate);
    }

    let items = [];

    // Fetch based on type filter
    if (!type || type === 'clients') {
      const clients = await Client.find(query)
        .select('name email phone gstNumber cinNumber deletedAt deletedBy')
        .populate('deletedBy', 'name email')
        .sort({ deletedAt: -1 })
        .lean();

      items = items.concat(
        clients.map(client => ({
          ...client,
          type: 'client',
          displayName: client.name,
          size: 0 // Clients don't have file size
        }))
      );
    }

    if (!type || type === 'documents') {
      const documents = await ClientDocument.find(query)
        .select('fileName fileUrl fileSize clientId deletedAt deletedBy')
        .populate('deletedBy', 'name email')
        .populate('clientId', 'name')
        .sort({ deletedAt: -1 })
        .lean();

      items = items.concat(
        documents.map(doc => ({
          ...doc,
          type: 'document',
          displayName: doc.fileName,
          size: doc.fileSize || 0,
          clientName: doc.clientId?.name
        }))
      );
    }

    // Calculate total size
    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);

    res.json({
      success: true,
      data: {
        items,
        totalCount: items.length,
        totalSize,
        breakdown: {
          clients: items.filter(i => i.type === 'client').length,
          documents: items.filter(i => i.type === 'document').length
        }
      }
    });
  } catch (error) {
    console.error('Get recycle bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted items',
      error: error.message
    });
  }
});

// @desc    Restore items from recycle bin
// @route   POST /api/recycle-bin/restore
// @access  Private
router.post('/restore', auth, async (req, res) => {
  try {
    const { items } = req.body; // items = [{id, type}, ...]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided'
      });
    }

    const results = {
      restored: 0,
      failed: 0,
      errors: []
    };

    for (const item of items) {
      try {
        let Model;
        switch (item.type) {
          case 'client':
            Model = Client;
            break;
          case 'document':
            Model = ClientDocument;
            break;
          default:
            results.failed++;
            results.errors.push(`Unknown type: ${item.type}`);
            continue;
        }

        const updated = await Model.findOneAndUpdate(
          {
            _id: item.id,
            firmId: req.user.firmId,
            isDeleted: true
          },
          {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            updatedBy: req.user._id,
            updatedAt: new Date()
          }
        );

        if (updated) {
          results.restored++;
        } else {
          results.failed++;
          results.errors.push(`Item not found: ${item.id}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error restoring ${item.id}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Restored ${results.restored} items, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('Restore items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore items',
      error: error.message
    });
  }
});

// @desc    Permanently delete items from recycle bin
// @route   POST /api/recycle-bin/permanent-delete
// @access  Private
router.post('/permanent-delete', auth, async (req, res) => {
  try {
    const { items } = req.body; // items = [{id, type}, ...]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided'
      });
    }

    const results = {
      deleted: 0,
      failed: 0,
      errors: []
    };

    for (const item of items) {
      try {
        let Model;
        switch (item.type) {
          case 'client':
            Model = Client;
            break;
          case 'document':
            Model = ClientDocument;
            break;
          default:
            results.failed++;
            results.errors.push(`Unknown type: ${item.type}`);
            continue;
        }

        const deleted = await Model.findOneAndDelete({
          _id: item.id,
          firmId: req.user.firmId,
          isDeleted: true
        });

        if (deleted) {
          results.deleted++;
        } else {
          results.failed++;
          results.errors.push(`Item not found: ${item.id}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error deleting ${item.id}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Permanently deleted ${results.deleted} items, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete items',
      error: error.message
    });
  }
});

// @desc    Empty entire recycle bin
// @route   POST /api/recycle-bin/empty
// @access  Private
router.post('/empty', auth, async (req, res) => {
  try {
    const query = {
      firmId: req.user.firmId,
      isDeleted: true
    };

    const [clientsResult, documentsResult] = await Promise.all([
      Client.deleteMany(query),
      ClientDocument.deleteMany(query)
    ]);

    const totalDeleted = clientsResult.deletedCount + documentsResult.deletedCount;

    res.json({
      success: true,
      message: `Permanently deleted ${totalDeleted} items from recycle bin`,
      data: {
        clients: clientsResult.deletedCount,
        documents: documentsResult.deletedCount,
        total: totalDeleted
      }
    });
  } catch (error) {
    console.error('Empty recycle bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to empty recycle bin',
      error: error.message
    });
  }
});

// @desc    Get storage statistics
// @route   GET /api/recycle-bin/stats
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const query = { firmId: req.user.firmId };
    const deletedQuery = { ...query, isDeleted: true };

    // Count active and deleted items
    const [
      activeClients,
      deletedClients,
      activeDocuments,
      deletedDocuments
    ] = await Promise.all([
      Client.countDocuments({ ...query, isDeleted: false }),
      Client.countDocuments(deletedQuery),
      ClientDocument.countDocuments({ ...query, isDeleted: false }),
      ClientDocument.countDocuments(deletedQuery)
    ]);

    // Calculate storage for documents
    const activeDocsSize = await ClientDocument.aggregate([
      { $match: { ...query, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);

    const deletedDocsSize = await ClientDocument.aggregate([
      { $match: deletedQuery },
      { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);

    const activeStorage = activeDocsSize[0]?.total || 0;
    const deletedStorage = deletedDocsSize[0]?.total || 0;
    const totalStorage = activeStorage + deletedStorage;

    res.json({
      success: true,
      data: {
        active: {
          clients: activeClients,
          documents: activeDocuments,
          storage: activeStorage
        },
        deleted: {
          clients: deletedClients,
          documents: deletedDocuments,
          storage: deletedStorage
        },
        total: {
          clients: activeClients + deletedClients,
          documents: activeDocuments + deletedDocuments,
          storage: totalStorage
        },
        recycleBin: {
          itemCount: deletedClients + deletedDocuments,
          storage: deletedStorage
        }
      }
    });
  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch storage statistics',
      error: error.message
    });
  }
});

export default router;

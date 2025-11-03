import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import ClientDocument from '../models/ClientDocument.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'client-documents');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/rtf'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, images, and text files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// @desc    Get client documents
// @route   GET /api/documents/client/:clientId
// @access  Private
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 20, documentType, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      clientId,
      firmId: req.user.firmId
    };

    if (documentType && documentType !== 'all') {
      query.documentType = documentType;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const documents = await ClientDocument.find(query)
      .populate('uploadedBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await ClientDocument.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get client documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
});

// @desc    Upload client document
// @route   POST /api/documents/client/:clientId/upload
// @access  Private
router.post('/client/:clientId/upload', auth, upload.single('document'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const { documentType, description, tags, isConfidential, expiryDate } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const document = new ClientDocument({
      clientId,
      documentName: req.body.documentName || req.file.originalname,
      documentType: documentType || 'other',
      originalFileName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension: path.extname(req.file.originalname),
      description: description || '',
      tags: tags ? JSON.parse(tags) : [],
      isConfidential: isConfidential === 'true',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      firmId: req.user.firmId,
      uploadedBy: req.user._id
    });

    await document.save();

    // Populate the response
    await document.populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Upload document error:', error);
    
    // Clean up uploaded file if document creation failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await ClientDocument.findOne({
      _id: req.params.id,
      firmId: req.user.firmId
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update download statistics
    document.downloadCount += 1;
    document.lastDownloadedAt = new Date();
    document.lastDownloadedBy = req.user._id;
    await document.save();

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFileName}"`);
    
    // Send file
    res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
      error: error.message
    });
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await ClientDocument.findOne({
      _id: req.params.id,
      firmId: req.user.firmId
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (unlinkError) {
      console.error('Failed to delete file from filesystem:', unlinkError);
    }

    // Delete document record
    await ClientDocument.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

// @desc    Update document metadata
// @route   PUT /api/documents/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { documentName, documentType, description, tags, isConfidential, expiryDate, status } = req.body;

    const document = await ClientDocument.findOneAndUpdate(
      {
        _id: req.params.id,
        firmId: req.user.firmId
      },
      {
        documentName,
        documentType,
        description,
        tags: tags ? JSON.parse(tags) : undefined,
        isConfidential: isConfidential === 'true',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    )
    .populate('uploadedBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message
    });
  }
});

export default router;
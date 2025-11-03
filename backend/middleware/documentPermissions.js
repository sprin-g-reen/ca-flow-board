// Document access control middleware
import ClientDocument from '../models/ClientDocument.js';

/**
 * Check if employee has permission to access a document
 * Employees can only access documents that are:
 * 1. Not marked as protected/restricted
 * 2. From clients they are assigned to
 */
export const requireDocumentAccess = async (req, res, next) => {
  try {
    // Super admin, owner, and admin have full access
    if (['superadmin', 'owner', 'admin'].includes(req.user.role)) {
      return next();
    }

    // Clients can access their own documents
    if (req.user.role === 'client') {
      const documentId = req.params.documentId || req.params.id;
      if (!documentId) return next();

      const document = await ClientDocument.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (document.clientId.toString() !== req.user.clientId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own documents.'
        });
      }

      return next();
    }

    // Employee access control
    if (req.user.role === 'employee') {
      const documentId = req.params.documentId || req.params.id;
      if (!documentId) return next();

      const document = await ClientDocument.findById(documentId)
        .populate('clientId', 'assignedTo');

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Check if document is protected/restricted
      if (document.isProtected || document.isRestricted) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This document is protected and requires higher permissions.'
        });
      }

      // Check if employee is assigned to the client
      const client = document.clientId;
      const isAssigned = client?.assignedTo?.some(
        assignedUserId => assignedUserId.toString() === req.user._id.toString()
      );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not assigned to this client.'
        });
      }

      return next();
    }

    // Default deny
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  } catch (error) {
    console.error('Document access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking document access',
      error: error.message
    });
  }
};

/**
 * Check if employee can perform sensitive operations (GST/CIN fetch, etc.)
 * These operations are allowed even for employees with proper assignment
 */
export const requireClientOperationAccess = async (req, res, next) => {
  try {
    // Super admin, owner, and admin have full access
    if (['superadmin', 'owner', 'admin'].includes(req.user.role)) {
      return next();
    }

    // Clients can perform operations on their own data
    if (req.user.role === 'client') {
      const clientId = req.params.clientId || req.body.clientId;
      if (clientId && clientId.toString() !== req.user.clientId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own data.'
        });
      }
      return next();
    }

    // Employee can perform operations on assigned clients
    if (req.user.role === 'employee') {
      const clientId = req.params.clientId || req.body.clientId;
      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: 'Client ID is required'
        });
      }

      const Client = (await import('../models/Client.js')).default;
      const client = await Client.findById(clientId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Check if employee is assigned to this client
      const isAssigned = client.assignedTo?.some(
        assignedUserId => assignedUserId.toString() === req.user._id.toString()
      );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not assigned to this client. Cannot perform operations on unassigned clients.'
        });
      }

      return next();
    }

    // Default deny
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  } catch (error) {
    console.error('Client operation access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking operation access',
      error: error.message
    });
  }
};

/**
 * Filter documents list based on user permissions
 * Middleware adds filtered query conditions
 */
export const filterDocumentsByPermission = (req, res, next) => {
  // Super admin, owner, and admin see all documents
  if (['superadmin', 'owner', 'admin'].includes(req.user.role)) {
    return next();
  }

  // Clients see only their own documents
  if (req.user.role === 'client') {
    req.documentFilter = {
      ...req.documentFilter,
      clientId: req.user.clientId
    };
    return next();
  }

  // Employees see only documents from assigned clients (non-protected)
  if (req.user.role === 'employee') {
    req.documentFilter = {
      ...req.documentFilter,
      $or: [
        { isProtected: { $ne: true } },
        { isProtected: { $exists: false } }
      ]
    };
    // Additional client filtering will be done in the route handler
    req.requiresClientFilter = true;
    return next();
  }

  next();
};

export default {
  requireDocumentAccess,
  requireClientOperationAccess,
  filterDocumentsByPermission
};

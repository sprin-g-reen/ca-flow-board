// Role-based access control middleware

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No user information found.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Specific role checks
export const requireSuperAdmin = authorize('superadmin');
export const requireOwnerOrAdmin = authorize('owner', 'admin', 'superadmin');
export const requireEmployeeOrAbove = authorize('employee', 'admin', 'owner', 'superadmin');
export const requireAllRoles = authorize('client', 'employee', 'admin', 'owner', 'superadmin');

// Custom authorization for specific scenarios
export const requireSameFirm = (req, res, next) => {
  if (req.user.role === 'superadmin') {
    return next(); // Super admin can access all firms
  }

  // Extract firmId from request params, body, or query
  const requestedFirmId = req.params.firmId || req.body.firmId || req.query.firmId;
  
  if (!requestedFirmId) {
    // If no specific firm is requested, use user's firm
    req.firmId = req.user.firmId._id;
    return next();
  }

  if (req.user.firmId._id.toString() !== requestedFirmId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access resources from your own firm.'
    });
  }

  next();
};

// Check if user can access specific client data
export const requireClientAccess = (req, res, next) => {
  const clientId = req.params.clientId || req.body.clientId;
  
  if (!clientId) {
    return next(); // No specific client requested
  }

  // Owners and admins can access all clients in their firm
  if (['owner', 'admin', 'superadmin'].includes(req.user.role)) {
    return next();
  }

  // Clients can only access their own data
  if (req.user.role === 'client' && req.user._id.toString() !== clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.'
    });
  }

  // Employees can access clients assigned to them (this would need additional logic based on assignments)
  next();
};

// Check if user can manage other users
export const requireUserManagementAccess = (req, res, next) => {
  const targetUserId = req.params.userId || req.params.id || req.body.userId;
  
  if (!targetUserId) {
    return next();
  }

  // Super admin can manage anyone
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Users can always access their own data
  if (req.user._id.toString() === targetUserId.toString()) {
    return next();
  }

  // Owners and admins can manage users in their firm
  if (['owner', 'admin'].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Insufficient permissions to manage users.'
  });
};

export default authorize;
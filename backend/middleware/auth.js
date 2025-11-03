import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authorization header provided' 
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authorization header format. Expected "Bearer <token>"' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided, authorization denied' 
      });
    }

    // Basic JWT format validation before attempting verification
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Auth middleware: Malformed JWT - invalid number of parts:', tokenParts.length);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    // Check for test tokens
    if (token === 'test-token') {
      console.error('Auth middleware: Test token detected');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and check if still exists
    const user = await User.findById(decoded.id).select('-password').populate('firmId');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid - user not found' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'User account is deactivated' 
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ 
        success: false, 
        message: 'User recently changed password. Please log in again' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT Error Details:', {
        message: error.message,
        token: req.header('Authorization')?.substring(0, 50) + '...' // Only log first 50 chars for security
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format or signature' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

export default auth;
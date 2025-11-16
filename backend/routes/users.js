import express from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import { requireOwnerOrAdmin, requireUserManagementAccess } from '../middleware/authorize.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Owner)
router.get('/', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    
    // Build filter
    const filter = {};
    if (req.user.role !== 'superadmin') {
      filter.firmId = req.user.firmId._id;
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .populate('firmId', 'name')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get team members (coworkers in same firm) - for chat
// @route   GET /api/users/team/members
// @access  Private (All authenticated users)
router.get('/team/members', auth, async (req, res) => {
  try {
    console.log('🔍 Team members request from user:', req.user.id, 'firmId:', req.user.firmId?._id);
    
    // Get all active users in the same firm (excluding password)
    let filter = {
      firmId: req.user.firmId._id,
      isActive: true
      // Include all users, even current user (useful for chat member lists)
    };

    let teamMembers = await User.find(filter)
      .select('_id fullName email role username avatar isActive')
      .sort({ fullName: 1 });

    // If no active users found, get all users (including inactive)
    if (teamMembers.length === 0) {
      console.log('⚠️ No active users found, fetching all users in firm...');
      filter = { firmId: req.user.firmId._id };
      teamMembers = await User.find(filter)
        .select('_id fullName email role username avatar isActive')
        .sort({ fullName: 1 });
    }

    console.log('✅ Found team members:', teamMembers.length, teamMembers.map(u => ({ name: u.fullName, active: u.isActive })));

    res.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', auth, requireUserManagementAccess, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('firmId').select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin/Owner)
router.post('/', auth, requireOwnerOrAdmin, [
  body('username').optional().isLength({ min: 3 }).trim().matches(/^[a-zA-Z0-9._-]{3,30}$/),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('role').isIn(['admin', 'employee', 'client'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    let { username, email, password, fullName, role, phone, department, expertise, companyName } = req.body;

    // Auto-generate username from fullName if not provided
    if (!username && fullName) {
      const firstName = fullName.trim().split(/\s+/)[0];
      const baseUsername = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Ensure uniqueness
      username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
    }

    // Check if user already exists by username
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this username'
      });
    }

    const userData = {
      username: username.toLowerCase().trim(),
      email,
      password,
      fullName,
      role,
      phone,
      firmId: req.user.firmId._id
    };

    // Add role-specific fields
    if (role === 'employee') {
      if (department) userData.department = department;
      if (expertise) userData.expertise = expertise;
    } else if (role === 'client') {
      if (companyName) userData.companyName = companyName;
    }

    const user = await User.create(userData);
    const { password: _, ...userResponse } = user.toObject();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', auth, requireUserManagementAccess, async (req, res) => {
  try {
    const { fullName, phone, department, expertise, companyName, address, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only admin/owner can change isActive status
    if (isActive !== undefined && !['admin', 'owner', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to change user status'
      });
    }

    const updateData = { fullName, phone };
    if (isActive !== undefined) updateData.isActive = isActive;
    if (address) updateData.address = address;
    
    // Role-specific updates
    if (user.role === 'employee') {
      if (department) updateData.department = department;
      if (expertise) updateData.expertise = expertise;
    } else if (user.role === 'client') {
      if (companyName) updateData.companyName = companyName;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('firmId').select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin/Owner)
router.delete('/:id', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Bulk delete users
// @route   POST /api/users/bulk-delete
// @access  Private (Admin/Owner)
router.post('/bulk-delete', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    // Check that current user is not trying to delete themselves
    if (userIds.includes(req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Filter users by firmId for security
    const filter = {
      _id: { $in: userIds },
      firmId: req.user.firmId._id
    };

    const result = await User.deleteMany(filter);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} users`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Bulk update user status
// @route   POST /api/users/bulk-status
// @access  Private (Admin/Owner)
router.post('/bulk-status', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { userIds, isActive } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    // Filter users by firmId for security
    const filter = {
      _id: { $in: userIds },
      firmId: req.user.firmId._id
    };

    const result = await User.updateMany(filter, { isActive });

    res.json({
      success: true,
      message: `Successfully updated status for ${result.modifiedCount} users`,
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Bulk update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Bulk update user department
// @route   POST /api/users/bulk-department
// @access  Private (Admin/Owner)
router.post('/bulk-department', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { userIds, department } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department is required'
      });
    }

    // Filter users by firmId and role for security (only employees/admins have departments)
    const filter = {
      _id: { $in: userIds },
      firmId: req.user.firmId._id,
      role: { $in: ['employee', 'admin'] }
    };

    const result = await User.updateMany(filter, { department });

    res.json({
      success: true,
      message: `Successfully updated department for ${result.modifiedCount} users`,
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Bulk update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Bulk import users (employees, admins, owners)
// @route   POST /api/users/bulk-import
// @access  Private (Admin/Owner)
router.post('/bulk-import', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { users: usersData } = req.body;

    if (!usersData || !Array.isArray(usersData) || usersData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No user data provided for import'
      });
    }

    const results = {
      successful: [],
      failed: [],
      duplicates: []
    };

    for (const userData of usersData) {
      try {
        // Validate required fields
        if (!userData.fullName) {
          results.failed.push({
            data: userData,
            error: 'Full name is required'
          });
          continue;
        }

        // Auto-generate username from fullName if not provided
        let username = userData.username;
        if (!username && userData.fullName) {
          const firstName = userData.fullName.trim().split(/\s+/)[0];
          const baseUsername = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // Ensure uniqueness
          username = baseUsername;
          let counter = 1;
          while (await User.findOne({ username })) {
            username = `${baseUsername}${counter}`;
            counter++;
          }
        }

        // Check for duplicates by username
        const existingUser = await User.findOne({
          username: username.toLowerCase().trim()
        });

        if (existingUser) {
          results.duplicates.push({
            data: userData,
            reason: 'User with this username already exists',
            existing: {
              id: existingUser._id,
              username: existingUser.username,
              fullName: existingUser.fullName,
              role: existingUser.role
            }
          });
          continue;
        }

        // Prepare user data
        // Normalize department to match schema enum values (lowercase). Default to 'general' if not provided or invalid.
        const validDepartments = ['taxation', 'audit', 'advisory', 'compliance', 'general'];
        const deptNormalized = userData.department != null ? String(userData.department).toLowerCase().trim() : 'general';

        const processedData = {
          username: username.toLowerCase().trim(),
          email: userData.email ? userData.email.toLowerCase().trim() : undefined,
          fullName: userData.fullName.trim(),
          role: userData.role || 'employee', // Default to employee
          firmId: req.user.firmId._id,
          // Coerce phone to string before calling trim to avoid TypeError when phone is numeric
          phone: userData.phone != null ? (String(userData.phone).trim() || undefined) : undefined,
          department: validDepartments.includes(deptNormalized) ? deptNormalized : 'general',
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          // Generate a default password (should be changed on first login)
          password: userData.password || 'ChangeMe@123'
        };

        // Convert numeric fields
        if (userData.salary) {
          processedData.salary = parseFloat(userData.salary) || undefined;
        }

        // Validate role
        const validRoles = ['employee', 'admin', 'owner'];
        if (!validRoles.includes(processedData.role)) {
          results.failed.push({
            data: userData,
            error: `Invalid role: ${processedData.role}. Must be one of: ${validRoles.join(', ')}`
          });
          continue;
        }

        // Only owner can create other owners
        if (processedData.role === 'owner' && req.user.role !== 'owner') {
          results.failed.push({
            data: userData,
            error: 'Only owners can create other owner accounts'
          });
          continue;
        }

        // Create and save user
        const user = new User(processedData);
        await user.save();

        results.successful.push({
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          employeeId: user.employeeId
        });

      } catch (error) {
        console.error(`Failed to import user ${userData.email}:`, error);
        results.failed.push({
          data: userData,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import completed. ${results.successful.length} successful, ${results.failed.length} failed, ${results.duplicates.length} duplicates.`
    });

  } catch (error) {
    console.error('Bulk import users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk import',
      error: error.message
    });
  }
});

export default router;
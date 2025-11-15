import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import totpService from '../services/totpService.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// @desc    Setup two-factor authentication
// @route   POST /api/2fa/setup
// @access  Private
router.post('/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled. Please disable it first to reconfigure.'
      });
    }

    // Generate new secret
    const { secret, otpauthUrl } = totpService.generateSecret(
      user.email || user.username,
      'CA Flow Board'
    );

    // Generate QR code
    const qrCode = await totpService.generateQRCode(otpauthUrl);

    // Store secret temporarily (not enabled yet)
    user.twoFactorSecret = secret;
    user.twoFactorSetupComplete = false;
    await user.save();

    res.json({
      success: true,
      data: {
        secret,
        qrCode,
        manualEntryKey: secret
      },
      message: 'Scan QR code with Microsoft Authenticator or Google Authenticator'
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA'
    });
  }
});

// @desc    Verify and enable two-factor authentication
// @route   POST /api/2fa/verify-setup
// @access  Private
router.post('/verify-setup', auth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'TOTP token is required'
      });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please setup 2FA first'
      });
    }

    // Verify the token
    const isValid = totpService.verifyToken(token, user.twoFactorSecret);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token. Please try again.'
      });
    }

    // Generate backup codes
    const backupCodes = totpService.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSetupComplete = true;
    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        backupCodes // Show these once, user should save them
      }
    });
  } catch (error) {
    console.error('Error verifying 2FA setup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA setup'
    });
  }
});

// @desc    Disable two-factor authentication
// @route   POST /api/2fa/disable
// @access  Private
router.post('/disable', auth, async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const user = await User.findById(req.user._id)
      .select('+password +twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Verify TOTP token
    const isTokenValid = totpService.verifyToken(token, user.twoFactorSecret);
    if (!isTokenValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    user.twoFactorSetupComplete = false;
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
});

// @desc    Verify TOTP token (for critical operations)
// @route   POST /api/2fa/verify
// @access  Private
router.post('/verify', auth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'TOTP token is required'
      });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this user'
      });
    }

    // Try TOTP token first
    const isTokenValid = totpService.verifyToken(token, user.twoFactorSecret);
    
    if (isTokenValid) {
      return res.json({
        success: true,
        message: 'Token verified successfully'
      });
    }

    // Try backup codes if TOTP failed
    if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        const isBackupCodeValid = await bcrypt.compare(token, user.twoFactorBackupCodes[i]);
        
        if (isBackupCodeValid) {
          // Remove used backup code
          user.twoFactorBackupCodes.splice(i, 1);
          await user.save();
          
          return res.json({
            success: true,
            message: 'Backup code verified successfully',
            data: {
              backupCodesRemaining: user.twoFactorBackupCodes.length
            }
          });
        }
      }
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid token or backup code'
    });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    });
  }
});

// @desc    Regenerate backup codes
// @route   POST /api/2fa/regenerate-backup-codes
// @access  Private
router.post('/regenerate-backup-codes', auth, async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password || !token) {
      return res.status(400).json({
        success: false,
        message: 'Password and TOTP token are required'
      });
    }

    const user = await User.findById(req.user._id)
      .select('+password +twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Verify TOTP token
    const isTokenValid = totpService.verifyToken(token, user.twoFactorSecret);
    if (!isTokenValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    // Generate new backup codes
    const newBackupCodes = totpService.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      newBackupCodes.map(code => bcrypt.hash(code, 10))
    );

    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes: newBackupCodes
      }
    });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate backup codes'
    });
  }
});

// @desc    Get 2FA status
// @route   GET /api/2fa/status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorBackupCodes');

    res.json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false,
        setupComplete: user.twoFactorSetupComplete || false,
        backupCodesRemaining: user.twoFactorBackupCodes?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching 2FA status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch 2FA status'
    });
  }
});

export default router;

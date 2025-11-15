import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

class TOTPService {
  /**
   * Generate a new TOTP secret for a user
   * @param {string} userEmail - User's email address
   * @param {string} issuer - App name (e.g., "CA Flow Board")
   * @returns {Object} - Secret object with base32, otpauth_url, etc.
   */
  generateSecret(userEmail, issuer = 'CA Flow Board') {
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${userEmail})`,
      issuer: issuer,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Generate QR code as data URL for the secret
   * @param {string} otpauthUrl - The otpauth:// URL from generateSecret
   * @returns {Promise<string>} - Data URL for QR code image
   */
  async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token
   * @param {string} token - 6-digit token from authenticator app
   * @param {string} secret - User's TOTP secret (base32)
   * @param {number} window - Time window for validation (default 1 = ±30 seconds)
   * @returns {boolean} - True if token is valid
   */
  verifyToken(token, secret, window = 1) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window // Allow 1 step before/after current time (±30 seconds)
      });

      return verified;
    } catch (error) {
      console.error('Error verifying TOTP token:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for account recovery
   * @param {number} count - Number of backup codes to generate (default 10)
   * @returns {Array<string>} - Array of backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Validate backup code format
   * @param {string} code - Backup code to validate
   * @returns {boolean} - True if format is valid
   */
  isValidBackupCodeFormat(code) {
    return /^[A-Z0-9]{8}$/.test(code);
  }

  /**
   * Generate current TOTP token (for testing purposes)
   * @param {string} secret - TOTP secret (base32)
   * @returns {string} - Current 6-digit token
   */
  generateCurrentToken(secret) {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
  }
}

export default new TOTPService();

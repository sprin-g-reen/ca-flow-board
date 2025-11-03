import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, '..', 'chatlog.log');
const PASSWORD = process.env.CHAT_LOG_ENCRYPTION_PASSWORD || 'default-insecure-password-change-in-env';
const ALGORITHM = 'aes-256-cbc';

// Derive key from password
function deriveKey(password) {
  return crypto.scryptSync(password, 'salt', 32);
}

// Encrypt text
function encrypt(text) {
  const key = deriveKey(PASSWORD);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt text
function decrypt(encryptedText) {
  try {
    const key = deriveKey(PASSWORD);
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Log chat message (encrypted)
export function logChatMessage(user, message, sender) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      user: {
        id: user._id?.toString(),
        name: user.name,
        email: user.email,
        firm: user.firmId?.name || user.firmId
      },
      sender, // 'user' or 'ai'
      message,
      type: 'chat'
    };
    
    const logLine = JSON.stringify(logEntry);
    const encrypted = encrypt(logLine);
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, encrypted + '\n', 'utf8');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to log chat message:', error);
    return false;
  }
}

// Log function call
export function logFunctionCall(user, functionName, args, result) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      user: {
        id: user._id?.toString(),
        name: user.name,
        email: user.email,
        firm: user.firmId?.name || user.firmId
      },
      type: 'function_call',
      functionName,
      arguments: args,
      result: result?.success ? 'success' : 'error',
      error: result?.error || null
    };
    
    const logLine = JSON.stringify(logEntry);
    const encrypted = encrypt(logLine);
    
    fs.appendFileSync(LOG_FILE, encrypted + '\n', 'utf8');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to log function call:', error);
    return false;
  }
}

// Read and decrypt chat logs (for debugging/auditing)
export function readChatLogs(limit = 100) {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }
    
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(l => l);
    
    const logs = lines
      .slice(-limit) // Get last N lines
      .map(encryptedLine => {
        const decrypted = decrypt(encryptedLine);
        if (decrypted) {
          try {
            return JSON.parse(decrypted);
          } catch (e) {
            return null;
          }
        }
        return null;
      })
      .filter(log => log !== null);
    
    return logs;
  } catch (error) {
    console.error('❌ Failed to read chat logs:', error);
    return [];
  }
}

// Get logs for specific user
export function getUserChatLogs(userId, limit = 50) {
  try {
    const allLogs = readChatLogs(500); // Read more to filter
    const userLogs = allLogs
      .filter(log => log.user?.id === userId.toString())
      .slice(-limit);
    
    return userLogs;
  } catch (error) {
    console.error('❌ Failed to get user logs:', error);
    return [];
  }
}

// Get conversation thread (chronological with user/AI alternation)
export function getConversationThread(userId, limit = 50) {
  try {
    const userLogs = getUserChatLogs(userId, limit);
    const chatLogs = userLogs.filter(log => log.type === 'chat');
    
    // Group into conversation thread
    const thread = chatLogs.map(log => ({
      timestamp: log.timestamp,
      sender: log.sender,
      message: log.message,
      userName: log.user.name
    }));
    
    return thread;
  } catch (error) {
    console.error('❌ Failed to get conversation thread:', error);
    return [];
  }
}

export default {
  logChatMessage,
  logFunctionCall,
  readChatLogs,
  getUserChatLogs,
  getConversationThread
};

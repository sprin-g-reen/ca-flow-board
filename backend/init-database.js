#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes the database with essential data for first-time setup:
 * - Creates the first firm (owner's CA firm)
 * - Creates the owner/admin account
 * - Sets up default configurations
 * 
 * Usage:
 *   node init-database.js
 * 
 * Or make it executable:
 *   chmod +x init-database.js
 *   ./init-database.js
 */

import mongoose from 'mongoose';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Import models
import User from './models/User.js';
import Firm from './models/Firm.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility to ask questions
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Utility to ask for password (hidden input)
function askPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let password = '';

    console.log(question);
    
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    stdin.on('data', function(char) {
      char = char.toString('utf8');

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeAllListeners('data');
          console.log(''); // New line
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
          password = password.slice(0, -1);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(question + '*'.repeat(password.length));
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

// Connect to MongoDB
async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-flow-board';
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log(`${colors.green}✓${colors.reset} Connected to MongoDB`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} MongoDB connection error:`, error.message);
    console.error(`${colors.yellow}Please make sure MongoDB is running:${colors.reset}`);
    console.error(`  - macOS: brew services start mongodb-community`);
    console.error(`  - Or: mongod --dbpath /path/to/data`);
    return false;
  }
}

// Check if database is already initialized
async function checkExistingData() {
  const firmCount = await Firm.countDocuments();
  const userCount = await User.countDocuments({ role: { $in: ['owner', 'admin'] } });

  if (firmCount > 0 || userCount > 0) {
    console.log(`${colors.yellow}⚠${colors.reset} Warning: Database already contains data`);
    console.log(`  - Firms: ${firmCount}`);
    console.log(`  - Owner/Admin users: ${userCount}`);
    console.log('');
    
    const confirm = await ask('Do you want to proceed anyway? This will create additional data. (y/N): ');
    return confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes';
  }

  return true;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
}

// Validate phone number
function isValidPhone(phone) {
  const phoneRegex = /^[+]?[\d\s-()]+$/;
  return phoneRegex.test(phone);
}

// Validate PAN number
function isValidPAN(pan) {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

// Main initialization function
async function initializeDatabase() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   CA Flow Board - Database Initialization     ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  // Check for existing data
  const shouldProceed = await checkExistingData();
  if (!shouldProceed) {
    console.log(`${colors.yellow}Initialization cancelled.${colors.reset}`);
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  }

  console.log(`${colors.blue}Let's set up your CA firm and owner account...${colors.reset}\n`);

  // ========== FIRM DETAILS ==========
  console.log(`${colors.bright}STEP 1: Firm Details${colors.reset}`);
  
  let firmName = await ask('Firm Name: ');
  while (!firmName.trim()) {
    console.log(`${colors.red}Firm name is required!${colors.reset}`);
    firmName = await ask('Firm Name: ');
  }

  let firmEmail = await ask('Firm Email: ');
  while (!isValidEmail(firmEmail)) {
    console.log(`${colors.red}Invalid email format!${colors.reset}`);
    firmEmail = await ask('Firm Email: ');
  }

  let firmPhone = await ask('Firm Phone: ');
  while (!isValidPhone(firmPhone)) {
    console.log(`${colors.red}Invalid phone number!${colors.reset}`);
    firmPhone = await ask('Firm Phone: ');
  }

  let panNumber = await ask('Firm PAN Number: ').then(v => v.toUpperCase());
  while (!isValidPAN(panNumber)) {
    console.log(`${colors.red}Invalid PAN format! (e.g., ABCDE1234F)${colors.reset}`);
    panNumber = await ask('Firm PAN Number: ').then(v => v.toUpperCase());
  }

  const gstNumber = (await ask('GST Number (optional, press Enter to skip): ')).toUpperCase();
  const registrationNumber = await ask('Registration Number: ') || `REG${Date.now()}`;
  const website = await ask('Website (optional, press Enter to skip): ');

  console.log('\nFirm Address:');
  const street = await ask('  Street: ');
  const city = await ask('  City: ');
  const state = await ask('  State: ');
  const pincode = await ask('  Pincode: ');

  // ========== OWNER DETAILS ==========
  console.log(`\n${colors.bright}STEP 2: Owner Account${colors.reset}`);
  
  let ownerName = await ask('Owner Full Name: ');
  while (!ownerName.trim()) {
    console.log(`${colors.red}Owner name is required!${colors.reset}`);
    ownerName = await ask('Owner Full Name: ');
  }

  let ownerEmail = await ask('Owner Email: ');
  while (!isValidEmail(ownerEmail)) {
    console.log(`${colors.red}Invalid email format!${colors.reset}`);
    ownerEmail = await ask('Owner Email: ');
  }

  let ownerPhone = await ask('Owner Phone: ');
  while (!isValidPhone(ownerPhone)) {
    console.log(`${colors.red}Invalid phone number!${colors.reset}`);
    ownerPhone = await ask('Owner Phone: ');
  }

  let ownerPassword = await askPassword('Owner Password (min 6 characters): ');
  while (ownerPassword.length < 6) {
    console.log(`${colors.red}Password must be at least 6 characters!${colors.reset}`);
    ownerPassword = await askPassword('Owner Password (min 6 characters): ');
  }

  let confirmPassword = await askPassword('Confirm Password: ');
  while (ownerPassword !== confirmPassword) {
    console.log(`${colors.red}Passwords do not match!${colors.reset}`);
    confirmPassword = await askPassword('Confirm Password: ');
  }

  // ========== CONFIRMATION ==========
  console.log(`\n${colors.bright}${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}Please confirm the details:${colors.reset}\n`);
  console.log(`${colors.cyan}Firm:${colors.reset}`);
  console.log(`  Name: ${firmName}`);
  console.log(`  Email: ${firmEmail}`);
  console.log(`  Phone: ${firmPhone}`);
  console.log(`  PAN: ${panNumber}`);
  if (gstNumber) console.log(`  GST: ${gstNumber}`);
  console.log(`  Address: ${street}, ${city}, ${state} - ${pincode}`);
  
  console.log(`\n${colors.cyan}Owner:${colors.reset}`);
  console.log(`  Name: ${ownerName}`);
  console.log(`  Email: ${ownerEmail}`);
  console.log(`  Phone: ${ownerPhone}`);
  console.log(`  Password: ${'*'.repeat(ownerPassword.length)}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════${colors.reset}\n`);

  const confirmCreate = await ask('Create this setup? (Y/n): ');
  if (confirmCreate.toLowerCase() === 'n' || confirmCreate.toLowerCase() === 'no') {
    console.log(`${colors.yellow}Setup cancelled.${colors.reset}`);
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  }

  // ========== CREATE RECORDS ==========
  console.log(`\n${colors.blue}Creating records...${colors.reset}\n`);

  try {
    // Create firm first (without owner reference)
    console.log(`${colors.yellow}Creating firm record...${colors.reset}`);
    const firm = new Firm({
      name: firmName,
      email: firmEmail,
      phone: firmPhone,
      registrationNumber: registrationNumber,
      panNumber: panNumber,
      gstNumber: gstNumber || undefined,
      website: website || undefined,
      address: {
        street: street || 'Not specified',
        city: city || 'Not specified',
        state: state || 'Not specified',
        pincode: pincode || '000000',
        country: 'India'
      },
      subscription: {
        plan: 'premium',
        status: 'active',
        startDate: new Date(),
        maxUsers: 50,
        maxClients: 500,
        maxStorage: 10000
      },
      isActive: true,
      // Temporary owner - will update after user creation
      owner: new mongoose.Types.ObjectId()
    });

    console.log(`${colors.yellow}Saving firm to database...${colors.reset}`);
    await firm.save();
    console.log(`${colors.green}✓${colors.reset} Firm created: ${firm.name}`);

    // Create owner user
    console.log('Creating owner account...');
    console.log(`${colors.yellow}  (Hashing password securely...)${colors.reset}`);
    
    // Hash password manually to see progress
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    console.log(`${colors.green}✓${colors.reset} Password hashed`);
    
    const ownerData = {
      email: ownerEmail,
      password: hashedPassword,
      fullName: ownerName,
      role: 'owner',
      phone: ownerPhone,
      firmId: firm._id,
      isActive: true,
      emailVerified: true,
      notificationPreferences: {
        email: {
          taskAssigned: true,
          taskDueSoon: true,
          taskOverdue: true,
          taskCompleted: true,
          taskUpdated: true,
          clientDocumentUploaded: true,
          paymentReceived: true,
          systemAnnouncement: true
        },
        inApp: {
          taskAssigned: true,
          taskDueSoon: true,
          taskOverdue: true,
          taskCompleted: true,
          taskUpdated: true,
          clientDocumentUploaded: true,
          paymentReceived: true,
          systemAnnouncement: true
        }
      }
    };

    console.log(`${colors.yellow}  Creating user document...${colors.reset}`);
    
    // Create user directly without triggering password hash hook
    const owner = await User.create(ownerData);
    console.log(`${colors.green}✓${colors.reset} Owner account created: ${owner.email}`);

    // Update firm with owner reference
    firm.owner = owner._id;
    await firm.save();
    console.log(`${colors.green}✓${colors.reset} Linked owner to firm`);

    // ========== SUCCESS ==========
    console.log(`\n${colors.bright}${colors.green}╔════════════════════════════════════════════════╗`);
    console.log('║          ✓ SETUP COMPLETED SUCCESSFULLY       ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(colors.reset);

    console.log(`\n${colors.cyan}Your CA Flow Board is ready!${colors.reset}\n`);
    console.log('Login Credentials:');
    console.log(`  Email: ${colors.bright}${ownerEmail}${colors.reset}`);
    console.log(`  Password: ${colors.bright}${'*'.repeat(ownerPassword.length)}${colors.reset}`);
    console.log('');
    console.log('Next Steps:');
    console.log(`  1. Start the backend server: ${colors.cyan}npm start${colors.reset}`);
    console.log(`  2. Open the frontend: ${colors.cyan}http://localhost:5173${colors.reset}`);
    console.log(`  3. Login with the credentials above`);
    console.log(`  4. Complete the dashboard setup wizard`);
    console.log('');
    console.log(`${colors.yellow}Important: Save your credentials securely!${colors.reset}\n`);

    // Show record IDs for reference
    console.log(`${colors.blue}Database Records:${colors.reset}`);
    console.log(`  Firm ID: ${firm._id}`);
    console.log(`  Owner ID: ${owner._id}`);
    console.log('');

  } catch (error) {
    console.error(`\n${colors.red}✗ Error creating records:${colors.reset}`, error.message);
    console.error(error);
    
    // Cleanup on error
    console.log(`\n${colors.yellow}Cleaning up...${colors.reset}`);
    try {
      await Firm.deleteMany({ email: firmEmail });
      await User.deleteMany({ email: ownerEmail });
      console.log(`${colors.green}✓${colors.reset} Cleanup completed`);
    } catch (cleanupError) {
      console.error(`${colors.red}✗ Cleanup error:${colors.reset}`, cleanupError.message);
    }
  }

  // Disconnect and close
  await mongoose.disconnect();
  console.log(`${colors.green}✓${colors.reset} Disconnected from MongoDB`);
  rl.close();
  process.exit(0);
}

// Run the initialization
initializeDatabase().catch((error) => {
  console.error(`${colors.red}✗ Fatal error:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});

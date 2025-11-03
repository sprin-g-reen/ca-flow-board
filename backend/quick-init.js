#!/usr/bin/env node

/**
 * Quick Database Initialization - No prompts, direct creation
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Import models
import Firm from './models/Firm.js';
import User from './models/User.js';

// Your firm and owner details
const FIRM_DATA = {
  name: 'HMPS',
  email: 'salemhmps@gmail.com',
  phone: '7604907896',
  panNumber: 'GBAPT7883S',
  registrationNumber: 'HMPS-2025-001', // Auto-generated registration number
  gstNumber: '',
  website: '',
  address: {
    street: 'Salem',
    city: 'Salem',
    state: 'Tamil Nadu',
    pincode: '636001',
    country: 'India'
  }
};

const OWNER_DATA = {
  fullName: 'Auditor',
  email: 'auditor@hmps.com',
  phone: '7604907896',
  password: 'SecurePassword123' // This will be hashed
};

async function quickInit() {
  try {
    console.log('🚀 Quick Database Initialization\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-flow-board';
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      w: 'majority', // Write concern
      wtimeoutMS: 10000 // Write timeout
    });
    console.log('✅ Connected to MongoDB\n');

    // Check if firm already exists
    const existingFirm = await Firm.findOne({ email: FIRM_DATA.email });
    if (existingFirm) {
      console.log('⚠️  Firm already exists with this email!');
      console.log('   Delete it first or use different email.');
      process.exit(1);
    }

    // Check if owner already exists
    const existingUser = await User.findOne({ email: OWNER_DATA.email });
    if (existingUser) {
      console.log('⚠️  User already exists with this email!');
      console.log('   Delete it first or use different email.');
      process.exit(1);
    }

    console.log('📝 Creating firm...');
    
    // Create firm with temporary owner ID
    const tempOwnerId = new mongoose.Types.ObjectId();
    const firm = await Firm.create({
      name: FIRM_DATA.name,
      email: FIRM_DATA.email,
      phone: FIRM_DATA.phone,
      registrationNumber: FIRM_DATA.registrationNumber,
      panNumber: FIRM_DATA.panNumber,
      gstNumber: FIRM_DATA.gstNumber || undefined,
      website: FIRM_DATA.website || undefined,
      address: FIRM_DATA.address,
      subscription: {
        plan: 'premium',
        status: 'active',
        startDate: new Date(),
        maxUsers: 50,
        maxClients: 500,
        maxStorage: 10000
      },
      isActive: true,
      owner: tempOwnerId
    });
    
    console.log(`✅ Firm created: ${firm.name}`);

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(OWNER_DATA.password, 10);
    console.log('✅ Password hashed');

    console.log('👤 Creating owner account...');
    
    // Create owner with pre-hashed password
    const owner = await User.create({
      email: OWNER_DATA.email,
      password: hashedPassword,
      fullName: OWNER_DATA.fullName,
      role: 'owner',
      phone: OWNER_DATA.phone,
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
    });

    console.log(`✅ Owner created: ${owner.email}`);

    console.log('🔗 Linking owner to firm...');
    firm.owner = owner._id;
    await firm.save();
    console.log('✅ Linked successfully\n');

    // Success summary
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║          🎉 SETUP COMPLETE!                   ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log('📋 Your Login Credentials:\n');
    console.log(`   Email:    ${OWNER_DATA.email}`);
    console.log(`   Password: ${OWNER_DATA.password}`);
    console.log(`   Firm:     ${FIRM_DATA.name}\n`);
    
    console.log('🚀 Next Steps:\n');
    console.log('   1. Start backend:  npm start');
    console.log('   2. Start frontend: npm run dev (in root folder)');
    console.log('   3. Login at:       http://localhost:5173\n');
    
    console.log('✨ Done! You can now login to your CA Flow Board.\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during initialization:', error.message);
    console.error('\nFull error:', error);
    
    if (error.code === 11000) {
      console.error('\n⚠️  Duplicate key error - record already exists!');
      console.error('   Run this to clear database:');
      console.error('   mongosh ca-flow-board --eval "db.dropDatabase()"');
    }
    
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

// Run it
quickInit();

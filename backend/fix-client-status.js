#!/usr/bin/env node

/**
 * Script to fix existing client status values in the database
 * Converts all capitalized status values to lowercase
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function fixClientStatus() {
  try {
    console.log('🔧 Client Status Fix Utility\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-flow-board';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the Client collection directly
    const db = mongoose.connection.db;
    const clientsCollection = db.collection('clients');

    // Count clients with incorrect status
    const incorrectStatuses = await clientsCollection.find({
      status: { $in: ['Active', 'Inactive', 'Suspended', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] }
    }).toArray();

    if (incorrectStatuses.length === 0) {
      console.log('✅ No clients found with incorrect status values!');
      console.log('   All status values are already lowercase.\n');
    } else {
      console.log(`⚠️  Found ${incorrectStatuses.length} client(s) with incorrect status values:\n`);
      
      incorrectStatuses.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} - Status: "${client.status}"`);
      });

      console.log('\n🔄 Updating status values to lowercase...\n');

      // Update Active -> active
      const result1 = await clientsCollection.updateMany(
        { status: { $in: ['Active', 'ACTIVE'] } },
        { $set: { status: 'active' } }
      );
      if (result1.modifiedCount > 0) {
        console.log(`   ✓ Updated ${result1.modifiedCount} client(s) to 'active'`);
      }

      // Update Inactive -> inactive
      const result2 = await clientsCollection.updateMany(
        { status: { $in: ['Inactive', 'INACTIVE'] } },
        { $set: { status: 'inactive' } }
      );
      if (result2.modifiedCount > 0) {
        console.log(`   ✓ Updated ${result2.modifiedCount} client(s) to 'inactive'`);
      }

      // Update Suspended -> suspended
      const result3 = await clientsCollection.updateMany(
        { status: { $in: ['Suspended', 'SUSPENDED'] } },
        { $set: { status: 'suspended' } }
      );
      if (result3.modifiedCount > 0) {
        console.log(`   ✓ Updated ${result3.modifiedCount} client(s) to 'suspended'`);
      }

      console.log('\n✅ Status values updated successfully!\n');
    }

    // Show summary
    const totalClients = await clientsCollection.countDocuments();
    const activeClients = await clientsCollection.countDocuments({ status: 'active', isDeleted: false });
    const inactiveClients = await clientsCollection.countDocuments({ status: 'inactive', isDeleted: false });
    const suspendedClients = await clientsCollection.countDocuments({ status: 'suspended', isDeleted: false });

    console.log('📊 Client Status Summary:');
    console.log(`   Total Clients:     ${totalClients}`);
    console.log(`   Active:            ${activeClients}`);
    console.log(`   Inactive:          ${inactiveClients}`);
    console.log(`   Suspended:         ${suspendedClients}`);
    console.log('');

    await mongoose.disconnect();
    console.log('✨ Done!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

// Run it
fixClientStatus();

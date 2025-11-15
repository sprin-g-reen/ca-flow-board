#!/usr/bin/env node

/**
 * Standalone Template Seeding Script
 * 
 * This script seeds common CA task templates into the database.
 * It can be run independently or as part of the initialization process.
 * 
 * Usage:
 *   node seed-templates.js
 * 
 * Options:
 *   node seed-templates.js --force    (Re-seed even if templates exist)
 *   node seed-templates.js --firm=<firmId>  (Seed for specific firm only)
 *   node seed-templates.js --remove   (Remove all templates - CAUTION!)
 * 
 * Make it executable:
 *   chmod +x seed-templates.js
 *   ./seed-templates.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Import seeding functions
import { 
  seedTemplatesForAllFirms, 
  seedTemplatesForFirm, 
  removeTemplatesForFirm 
} from './seeds/index.js';
import TaskTemplate from './models/TaskTemplate.js';
import Firm from './models/Firm.js';
import User from './models/User.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  remove: args.includes('--remove'),
  firmId: args.find(arg => arg.startsWith('--firm='))?.split('=')[1]
};

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Connect to MongoDB
async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-flow-board';
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`${colors.green}✓${colors.reset} Connected to MongoDB`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} MongoDB connection error:`, error.message);
    console.error(`${colors.yellow}Please make sure MongoDB is running${colors.reset}`);
    return false;
  }
}

// Display statistics
async function displayStats() {
  const firmCount = await Firm.countDocuments({ isActive: true });
  const templateCount = await TaskTemplate.countDocuments({ is_deleted: false });
  const templatesByFirm = await TaskTemplate.aggregate([
    { $match: { is_deleted: false } },
    { $group: { _id: '$firm', count: { $sum: 1 } } }
  ]);

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}Current Database Statistics:${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`  Active Firms: ${colors.bright}${firmCount}${colors.reset}`);
  console.log(`  Total Templates: ${colors.bright}${templateCount}${colors.reset}`);
  
  if (templatesByFirm.length > 0) {
    console.log(`\n  ${colors.yellow}Templates by Firm:${colors.reset}`);
    for (const item of templatesByFirm) {
      const firm = await Firm.findById(item._id);
      if (firm) {
        console.log(`    - ${firm.name}: ${colors.bright}${item.count}${colors.reset} templates`);
      }
    }
  }
  console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);
}

// Remove templates
async function removeTemplates() {
  console.log(`${colors.red}${colors.bright}⚠️  WARNING: This will remove ALL templates!${colors.reset}`);
  await displayStats();
  
  const confirm = await ask('Are you absolutely sure you want to continue? (type "YES" to confirm): ');
  
  if (confirm !== 'YES') {
    console.log(`${colors.yellow}Operation cancelled.${colors.reset}`);
    return false;
  }

  if (options.firmId) {
    console.log(`${colors.yellow}Removing templates for firm: ${options.firmId}${colors.reset}`);
    const firm = await Firm.findById(options.firmId);
    if (!firm) {
      console.log(`${colors.red}✗ Firm not found${colors.reset}`);
      return false;
    }
    await removeTemplatesForFirm(options.firmId);
  } else {
    console.log(`${colors.yellow}Removing all templates...${colors.reset}`);
    const result = await TaskTemplate.deleteMany({});
    console.log(`${colors.green}✓${colors.reset} Removed ${result.deletedCount} templates`);
  }
  
  return true;
}

// Seed templates
async function seedTemplates() {
  console.log(`${colors.blue}Starting template seeding process...${colors.reset}\n`);
  
  await displayStats();

  if (options.firmId) {
    // Seed for specific firm
    console.log(`${colors.cyan}Seeding templates for specific firm: ${options.firmId}${colors.reset}`);
    
    const firm = await Firm.findById(options.firmId);
    if (!firm) {
      console.log(`${colors.red}✗ Firm not found with ID: ${options.firmId}${colors.reset}`);
      return false;
    }

    console.log(`  Firm: ${colors.bright}${firm.name}${colors.reset}`);
    
    const owner = await User.findOne({ 
      firmId: firm._id, 
      role: { $in: ['owner', 'admin'] },
      isActive: true 
    });

    if (!owner) {
      console.log(`${colors.red}✗ No owner/admin found for this firm${colors.reset}`);
      return false;
    }

    // Check if templates already exist
    const existingCount = await TaskTemplate.countDocuments({ 
      firm: firm._id, 
      is_deleted: false 
    });

    if (existingCount > 0 && !options.force) {
      console.log(`${colors.yellow}⚠️  This firm already has ${existingCount} templates.${colors.reset}`);
      const confirm = await ask('Do you want to add templates anyway? (y/N): ');
      
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log(`${colors.yellow}Operation cancelled.${colors.reset}`);
        return false;
      }
    }

    const templates = await seedTemplatesForFirm(firm._id, owner._id);
    console.log(`\n${colors.green}✅ Success!${colors.reset} Created ${templates.length} templates for ${firm.name}`);
    
  } else {
    // Seed for all firms
    console.log(`${colors.cyan}Seeding templates for all firms...${colors.reset}\n`);
    
    const firms = await Firm.find({ isActive: true });
    
    if (firms.length === 0) {
      console.log(`${colors.yellow}⚠️  No active firms found.${colors.reset}`);
      console.log('Please create a firm first using: node init-database.js');
      return false;
    }

    const result = await seedTemplatesForAllFirms();
    
    if (result.success) {
      console.log(`\n${colors.green}${colors.bright}✅ Template seeding completed!${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ Template seeding failed${colors.reset}`);
      return false;
    }
  }

  // Display final stats
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}Updated Statistics:${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
  await displayStats();
  
  return true;
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║      CA Flow Board - Template Seeding         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    if (options.remove) {
      // Remove templates
      const removed = await removeTemplates();
      if (removed) {
        console.log(`\n${colors.green}✅ Templates removed successfully${colors.reset}`);
      }
    } else {
      // Seed templates
      const seeded = await seedTemplates();
      if (seeded) {
        console.log(`\n${colors.green}${colors.bright}All done! 🎉${colors.reset}`);
        console.log(`\nYour CA Flow Board now has comprehensive task templates.`);
        console.log(`Admins can use these templates when creating tasks for clients.\n`);
      }
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ Error:${colors.reset}`, error.message);
    console.error(error);
  }

  // Cleanup
  await mongoose.disconnect();
  console.log(`${colors.green}✓${colors.reset} Disconnected from MongoDB`);
  rl.close();
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error(`${colors.red}✗ Fatal error:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});

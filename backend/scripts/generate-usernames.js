#!/usr/bin/env node
import connectDB from '../config/database.js';
import User from '../models/User.js';

/**
 * Generate a username from full name
 * @param {string} fullName - The user's full name
 * @returns {string} Generated username
 */
const generateUsername = (fullName) => {
  if (!fullName) return null;
  
  // Extract first name (everything before the first space)
  const firstName = fullName.trim().split(/\s+/)[0];
  
  // Clean and format: lowercase, remove special chars, keep only alphanumeric
  const cleanFirstName = firstName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  return cleanFirstName;
};

/**
 * Ensure username is unique by appending numbers if needed
 */
const ensureUniqueUsername = async (baseUsername, excludeUserId = null) => {
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const query = { username };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    
    const existing = await User.findOne(query);
    if (!existing) {
      return username;
    }
    
    // Username exists, try with number suffix
    username = `${baseUsername}${counter}`;
    counter++;
  }
};

const generateUsernames = async () => {
  try {
    await connectDB();

    console.log('\n🔧 Generating Usernames for All Users\n');
    console.log('='.repeat(80));

    // Get all users without username
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    if (usersWithoutUsername.length === 0) {
      console.log('\n✅ All users already have usernames!\n');
      process.exit(0);
    }

    console.log(`\n📋 Found ${usersWithoutUsername.length} users without usernames\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutUsername) {
      try {
        const baseUsername = generateUsername(user.fullName);
        
        if (!baseUsername) {
          console.log(`❌ ${user.fullName} (${user._id}) - Cannot generate username from name`);
          errorCount++;
          continue;
        }

        // Ensure uniqueness
        const uniqueUsername = await ensureUniqueUsername(baseUsername, user._id);
        
        // Update user
        user.username = uniqueUsername;
        await user.save();
        
        console.log(`✅ ${user.fullName} → username: ${uniqueUsername}`);
        successCount++;
      } catch (error) {
        console.log(`❌ ${user.fullName} - Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total: ${usersWithoutUsername.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error generating usernames:', error.message);
    process.exit(1);
  }
};

generateUsernames();

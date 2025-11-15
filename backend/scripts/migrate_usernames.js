#!/usr/bin/env node
import connectDB from '../config/database.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

async function generateUsernameFromName(name) {
  if (!name) return null;
  // Basic slug: lowercase, remove non-word, replace spaces with dot
  let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)+/g, '').slice(0, 20);
  if (!base) base = `user${Date.now()}`;
  let username = base;
  let suffix = 0;
  while (await User.exists({ username })) {
    suffix += 1;
    username = `${base}${suffix}`;
  }
  return username;
}

async function run() {
  try {
    await connectDB();

    console.log('🔍 Finding users without username...');
    const users = await User.find({ username: { $exists: false } });
    console.log(`Found ${users.length} users without username`);

    for (const u of users) {
      const candidate = await generateUsernameFromName(u.fullName || (u.email && u.email.split('@')[0]) || `user${u._id.toString().slice(-4)}`);
      if (candidate) {
        u.username = candidate;
        await u.save();
        console.log(`Updated user ${u._id} -> username: ${candidate}`);
      }
    }

    // Remove "lal" employees: username equal to 'lal' OR fullName contains 'lal' (case-insensitive)
    const deleteFilter = {
      role: 'employee',
      $or: [
        { username: 'lal' },
        { fullName: { $regex: /(\b|^)lal(\b|$)/i } }
      ]
    };

    const deleted = await User.deleteMany(deleteFilter);
    console.log(`Deleted ${deleted.deletedCount} employee records matching 'lal'`);

    console.log('✅ Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();

#!/usr/bin/env node
import connectDB from '../config/database.js';
import Firm from '../models/Firm.js';
import Settings from '../models/Settings.js';
import defaultSettings from '../config/defaultSettings.js';
import fs from 'fs/promises';
import path from 'path';

const run = async () => {
  try {
    await connectDB();

    // Try to load existing file-based settings if present
    const filePath = path.join(process.cwd(), 'backend', 'settings.json');
    let fileSettings = null;
    try {
      const raw = await fs.readFile(filePath, { encoding: 'utf8' });
      fileSettings = JSON.parse(raw);
      console.log(`Loaded ${filePath} to use as import fallback`);
    } catch (err) {
      // It's OK if file doesn't exist
      console.log('No backend/settings.json found, proceeding with defaults and firm settings.');
    }

    const firms = await Firm.find({}).lean();
    console.log(`Found ${firms.length} firms`);

    let created = 0;
    let updated = 0;

    for (const firm of firms) {
      const firmId = firm._id;
      // Decide initial settings: prefer fileSettings if present, else merge defaultSettings with firm.settings
      let initial = JSON.parse(JSON.stringify(defaultSettings));
      if (fileSettings && typeof fileSettings === 'object') {
        // If fileSettings contains a top-level object, use it wholesale
        initial = mergeDeep(initial, fileSettings);
      }
      if (firm.settings) {
        initial.company = { ...initial.company, ...firm.settings };
      }

      const existing = await Settings.findOne({ firm: firmId });
      if (existing) {
        existing.data = initial;
        await existing.save();
        updated++;
        console.log(`Updated settings for firm ${firm.name} (${firmId})`);
      } else {
        await Settings.create({ firm: firmId, data: initial });
        created++;
        console.log(`Created settings for firm ${firm.name} (${firmId})`);
      }
    }

    console.log(`Migration complete. Created: ${created}, Updated: ${updated}`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

run();

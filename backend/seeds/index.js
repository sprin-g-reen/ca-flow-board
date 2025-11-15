import TaskTemplate from '../models/TaskTemplate.js';
import Firm from '../models/Firm.js';
import User from '../models/User.js';
import { commonTemplates } from './templates.js';

/**
 * Seed templates for a specific firm
 * @param {String} firmId - The firm ID to associate templates with
 * @param {String} userId - The user ID who creates the templates (usually owner/admin)
 * @returns {Promise<Array>} - Array of created templates
 */
export async function seedTemplatesForFirm(firmId, userId) {
  try {
    console.log(`📝 Seeding templates for firm: ${firmId}`);
    
    // Check if templates already exist for this firm
    const existingCount = await TaskTemplate.countDocuments({ 
      firm: firmId,
      is_deleted: false 
    });
    
    if (existingCount > 0) {
      console.log(`ℹ️  Firm already has ${existingCount} templates. Skipping seed.`);
      return [];
    }

    // Prepare templates with firm and creator info
    const templatesData = commonTemplates.map(template => ({
      ...template,
      firm: firmId,
      created_by: userId,
      is_active: true,
      is_deleted: false
    }));

    // Insert templates
    const createdTemplates = await TaskTemplate.insertMany(templatesData);
    
    console.log(`✅ Successfully created ${createdTemplates.length} templates for firm`);
    return createdTemplates;
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
}

/**
 * Seed templates for all firms
 * Useful when adding new templates to existing system
 * @returns {Promise<Object>} - Summary of seeding results
 */
export async function seedTemplatesForAllFirms() {
  try {
    console.log('📝 Starting template seeding for all firms...');
    
    const firms = await Firm.find({ isActive: true });
    
    if (firms.length === 0) {
      console.log('⚠️  No active firms found. Please create a firm first.');
      return { success: false, message: 'No active firms found' };
    }

    const results = {
      total_firms: firms.length,
      seeded: 0,
      skipped: 0,
      errors: []
    };

    for (const firm of firms) {
      try {
        // Get the firm owner or any admin user
        const owner = await User.findOne({ 
          firmId: firm._id, 
          role: { $in: ['owner', 'admin'] },
          isActive: true 
        });

        if (!owner) {
          console.log(`⚠️  No owner/admin found for firm: ${firm.name}`);
          results.skipped++;
          continue;
        }

        const templates = await seedTemplatesForFirm(firm._id, owner._id);
        
        if (templates.length > 0) {
          results.seeded++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        console.error(`❌ Error seeding templates for firm ${firm.name}:`, error.message);
        results.errors.push({
          firmId: firm._id,
          firmName: firm.name,
          error: error.message
        });
      }
    }

    console.log('\n📊 Template Seeding Summary:');
    console.log(`   Total Firms: ${results.total_firms}`);
    console.log(`   Seeded: ${results.seeded}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(err => {
        console.log(`   - ${err.firmName}: ${err.error}`);
      });
    }

    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('❌ Fatal error during template seeding:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Remove all templates for a firm (use with caution!)
 * @param {String} firmId - The firm ID
 * @returns {Promise<Number>} - Number of deleted templates
 */
export async function removeTemplatesForFirm(firmId) {
  try {
    const result = await TaskTemplate.deleteMany({ firm: firmId });
    console.log(`🗑️  Removed ${result.deletedCount} templates for firm ${firmId}`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error removing templates:', error);
    throw error;
  }
}

/**
 * Update existing templates with new fields (migration helper)
 * @returns {Promise<Number>} - Number of updated templates
 */
export async function updateTemplatesSchema() {
  try {
    console.log('🔄 Updating template schemas...');
    
    // Example: Add default values for new fields
    const result = await TaskTemplate.updateMany(
      { complexity: { $exists: false } },
      { $set: { complexity: 'medium' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} templates`);
    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error updating templates:', error);
    throw error;
  }
}

export default {
  seedTemplatesForFirm,
  seedTemplatesForAllFirms,
  removeTemplatesForFirm,
  updateTemplatesSchema
};

import mongoose from 'mongoose';

const recurrencePatternSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['monthly', 'yearly', 'quarterly', 'custom'],
    required: true
  },
  // Monthly configuration
  monthlyConfig: {
    frequency: {
      type: Number, // Every X months
      default: 1,
      min: 1,
      max: 12
    },
    dayOfMonth: {
      type: Number, // Day of month (1-31)
      min: 1,
      max: 31
    },
    weekOfMonth: {
      type: Number, // Which week of month (1-4, 5 for last)
      min: 1,
      max: 5
    },
    dayOfWeek: {
      type: Number, // Day of week (0=Sunday, 6=Saturday)
      min: 0,
      max: 6
    },
    endOfMonth: {
      type: Boolean, // Last day of month
      default: false
    }
  },
  
  // Yearly configuration
  yearlyConfig: {
    frequency: {
      type: Number, // Every X years
      default: 1,
      min: 1,
      max: 10
    },
    months: [{
      type: Number, // Months of year (1-12)
      min: 1,
      max: 12
    }],
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    weekOfMonth: {
      type: Number,
      min: 1,
      max: 5
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    }
  },
  
  // Quarterly configuration
  quarterlyConfig: {
    frequency: {
      type: Number, // Every X quarters
      default: 1,
      min: 1,
      max: 4
    },
    monthOfQuarter: {
      type: Number, // Month within quarter (1-3)
      min: 1,
      max: 3
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    weekOfMonth: {
      type: Number,
      min: 1,
      max: 5
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    }
  },
  
  // Custom configuration
  customConfig: {
    frequency: {
      type: Number,
      default: 1
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'weeks'
    },
    daysOfWeek: [{
      type: Number, // Multiple days for weekly patterns
      min: 0,
      max: 6
    }],
    daysOfMonth: [{
      type: Number, // Multiple days for monthly patterns
      min: 1,
      max: 31
    }],
    monthsOfYear: [{
      type: Number, // Multiple months for yearly patterns
      min: 1,
      max: 12
    }]
  },
  
  // End conditions
  endCondition: {
    type: {
      type: String,
      enum: ['never', 'after_occurrences', 'by_date'],
      default: 'never'
    },
    occurrences: {
      type: Number,
      min: 1
    },
    endDate: {
      type: Date
    }
  },
  
  // Metadata
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Firm association
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
recurrencePatternSchema.index({ firm: 1, type: 1 });
recurrencePatternSchema.index({ isActive: 1 });

// Virtual for readable frequency description
recurrencePatternSchema.virtual('frequencyDescription').get(function() {
  switch (this.type) {
    case 'monthly':
      if (this.monthlyConfig.endOfMonth) {
        return `Every ${this.monthlyConfig.frequency} month(s) on the last day`;
      } else if (this.monthlyConfig.dayOfMonth) {
        return `Every ${this.monthlyConfig.frequency} month(s) on day ${this.monthlyConfig.dayOfMonth}`;
      } else if (this.monthlyConfig.weekOfMonth && this.monthlyConfig.dayOfWeek !== undefined) {
        const weekNames = ['first', 'second', 'third', 'fourth', 'last'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Every ${this.monthlyConfig.frequency} month(s) on the ${weekNames[this.monthlyConfig.weekOfMonth - 1]} ${dayNames[this.monthlyConfig.dayOfWeek]}`;
      }
      break;
      
    case 'yearly':
      if (this.yearlyConfig.months && this.yearlyConfig.months.length > 0) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsStr = this.yearlyConfig.months.map(m => monthNames[m - 1]).join(', ');
        return `Every ${this.yearlyConfig.frequency} year(s) in ${monthsStr}`;
      }
      break;
      
    case 'quarterly':
      return `Every ${this.quarterlyConfig.frequency} quarter(s)`;
      
    case 'custom':
      return `Every ${this.customConfig.frequency} ${this.customConfig.unit}`;
  }
  
  return this.description || 'Custom pattern';
});

// Method to generate next occurrence date
recurrencePatternSchema.methods.getNextOccurrence = function(fromDate = new Date()) {
  // Implementation for calculating next occurrence based on pattern
  // This would be a complex algorithm based on the configuration
  // For now, return a placeholder
  const nextDate = new Date(fromDate);
  
  switch (this.type) {
    case 'monthly':
      if (this.monthlyConfig.frequency) {
        nextDate.setMonth(nextDate.getMonth() + this.monthlyConfig.frequency);
      }
      break;
    case 'yearly':
      if (this.yearlyConfig.frequency) {
        nextDate.setFullYear(nextDate.getFullYear() + this.yearlyConfig.frequency);
      }
      break;
    case 'quarterly':
      if (this.quarterlyConfig.frequency) {
        nextDate.setMonth(nextDate.getMonth() + (this.quarterlyConfig.frequency * 3));
      }
      break;
    case 'custom':
      // Custom logic based on unit and frequency
      break;
  }
  
  return nextDate;
};

// Static method to create predefined CA patterns
recurrencePatternSchema.statics.createCAPresets = async function(firmId, userId) {
  const presets = [
    {
      name: 'Monthly GST Filing',
      type: 'monthly',
      monthlyConfig: {
        frequency: 1,
        dayOfMonth: 20
      },
      description: 'Monthly GST return filing on 20th of every month',
      firm: firmId,
      createdBy: userId
    },
    {
      name: 'Quarterly GST Filing',
      type: 'quarterly',
      quarterlyConfig: {
        frequency: 1,
        monthOfQuarter: 1,
        dayOfMonth: 18
      },
      description: 'Quarterly GST return filing on 18th of first month of quarter',
      firm: firmId,
      createdBy: userId
    },
    {
      name: 'Annual ITR Filing',
      type: 'yearly',
      yearlyConfig: {
        frequency: 1,
        months: [7], // July
        dayOfMonth: 31
      },
      description: 'Annual Income Tax Return filing by July 31st',
      firm: firmId,
      createdBy: userId
    },
    {
      name: 'Annual ROC Filing',
      type: 'yearly',
      yearlyConfig: {
        frequency: 1,
        months: [9], // September
        dayOfMonth: 30
      },
      description: 'Annual ROC filing by September 30th',
      firm: firmId,
      createdBy: userId
    }
  ];
  
  const createdPresets = [];
  for (const preset of presets) {
    try {
      const existing = await this.findOne({ 
        name: preset.name, 
        firm: firmId 
      });
      
      if (!existing) {
        const created = await this.create(preset);
        createdPresets.push(created);
      }
    } catch (error) {
      console.error(`Error creating preset ${preset.name}:`, error);
    }
  }
  
  return createdPresets;
};

const RecurrencePattern = mongoose.model('RecurrencePattern', recurrencePatternSchema);

export default RecurrencePattern;
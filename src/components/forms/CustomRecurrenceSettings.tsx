import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Repeat, X } from 'lucide-react';
import { Control } from 'react-hook-form';

interface CustomRecurrenceProps {
  control: Control<any>;
  onPatternChange: (pattern: string) => void;
}

interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  weekdays: number[]; // 0-6 (Sunday-Saturday)
  monthlyType: 'date' | 'day'; // by date (15th) or by day (2nd Tuesday)
  monthlyDate: number;
  monthlyWeek: number; // 1-4 (first, second, third, fourth)
  monthlyWeekday: number; // 0-6
  endType: 'never' | 'date' | 'count';
  endDate: string;
  endCount: number;
  time: string;
}

export function CustomRecurrenceSettings({ control, onPatternChange }: CustomRecurrenceProps) {
  const [config, setConfig] = useState<RecurrenceConfig>({
    frequency: 'weekly',
    interval: 1,
    weekdays: [1], // Default to Monday
    monthlyType: 'date',
    monthlyDate: 1,
    monthlyWeek: 1,
    monthlyWeekday: 1,
    endType: 'never',
    endDate: '',
    endCount: 10,
    time: '09:00'
  });

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekNames = ['First', 'Second', 'Third', 'Fourth', 'Last'];

  const updateConfig = (updates: Partial<RecurrenceConfig>) => {
    try {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);
      
      // Generate pattern string for backend
      const pattern = generatePatternString(newConfig);
      onPatternChange(pattern);
    } catch (error) {
      console.error('Error updating recurrence config:', error);
    }
  };

  // Safe update function that prevents form submission
  const safeUpdateConfig = (updates: Partial<RecurrenceConfig>) => {
    // Prevent any potential event bubbling
    try {
      updateConfig(updates);
    } catch (error) {
      console.error('Error in safeUpdateConfig:', error);
    }
  };

  const generatePatternString = (cfg: RecurrenceConfig): string => {
    let pattern = '';
    
    // Base frequency with interval
    switch (cfg.frequency) {
      case 'daily':
        pattern = `FREQ=DAILY;INTERVAL=${cfg.interval}`;
        break;
      case 'weekly':
        pattern = `FREQ=WEEKLY;INTERVAL=${cfg.interval}`;
        if (cfg.weekdays.length > 0) {
          const days = cfg.weekdays.map(d => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d]).join(',');
          pattern += `;BYDAY=${days}`;
        }
        break;
      case 'monthly':
        pattern = `FREQ=MONTHLY;INTERVAL=${cfg.interval}`;
        if (cfg.monthlyType === 'date') {
          pattern += `;BYMONTHDAY=${cfg.monthlyDate}`;
        } else {
          const weekday = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][cfg.monthlyWeekday];
          const week = cfg.monthlyWeek === 5 ? -1 : cfg.monthlyWeek; // Last = -1
          pattern += `;BYDAY=${week}${weekday}`;
        }
        break;
      case 'yearly':
        pattern = `FREQ=YEARLY;INTERVAL=${cfg.interval}`;
        break;
    }

    // Add end conditions
    switch (cfg.endType) {
      case 'date':
        if (cfg.endDate) {
          const endDate = new Date(cfg.endDate).toISOString().split('T')[0].replace(/-/g, '');
          pattern += `;UNTIL=${endDate}T235959Z`;
        }
        break;
      case 'count':
        pattern += `;COUNT=${cfg.endCount}`;
        break;
    }

    // Add time if specified
    if (cfg.time) {
      pattern += `;TIME=${cfg.time}`;
    }

    return pattern;
  };

  const toggleWeekday = (day: number) => {
    const newWeekdays = config.weekdays.includes(day)
      ? config.weekdays.filter(d => d !== day)
      : [...config.weekdays, day].sort();
    safeUpdateConfig({ weekdays: newWeekdays });
  };

  const getFrequencyLabel = () => {
    const { frequency, interval } = config;
    if (interval === 1) {
      return frequency === 'daily' ? 'day' : frequency === 'weekly' ? 'week' : 
             frequency === 'monthly' ? 'month' : 'year';
    }
    return frequency === 'daily' ? 'days' : frequency === 'weekly' ? 'weeks' : 
           frequency === 'monthly' ? 'months' : 'years';
  };

  return (
    <div className="space-y-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Repeat className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">Custom Recurrence Settings</h3>
      </div>

      {/* Frequency and Interval */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">Frequency</FormLabel>
            <Select 
              value={config.frequency} 
              onValueChange={(value: any) => {
                safeUpdateConfig({ frequency: value });
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
              Every
            </FormLabel>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="99"
                value={config.interval}
                onChange={(e) => {
                  e.preventDefault();
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    safeUpdateConfig({ interval: value });
                  }
                }}
                className="h-10 w-20"
              />
              <span className="text-sm text-gray-600">{getFrequencyLabel()}</span>
            </div>
          </div>
        </div>

        {/* Weekly Options */}
        {config.frequency === 'weekly' && (
          <div>
            <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">
              Repeat on
            </FormLabel>
            <div className="flex flex-wrap gap-2">
              {weekdayNames.map((day, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={config.weekdays.includes(index) ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => toggleWeekday(index)}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Options */}
        {config.frequency === 'monthly' && (
          <div className="space-y-4">
            <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
              Monthly Recurrence
            </FormLabel>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={config.monthlyType === 'date'}
                  onCheckedChange={(checked) => {
                    if (checked) safeUpdateConfig({ monthlyType: 'date' });
                  }}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm">On the</span>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={config.monthlyDate}
                    onChange={(e) => {
                      e.preventDefault();
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 31) {
                        safeUpdateConfig({ monthlyDate: value });
                      }
                    }}
                    className="h-8 w-16"
                    disabled={config.monthlyType !== 'date'}
                  />
                  <span className="text-sm">of each month</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={config.monthlyType === 'day'}
                  onCheckedChange={(checked) => {
                    if (checked) safeUpdateConfig({ monthlyType: 'day' });
                  }}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm">On the</span>
                  <Select
                    value={config.monthlyWeek.toString()}
                    onValueChange={(value) => {
                      safeUpdateConfig({ monthlyWeek: parseInt(value) });
                    }}
                    disabled={config.monthlyType !== 'day'}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue placeholder="Week" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekNames.map((week, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={config.monthlyWeekday.toString()}
                    onValueChange={(value) => {
                      safeUpdateConfig({ monthlyWeekday: parseInt(value) });
                    }}
                    disabled={config.monthlyType !== 'day'}
                  >
                    <SelectTrigger className="h-8 w-24">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekdayNames.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Setting */}
        <div>
          <FormLabel className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Start Time
          </FormLabel>
          <Input
            type="time"
            value={config.time}
            onChange={(e) => {
              e.preventDefault();
              safeUpdateConfig({ time: e.target.value });
            }}
            className="h-10 w-40"
          />
        </div>

        {/* End Conditions */}
        <div className="space-y-4">
          <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
            End Condition
          </FormLabel>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={config.endType === 'never'}
                onCheckedChange={(checked) => {
                  if (checked) safeUpdateConfig({ endType: 'never' });
                }}
              />
              <span className="text-sm">Never ends</span>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                checked={config.endType === 'date'}
                onCheckedChange={(checked) => {
                  if (checked) safeUpdateConfig({ endType: 'date' });
                }}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm">Ends on</span>
                <Input
                  type="date"
                  value={config.endDate}
                  onChange={(e) => {
                    e.preventDefault();
                    safeUpdateConfig({ endDate: e.target.value });
                  }}
                  className="h-8 w-40"
                  disabled={config.endType !== 'date'}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                checked={config.endType === 'count'}
                onCheckedChange={(checked) => {
                  if (checked) safeUpdateConfig({ endType: 'count' });
                }}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm">Ends after</span>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={config.endCount}
                  onChange={(e) => {
                    e.preventDefault();
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 999) {
                      safeUpdateConfig({ endCount: value });
                    }
                  }}
                  className="h-8 w-20"
                  disabled={config.endType !== 'count'}
                />
                <span className="text-sm">occurrences</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-white border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Recurrence Summary</span>
          </div>
          <div className="text-sm text-gray-700">
            {getRecurrenceSummary(config)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Pattern: <code className="bg-gray-100 px-1 rounded">{generatePatternString(config)}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRecurrenceSummary(config: RecurrenceConfig): string {
  let summary = '';
  
  // Base frequency
  const interval = config.interval === 1 ? '' : `every ${config.interval} `;
  switch (config.frequency) {
    case 'daily':
      summary = `Repeats ${interval}day${config.interval > 1 ? 's' : ''}`;
      break;
    case 'weekly':
      summary = `Repeats ${interval}week${config.interval > 1 ? 's' : ''}`;
      if (config.weekdays.length > 0) {
        const days = config.weekdays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
        summary += ` on ${days}`;
      }
      break;
    case 'monthly':
      summary = `Repeats ${interval}month${config.interval > 1 ? 's' : ''}`;
      if (config.monthlyType === 'date') {
        summary += ` on the ${config.monthlyDate}${getOrdinal(config.monthlyDate)}`;
      } else {
        const weekNames = ['first', 'second', 'third', 'fourth', 'last'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        summary += ` on the ${weekNames[config.monthlyWeek - 1]} ${dayNames[config.monthlyWeekday]}`;
      }
      break;
    case 'yearly':
      summary = `Repeats ${interval}year${config.interval > 1 ? 's' : ''}`;
      break;
  }

  // Add time
  if (config.time) {
    summary += ` at ${config.time}`;
  }

  // Add end condition
  switch (config.endType) {
    case 'date':
      if (config.endDate) {
        summary += `, ending on ${new Date(config.endDate).toLocaleDateString()}`;
      }
      break;
    case 'count':
      summary += `, for ${config.endCount} occurrence${config.endCount > 1 ? 's' : ''}`;
      break;
  }

  return summary;
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
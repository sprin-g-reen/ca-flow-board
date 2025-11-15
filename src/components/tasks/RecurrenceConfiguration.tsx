import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Repeat, Settings, X, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRecurrencePatterns, RecurrencePattern } from '@/hooks/useRecurrencePatterns';
import { format } from 'date-fns';

interface RecurrenceConfigurationProps {
  value?: RecurrencePattern | null;
  onChange: (pattern: RecurrencePattern | null) => void;
  disabled?: boolean;
}

export const RecurrenceConfiguration: React.FC<RecurrenceConfigurationProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'monthly' | 'yearly' | 'quarterly' | 'custom'>('monthly');
  const [patternName, setPatternName] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Monthly configuration
  const [monthlyFreq, setMonthlyFreq] = useState(1);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [monthlyEndOfMonth, setMonthlyEndOfMonth] = useState(false);
  
  // Yearly configuration
  const [yearlyFreq, setYearlyFreq] = useState(1);
  const [yearlyMonths, setYearlyMonths] = useState<number[]>([7]); // July default
  const [yearlyDay, setYearlyDay] = useState(31);
  
  // Quarterly configuration
  const [quarterlyFreq, setQuarterlyFreq] = useState(1);
  const [quarterlyMonth, setQuarterlyMonth] = useState(1);
  const [quarterlyDay, setQuarterlyDay] = useState(18);
  
  // Custom configuration
  const [customFreq, setCustomFreq] = useState(1);
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('weeks');
  const [customDaysOfWeek, setCustomDaysOfWeek] = useState<number[]>([]);
  
  // End condition
  const [endType, setEndType] = useState<'never' | 'after_occurrences' | 'by_date'>('never');
  const [endOccurrences, setEndOccurrences] = useState(12);
  const [endDate, setEndDate] = useState('');

  const { 
    patterns, 
    createPattern, 
    previewPattern, 
    previewData, 
    isCreating, 
    isPreviewing 
  } = useRecurrencePatterns();

  // Predefined CA patterns
  const caPresets = [
    {
      id: 'monthly_gst',
      name: 'Monthly GST Filing',
      description: 'Every month on 20th - Perfect for GST returns',
      icon: '🧾',
      type: 'monthly' as const,
      config: {
        monthlyConfig: {
          frequency: 1,
          dayOfMonth: 20
        }
      }
    },
    {
      id: 'quarterly_gst',
      name: 'Quarterly GST Filing',
      description: 'Every 3 months - Great for quarterly GST returns',
      icon: '📋',
      type: 'quarterly' as const,
      config: {
        quarterlyConfig: {
          frequency: 1,
          monthOfQuarter: 1,
          dayOfMonth: 18
        }
      }
    },
    {
      id: 'yearly_itr',
      name: 'Yearly ITR Filing',
      description: 'Every year by July 31st - Perfect for income tax returns',
      icon: '🗂️',
      type: 'yearly' as const,
      config: {
        yearlyConfig: {
          frequency: 1,
          months: [7],
          dayOfMonth: 31
        }
      }
    },
    {
      id: 'yearly_roc',
      name: 'Yearly ROC Filing',
      description: 'Every year by September 30th - Company annual filings and compliance',
      icon: '🏢',
      type: 'yearly' as const,
      config: {
        yearlyConfig: {
          frequency: 1,
          months: [9],
          dayOfMonth: 30
        }
      }
    }
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handlePresetSelect = (preset: typeof caPresets[0]) => {
    setSelectedType(preset.type);
    setPatternName(preset.name);
    
    if (preset.config.monthlyConfig) {
      setMonthlyFreq(preset.config.monthlyConfig.frequency);
      setMonthlyDay(preset.config.monthlyConfig.dayOfMonth || 1);
    }
    
    if (preset.config.yearlyConfig) {
      setYearlyFreq(preset.config.yearlyConfig.frequency);
      setYearlyMonths(preset.config.yearlyConfig.months);
      setYearlyDay(preset.config.yearlyConfig.dayOfMonth || 31);
    }
    
    if (preset.config.quarterlyConfig) {
      setQuarterlyFreq(preset.config.quarterlyConfig.frequency);
      setQuarterlyMonth(preset.config.quarterlyConfig.monthOfQuarter);
      setQuarterlyDay(preset.config.quarterlyConfig.dayOfMonth || 18);
    }
  };

  const handleCreatePattern = async () => {
    try {
      const patternData: Partial<RecurrencePattern> = {
        name: patternName,
        type: selectedType,
        endCondition: {
          type: endType,
          ...(endType === 'after_occurrences' && { occurrences: endOccurrences }),
          ...(endType === 'by_date' && { endDate })
        }
      };

      switch (selectedType) {
        case 'monthly':
          patternData.monthlyConfig = {
            frequency: monthlyFreq,
            dayOfMonth: monthlyEndOfMonth ? undefined : monthlyDay,
            endOfMonth: monthlyEndOfMonth
          };
          break;
        case 'yearly':
          patternData.yearlyConfig = {
            frequency: yearlyFreq,
            months: yearlyMonths,
            dayOfMonth: yearlyDay
          };
          break;
        case 'quarterly':
          patternData.quarterlyConfig = {
            frequency: quarterlyFreq,
            monthOfQuarter: quarterlyMonth,
            dayOfMonth: quarterlyDay
          };
          break;
        case 'custom':
          patternData.customConfig = {
            frequency: customFreq,
            unit: customUnit,
            daysOfWeek: customDaysOfWeek,
            daysOfMonth: [],
            monthsOfYear: []
          };
          break;
      }

      const newPattern = await createPattern(patternData);
      onChange(newPattern);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating pattern:', error);
    }
  };

  const handlePreview = async () => {
    if (!patternName) return;
    
    try {
      // Create a temporary pattern for preview
      const tempPattern: Partial<RecurrencePattern> = {
        _id: 'temp',
        name: patternName,
        type: selectedType
      };

      // For now, just show the preview dialog
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error previewing pattern:', error);
    }
  };

  const renderMonthlyConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthly-freq">Every</Label>
          <div className="flex items-center gap-2">
            <Input
              id="monthly-freq"
              type="number"
              min="1"
              max="12"
              value={monthlyFreq}
              onChange={(e) => setMonthlyFreq(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="text-sm text-gray-600">month(s)</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="end-of-month"
            checked={monthlyEndOfMonth}
            onCheckedChange={(checked) => setMonthlyEndOfMonth(checked as boolean)}
          />
          <Label htmlFor="end-of-month">Last day of month</Label>
        </div>
        
        {!monthlyEndOfMonth && (
          <div>
            <Label htmlFor="monthly-day">On day</Label>
            <Select value={monthlyDay.toString()} onValueChange={(value) => setMonthlyDay(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );

  const renderYearlyConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearly-freq">Every</Label>
          <div className="flex items-center gap-2">
            <Input
              id="yearly-freq"
              type="number"
              min="1"
              max="10"
              value={yearlyFreq}
              onChange={(e) => setYearlyFreq(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="text-sm text-gray-600">year(s)</span>
          </div>
        </div>
        
        <div>
          <Label htmlFor="yearly-day">On day</Label>
          <Input
            id="yearly-day"
            type="number"
            min="1"
            max="31"
            value={yearlyDay}
            onChange={(e) => setYearlyDay(parseInt(e.target.value) || 31)}
            className="w-20"
          />
        </div>
      </div>
      
      <div>
        <Label>In months</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {monthNames.map((month, index) => (
            <div key={month} className="flex items-center space-x-2">
              <Checkbox
                id={`month-${index}`}
                checked={yearlyMonths.includes(index + 1)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setYearlyMonths([...yearlyMonths, index + 1]);
                  } else {
                    setYearlyMonths(yearlyMonths.filter(m => m !== index + 1));
                  }
                }}
              />
              <Label htmlFor={`month-${index}`} className="text-sm">
                {month.slice(0, 3)}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuarterlyConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="quarterly-freq">Every</Label>
          <div className="flex items-center gap-2">
            <Input
              id="quarterly-freq"
              type="number"
              min="1"
              max="4"
              value={quarterlyFreq}
              onChange={(e) => setQuarterlyFreq(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="text-sm text-gray-600">quarter(s)</span>
          </div>
        </div>
        
        <div>
          <Label htmlFor="quarterly-month">Month of quarter</Label>
          <Select value={quarterlyMonth.toString()} onValueChange={(value) => setQuarterlyMonth(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st month</SelectItem>
              <SelectItem value="2">2nd month</SelectItem>
              <SelectItem value="3">3rd month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="quarterly-day">On day</Label>
          <Input
            id="quarterly-day"
            type="number"
            min="1"
            max="31"
            value={quarterlyDay}
            onChange={(e) => setQuarterlyDay(parseInt(e.target.value) || 18)}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );

  const renderCustomConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="custom-freq">Every</Label>
          <Input
            id="custom-freq"
            type="number"
            min="1"
            value={customFreq}
            onChange={(e) => setCustomFreq(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        
        <div>
          <Label htmlFor="custom-unit">Unit</Label>
          <Select value={customUnit} onValueChange={(value) => setCustomUnit(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {customUnit === 'weeks' && (
        <div>
          <Label>On days</Label>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {dayNames.map((day, index) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${index}`}
                  checked={customDaysOfWeek.includes(index)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setCustomDaysOfWeek([...customDaysOfWeek, index]);
                    } else {
                      setCustomDaysOfWeek(customDaysOfWeek.filter(d => d !== index));
                    }
                  }}
                />
                <Label htmlFor={`day-${index}`} className="text-xs">
                  {day.slice(0, 3)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEndCondition = () => (
    <div className="space-y-4">
      <Label>Ends</Label>
      <RadioGroup value={endType} onValueChange={(value) => setEndType(value as any)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="never" id="never" />
          <Label htmlFor="never">Never</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="after_occurrences" id="after" />
          <Label htmlFor="after">After</Label>
          {endType === 'after_occurrences' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={endOccurrences}
                onChange={(e) => setEndOccurrences(parseInt(e.target.value) || 12)}
                className="w-20"
              />
              <span className="text-sm text-gray-600">occurrences</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="by_date" id="by_date" />
          <Label htmlFor="by_date">By date</Label>
          {endType === 'by_date' && (
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          )}
        </div>
      </RadioGroup>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Recurrence Pattern</Label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              Configure Recurrence
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
              <DialogTitle className="text-xl font-semibold">Configure Recurrence Pattern</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Presets */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">CA Presets</h3>
                  <div className="grid gap-3">
                    {caPresets.map((preset) => (
                      <Card 
                        key={preset.id} 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handlePresetSelect(preset)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{preset.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-medium">{preset.name}</h4>
                              <p className="text-sm text-gray-600">{preset.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Configuration */}
              <div className="space-y-6">
                <div>
                  <Label htmlFor="pattern-name">Pattern Name</Label>
                  <Input
                    id="pattern-name"
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    placeholder="Enter pattern name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="pattern-type">Recurrence Type</Label>
                  <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedType === 'monthly' && renderMonthlyConfig()}
                    {selectedType === 'yearly' && renderYearlyConfig()}
                    {selectedType === 'quarterly' && renderQuarterlyConfig()}
                    {selectedType === 'custom' && renderCustomConfig()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">End Condition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderEndCondition()}
                  </CardContent>
                </Card>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handlePreview} 
                    variant="outline"
                    disabled={!patternName || isPreviewing}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    onClick={handleCreatePattern} 
                    disabled={!patternName || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Pattern'}
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {value && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{value.name}</span>
            <Badge variant="outline">{value.type}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pattern Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Preview of "{patternName}" pattern occurrences:
            </p>
            <div className="space-y-2">
              {/* Mock preview data - in real implementation, this would show actual calculated dates */}
              <div className="text-sm">Next 5 occurrences:</div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• {format(new Date(), 'MMM dd, yyyy')}</div>
                <div>• {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</div>
                <div>• {format(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</div>
                <div>• {format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</div>
                <div>• {format(new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
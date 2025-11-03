import React, { useState, useEffect } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Repeat, Calendar, Clock } from 'lucide-react';

interface CustomRecurrenceSettingsProps {
  control: Control<any>;
  onPatternChange: (pattern: string) => void;
}

export function CustomRecurrenceSettings({ control, onPatternChange }: CustomRecurrenceSettingsProps) {
  const [frequency, setFrequency] = useState('weekly');
  const [interval, setInterval] = useState(1);
  const [weekDays, setWeekDays] = useState<string[]>(['monday']);
  const [monthDay, setMonthDay] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endCondition, setEndCondition] = useState('never');
  const [endDate, setEndDate] = useState('');
  const [occurrences, setOccurrences] = useState(10);

  // Memoize the pattern change callback to prevent unnecessary re-renders
  const handlePatternChange = React.useCallback((pattern: string) => {
    onPatternChange(pattern);
  }, [onPatternChange]);

  const weekDayOptions = [
    { value: 'sunday', label: 'Sun' },
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const intervalUnit = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
    yearly: 'year',
  }[frequency] || 'week';

  const handleWeekDayToggle = React.useCallback((day: string) => {
    setWeekDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  }, []);

  // Generate pattern string whenever settings change
  useEffect(() => {
    const generatePattern = () => {
      let pattern = `FREQ=${frequency.toUpperCase()}`;
      
      if (interval > 1) {
        pattern += `;INTERVAL=${interval}`;
      }
      
      if (frequency === 'weekly' && weekDays.length > 0) {
        const days = weekDays.map(day => day.substring(0, 2).toUpperCase()).join(',');
        pattern += `;BYDAY=${days}`;
      }
      
      if (frequency === 'monthly') {
        pattern += `;BYMONTHDAY=${monthDay}`;
      }
      
      // Add time component
      if (startTime) {
        const [hour, minute] = startTime.split(':');
        pattern += `;BYHOUR=${hour};BYMINUTE=${minute}`;
      }
      
      // Add end condition
      if (endCondition === 'date' && endDate) {
        const formattedDate = endDate.replace(/-/g, '');
        pattern += `;UNTIL=${formattedDate}T235959Z`;
      } else if (endCondition === 'count' && occurrences) {
        pattern += `;COUNT=${occurrences}`;
      }
      
      return pattern;
    };

    const pattern = generatePattern();
    handlePatternChange(pattern);
  }, [frequency, interval, weekDays, monthDay, startTime, endCondition, endDate, occurrences, handlePatternChange]);

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Custom Recurrence Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Every</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <span className="text-sm text-gray-600">
                {intervalUnit}{interval > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Settings */}
        {frequency === 'weekly' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Repeat on</Label>
            <div className="flex gap-2 flex-wrap">
              {weekDayOptions.map(day => (
                <Button
                  key={day.value}
                  type="button"
                  variant={weekDays.includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleWeekDayToggle(day.value)}
                  className="w-12 h-8 p-0"
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Settings */}
        {frequency === 'monthly' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Day of month</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={monthDay}
              onChange={(e) => setMonthDay(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>
        )}

        {/* Start Time */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Start Time
          </Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-32"
          />
        </div>

        {/* End Condition */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">End Condition</Label>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="never"
                checked={endCondition === 'never'}
                onCheckedChange={() => setEndCondition('never')}
              />
              <Label htmlFor="never" className="text-sm">Never ends</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="endDate"
                checked={endCondition === 'date'}
                onCheckedChange={() => setEndCondition('date')}
              />
              <Label htmlFor="endDate" className="text-sm">Ends on</Label>
              {endCondition === 'date' && (
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36 ml-2"
                />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="endCount"
                checked={endCondition === 'count'}
                onCheckedChange={() => setEndCondition('count')}
              />
              <Label htmlFor="endCount" className="text-sm">Ends after</Label>
              {endCondition === 'count' && (
                <div className="flex items-center gap-2 ml-2">
                  <Input
                    type="number"
                    min="1"
                    value={occurrences}
                    onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">occurrences</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pattern Preview */}
        <div className="p-3 bg-white border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Pattern Summary</span>
          </div>
          <div className="text-sm text-gray-700">
            {frequency === 'daily' && `Every ${interval > 1 ? `${interval} days` : 'day'}`}
            {frequency === 'weekly' && `Every ${interval > 1 ? `${interval} weeks` : 'week'} on ${weekDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`}
            {frequency === 'monthly' && `Every ${interval > 1 ? `${interval} months` : 'month'} on day ${monthDay}`}
            {frequency === 'yearly' && `Every ${interval > 1 ? `${interval} years` : 'year'}`}
            {startTime && ` at ${startTime}`}
            {endCondition === 'date' && endDate && ` until ${endDate}`}
            {endCondition === 'count' && ` for ${occurrences} times`}
            {endCondition === 'never' && ' (never ends)'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause
} from 'lucide-react';

interface RecurringSchedule {
  id: string;
  templateName: string;
  clientName: string;
  category: 'GST' | 'ITR' | 'ROC' | 'OTHER';
  pattern: string;
  nextRun: string;
  lastRun?: string;
  isActive: boolean;
  assignedEmployees: string[];
}

export const RecurringTaskAutomation = () => {
  const { toast } = useToast();
  
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);
  const [autoRunTime, setAutoRunTime] = useState('09:00');
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([
    {
      id: '1',
      templateName: 'GST Filing - Monthly',
      clientName: 'ABC Corporation',
      category: 'GST',
      pattern: 'Monthly (10th)',
      nextRun: '2024-02-10T09:00:00Z',
      lastRun: '2024-01-10T09:00:00Z',
      isActive: true,
      assignedEmployees: ['John Doe', 'Jane Smith']
    },
    {
      id: '2',
      templateName: 'GST 3B Filing',
      clientName: 'XYZ Ltd',
      category: 'GST',
      pattern: 'Monthly (20th)',
      nextRun: '2024-02-20T09:00:00Z',
      lastRun: '2024-01-20T09:00:00Z',
      isActive: true,
      assignedEmployees: ['Jane Smith']
    },
    {
      id: '3',
      templateName: 'ITR Filing - Annual',
      clientName: 'Tech Solutions',
      category: 'ITR',
      pattern: 'Yearly (July 31st)',
      nextRun: '2024-07-31T09:00:00Z',
      lastRun: '2023-07-31T09:00:00Z',
      isActive: true,
      assignedEmployees: ['John Doe']
    },
    {
      id: '4',
      templateName: 'ROC Form Filing',
      clientName: 'Startup Inc',
      category: 'ROC',
      pattern: 'Yearly (November 30th)',
      nextRun: '2024-11-30T09:00:00Z',
      isActive: false,
      assignedEmployees: ['Jane Smith']
    }
  ]);

  const generateRecurringTasks = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call to generate tasks
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedCount = Math.floor(Math.random() * 10) + 5;
      
      toast({
        title: "Tasks Generated Successfully",
        description: `Generated ${generatedCount} recurring tasks based on active schedules.`,
      });
      
      // Update last run times
      setSchedules(prev => prev.map(schedule => ({
        ...schedule,
        lastRun: schedule.isActive ? new Date().toISOString() : schedule.lastRun
      })));
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate recurring tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, isActive: !schedule.isActive }
        : schedule
    ));
    
    toast({
      title: "Schedule Updated",
      description: "Recurring schedule has been updated successfully.",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'GST': return 'bg-blue-100 text-blue-800';
      case 'ITR': return 'bg-green-100 text-green-800';
      case 'ROC': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeSchedules = schedules.filter(s => s.isActive).length;
  const totalSchedules = schedules.length;

  return (
    <div className="space-y-6">
      {/* Automation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-purple-600" />
            Recurring Task Automation
            {isAutomationEnabled && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Automatic Generation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate recurring tasks based on templates
              </p>
            </div>
            <Switch
              checked={isAutomationEnabled}
              onCheckedChange={setIsAutomationEnabled}
            />
          </div>

          {isAutomationEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="autoRunTime">Daily Auto-run Time</Label>
                  <Input
                    id="autoRunTime"
                    type="time"
                    value={autoRunTime}
                    onChange={(e) => setAutoRunTime(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Time when recurring tasks will be automatically generated
                  </p>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={generateRecurringTasks}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Generate Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xl font-bold text-blue-700">{activeSchedules}</div>
              <div className="text-sm text-blue-600">Active Schedules</div>
            </div>
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xl font-bold text-green-700">{totalSchedules}</div>
              <div className="text-sm text-green-600">Total Schedules</div>
            </div>
            <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-xl font-bold text-purple-700">
                {schedules.filter(s => new Date(s.nextRun) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-sm text-purple-600">Due This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recurring Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Recurring Schedules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium">{schedule.templateName}</h4>
                    <p className="text-sm text-muted-foreground">{schedule.clientName}</p>
                  </div>
                  <Badge variant="secondary" className={getCategoryColor(schedule.category)}>
                    {schedule.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {schedule.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Pause className="h-4 w-4 text-gray-400" />
                  )}
                  <Switch
                    checked={schedule.isActive}
                    onCheckedChange={() => toggleSchedule(schedule.id)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">Pattern:</span>
                  <span>{schedule.pattern}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">Next Run:</span>
                  <span>{formatDateTime(schedule.nextRun)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">Assigned:</span>
                  <span>{schedule.assignedEmployees.join(', ')}</span>
                </div>
              </div>

              {schedule.lastRun && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Last generated: {formatDateTime(schedule.lastRun)}</span>
                </div>
              )}

              {new Date(schedule.nextRun) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && schedule.isActive && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Due in next 3 days</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
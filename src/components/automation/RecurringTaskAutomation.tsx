import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/services/api';
import { 
  RefreshCw,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  Loader2
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
  
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [autoRunTime, setAutoRunTime] = useState('09:00');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [stats, setStats] = useState({
    activeSchedules: 0,
    totalSchedules: 0,
    dueThisWeek: 0
  });

  // Load automation settings
  useEffect(() => {
    loadAutomationSettings();
    loadSchedules();
    loadStats();
  }, []);

  const loadAutomationSettings = async () => {
    try {
      const response = await apiClient.get('/automation/settings');
      if (response.data.success) {
        const { enabled, autoRunTime: time } = response.data.data;
        setIsAutomationEnabled(enabled || false);
        setAutoRunTime(time || '09:00');
      }
    } catch (error: any) {
      console.error('Error loading automation settings:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load automation settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await apiClient.get('/automation/schedules');
      if (response.data.success) {
        setSchedules(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/automation/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const saveAutomationSettings = async (enabled: boolean, time: string) => {
    setIsSavingSettings(true);
    try {
      const response = await apiClient.put('/automation/settings', {
        enabled,
        autoRunTime: time,
        emailNotifications: true,
        taskGeneration: true
      });

      if (response.data.success) {
        toast({
          title: "Settings Saved",
          description: "Automation settings updated successfully.",
        });
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAutomationToggle = async (checked: boolean) => {
    setIsAutomationEnabled(checked);
    await saveAutomationSettings(checked, autoRunTime);
  };

  const handleTimeChange = async (time: string) => {
    setAutoRunTime(time);
    await saveAutomationSettings(isAutomationEnabled, time);
  };

  const generateRecurringTasks = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.post('/automation/generate');
      
      if (response.data.success) {
        const generatedCount = response.data.data.count;
        
        toast({
          title: "Tasks Generated Successfully",
          description: `Generated ${generatedCount} recurring tasks based on active schedules.`,
        });
        
        // Reload schedules and stats
        await loadSchedules();
        await loadStats();
      }
    } catch (error: any) {
      console.error('Error generating tasks:', error);
      toast({
        title: "Generation Failed",
        description: error.response?.data?.message || "Failed to generate recurring tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSchedule = async (scheduleId: string) => {
    try {
      const response = await apiClient.put(`/automation/schedules/${scheduleId}/toggle`);
      
      if (response.data.success) {
        // Update local state
        setSchedules(prev => prev.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, isActive: !schedule.isActive }
            : schedule
        ));
        
        // Reload stats
        await loadStats();
        
        toast({
          title: "Schedule Updated",
          description: "Recurring schedule has been updated successfully.",
        });
      }
    } catch (error: any) {
      console.error('Error toggling schedule:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update schedule",
        variant: "destructive",
      });
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading automation settings...</span>
      </div>
    );
  }

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
              onCheckedChange={handleAutomationToggle}
              disabled={isSavingSettings}
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
                    onChange={(e) => handleTimeChange(e.target.value)}
                    disabled={isSavingSettings}
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
              <div className="text-xl font-bold text-blue-700">{stats.activeSchedules}</div>
              <div className="text-sm text-blue-600">Active Schedules</div>
            </div>
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xl font-bold text-green-700">{stats.totalSchedules}</div>
              <div className="text-sm text-green-600">Total Schedules</div>
            </div>
            <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-xl font-bold text-purple-700">{stats.dueThisWeek}</div>
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
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recurring schedules found</p>
              <p className="text-sm mt-1">Create task templates with recurrence patterns to see them here</p>
            </div>
          ) : (
            schedules.map((schedule) => (
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
                    <span>{schedule.assignedEmployees.join(', ') || 'Unassigned'}</span>
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
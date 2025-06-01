
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAutomation } from '@/hooks/useAutomation';
import { useToast } from '@/hooks/use-toast';
import { Clock, Bot, MessageCircle, FileText, RefreshCw } from 'lucide-react';

export const AutomationSettings = () => {
  const { settings, updateSettings, isUpdatingSettings, generateRecurringTasks, isGenerating } = useAutomation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    auto_invoice_generation: false,
    deadline_reminders_enabled: false,
    whatsapp_notifications: false,
    reminder_days_before: 3,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        auto_invoice_generation: settings.auto_invoice_generation || false,
        deadline_reminders_enabled: settings.deadline_reminders_enabled || false,
        whatsapp_notifications: settings.whatsapp_notifications || false,
        reminder_days_before: settings.reminder_days_before || 3,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings(formData);
    toast({
      title: "Settings Updated",
      description: "Automation settings have been saved successfully.",
    });
  };

  const handleGenerateRecurring = () => {
    generateRecurringTasks();
    toast({
      title: "Generating Tasks",
      description: "Recurring tasks are being generated based on templates.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Settings</h2>
          <p className="text-muted-foreground">Configure automated workflows and notifications</p>
        </div>
        <Button 
          onClick={handleGenerateRecurring}
          disabled={isGenerating}
          variant="outline"
        >
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Recurring Tasks
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Auto Invoice Generation
              {formData.auto_invoice_generation && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-invoice">Generate invoices automatically after task completion</Label>
              <Switch
                id="auto-invoice"
                checked={formData.auto_invoice_generation}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, auto_invoice_generation: checked }))
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, invoices will be automatically created when payable tasks are marked as completed.
            </p>
          </CardContent>
        </Card>

        {/* Deadline Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Deadline Reminders
              {formData.deadline_reminders_enabled && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="deadline-reminders">Send deadline reminders</Label>
              <Switch
                id="deadline-reminders"
                checked={formData.deadline_reminders_enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, deadline_reminders_enabled: checked }))
                }
              />
            </div>
            
            {formData.deadline_reminders_enabled && (
              <div className="space-y-2">
                <Label htmlFor="reminder-days">Days before deadline</Label>
                <Input
                  id="reminder-days"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.reminder_days_before}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, reminder_days_before: parseInt(e.target.value) || 3 }))
                  }
                  className="w-20"
                />
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Automatically notify assigned employees and clients about upcoming deadlines.
            </p>
          </CardContent>
        </Card>

        {/* WhatsApp Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              WhatsApp Automation
              {formData.whatsapp_notifications && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="whatsapp-notifications">Enable WhatsApp notifications</Label>
              <Switch
                id="whatsapp-notifications"
                checked={formData.whatsapp_notifications}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, whatsapp_notifications: checked }))
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Send automated WhatsApp messages for task updates, quotations, and reminders.
            </p>
          </CardContent>
        </Card>

        {/* Recurring Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Recurring Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Automatically generate recurring tasks based on your templates (GST, ITR, ROC filing).
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Next check:</span>
                <span className="font-medium">Today at 9:00 AM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last generated:</span>
                <span className="font-medium">2 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isUpdatingSettings}
          className="bg-ca-blue hover:bg-ca-blue-dark"
        >
          {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

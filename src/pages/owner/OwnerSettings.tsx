
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/hooks/useSettings';
import { BackendConnectivityTest } from '@/components/testing/BackendConnectivityTest';
import { SystemConfigurationSettings } from '@/components/settings/SystemConfigurationSettings';
import { InvoiceAccountsSettings } from '@/components/settings/InvoiceAccountsSettings';
import { RecurringTaskAutomation } from '@/components/automation/RecurringTaskAutomation';
import { IntegrationsTestSuite } from '@/components/testing/IntegrationsTestSuite';
import { EmailTemplateManager } from '@/components/communication/EmailTemplateManager';
import { ExcelManager } from '@/components/excel/ExcelManager';
import { 
  Building2, 
  Bell, 
  Shield, 
  CreditCard, 
  Settings2, 
  Zap,
  Save,
  RotateCcw,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  TestTube,
  RefreshCw,
  Power
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { settingsService } from '@/services/settings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const OwnerSettings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [importFile, setImportFile] = useState<File | null>(null);
  
  const {
    settings,
    isLoading,
    error,
    unsavedChanges,
    hasUnsavedChanges,
    updateSetting,
    saveChanges,
    discardChanges,
    resetSettings,
    exportSettings,
    importSettings,
    getSetting,
    isUpdating,
    isResetting,
    isExporting
  } = useSettings({ autoSave: true, saveDelay: 2000 });

  const { toast } = useToast();
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      await importSettings(file);
      setImportFile(null);
      event.target.value = ''; // Reset file input
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load settings. Please refresh the page or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure your CA Flow Board system settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportSettings}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirmSave(true)}
            disabled={isSavingFile}
          >
            {isSavingFile ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings File
          </Button>
          {/* Confirmation Dialog */}
          <Dialog open={showConfirmSave} onOpenChange={setShowConfirmSave}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Save settings to backend file?</DialogTitle>
              </DialogHeader>
              <div className="py-4 text-sm text-secondary">
                This will write the current firm's settings to <code>backend/settings.json</code> on the server. This is a development convenience and may overwrite existing file-based settings. Proceed?
              </div>
              <DialogFooter>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowConfirmSave(false)}>Cancel</Button>
                  <Button
                    onClick={async () => {
                      try {
                        setIsSavingFile(true);
                        const res = await settingsService.saveSettingsFile();
                        toast({ title: 'Saved', description: res?.message || 'Settings written to backend file.' });
                      } catch (err: any) {
                        console.error('Save settings file failed', err);
                        toast({ title: 'Save failed', description: err?.message || 'Unable to save settings file', variant: 'destructive' });
                      } finally {
                        setIsSavingFile(false);
                        setShowConfirmSave(false);
                      }
                    }}
                    disabled={isSavingFile}
                  >
                    {isSavingFile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      {hasUnsavedChanges && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Changes will be saved automatically in a few seconds...</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveChanges} disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Now
              </Button>
              <Button size="sm" variant="outline" onClick={discardChanges}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Discard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Settings</CardTitle>
          <CardDescription>
            Manage your system preferences, notifications, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="company" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-1">
                <Settings2 className="h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Automation
              </TabsTrigger>
            </TabsList>

            {/* Company Settings */}
            <TabsContent value="company" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure your organization's basic information and branding
                </p>
              </div>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName"
                    value={getSetting('company', 'name') || ''}
                    onChange={(e) => updateSetting('company', 'name', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input 
                    id="registrationNumber"
                    value={getSetting('company', 'registrationNumber') || ''}
                    onChange={(e) => updateSetting('company', 'registrationNumber', e.target.value)}
                    placeholder="Enter registration number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input 
                    id="gstNumber"
                    value={getSetting('company', 'gstNumber') || ''}
                    onChange={(e) => updateSetting('company', 'gstNumber', e.target.value)}
                    placeholder="Enter GST number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input 
                    id="panNumber"
                    value={getSetting('company', 'panNumber') || ''}
                    onChange={(e) => updateSetting('company', 'panNumber', e.target.value)}
                    placeholder="Enter PAN number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    value={getSetting('company', 'phone') || ''}
                    onChange={(e) => updateSetting('company', 'phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={getSetting('company', 'email') || ''}
                    onChange={(e) => updateSetting('company', 'email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address"
                    value={getSetting('company', 'address') || ''}
                    onChange={(e) => updateSetting('company', 'address', e.target.value)}
                    placeholder="Enter complete address"
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-md font-semibold mb-4">System Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select 
                      value={getSetting('company', 'dateFormat') || 'DD/MM/YYYY'}
                      onValueChange={(value) => updateSetting('company', 'dateFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeZone">Time Zone</Label>
                    <Select 
                      value={getSetting('company', 'timeZone') || 'Asia/Kolkata'}
                      onValueChange={(value) => updateSetting('company', 'timeZone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Indian Standard Time (IST)</SelectItem>
                        <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (EST)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={getSetting('company', 'currency') || 'INR'}
                      onValueChange={(value) => updateSetting('company', 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Invoice Accounts Settings */}
            <TabsContent value="accounts">
              <InvoiceAccountsSettings 
                getSetting={getSetting} 
                updateSetting={updateSetting} 
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure how and when you want to receive notifications
                </p>
              </div>
              <Separator />
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-semibold mb-4">Delivery Methods</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'email')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'sms')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'sms', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive browser push notifications
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'push')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold mb-4">Event Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Task Assignments</Label>
                        <p className="text-sm text-muted-foreground">
                          When tasks are assigned to team members
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'taskAssignments')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'taskAssignments', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Task Completions</Label>
                        <p className="text-sm text-muted-foreground">
                          When tasks are marked as completed
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'taskCompletions')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'taskCompletions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Due Date Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Reminders for approaching due dates
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'dueDateReminders')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'dueDateReminders', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Client Activities</Label>
                        <p className="text-sm text-muted-foreground">
                          New client registrations and updates
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'clientActivities')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'clientActivities', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Payment Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Invoice payments and payment failures
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'paymentUpdates')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'paymentUpdates', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Critical system notifications and maintenance
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'systemAlerts')}
                        onCheckedChange={(checked) => updateSetting('notifications', 'systemAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage your account security and privacy settings
                </p>
              </div>
              <Separator />
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-semibold mb-4">Authentication</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('security', 'twoFactorAuth')}
                        onCheckedChange={(checked) => updateSetting('security', 'twoFactorAuth', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input 
                        id="sessionTimeout"
                        type="number"
                        value={getSetting('security', 'sessionTimeout') || ''}
                        onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                        placeholder="Enter session timeout in minutes"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold mb-4">Access Control</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>IP Restrictions</Label>
                        <p className="text-sm text-muted-foreground">
                          Restrict access to specific IP addresses
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('security', 'ipRestrictions')}
                        onCheckedChange={(checked) => updateSetting('security', 'ipRestrictions', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allowedIPs">Allowed IP Addresses</Label>
                      <Textarea 
                        id="allowedIPs"
                        value={getSetting('security', 'allowedIPs') || ''}
                        onChange={(e) => updateSetting('security', 'allowedIPs', e.target.value)}
                        placeholder="Enter IP addresses (one per line)"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold mb-4">Data Retention</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataRetentionPeriod">Data Retention Period (days)</Label>
                      <Input 
                        id="dataRetentionPeriod"
                        type="number"
                        value={getSetting('security', 'dataRetentionPeriod') || ''}
                        onChange={(e) => updateSetting('security', 'dataRetentionPeriod', parseInt(e.target.value))}
                        placeholder="Enter retention period in days"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-delete Old Data</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically delete data after retention period
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('security', 'autoDeleteOldData')}
                        onCheckedChange={(checked) => updateSetting('security', 'autoDeleteOldData', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing & Subscription
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription and billing preferences
                </p>
              </div>
              <Separator />
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-semibold mb-4">Current Plan</h4>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{getSetting('billing', 'currentPlan') || 'Premium'} Plan</h3>
                        <p className="text-sm text-muted-foreground">
                          ₹{getSetting('billing', 'monthlyRate') || '4,999'}/month
                        </p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm">
                        Your next billing date is {getSetting('billing', 'nextBillingDate') || 'May 15, 2025'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold mb-4">Billing Preferences</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-renewal</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically renew subscription
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('billing', 'autoRenewal')}
                        onCheckedChange={(checked) => updateSetting('billing', 'autoRenewal', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Invoices</Label>
                        <p className="text-sm text-muted-foreground">
                          Send invoices via email
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('billing', 'emailInvoices')}
                        onCheckedChange={(checked) => updateSetting('billing', 'emailInvoices', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold mb-4">Tax Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input 
                        id="taxId"
                        value={getSetting('billing', 'taxId') || ''}
                        onChange={(e) => updateSetting('billing', 'taxId', e.target.value)}
                        placeholder="Enter tax ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Billing Address</Label>
                      <Textarea 
                        id="billingAddress"
                        value={getSetting('billing', 'billingAddress') || ''}
                        onChange={(e) => updateSetting('billing', 'billingAddress', e.target.value)}
                        placeholder="Enter billing address"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="py-4">
                <SystemConfigurationSettings showWhatsApp={false} showTesting={false} />
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-6">
              <div className="py-4">
                <div className="space-y-6">
                  <RecurringTaskAutomation />
                  <EmailTemplateManager />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ExcelManager 
                      entityType="tasks" 
                      data={[]} 
                      onImport={(data) => console.log('Imported tasks:', data)}
                    />
                    <ExcelManager 
                      entityType="clients" 
                      data={[]} 
                      onImport={(data) => console.log('Imported clients:', data)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reset Settings Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will affect your system configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h4 className="font-medium">Full System Restart</h4>
              <p className="text-sm text-muted-foreground">
                Restart the entire system including all services and connections. Requires TOTP from auditor's authenticator.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => {
                const totp = prompt('Enter TOTP from Auditor\'s Google Auth/MS Auth:');
                if (totp) {
                  toast({ 
                    title: 'System Restart Initiated', 
                    description: 'Full system restart in progress...' 
                  });
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              System Restart
            </Button>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h4 className="font-medium">Application Restart</h4>
              <p className="text-sm text-muted-foreground">
                Restart only the application server without affecting database or other services.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => {
                toast({ 
                  title: 'Application Restart Initiated', 
                  description: 'Application restarting...' 
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              App Restart
            </Button>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h4 className="font-medium">Shutdown Application</h4>
              <p className="text-sm text-muted-foreground">
                Kill this process and stop until manual restart. Requires TOTP from auditor's authenticator.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => {
                const totp = prompt('Enter TOTP from Auditor\'s Google Auth/MS Auth:');
                if (totp) {
                  const confirm = window.confirm('Are you sure? This will stop the application completely.');
                  if (confirm) {
                    toast({ 
                      title: 'Shutdown Initiated', 
                      description: 'Application shutting down...',
                      variant: 'destructive'
                    });
                  }
                }
              }}
            >
              <Power className="h-4 w-4 mr-2" />
              Shutdown App
            </Button>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h4 className="font-medium">Shutdown Server</h4>
              <p className="text-sm text-muted-foreground">
                Shutdown the entire server infrastructure. Requires TOTP from auditor's authenticator.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => {
                const totp = prompt('Enter TOTP from Auditor\'s Google Auth/MS Auth:');
                if (totp) {
                  const confirm = window.confirm('Are you sure? This will shutdown the entire server!');
                  if (confirm) {
                    toast({ 
                      title: 'Server Shutdown Initiated', 
                      description: 'Server shutting down...',
                      variant: 'destructive'
                    });
                  }
                }
              }}
            >
              <Power className="h-4 w-4 mr-2" />
              Shutdown Server
            </Button>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <h4 className="font-medium">Reset All Settings</h4>
              <p className="text-sm text-muted-foreground">
                Reset all settings to their default values. This action cannot be undone.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => resetSettings()}
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reset Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerSettings;

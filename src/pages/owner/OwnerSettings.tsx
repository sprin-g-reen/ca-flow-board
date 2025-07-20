
import { useState } from 'react';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { BackendConnectivityTest } from '@/components/testing/BackendConnectivityTest';
import { SystemConfigurationSettings } from '@/components/settings/SystemConfigurationSettings';
import { RecurringTaskAutomation } from '@/components/automation/RecurringTaskAutomation';
import { IntegrationsTestSuite } from '@/components/testing/IntegrationsTestSuite';
import { EmailTemplateManager } from '@/components/communication/EmailTemplateManager';
import { ExcelManager } from '@/components/excel/ExcelManager';

const OwnerSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [taskAssignments, setTaskAssignments] = useState(true);
  const [invoiceEvents, setInvoiceEvents] = useState(true);
  const [clientSignups, setClientSignups] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Settings</CardTitle>
          <CardDescription>
            Manage your system preferences, notifications, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="space-y-4 py-4">
                <h3 className="text-lg font-medium">Company Information</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" defaultValue="CA Flow Board" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input id="businessType" defaultValue="Chartered Accountancy Firm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="contact@caflowboard.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue="+91 98765 43210" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" defaultValue="123 Business Park, Financial District" />
                  </div>
                </div>

                <h3 className="text-lg font-medium mt-6">System Preferences</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select id="dateFormat" className="w-full border rounded-md p-2">
                      <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                      <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                      <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeZone">Time Zone</Label>
                    <select id="timeZone" className="w-full border rounded-md p-2">
                      <option value="IST">Indian Standard Time (IST)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="EST">Eastern Standard Time (EST)</option>
                      <option value="PST">Pacific Standard Time (PST)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select id="currency" className="w-full border rounded-md p-2">
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                </div>

                <Button className="mt-4 bg-ca-blue hover:bg-ca-blue-dark">Save Changes</Button>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4 py-4">
                <h3 className="text-lg font-medium">Notification Preferences</h3>
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mt-6">Notification Events</h3>
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Task Assignments</h4>
                      <p className="text-sm text-muted-foreground">Notifications for new task assignments</p>
                    </div>
                    <Switch
                      checked={taskAssignments}
                      onCheckedChange={setTaskAssignments}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Invoice Events</h4>
                      <p className="text-sm text-muted-foreground">Notifications for invoice generation and payments</p>
                    </div>
                    <Switch
                      checked={invoiceEvents}
                      onCheckedChange={setInvoiceEvents}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Client Signups</h4>
                      <p className="text-sm text-muted-foreground">Notifications when new clients join</p>
                    </div>
                    <Switch
                      checked={clientSignups}
                      onCheckedChange={setClientSignups}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Daily Reports</h4>
                      <p className="text-sm text-muted-foreground">Receive daily activity summary reports</p>
                    </div>
                    <Switch
                      checked={dailyReports}
                      onCheckedChange={setDailyReports}
                    />
                  </div>
                </div>
                
                <Button className="mt-4 bg-ca-blue hover:bg-ca-blue-dark">Save Preferences</Button>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="space-y-4 py-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
                
                <Button className="mt-4 bg-ca-blue hover:bg-ca-blue-dark">Update Password</Button>
                
                <h3 className="text-lg font-medium mt-6">Two-Factor Authentication</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enable Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Secure your account with 2FA</p>
                  </div>
                  <Button variant="outline">Setup</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <div className="space-y-4 py-4">
                <h3 className="text-lg font-medium">Subscription Plan</h3>
                <Separator />
                
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Premium Plan</h3>
                      <p className="text-sm text-muted-foreground">₹4,999/month</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Active</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm">Your next billing date is May 15, 2025</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm">Change Plan</Button>
                    <Button variant="destructive" size="sm">Cancel Subscription</Button>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mt-6">Payment Method</h3>
                <Separator />
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="font-bold">V</span>
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Change</Button>
                </div>
                
                <h3 className="text-lg font-medium mt-6">Billing History</h3>
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between p-3 border-b">
                    <div>
                      <p className="font-medium">Apr 15, 2025</p>
                      <p className="text-sm text-muted-foreground">Premium Plan - Monthly</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹4,999</p>
                      <p className="text-sm text-green-600">Paid</p>
                    </div>
                  </div>
                  <div className="flex justify-between p-3 border-b">
                    <div>
                      <p className="font-medium">Mar 15, 2025</p>
                      <p className="text-sm text-muted-foreground">Premium Plan - Monthly</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹4,999</p>
                      <p className="text-sm text-green-600">Paid</p>
                    </div>
                  </div>
                  <div className="flex justify-between p-3 border-b">
                    <div>
                      <p className="font-medium">Feb 15, 2025</p>
                      <p className="text-sm text-muted-foreground">Premium Plan - Monthly</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹4,999</p>
                      <p className="text-sm text-green-600">Paid</p>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="mt-2">View All Invoices</Button>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="py-4">
                <SystemConfigurationSettings />
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

            <TabsContent value="testing" className="space-y-6">
              <div className="space-y-6 py-4">
                <IntegrationsTestSuite />
                <div>
                  <h3 className="text-lg font-medium mb-4">Backend Connectivity Test</h3>
                  <Separator />
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Run basic connectivity tests to verify database and edge function connections.
                    </p>
                    <BackendConnectivityTest />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerSettings;

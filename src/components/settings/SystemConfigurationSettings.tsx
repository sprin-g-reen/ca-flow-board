import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  CreditCard, 
  MessageCircle, 
  FileSpreadsheet, 
  Download,
  Upload,
  TestTube,
  Zap
} from 'lucide-react';

interface SystemConfig {
  // Email SMTP Configuration
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_secure: boolean;
  smtp_enabled: boolean;
  
  // Payment Gateway Configuration
  razorpay_api_key_1: string;
  razorpay_api_secret_1: string;
  razorpay_api_key_2: string;
  razorpay_api_secret_2: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  payment_gateway_enabled: boolean;
  
  // WhatsApp Configuration
  whatsapp_api_url: string;
  whatsapp_access_token: string;
  whatsapp_timeout: number;
  whatsapp_enabled: boolean;
  
  // Excel Configuration
  excel_import_size_limit: number;
  excel_export_enabled: boolean;
  excel_import_enabled: boolean;
  
  // Testing Configuration
  test_mode_enabled: boolean;
  payment_test_mode: boolean;
  email_test_mode: boolean;
  whatsapp_test_mode: boolean;
}

export const SystemConfigurationSettings = () => {
  const { toast } = useToast();
  
  const [config, setConfig] = useState<SystemConfig>({
    // Email defaults
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_secure: true,
    smtp_enabled: false,
    
    // Payment defaults
    razorpay_api_key_1: '',
    razorpay_api_secret_1: '',
    razorpay_api_key_2: '',
    razorpay_api_secret_2: '',
    stripe_publishable_key: '',
    stripe_secret_key: '',
    payment_gateway_enabled: false,
    
    // WhatsApp defaults
    whatsapp_api_url: '',
    whatsapp_access_token: '',
    whatsapp_timeout: 30,
    whatsapp_enabled: false,
    
    // Excel defaults
    excel_import_size_limit: 50,
    excel_export_enabled: true,
    excel_import_enabled: true,
    
    // Testing defaults
    test_mode_enabled: false,
    payment_test_mode: false,
    email_test_mode: false,
    whatsapp_test_mode: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState({
    email: false,
    payment: false,
    whatsapp: false,
  });

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, this would save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Configuration Saved",
        description: "System configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (type: 'email' | 'payment' | 'whatsapp') => {
    setIsTesting(prev => ({ ...prev, [type]: true }));
    
    try {
      // Simulate test API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Test Successful",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} connection test passed.`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} connection test failed.`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">Configure integrations, limits, and testing options</p>
        </div>
        <Button 
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="bg-ca-blue hover:bg-ca-blue-dark"
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      {/* Email SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email SMTP Configuration
            {config.smtp_enabled && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable SMTP Email</Label>
            <Switch
              checked={config.smtp_enabled}
              onCheckedChange={(checked) => handleConfigChange('smtp_enabled', checked)}
            />
          </div>
          
          {config.smtp_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={config.smtp_host}
                    onChange={(e) => handleConfigChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={config.smtp_port}
                    onChange={(e) => handleConfigChange('smtp_port', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Username</Label>
                  <Input
                    id="smtp_username"
                    value={config.smtp_username}
                    onChange={(e) => handleConfigChange('smtp_username', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={config.smtp_password}
                    onChange={(e) => handleConfigChange('smtp_password', e.target.value)}
                    placeholder="App password"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Use Secure Connection (TLS)</Label>
                <Switch
                  checked={config.smtp_secure}
                  onCheckedChange={(checked) => handleConfigChange('smtp_secure', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Email Test Mode</Label>
                <Switch
                  checked={config.email_test_mode}
                  onCheckedChange={(checked) => handleConfigChange('email_test_mode', checked)}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => handleTestConnection('email')}
                disabled={isTesting.email}
                className="w-full"
              >
                {isTesting.email ? 'Testing...' : 'Test Email Connection'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Gateway Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Payment Gateway Configuration
            {config.payment_gateway_enabled && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Payment Gateways</Label>
            <Switch
              checked={config.payment_gateway_enabled}
              onCheckedChange={(checked) => handleConfigChange('payment_gateway_enabled', checked)}
            />
          </div>
          
          {config.payment_gateway_enabled && (
            <>
              <Separator />
              
              {/* Razorpay Branch 1 */}
              <div className="space-y-4">
                <h4 className="font-medium">Razorpay Configuration (Branch 1)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razorpay_key_1">API Key 1</Label>
                    <Input
                      id="razorpay_key_1"
                      value={config.razorpay_api_key_1}
                      onChange={(e) => handleConfigChange('razorpay_api_key_1', e.target.value)}
                      placeholder="rzp_test_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razorpay_secret_1">API Secret 1</Label>
                    <Input
                      id="razorpay_secret_1"
                      type="password"
                      value={config.razorpay_api_secret_1}
                      onChange={(e) => handleConfigChange('razorpay_api_secret_1', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Razorpay Branch 2 */}
              <div className="space-y-4">
                <h4 className="font-medium">Razorpay Configuration (Branch 2)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razorpay_key_2">API Key 2</Label>
                    <Input
                      id="razorpay_key_2"
                      value={config.razorpay_api_key_2}
                      onChange={(e) => handleConfigChange('razorpay_api_key_2', e.target.value)}
                      placeholder="rzp_test_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razorpay_secret_2">API Secret 2</Label>
                    <Input
                      id="razorpay_secret_2"
                      type="password"
                      value={config.razorpay_api_secret_2}
                      onChange={(e) => handleConfigChange('razorpay_api_secret_2', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Stripe Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Stripe Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe_publishable">Publishable Key</Label>
                    <Input
                      id="stripe_publishable"
                      value={config.stripe_publishable_key}
                      onChange={(e) => handleConfigChange('stripe_publishable_key', e.target.value)}
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe_secret">Secret Key</Label>
                    <Input
                      id="stripe_secret"
                      type="password"
                      value={config.stripe_secret_key}
                      onChange={(e) => handleConfigChange('stripe_secret_key', e.target.value)}
                      placeholder="sk_test_..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Payment Test Mode</Label>
                <Switch
                  checked={config.payment_test_mode}
                  onCheckedChange={(checked) => handleConfigChange('payment_test_mode', checked)}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => handleTestConnection('payment')}
                disabled={isTesting.payment}
                className="w-full"
              >
                {isTesting.payment ? 'Testing...' : 'Test Payment Gateways'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp Configuration
            {config.whatsapp_enabled && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable WhatsApp Integration</Label>
            <Switch
              checked={config.whatsapp_enabled}
              onCheckedChange={(checked) => handleConfigChange('whatsapp_enabled', checked)}
            />
          </div>
          
          {config.whatsapp_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_api">WhatsApp API URL</Label>
                  <Input
                    id="whatsapp_api"
                    value={config.whatsapp_api_url}
                    onChange={(e) => handleConfigChange('whatsapp_api_url', e.target.value)}
                    placeholder="https://api.whatsapp.com/send"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_token">Access Token</Label>
                  <Input
                    id="whatsapp_token"
                    type="password"
                    value={config.whatsapp_access_token}
                    onChange={(e) => handleConfigChange('whatsapp_access_token', e.target.value)}
                    placeholder="Your WhatsApp Business API token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_timeout">Request Timeout (seconds)</Label>
                  <Input
                    id="whatsapp_timeout"
                    type="number"
                    min="5"
                    max="120"
                    value={config.whatsapp_timeout}
                    onChange={(e) => handleConfigChange('whatsapp_timeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>WhatsApp Test Mode</Label>
                <Switch
                  checked={config.whatsapp_test_mode}
                  onCheckedChange={(checked) => handleConfigChange('whatsapp_test_mode', checked)}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => handleTestConnection('whatsapp')}
                disabled={isTesting.whatsapp}
                className="w-full"
              >
                {isTesting.whatsapp ? 'Testing...' : 'Test WhatsApp Connection'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Excel Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-600" />
            Excel Import/Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Excel Export</Label>
            <Switch
              checked={config.excel_export_enabled}
              onCheckedChange={(checked) => handleConfigChange('excel_export_enabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Enable Excel Import</Label>
            <Switch
              checked={config.excel_import_enabled}
              onCheckedChange={(checked) => handleConfigChange('excel_import_enabled', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="excel_size_limit">Import Size Limit (MB)</Label>
            <Input
              id="excel_size_limit"
              type="number"
              min="1"
              max="100"
              value={config.excel_import_size_limit}
              onChange={(e) => handleConfigChange('excel_import_size_limit', parseInt(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Maximum file size allowed for Excel imports
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Testing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-purple-600" />
            Global Testing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Master Test Mode</Label>
              <p className="text-sm text-muted-foreground">Override all individual test mode settings</p>
            </div>
            <Switch
              checked={config.test_mode_enabled}
              onCheckedChange={(checked) => handleConfigChange('test_mode_enabled', checked)}
            />
          </div>
          
          {config.test_mode_enabled && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Test Mode Active</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                All integrations are running in test mode. No real transactions or messages will be processed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
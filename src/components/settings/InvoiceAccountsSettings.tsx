import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CreditCard, Upload, X, Image as ImageIcon } from 'lucide-react';
import type { InvoiceAccount } from '@/services/settings';

interface InvoiceAccountsSettingsProps {
  getSetting: (category: string, key: string) => any;
  updateSetting: (category: string, key: string, value: any) => void;
}

export const InvoiceAccountsSettings = ({ getSetting, updateSetting }: InvoiceAccountsSettingsProps) => {
  const [logoPreview1, setLogoPreview1] = useState<string>('');
  const [logoPreview2, setLogoPreview2] = useState<string>('');

  // Load existing logos on mount
  useEffect(() => {
    const accounts = getSetting('company', 'invoiceAccounts');
    if (accounts?.account_1?.branding?.logoFile) {
      setLogoPreview1(accounts.account_1.branding.logoFile);
    }
    if (accounts?.account_2?.branding?.logoFile) {
      setLogoPreview2(accounts.account_2.branding.logoFile);
    }
  }, []);

  const updateAccount = (accountKey: 'account_1' | 'account_2', field: string, value: any) => {
    const accounts = getSetting('company', 'invoiceAccounts') || {};
    const currentAccount = accounts[accountKey] || {};
    
    // Handle nested fields
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updateSetting('company', 'invoiceAccounts', {
        ...accounts,
        [accountKey]: {
          ...currentAccount,
          [parent]: {
            ...currentAccount[parent],
            [child]: value
          }
        }
      });
    } else {
      updateSetting('company', 'invoiceAccounts', {
        ...accounts,
        [accountKey]: {
          ...currentAccount,
          [field]: value
        }
      });
    }
  };

  const handleLogoUpload = (accountKey: 'account_1' | 'account_2', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateAccount(accountKey, 'branding.logoFile', base64String);
      
      // Update preview
      if (accountKey === 'account_1') {
        setLogoPreview1(base64String);
      } else {
        setLogoPreview2(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = (accountKey: 'account_1' | 'account_2') => {
    updateAccount(accountKey, 'branding.logoFile', '');
    if (accountKey === 'account_1') {
      setLogoPreview1('');
    } else {
      setLogoPreview2('');
    }
  };

  const AccountCard = ({ accountKey, title, description }: { 
    accountKey: 'account_1' | 'account_2'; 
    title: string;
    description: string;
  }) => {
    const account = getSetting('company', 'invoiceAccounts')?.[accountKey] || {};
    const logoPreview = accountKey === 'account_1' ? logoPreview1 : logoPreview2;
    const currentLogo = logoPreview || account.branding?.logoFile || '';
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                value={account.name || ''}
                onChange={(e) => updateAccount(accountKey, 'name', e.target.value)}
                placeholder="Enter account name"
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={account.companyName || ''}
                onChange={(e) => updateAccount(accountKey, 'companyName', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input
                value={account.gstNumber || ''}
                onChange={(e) => updateAccount(accountKey, 'gstNumber', e.target.value)}
                placeholder="Enter GST number"
              />
            </div>
            <div className="space-y-2">
              <Label>PAN Number</Label>
              <Input
                value={account.panNumber || ''}
                onChange={(e) => updateAccount(accountKey, 'panNumber', e.target.value)}
                placeholder="Enter PAN number"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={account.email || ''}
                onChange={(e) => updateAccount(accountKey, 'email', e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={account.phone || ''}
                onChange={(e) => updateAccount(accountKey, 'phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={account.address || ''}
                onChange={(e) => updateAccount(accountKey, 'address', e.target.value)}
                placeholder="Enter complete address"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <Separator />
          <h4 className="text-md font-semibold">Razorpay Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Razorpay Key ID</Label>
              <Input
                value={account.razorpayDetails?.keyId || ''}
                onChange={(e) => updateAccount(accountKey, 'razorpayDetails.keyId', e.target.value)}
                placeholder="Enter Razorpay Key ID"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Razorpay Key Secret</Label>
              <Input
                value={account.razorpayDetails?.keySecret || ''}
                onChange={(e) => updateAccount(accountKey, 'razorpayDetails.keySecret', e.target.value)}
                placeholder="Enter Razorpay Key Secret"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Account ID (Optional)</Label>
              <Input
                value={account.razorpayDetails?.accountId || ''}
                onChange={(e) => updateAccount(accountKey, 'razorpayDetails.accountId', e.target.value)}
                placeholder="Enter Razorpay Account ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook Secret (Optional)</Label>
              <Input
                value={account.razorpayDetails?.webhookSecret || ''}
                onChange={(e) => updateAccount(accountKey, 'razorpayDetails.webhookSecret', e.target.value)}
                placeholder="Enter Webhook Secret"
                type="password"
              />
            </div>
          </div>

          <Separator />
          <h4 className="text-md font-semibold">Branding</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={account.branding?.primaryColor || '#3b82f6'}
                  onChange={(e) => updateAccount(accountKey, 'branding.primaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={account.branding?.primaryColor || '#3b82f6'}
                  onChange={(e) => updateAccount(accountKey, 'branding.primaryColor', e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              {currentLogo ? (
                <div className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img 
                    src={currentLogo} 
                    alt="Company Logo" 
                    className="max-h-24 max-w-full object-contain mx-auto"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLogo(accountKey)}
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id={`logo-${accountKey}`}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleLogoUpload(accountKey, file);
                      }
                    }}
                    className="hidden"
                  />
                  <label 
                    htmlFor={`logo-${accountKey}`}
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload logo</span>
                    <span className="text-xs text-gray-500">PNG, JPG up to 2MB</span>
                  </label>
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Footer Text</Label>
              <Textarea
                value={account.branding?.footerText || ''}
                onChange={(e) => updateAccount(accountKey, 'branding.footerText', e.target.value)}
                placeholder="Thank you for your business!"
                rows={2}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                value={account.branding?.termsAndConditions || ''}
                onChange={(e) => updateAccount(accountKey, 'branding.termsAndConditions', e.target.value)}
                placeholder="Payment due within 30 days of invoice date..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 mt-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Invoice Accounts & Branding
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure two separate accounts for your invoices with custom branding
        </p>
      </div>
      <Separator />
      
      <AccountCard 
        accountKey="account_1" 
        title="Account 1" 
        description="Primary invoice account configuration" 
      />
      
      <AccountCard 
        accountKey="account_2" 
        title="Account 2" 
        description="Secondary invoice account configuration" 
      />
    </div>
  );
};

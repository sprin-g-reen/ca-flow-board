import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Users,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [firmData, setFirmData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    panNumber: '',
    gstNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [preferences, setPreferences] = useState({
    invoicePrefix: 'INV',
    quotationPrefix: 'QUO',
    taskPrefix: 'TSK',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY'
  });

  const steps = [
    { 
      number: 1, 
      title: 'Welcome', 
      description: 'Get started with CA Flow Board',
      icon: Sparkles 
    },
    { 
      number: 2, 
      title: 'Firm Details', 
      description: 'Tell us about your firm',
      icon: Building2 
    },
    { 
      number: 3, 
      title: 'Address', 
      description: 'Your firm location',
      icon: MapPin 
    },
    { 
      number: 4, 
      title: 'Preferences', 
      description: 'Customize your experience',
      icon: FileText 
    }
  ];

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 2) {
      if (!firmData.name || !firmData.email || !firmData.phone || !firmData.panNumber) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }
      // Validate email
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(firmData.email)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address',
          variant: 'destructive'
        });
        return;
      }
      // Validate PAN
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(firmData.panNumber.toUpperCase())) {
        toast({
          title: 'Invalid PAN',
          description: 'PAN should be in format: ABCDE1234F',
          variant: 'destructive'
        });
        return;
      }
    }

    if (currentStep === 3) {
      if (!firmData.street || !firmData.city || !firmData.state || !firmData.pincode) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all address fields',
          variant: 'destructive'
        });
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Update firm settings via API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/firm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...firmData,
          settings: preferences
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update firm settings');
      }

      toast({
        title: 'Setup Complete! 🎉',
        description: 'Your dashboard is ready to use',
      });

      // Mark onboarding as complete in localStorage
      localStorage.setItem('onboardingComplete', 'true');
      
      // Call parent completion handler
      onComplete();
      
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: 'Setup Failed',
        description: 'Please try again or contact support',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 py-8"
          >
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-full">
                  <Sparkles className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Welcome to CA Flow Board!</h2>
              <p className="text-muted-foreground text-lg">
                Let's set up your firm profile to get started
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <Users className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle className="text-sm">Manage Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Track all your clients and their details in one place
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <Calendar className="h-8 w-8 text-purple-500 mb-2" />
                  <CardTitle className="text-sm">Task Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Organize tasks, set deadlines, and track progress
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <FileText className="h-8 w-8 text-green-500 mb-2" />
                  <CardTitle className="text-sm">Invoicing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Create and send professional invoices instantly
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="firmName">
                  Firm Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firmName"
                    placeholder="ABC & Associates"
                    className="pl-10"
                    value={firmData.name}
                    onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmEmail">
                  Firm Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firmEmail"
                    type="email"
                    placeholder="contact@firm.com"
                    className="pl-10"
                    value={firmData.email}
                    onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmPhone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firmPhone"
                    placeholder="+91 98765 43210"
                    className="pl-10"
                    value={firmData.phone}
                    onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">
                  PAN Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="panNumber"
                    placeholder="ABCDE1234F"
                    className="pl-10 uppercase"
                    value={firmData.panNumber}
                    onChange={(e) => setFirmData({ ...firmData, panNumber: e.target.value.toUpperCase() })}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="gstNumber"
                    placeholder="22AAAAA0000A1Z5"
                    className="pl-10 uppercase"
                    value={firmData.gstNumber}
                    onChange={(e) => setFirmData({ ...firmData, gstNumber: e.target.value.toUpperCase() })}
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  placeholder="https://www.yourfirm.com"
                  value={firmData.website}
                  onChange={(e) => setFirmData({ ...firmData, website: e.target.value })}
                />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="street">
                Street Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="street"
                placeholder="123, Main Street"
                value={firmData.street}
                onChange={(e) => setFirmData({ ...firmData, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Mumbai"
                  value={firmData.city}
                  onChange={(e) => setFirmData({ ...firmData, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  placeholder="Maharashtra"
                  value={firmData.state}
                  onChange={(e) => setFirmData({ ...firmData, state: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pincode"
                  placeholder="400001"
                  value={firmData.pincode}
                  onChange={(e) => setFirmData({ ...firmData, pincode: e.target.value })}
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value="India"
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="font-semibold">Document Prefixes</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    placeholder="INV"
                    value={preferences.invoicePrefix}
                    onChange={(e) => setPreferences({ ...preferences, invoicePrefix: e.target.value })}
                    maxLength={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quotationPrefix">Quotation Prefix</Label>
                  <Input
                    id="quotationPrefix"
                    placeholder="QUO"
                    value={preferences.quotationPrefix}
                    onChange={(e) => setPreferences({ ...preferences, quotationPrefix: e.target.value })}
                    maxLength={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskPrefix">Task Prefix</Label>
                  <Input
                    id="taskPrefix"
                    placeholder="TSK"
                    value={preferences.taskPrefix}
                    onChange={(e) => setPreferences({ ...preferences, taskPrefix: e.target.value })}
                    maxLength={5}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Regional Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="w-full px-3 py-2 border rounded-md"
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    className="w-full px-3 py-2 border rounded-md"
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full px-3 py-2 border rounded-md"
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">You're all set!</p>
                    <p className="text-xs text-muted-foreground">
                      Click "Complete Setup" to start using CA Flow Board with these preferences.
                      You can always change these settings later from the Settings page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="space-y-6">
          {/* Progress Steps */}
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all ${
                      currentStep > step.number ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Title */}
          <div className="text-center">
            <CardTitle className="text-2xl">
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-base">
              {steps[currentStep - 1].description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {currentStep === 4 ? (
                <>
                  {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingWizard;


import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useClients } from '@/hooks/useClients';
import { gstService, GSTComprehensiveInfo } from '@/services/gst';
import { cinService, CINSearchResult, CompanyDetails } from '@/services/cin';
import { GSTDetailsModal } from '@/components/client/GSTDetailsModal';
import { CINSearch } from '@/components/shared/CINSearch';
import { Search, Loader2, CheckCircle, AlertTriangle, Building2, FileText } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  contact_person: z.string().optional(),
  address: z.string().optional(),
  billing_address: z.string().optional(),
  shipping_address: z.string().optional(),
  business_type: z.string().optional(),
  industry: z.string().optional(),
  gst_number: z.string().optional(),
  cin_number: z.string().optional(),
  pan_number: z.string().optional(),
  company_registration_number: z.string().optional(),
  credit_limit: z.number().min(0).optional(),
  payment_terms: z.number().min(1).optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default('active'),
});

interface AddClientFormProps {
  onSuccess: () => void;
  initialData?: any;
  isEditing?: boolean;
}

interface CompanyLookupData {
  gst?: {
    gstNumber: string;
    legalName: string;
    tradeName?: string;
    address: string;
    panNumber: string;
    status: string;
  };
  cin?: {
    cinNumber: string;
    registeredName: string;
    address: string;
    status: string;
    directors?: Array<{ name: string; designation: string }>;
  };
}

export function AddClientForm({ onSuccess, initialData, isEditing = false }: AddClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpGST, setIsLookingUpGST] = useState(false);
  const [isLookingUpCIN, setIsLookingUpCIN] = useState(false);
  const [gstDetailsModalOpen, setGstDetailsModalOpen] = useState(false);
  const [currentGSTIN, setCurrentGSTIN] = useState('');
  const [gstData, setGstData] = useState<GSTComprehensiveInfo | null>(null);
  const [cinData, setCinData] = useState<{ company: CINSearchResult; details: CompanyDetails } | null>(null);
  const [useCINSearch, setUseCINSearch] = useState(false);
  const { addClient, updateClient } = useClients();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      contact_person: initialData.contact_person || '',
      address: initialData.address || '',
      billing_address: initialData.billing_address || '',
      shipping_address: initialData.shipping_address || '',
      business_type: initialData.business_type || '',
      industry: initialData.industry || '',
      gst_number: initialData.gst_number || '',
      cin_number: initialData.cin_number || '',
      pan_number: initialData.pan_number || '',
      company_registration_number: initialData.company_registration_number || '',
      credit_limit: initialData.credit_limit || 0,
      payment_terms: initialData.payment_terms || 30,
      website: initialData.website || '',
      notes: initialData.notes || '',
      status: initialData.status || 'active',
    } : {
      name: '',
      email: '',
      phone: '',
      contact_person: '',
      address: '',
      billing_address: '',
      shipping_address: '',
      business_type: '',
      industry: '',
      gst_number: '',
      cin_number: '',
      pan_number: '',
      company_registration_number: '',
      credit_limit: 0,
      payment_terms: 30,
      website: '',
      notes: '',
      status: 'active',
    },
  });

  // GST Lookup function
  const handleGSTLookup = async () => {
    const gstNumber = form.getValues('gst_number');
    if (!gstNumber) {
      toast.error('Please enter a GST number');
      return;
    }

    // First, validate format on frontend
    if (!gstService.validateGSTINFormat(gstNumber)) {
      toast.error('Please enter a valid 15-digit GST number (format: 22AAAAA0000A1Z5)');
      return;
    }

    try {
      setIsLookingUpGST(true);
      setCurrentGSTIN(gstNumber);
      
      // Try backend validation, fallback to frontend validation
      try {
        const validation = await gstService.validateGSTIN(gstNumber);
        if (validation && !validation.isValid) {
          toast.error('Invalid GST number format');
          return;
        }
      } catch (validationError) {
        console.warn('Backend validation failed, using frontend validation:', validationError);
        // Continue with frontend validation already done above
      }

      // Open modal for detailed view
      setGstDetailsModalOpen(true);
      toast.success('Opening GST details...');
    } catch (error: unknown) {
      console.error('GST lookup error:', error);
      toast.error('Failed to lookup GST data');
    } finally {
      setIsLookingUpGST(false);
    }
  };

  // Handle GST data from modal
  const handleGSTDataLoad = (data: GSTComprehensiveInfo) => {
    console.log('🚀 handleGSTDataLoad called with data:', data);
    setGstData(data);
    
    // Check if data and taxpayerDetails exist
    if (!data || !data.taxpayerDetails) {
      console.warn('❌ GST data is missing taxpayerDetails:', data);
      toast.error('GST data is incomplete. Please try again.');
      return;
    }
    
    // Auto-fill form fields from enhanced GST data
    const { taxpayerDetails } = data;
    
    console.log('📋 Enhanced GST Data for auto-population:', {
      companyName: taxpayerDetails.company_name,
      contactName: taxpayerDetails.contactName,
      email: taxpayerDetails.email,
      phone: taxpayerDetails.phone,
      address: taxpayerDetails.address,
      businessType: taxpayerDetails.ctb,
      mappedBusinessType: taxpayerDetails.businessType,
      industry: taxpayerDetails.industry,
      gstin: taxpayerDetails.gstin,
      dataSource: taxpayerDetails.dataSource,
      completeness: taxpayerDetails.dataCompleteness
    });
    
    // Log current form values before update
    console.log('📝 Form values BEFORE GST update:', form.getValues());
    
    try {
      // Set company name (using enhanced data structure)
      const companyName = taxpayerDetails.company_name || taxpayerDetails.lgnm || taxpayerDetails.tradeNam || '';
      if (companyName) {
        console.log('✅ Setting company name:', companyName);
        form.setValue('name', companyName, { shouldValidate: true, shouldDirty: true });
        console.log('✅ Company name set. Current value:', form.getValues('name'));
      }

      // Set contact person name (separate field from company name)
      const contactName = taxpayerDetails.contactName || '';
      if (contactName) {
        console.log('✅ Setting contact name:', contactName);
        // Check if form has contact_person field
        const formValues = form.getValues();
        if ('contact_person' in formValues) {
          form.setValue('contact_person', contactName, { shouldValidate: true, shouldDirty: true });
          console.log('✅ Contact name set. Current value:', form.getValues('contact_person'));
        }
      }

      // Set email address (if available)
      const email = taxpayerDetails.email || '';
      if (email) {
        console.log('✅ Setting email:', email);
        form.setValue('email', email, { shouldValidate: true, shouldDirty: true });
        console.log('✅ Email set. Current value:', form.getValues('email'));
      } else {
        console.log('ℹ️ No email found in GST data');
      }

      // Set phone number (if available)
      const phone = taxpayerDetails.phone || '';
      if (phone) {
        console.log('✅ Setting phone:', phone);
        form.setValue('phone', phone, { shouldValidate: true, shouldDirty: true });
        console.log('✅ Phone set. Current value:', form.getValues('phone'));
      }
      
      // Set address using enhanced data structure
      const address = taxpayerDetails.address || taxpayerDetails.pradr?.adr || '';
      if (address) {
        console.log('✅ Setting address:', address);
        form.setValue('address', address, { shouldValidate: true, shouldDirty: true });
        console.log('✅ Address set. Current value:', form.getValues('address'));
        
        // Also set billing address if it's empty
        const currentBillingAddress = form.getValues('billing_address');
        if (!currentBillingAddress) {
          form.setValue('billing_address', address, { shouldValidate: true, shouldDirty: true });
          console.log('✅ Billing address set. Current value:', form.getValues('billing_address'));
        }
      }
      
      // Set business type using enhanced mapping
      let businessTypeToSet = '';
      if (taxpayerDetails.businessType) {
        // Backend already mapped it in the new structure
        businessTypeToSet = taxpayerDetails.businessType;
        console.log('✅ Using backend-mapped business type:', businessTypeToSet);
      } else if (taxpayerDetails.ctb) {
        // Fallback to manual mapping
        businessTypeToSet = getBusinessType(taxpayerDetails.ctb);
        console.log('✅ Frontend-mapped business type:', businessTypeToSet, 'from:', taxpayerDetails.ctb);
      }
      
      if (businessTypeToSet) {
        form.setValue('business_type', businessTypeToSet, { shouldValidate: true, shouldDirty: true });
        console.log('✅ Business type set. Current value:', form.getValues('business_type'));
      }
      
      // Set industry using enhanced data structure
      let industryToSet = '';
      if (taxpayerDetails.industry) {
        // Use the standardized industry field
        industryToSet = taxpayerDetails.industry;
      } else if (taxpayerDetails.nba && Array.isArray(taxpayerDetails.nba) && taxpayerDetails.nba.length > 0) {
        // Fallback to business activities array
        industryToSet = taxpayerDetails.nba[0];
      }
      
      if (industryToSet) {
        console.log('✅ Setting industry:', industryToSet);
        form.setValue('industry', industryToSet, { shouldValidate: true, shouldDirty: true });
        console.log('✅ Industry set. Current value:', form.getValues('industry'));
      }

      // Set GST number and PAN using enhanced data
      const gstNumber = taxpayerDetails.gstin || '';
      if (gstNumber) {
        console.log('✅ Setting GST number:', gstNumber);
        form.setValue('gst_number', gstNumber, { shouldValidate: true, shouldDirty: true });
        console.log('✅ GST number set. Current value:', form.getValues('gst_number'));
        
        // Extract and set PAN number if there's a PAN field
        const panNumber = taxpayerDetails.pan || gstNumber.substring(2, 12);
        console.log('✅ Extracted PAN number:', panNumber);
        
        // Check if form has PAN field and set it
        const formValues = form.getValues();
        if ('pan_number' in formValues) {
          form.setValue('pan_number', panNumber, { shouldValidate: true, shouldDirty: true });
          console.log('✅ PAN number set. Current value:', form.getValues('pan_number'));
        }
      }

      // Show data quality information to user
      const completeness = taxpayerDetails.dataCompleteness || 0;
      const source = taxpayerDetails.dataSource || 'unknown';
      
      if (completeness >= 80) {
        toast.success(`✅ High quality GST data loaded (${completeness}% complete) from ${source}`);
      } else if (completeness >= 60) {
        toast.success(`⚠️ GST data loaded (${completeness}% complete) from ${source}. Some fields may need manual entry.`);
      } else if (completeness > 0) {
        toast.warning(`⚠️ Limited GST data available (${completeness}% complete) from ${source}. Please verify and complete missing fields.`);
      } else {
        toast.success('📋 GST data loaded. Please verify all fields before saving.');
      }
      
      // Force form re-render to show updated values
      setTimeout(() => {
        const currentValues = form.getValues();
        console.log('📋 Form values AFTER GST update:', currentValues);
        
        // Trigger form validation to ensure all fields are properly updated
        form.trigger();
        
        console.log('🎉 GST auto-population completed successfully!');
        
        // Provide detailed feedback to user about what was populated
        const populatedFields = [];
        if (taxpayerDetails.company_name || taxpayerDetails.lgnm) populatedFields.push('Company Name');
        if (taxpayerDetails.contactName) populatedFields.push('Contact Person');
        if (taxpayerDetails.email) populatedFields.push('Email');
        if (taxpayerDetails.phone) populatedFields.push('Phone');
        if (taxpayerDetails.address || taxpayerDetails.pradr?.adr) populatedFields.push('Address');
        if (taxpayerDetails.businessType || taxpayerDetails.ctb) populatedFields.push('Business Type');
        if (taxpayerDetails.industry) populatedFields.push('Industry');
        if (taxpayerDetails.gstin) populatedFields.push('GST Number');
        
        const fieldCount = populatedFields.length;
        if (fieldCount > 0) {
          toast.success(`✅ Form auto-filled with ${fieldCount} fields: ${populatedFields.slice(0, 3).join(', ')}${fieldCount > 3 ? ` and ${fieldCount - 3} more` : ''}`);
        } else {
          toast.success('📋 GST data loaded. Please review and complete the form.');
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error auto-filling form with GST data:', error);
      toast.error('Failed to auto-fill form with GST data. Please fill manually.');
    }
  };

  // Map GST company type to our business types
  const getBusinessType = (ctb: string): string => {
    const typeMap: Record<string, string> = {
      'Partnership': 'partnership',
      'Private Limited Company': 'private_limited',
      'Public Limited Company': 'public_limited',
      'Proprietorship': 'proprietorship',
      'LLP': 'llp',
      'Trust': 'trust',
      'Society': 'society',
      'HUF': 'huf'
    };
    return typeMap[ctb] || 'private_limited';
  };

  // CIN Search handlers
  const handleCINSelect = (company: CINSearchResult, details?: CompanyDetails) => {
    setCinData(details ? { company, details } : null);
    
    if (details) {
      // Auto-fill form fields from CIN data
      form.setValue('name', details.name);
      form.setValue('cin_number', details.cin);
      
      if (details.registeredOffice) {
        form.setValue('address', details.registeredOffice);
        form.setValue('billing_address', details.registeredOffice);
      }
      
      if (details.email) {
        form.setValue('email', details.email);
      }
      
      if (details.website) {
        form.setValue('website', details.website);
      }
      
      // Set business type based on company category
      if (details.category) {
        form.setValue('business_type', details.category);
      }
      
      // Set industry based on activities
      if (details.activities && details.activities.length > 0) {
        form.setValue('industry', details.activities[0]);
      }
      
      toast.success('Company details loaded from CIN');
    } else {
      // Just set the basic company info
      form.setValue('name', company.name);
      form.setValue('cin_number', company.cin);
      toast.success('Company selected. Loading additional details...');
    }
  };

  const handleCINClear = () => {
    setCinData(null);
    form.setValue('cin_number', '');
    toast.info('CIN data cleared');
  };  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log(isEditing ? 'Updating client with values:' : 'Creating client with values:', values);
      
      const clientData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        contact_person: values.contact_person,
        address: values.address,
        billing_address: values.billing_address,
        shipping_address: values.shipping_address,
        business_type: values.business_type,
        industry: values.industry,
        gst_number: values.gst_number,
        cin_number: values.cin_number,
        pan_number: values.pan_number,
        company_registration_number: values.company_registration_number,
        credit_limit: values.credit_limit,
        payment_terms: values.payment_terms,
        website: values.website,
        notes: values.notes,
        status: values.status,
      };

      if (isEditing && initialData?.id) {
        await updateClient({ id: initialData.id, ...clientData });
        toast.success("Client updated successfully");
      } else {
        await addClient(clientData);
        toast.success("Client created successfully");
      }

      form.reset();
      setGstData(null);
      onSuccess();
    } catch (error) {
      console.error(isEditing ? 'Error updating client:' : 'Error creating client:', error);
      toast.error(isEditing ? "Failed to update client" : "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <p className="text-sm text-gray-600">Company details and primary contact information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Company Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter company name" 
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Phone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter phone number" 
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Contact Person</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter contact person name" 
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Address</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter complete address" 
                    className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-6" />

        {/* Business Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
            <p className="text-sm text-gray-600">Business classification and industry details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="business_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Business Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="private_limited">Private Limited</SelectItem>
                      <SelectItem value="llp">LLP</SelectItem>
                      <SelectItem value="proprietorship">Proprietorship</SelectItem>
                      <SelectItem value="public_limited">Public Limited</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Industry</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Manufacturing, IT Services" 
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Company Lookup Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Company Information Lookup</h3>
            <p className="text-sm text-gray-600">Automatically fetch company details using GST or CIN number</p>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="gst_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">GST Number</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="Enter 15-digit GST number" 
                              className="h-11 uppercase border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              {...field} 
                              maxLength={15}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={handleGSTLookup}
                            disabled={isLookingUpGST || !field.value || field.value.length !== 15}
                          >
                            {isLookingUpGST ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                        {gstData && (
                          <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>GST data retrieved successfully</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="cin_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <CINSearch
                            value={field.value}
                            onSelect={handleCINSelect}
                            onClear={handleCINClear}
                            placeholder="Search by company name or CIN..."
                            label="CIN Number / Company Search"
                            showDetails={true}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Display GST Lookup Results */}
              {gstData && (
                <div className="space-y-3 pt-4 border-t border-blue-200">
                  <div className="text-sm font-medium text-gray-900">Retrieved GST Information:</div>
                  <div className="bg-white p-4 rounded-lg space-y-2 border border-green-200">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        GST Verified
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">{gstData.taxpayerDetails.lgnm}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Address:</strong> {gstData.taxpayerDetails.pradr?.adr}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Status:</strong> {gstData.taxpayerDetails.sts}
                    </div>
                  </div>
                </div>
              )}

              {/* Display CIN Lookup Results */}
              {cinData && (
                <div className="space-y-3 pt-4 border-t border-blue-200">
                  <div className="text-sm font-medium text-gray-900">Retrieved CIN Information:</div>
                  <div className="bg-white p-4 rounded-lg space-y-2 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        <Building2 className="h-3 w-3 mr-1" />
                        CIN Verified
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">{cinData.details.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>CIN:</strong> {cinService.formatCIN(cinData.details.cin)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Status:</strong> {cinData.details.status}
                    </div>
                    {cinData.details.dateOfIncorporation && (
                      <div className="text-sm text-gray-600">
                        <strong>Incorporated:</strong> {cinData.details.dateOfIncorporation}
                      </div>
                    )}
                    {cinData.details.registeredOffice && (
                      <div className="text-sm text-gray-600">
                        <strong>Address:</strong> {cinData.details.registeredOffice}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Additional Details Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
            <p className="text-sm text-gray-600">Tax information and payment terms</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="pan_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">PAN Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter PAN number" 
                      className="h-11 uppercase border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field} 
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="credit_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Credit Limit (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Payment Terms (Days)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="30"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Website</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com" 
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any additional notes about the client" 
                    className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="pt-6 flex justify-end gap-3 border-t border-gray-200">
          <Button 
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onSuccess();
            }}
            className="h-11 px-6 border-gray-300"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Client" : "Create Client")
            }
          </Button>
        </div>
      </form>
    </Form>

    {/* GST Details Modal */}
    <GSTDetailsModal
      open={gstDetailsModalOpen}
      onOpenChange={setGstDetailsModalOpen}
      gstin={currentGSTIN}
      onDataLoad={handleGSTDataLoad}
    />
    </>
  );
}

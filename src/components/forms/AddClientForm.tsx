
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useClients } from '@/hooks/useClients';

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
}

export function AddClientForm({ onSuccess }: AddClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addClient } = useClients();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
      pan_number: '',
      company_registration_number: '',
      credit_limit: 0,
      payment_terms: 30,
      website: '',
      notes: '',
      status: 'active',
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log('Creating client with values:', values);
      
      await addClient({
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
        pan_number: values.pan_number,
        company_registration_number: values.company_registration_number,
        credit_limit: values.credit_limit,
        payment_terms: values.payment_terms,
        website: values.website,
        notes: values.notes,
        status: values.status,
      });

      toast.success("Client created successfully");
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error("Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" {...field} />
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
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
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contact person name" {...field} />
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter complete address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="business_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Manufacturing, IT Services" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gst_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter GST number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pan_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PAN Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter PAN number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="credit_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Limit (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00"
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
            name="payment_terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms (Days)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="30"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional notes about the client" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="pt-4 space-x-2 flex justify-end">
          <Button 
            type="submit" 
            className="bg-ca-blue hover:bg-ca-blue-dark"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

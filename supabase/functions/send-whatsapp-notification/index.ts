
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phoneNumber, message, clientId } = await req.json()

    console.log('Sending WhatsApp notification to:', phoneNumber)

    // In a real implementation, you would integrate with WhatsApp Business API
    // For now, we'll create a WhatsApp deep link
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`

    // Log the communication
    const { data: communication, error: commError } = await supabase
      .from('client_communications')
      .insert({
        client_id: clientId,
        communication_type: 'whatsapp',
        recipient_phone: phoneNumber,
        message: message,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          whatsapp_url: whatsappUrl
        }
      })
      .select()
      .single()

    if (commError) {
      throw commError
    }

    console.log('WhatsApp notification logged successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        whatsappUrl,
        communication,
        message: 'WhatsApp notification prepared successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in send-whatsapp-notification function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})


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

    const { taskId } = await req.json()

    console.log('Auto-generating invoice for task:', taskId)

    // Get the task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          address
        )
      `)
      .eq('id', taskId)
      .eq('is_payable_task', true)
      .eq('status', 'completed')
      .single()

    if (taskError || !task) {
      throw new Error('Task not found or not eligible for invoice generation')
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('task_id', taskId)
      .single()

    if (existingInvoice) {
      return new Response(
        JSON.stringify({ message: 'Invoice already exists for this task' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        task_id: taskId,
        client_id: task.client_id,
        amount: task.price || 0,
        tax_amount: (task.price || 0) * 0.18, // 18% GST
        total_amount: (task.price || 0) * 1.18,
        status: 'draft',
        issued_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        created_by: task.created_by
      })
      .select()
      .single()

    if (invoiceError) {
      throw invoiceError
    }

    console.log('Invoice generated successfully:', invoice)

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice,
        message: 'Invoice generated successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in auto-generate-invoice function:', error)
    
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


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

    console.log('Sending deadline reminders...')

    // Get automation settings
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('*')
      .single()

    const reminderDays = settings?.reminder_days_before || 3

    // Calculate the date threshold for reminders
    const reminderDate = new Date()
    reminderDate.setDate(reminderDate.getDate() + reminderDays)

    // Get tasks that are due within the reminder period
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        clients (
          name,
          email,
          phone
        ),
        profiles!tasks_assigned_to_fkey (
          full_name,
          email
        )
      `)
      .lte('due_date', reminderDate.toISOString())
      .neq('status', 'completed')
      .eq('is_deleted', false)

    if (tasksError) {
      throw tasksError
    }

    let remindersSent = 0

    for (const task of tasks || []) {
      // Send reminder to assigned employees
      if (task.assigned_to && task.assigned_to.length > 0) {
        for (const employeeId of task.assigned_to) {
          // In a real implementation, you would send email/SMS here
          console.log(`Sending reminder to employee ${employeeId} for task: ${task.title}`)
          remindersSent++
        }
      }

      // Send reminder to client if enabled
      if (settings?.whatsapp_notifications && task.clients?.phone) {
        // In a real implementation, you would send WhatsApp message here
        console.log(`Sending WhatsApp reminder to client ${task.clients.name} for task: ${task.title}`)
        remindersSent++
      }

      // Log the communication
      await supabase
        .from('client_communications')
        .insert({
          client_id: task.client_id,
          communication_type: 'reminder',
          subject: `Deadline Reminder: ${task.title}`,
          message: `Your task "${task.title}" is due on ${new Date(task.due_date).toLocaleDateString()}. Please ensure all required documents are ready.`,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
    }

    console.log(`Sent ${remindersSent} deadline reminders`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent,
        tasksFound: tasks?.length || 0,
        message: `Sent ${remindersSent} deadline reminders`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in send-deadline-reminders function:', error)
    
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


import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus } from '@/store/slices/tasksSlice';

export function useTasks() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the database data to match the frontend Task interface
      return data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status as TaskStatus,
        priority: task.priority,
        category: task.category,
        clientId: task.client_id || '',
        clientName: task.client_name || '',
        assignedTo: task.assigned_to || [],
        createdBy: task.created_by || '',
        createdAt: task.created_at,
        dueDate: task.due_date || '',
        completedAt: task.completed_at,
        isTemplate: task.is_template || false,
        templateId: task.template_id,
        isRecurring: task.is_recurring || false,
        recurrencePattern: task.recurrence_pattern,
        attachments: task.attachments || [],
        subtasks: task.subtasks || [],
        comments: task.comments || [],
        price: task.price,
        isPayableTask: task.is_payable_task || false,
        payableTaskType: task.payable_task_type,
        quotationSent: task.quotation_sent || false,
        paymentStatus: task.payment_status,
        quotationNumber: task.quotation_number,
      })) as Task[];
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    updateTaskStatus: updateTaskStatusMutation.mutate,
  };
}

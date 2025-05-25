import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ListFilter, Plus } from 'lucide-react';
import { RootState } from '@/store';
import { Task, TaskStatus } from '@/store/slices/tasksSlice';
import { Button } from '@/components/ui/button';
import TaskColumn from './TaskColumn';
import { setBoardView } from '@/store/slices/uiSlice';
import TaskFilters from './TaskFilters';
import { CreateTaskDialog } from './CreateTaskDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskBoardProps {
  basePath: string;
}

const TaskBoard = ({ basePath }: TaskBoardProps) => {
  const dispatch = useDispatch();
  const { boardView, activeFilters } = useSelector((state: RootState) => state.ui);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Define the columns and their order
  const columns: { title: string; status: TaskStatus }[] = [
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'inprogress' },
    { title: 'Review', status: 'review' },
    { title: 'Completed', status: 'completed' },
  ];

  // Load tasks from database
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks: Task[] = (data || []).map(task => {
        // Parse subtasks safely
        let subtasks: SubTask[] = [];
        try {
          if (task.subtasks && typeof task.subtasks === 'string') {
            subtasks = JSON.parse(task.subtasks);
          } else if (Array.isArray(task.subtasks)) {
            subtasks = task.subtasks as SubTask[];
          }
        } catch (e) {
          console.warn('Failed to parse subtasks:', e);
          subtasks = [];
        }

        return {
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as TaskStatus,
          priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
          category: task.category as 'gst_filing' | 'itr_filing' | 'roc_filing' | 'other',
          clientId: task.client_id || '',
          clientName: task.client_name || '',
          assignedTo: task.assigned_to || [],
          createdBy: task.created_by || '',
          createdAt: task.created_at || '',
          dueDate: task.due_date || '',
          completedAt: task.completed_at,
          isTemplate: task.is_template || false,
          templateId: task.template_id,
          isRecurring: task.is_recurring || false,
          recurrencePattern: task.recurrence_pattern,
          subtasks: subtasks,
          price: task.price,
          isPayableTask: task.is_payable_task || false,
          payableTaskType: task.payable_task_type as 'payable_task_1' | 'payable_task_2' | undefined,
          quotationSent: task.quotation_sent || false,
          paymentStatus: task.payment_status as 'pending' | 'paid' | 'failed' | undefined,
          quotationNumber: task.quotation_number,
        };
      });

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on active filters
  const filteredTasks = tasks.filter(task => {
    if (activeFilters.status && activeFilters.status.length > 0) {
      if (!activeFilters.status.includes(task.status)) return false;
    }
    
    if (activeFilters.priority && activeFilters.priority.length > 0) {
      if (!activeFilters.priority.includes(task.priority)) return false;
    }
    
    if (activeFilters.category && activeFilters.category.length > 0) {
      if (!activeFilters.category.includes(task.category)) return false;
    }
    
    if (activeFilters.assignedTo && activeFilters.assignedTo.length > 0) {
      if (!task.assignedTo.some(userId => activeFilters.assignedTo?.includes(userId))) return false;
    }
    
    if (activeFilters.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check for tasks due today
      if (activeFilters.dueDate === 'today') {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate.getTime() !== today.getTime()) return false;
      }
      
      // Check for overdue tasks
      if (activeFilters.dueDate === 'overdue') {
        const dueDate = new Date(task.dueDate);
        if (!(dueDate < today && task.status !== 'completed')) return false;
      }
      
      // Check for tasks due this week
      if (activeFilters.dueDate === 'thisWeek') {
        const dueDate = new Date(task.dueDate);
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        if (!(dueDate >= startOfWeek && dueDate <= endOfWeek)) return false;
      }
    }
    
    return true;
  });

  // Handle task drop between columns
  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : task.completedAt
            }
          : task
      ));

      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Board</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <ListFilter className="h-4 w-4 mr-2" />
            Filters
            {Object.values(activeFilters).some(filter => 
              Array.isArray(filter) ? filter.length > 0 : !!filter
            ) && (
              <span className="ml-1 w-5 h-5 rounded-full bg-ca-blue text-white text-xs flex items-center justify-center">
                !
              </span>
            )}
          </Button>
          
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant={boardView === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => dispatch(setBoardView('kanban'))}
              className="rounded-none"
            >
              Kanban
            </Button>
            <Button
              variant={boardView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => dispatch(setBoardView('list'))}
              className="rounded-none"
            >
              List
            </Button>
          </div>
          
          <Button 
            className="bg-ca-blue hover:bg-ca-blue-dark"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>
      
      {showFilters && <TaskFilters />}
      
      {boardView === 'kanban' ? (
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {columns.map((column) => (
              <TaskColumn
                key={column.status}
                title={column.title}
                status={column.status}
                tasks={filteredTasks.filter((task) => task.status === column.status)}
                onTaskMove={handleTaskMove}
                basePath={basePath}
              />
            ))}
          </div>
        </DndProvider>
      ) : (
        <div className="mt-6">
          <p className="text-center py-6 text-muted-foreground">
            List view would display tasks in a table format with sorting and filtering options.
          </p>
        </div>
      )}

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTaskCreated={loadTasks}
      />
    </div>
  );
};

export default TaskBoard;

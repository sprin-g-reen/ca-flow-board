
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ListFilter, Plus } from 'lucide-react';
import { RootState } from '@/store';
import { Task, TaskStatus } from '@/store/slices/tasksSlice';
import { Button } from '@/components/ui/button';
import TaskColumn from './TaskColumn';
import { setBoardView } from '@/store/slices/uiSlice';
import TaskFilters from './TaskFilters';
import { useTasks } from '@/hooks/useTasks';

interface TaskBoardProps {
  tasks: Task[];
  basePath: string;
}

const TaskBoard = ({ tasks, basePath }: TaskBoardProps) => {
  const dispatch = useDispatch();
  const { boardView, activeFilters } = useSelector((state: RootState) => state.ui);
  const [showFilters, setShowFilters] = useState(false);
  const { updateTaskStatus } = useTasks();
  
  // Define the columns and their order
  const columns: { title: string; status: TaskStatus }[] = [
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'inprogress' },
    { title: 'Review', status: 'review' },
    { title: 'Completed', status: 'completed' },
  ];

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
  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    updateTaskStatus({ taskId, status: newStatus });
  };

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
          
          <Button className="bg-ca-blue hover:bg-ca-blue-dark">
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
          {/* List view implementation will go here */}
          <p className="text-center py-6 text-muted-foreground">
            List view would display tasks in a table format with sorting and filtering options.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;

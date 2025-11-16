
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  ListFilter, 
  Check, 
  CheckCircle,
  Trash2, 
  Archive, 
  UserPlus, 
  X, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download, 
  SortAsc, 
  SortDesc,
  Eye,
  Plus,
  Settings
} from 'lucide-react';
import { RootState } from '@/store';
import { Task, TaskStatus } from '@/store/slices/tasksSlice';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TaskColumn from './TaskColumn';
import { setBoardView } from '@/store/slices/uiSlice';
import TaskFilters from './TaskFilters';
import { useTasks } from '@/hooks/useTasks';
import { useTaskWebSocket } from '@/hooks/useTaskWebSocket';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface TaskBoardProps {
  tasks: Task[];
  basePath: string;
}

type SortOption = 'priority' | 'dueDate' | 'created' | 'title';
type SortDirection = 'asc' | 'desc';

const TaskBoard = ({ tasks, basePath }: TaskBoardProps) => {
  const dispatch = useDispatch();
  const { boardView, activeFilters } = useSelector((state: RootState) => state.ui);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [savedViews, setSavedViews] = useState<Array<{id: string, name: string, filters: any, sort: any}>>([]);
  
  // Bulk selection state
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  
  const { 
    updateTaskStatus, 
    bulkDeleteTasks, 
    isBulkDeleting,
    bulkUpdateTaskStatus, 
    isBulkUpdatingStatus,
    bulkAssignTasks, 
    isBulkAssigning,
    bulkArchiveTasks, 
    isBulkArchiving,
    isRealTime,
    setIsRealTime,
    isLoading,
    refreshTasks
  } = useTasks();
  const { employees } = useEmployees();
  
  // Initialize WebSocket connection for real-time updates
  const { isConnected: wsConnected } = useTaskWebSocket(isRealTime);

  // Export functions
  const exportToCSV = () => {
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Category', 'Assigned To', 'Due Date', 'Created Date'];
    const csvData = filteredTasks.map(task => [
      task.title,
      task.description,
      task.status,
      task.priority,
      task.category,
      Array.isArray(task.assignedTo) ? task.assignedTo.map(user => {
        if (typeof user === 'string') return user;
        return (user as any).fullName || (user as any).email || 'Unknown';
      }).join('; ') : '',
      task.dueDate,
      task.createdAt
    ]);    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Tasks exported successfully!');
  };

  const exportToJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalTasks: filteredTasks.length,
      tasks: filteredTasks,
      filters: activeFilters,
      sorting: { sortBy, sortDirection }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Tasks exported successfully!');
  };

  // View management
  const saveCurrentView = () => {
    if (!newViewName.trim()) {
      toast.error('Please enter a view name');
      return;
    }
    
    const newView = {
      id: Date.now().toString(),
      name: newViewName,
      filters: activeFilters,
      sort: { sortBy, sortDirection }
    };
    
    setSavedViews(prev => [...prev, newView]);
    setNewViewName('');
    setShowViewDialog(false);
    toast.success(`View "${newViewName}" saved successfully!`);
  };

  const loadView = (view: any) => {
    // Here you would dispatch actions to update filters and sorting
    setSortBy(view.sort.sortBy);
    setSortDirection(view.sort.sortDirection);
    toast.success(`View "${view.name}" loaded successfully!`);
  };

  // Sorting function
  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    setIsSelectAllChecked(checked);
    if (checked) {
      setSelectedTasks(tasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
      setIsSelectAllChecked(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    const result = await Swal.fire({
      title: 'Delete Tasks?',
      text: `Are you sure you want to delete ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete them!'
    });

    if (!result.isConfirmed) return;

    try {
      await bulkDeleteTasks(selectedTasks);
      setSelectedTasks([]);
      setIsSelectAllChecked(false);
      Swal.fire('Deleted!', 'Tasks have been deleted.', 'success');
    } catch (error) {
      console.error('Failed to delete tasks:', error);
      Swal.fire('Error!', 'Failed to delete tasks.', 'error');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedTasks.length === 0) return;

    try {
      await bulkUpdateTaskStatus({ taskIds: selectedTasks, status });
      setSelectedTasks([]);
      setIsSelectAllChecked(false);
    } catch (error) {
      console.error('Failed to update task statuses:', error);
    }
  };

  const handleBulkAssign = async (assignedTo: string) => {
    if (selectedTasks.length === 0) return;

    try {
      await bulkAssignTasks({ taskIds: selectedTasks, assignedTo });
      setSelectedTasks([]);
      setIsSelectAllChecked(false);
    } catch (error) {
      console.error('Failed to assign tasks:', error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedTasks.length === 0) return;

    try {
      await bulkArchiveTasks({ taskIds: selectedTasks, isArchived: true });
      setSelectedTasks([]);
      setIsSelectAllChecked(false);
    } catch (error) {
      console.error('Failed to archive tasks:', error);
    }
  };

  const clearSelection = () => {
    setSelectedTasks([]);
    setIsSelectAllChecked(false);
  };
  
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
      if (!task.assignedTo.some(userId => {
        if (typeof userId === 'string') {
          return activeFilters.assignedTo?.includes(userId);
        }
        return activeFilters.assignedTo?.includes((userId as any)._id);
      })) return false;
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

  // Apply sorting to filtered tasks
  const sortedAndFilteredTasks = sortTasks(filteredTasks);

  // Handle task drop between columns
  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    updateTaskStatus({ taskId, status: newStatus });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Task Board</h2>
          
          {/* Real-time Status Indicator */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={isRealTime ? "default" : "secondary"} 
              className={`flex items-center gap-1 ${
                isRealTime
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={
                isRealTime 
                  ? 'Real-time updates active (10-second polling)' 
                  : 'Real-time updates disabled'
              }
            >
              {isRealTime ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Ready
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>
            
            {isLoading && (
              <div className="flex items-center gap-1 text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span className="text-xs">Syncing...</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Manual Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshTasks}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Export Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Tasks</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToJSON}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sorting Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortDirection === 'asc' ? (
                  <SortAsc className="h-4 w-4 mr-2" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-2" />
                )}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSortBy('priority');
                setSortDirection(sortBy === 'priority' && sortDirection === 'desc' ? 'asc' : 'desc');
              }}>
                Priority {sortBy === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy('dueDate');
                setSortDirection(sortBy === 'dueDate' && sortDirection === 'desc' ? 'asc' : 'desc');
              }}>
                Due Date {sortBy === 'dueDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy('created');
                setSortDirection(sortBy === 'created' && sortDirection === 'desc' ? 'asc' : 'desc');
              }}>
                Created Date {sortBy === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy('title');
                setSortDirection(sortBy === 'title' && sortDirection === 'desc' ? 'asc' : 'desc');
              }}>
                Title {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Saved Views */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Views
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedViews.length === 0 ? (
                <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
              ) : (
                savedViews.map(view => (
                  <DropdownMenuItem key={view.id} onClick={() => loadView(view)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {view.name}
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Save Current View
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Current View</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="viewName">View Name</Label>
                      <Input
                        id="viewName"
                        placeholder="Enter view name"
                        value={newViewName}
                        onChange={(e) => setNewViewName(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={saveCurrentView}>
                        Save View
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Real-time Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
            className={isRealTime ? 'border-green-300 text-green-700' : 'border-gray-300'}
          >
            {isRealTime ? (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Real-time On
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Real-time Off
              </>
            )}
          </Button>
          
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
                tasks={sortedAndFilteredTasks.filter((task) => task.status === column.status)}
                onTaskMove={handleTaskMove}
                basePath={basePath}
              />
            ))}
          </div>
        </DndProvider>
      ) : (
        <div className="mt-6">
          {/* Bulk Actions Bar */}
          {selectedTasks.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={isSelectAllChecked}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                  <span className="font-medium text-blue-900">
                    {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearSelection}
                    className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-blue-300"
                        disabled={isBulkUpdatingStatus}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isBulkUpdatingStatus ? 'Updating...' : 'Update Status'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('todo')}>
                        Mark as Todo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('inprogress')}>
                        Mark as In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('review')}>
                        Mark as Review
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('completed')}>
                        Mark as Completed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-blue-300"
                        disabled={isBulkAssigning}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {isBulkAssigning ? 'Assigning...' : 'Assign To'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {employees.map((employee) => (
                        <DropdownMenuItem 
                          key={employee._id} 
                          onClick={() => handleBulkAssign(employee._id)}
                        >
                          {employee.fullName || employee.email}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBulkArchive}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    disabled={isBulkArchiving}
                  >
                    {isBulkArchiving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    disabled={isBulkDeleting}
                  >
                    {isBulkDeleting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced List view */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Tasks ({sortedAndFilteredTasks.length})
              </h3>
              <Checkbox 
                checked={isSelectAllChecked}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
              />
            </div>
            <div className="divide-y divide-gray-200">
              {sortedAndFilteredTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No tasks found matching your filters
                </div>
              ) : (
                sortedAndFilteredTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-500">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`priority-${task.priority}`}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={`status-${task.status}`}>
                          {task.status}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;

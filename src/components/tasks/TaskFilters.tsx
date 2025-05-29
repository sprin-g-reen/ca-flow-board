
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setActiveFilters, clearFilters } from '@/store/slices/uiSlice';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const TaskFilters = () => {
  const dispatch = useDispatch();
  const { activeFilters } = useSelector((state: RootState) => state.ui);

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'inprogress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const categoryOptions = [
    { value: 'gst', label: 'GST' },
    { value: 'tax', label: 'Tax' },
    { value: 'audit', label: 'Audit' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'other', label: 'Other' },
  ];

  const dueDateOptions = [
    { value: 'today', label: 'Due Today' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'thisWeek', label: 'This Week' },
  ];

  const handleStatusChange = (id: string, checked: boolean) => {
    const currentStatuses = activeFilters.status || [];
    
    if (checked) {
      dispatch(setActiveFilters({ 
        status: [...currentStatuses, id] 
      }));
    } else {
      dispatch(setActiveFilters({ 
        status: currentStatuses.filter((s) => s !== id) 
      }));
    }
  };

  const handlePriorityChange = (id: string, checked: boolean) => {
    const currentPriorities = activeFilters.priority || [];
    
    if (checked) {
      dispatch(setActiveFilters({ 
        priority: [...currentPriorities, id] 
      }));
    } else {
      dispatch(setActiveFilters({ 
        priority: currentPriorities.filter((p) => p !== id) 
      }));
    }
  };

  const handleCategoryChange = (id: string, checked: boolean) => {
    const currentCategories = activeFilters.category || [];
    
    if (checked) {
      dispatch(setActiveFilters({ 
        category: [...currentCategories, id] 
      }));
    } else {
      dispatch(setActiveFilters({ 
        category: currentCategories.filter((c) => c !== id) 
      }));
    }
  };

  const handleDueDateChange = (value: string) => {
    if (value === 'all') {
      dispatch(setActiveFilters({ dueDate: undefined }));
    } else {
      dispatch(setActiveFilters({ dueDate: value }));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Filter Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <Label className="mb-2 block font-medium">Status</Label>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={(activeFilters.status || []).includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleStatusChange(option.value, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`status-${option.value}`}
                    className="text-sm font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block font-medium">Priority</Label>
            <div className="space-y-2">
              {priorityOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`priority-${option.value}`}
                    checked={(activeFilters.priority || []).includes(option.value)}
                    onCheckedChange={(checked) => 
                      handlePriorityChange(option.value, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`priority-${option.value}`}
                    className="text-sm font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block font-medium">Category</Label>
            <div className="space-y-2">
              {categoryOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${option.value}`}
                    checked={(activeFilters.category || []).includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(option.value, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`category-${option.value}`}
                    className="text-sm font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block font-medium">Due Date</Label>
            <Select 
              value={activeFilters.dueDate || 'all'}
              onValueChange={handleDueDateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select due date filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Dates</SelectItem>
                  {dueDateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button 
          variant="outline" 
          onClick={() => dispatch(clearFilters())}
        >
          Clear Filters
        </Button>
        <Button>Apply Filters</Button>
      </CardFooter>
    </Card>
  );
};

export default TaskFilters;


import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setActiveFilters, clearFilters } from '@/store/slices/uiSlice';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api.config';
import { getValidatedToken } from '@/lib/auth';
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

interface TaskFiltersProps {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
}

const TaskFilters = ({ sortBy, sortDirection, onSortChange }: TaskFiltersProps) => {
  const dispatch = useDispatch();
  const { activeFilters } = useSelector((state: RootState) => state.ui);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);

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
    { value: 'all', label: 'All Categories' },
    { value: 'gst', label: 'GST' },
    { value: 'itr', label: 'ITR' },
    { value: 'roc', label: 'ROC' },
    { value: 'other', label: 'Other' },
  ];

  const dueDateOptions = [
    { value: 'today', label: 'Due Today' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'thisWeek', label: 'This Week' },
  ];

  // Fetch employees for all users
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = getValidatedToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`${API_BASE_URL}/users/team/members`, {
          headers
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setEmployees(result.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch sub-categories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (selectedCategory && selectedCategory !== 'all') {
        try {
          const token = getValidatedToken();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          
          const response = await fetch(`${API_BASE_URL}/tasks/sub-categories/${selectedCategory}`, {
            headers
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setSubCategories(result.data);
            }
          }
        } catch (error) {
          console.error('Error fetching sub-categories:', error);
          setSubCategories([]);
        }
      } else {
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [selectedCategory]);

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      dispatch(setActiveFilters({ status: undefined }));
    } else {
      dispatch(setActiveFilters({ status: [value] }));
    }
  };

  const handlePriorityChange = (value: string) => {
    if (value === 'all') {
      dispatch(setActiveFilters({ priority: undefined }));
    } else {
      dispatch(setActiveFilters({ priority: [value] }));
    }
  };



  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    if (value === 'all') {
      dispatch(setActiveFilters({ category: undefined, sub_category: undefined }));
    } else {
      dispatch(setActiveFilters({ category: value, sub_category: undefined }));
    }
  };

  const handleSubCategoryChange = (value: string) => {
    if (value === 'all') {
      dispatch(setActiveFilters({ sub_category: undefined }));
    } else {
      dispatch(setActiveFilters({ sub_category: value }));
    }
  };

  const handleDueDateChange = (value: string) => {
    if (value === 'all') {
      dispatch(setActiveFilters({ dueDate: undefined }));
    } else {
      dispatch(setActiveFilters({ dueDate: value }));
    }
  };

  const handleEmployeeChange = (value: string) => {
    if (value === 'all') {
      dispatch(setActiveFilters({ assignedTo: undefined }));
    } else {
      dispatch(setActiveFilters({ assignedTo: [value] }));
    }
  };

  const handleSortChange = (field: string) => {
    // Toggle direction if same field, otherwise default to desc
    const newDirection = sortBy === field && sortDirection === 'desc' ? 'asc' : 'desc';
    onSortChange(field, newDirection);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Filter & Sort Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Assigned To Filter */}
          <div>
            <Label className="mb-2 block font-medium">Assigned To</Label>
            <Select 
              value={(activeFilters.assignedTo && activeFilters.assignedTo.length > 0) ? activeFilters.assignedTo[0] : 'all'}
              onValueChange={handleEmployeeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.fullName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Label className="mb-2 block font-medium">Status</Label>
            <Select 
              value={(activeFilters.status && activeFilters.status.length > 0) ? activeFilters.status[0] : 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {/* Priority Filter */}
          <div>
            <Label className="mb-2 block font-medium">Priority</Label>
            <Select 
              value={(activeFilters.priority && activeFilters.priority.length > 0) ? activeFilters.priority[0] : 'all'}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Priority</SelectItem>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {/* Category Filter */}
          <div>
            <Label className="mb-2 block font-medium">Category</Label>
            <Select 
              value={selectedCategory}
              onValueChange={handleCategorySelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            {/* Sub-category dropdown - only show when category is selected */}
            {selectedCategory && selectedCategory !== 'all' && subCategories.length > 0 && (
              <div className="mt-3">
                <Label className="mb-2 block font-medium text-sm">Sub-Category</Label>
                <Select 
                  value={activeFilters.sub_category || 'all'}
                  onValueChange={handleSubCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All Sub-Categories</SelectItem>
                      {subCategories.map((subCat) => (
                        <SelectItem key={subCat} value={subCat}>
                          {subCat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Due Date Filter */}
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
          
          {/* Sort By Filter */}
          <div>
            <Label className="mb-2 block font-medium">Sort By</Label>
            <Select 
              value={sortBy}
              onValueChange={handleSortChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="priority">
                    Priority {sortBy === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </SelectItem>
                  <SelectItem value="dueDate">
                    Due Date {sortBy === 'dueDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </SelectItem>
                  <SelectItem value="created">
                    Created Date {sortBy === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </SelectItem>
                  <SelectItem value="title">
                    Title {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500 mt-1">
              Direction: {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </div>
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


import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { CATEGORY_WORKFLOWS, CategoryWorkflow, CategoryWorkflowCard } from './CategoryWorkflows';

interface WorkflowSelectorProps {
  onSelectWorkflow: (workflow: CategoryWorkflow) => void;
  selectedWorkflow?: CategoryWorkflow;
  showFilters?: boolean;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  onSelectWorkflow,
  selectedWorkflow,
  showFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>('all');

  const filteredWorkflows = CATEGORY_WORKFLOWS.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || workflow.category === selectedCategory;
    const matchesRecurrence = selectedRecurrence === 'all' || 
                             (selectedRecurrence === 'recurring' && workflow.recurrence) ||
                             (selectedRecurrence === 'one-time' && !workflow.recurrence);
    
    return matchesSearch && matchesCategory && matchesRecurrence;
  });

  return (
    <div className="space-y-6">
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="gst_filing">GST Filing</SelectItem>
                  <SelectItem value="itr_filing">ITR Filing</SelectItem>
                  <SelectItem value="roc_filing">ROC Filing</SelectItem>
                  <SelectItem value="other">Other Tasks</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedRecurrence} onValueChange={setSelectedRecurrence}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkflows.map(workflow => (
          <CategoryWorkflowCard
            key={workflow.id}
            workflow={workflow}
            onSelectWorkflow={onSelectWorkflow}
            isSelected={selectedWorkflow?.id === workflow.id}
          />
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No workflows found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        <Badge variant="outline" className="text-xs">
          {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''} available
        </Badge>
      </div>
    </div>
  );
};

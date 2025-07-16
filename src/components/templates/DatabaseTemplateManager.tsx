
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Calendar, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FormDialog } from '@/components/shared/FormDialog';
import { useTemplates } from '@/hooks/useTemplates';
import { useRecurringTasks } from '@/hooks/useRecurringTasks';
import { useEmployees } from '@/hooks/useEmployees';
import { DatabaseCreateTemplateForm } from './DatabaseCreateTemplateForm';
import { useToast } from '@/hooks/use-toast';

export function DatabaseTemplateManager() {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const { templates, isLoading, deleteTemplate } = useTemplates();
  const { generateRecurringTasks, isGenerating } = useRecurringTasks();
  const { employees } = useEmployees();
  const { toast } = useToast();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gst': return 'bg-green-100 text-green-800';
      case 'itr': return 'bg-blue-100 text-blue-800';
      case 'roc': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'gst': return 'GST Filing';
      case 'itr': return 'ITR Filing';
      case 'roc': return 'ROC Filing';
      default: return 'Other';
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.employee_id || 'Unassigned';
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
    }
  };

  const handleGenerateRecurringTasks = () => {
    generateRecurringTasks();
    toast({
      title: "Generating Tasks",
      description: "Checking for due recurring tasks and generating them...",
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Task Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable task templates</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateRecurringTasks}
            disabled={isGenerating}
            variant="outline"
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Due Tasks
              </>
            )}
          </Button>
          <Button 
            onClick={() => setShowCreateTemplate(true)}
            className="bg-ca-blue hover:bg-ca-blue-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.title}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate(template.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className={getCategoryColor(template.category)}>
                  {getCategoryLabel(template.category)}
                </Badge>
                {template.is_recurring && (
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {template.recurrence_pattern}
                  </Badge>
                )}
                {template.is_payable_task && (
                  <Badge variant="secondary">
                    ₹{template.price}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>
              <div className="space-y-2">
                {template.assigned_employee_id && (
                  <div className="text-xs">
                    <span className="font-medium">Assigned to:</span> {getEmployeeName(template.assigned_employee_id)}
                  </div>
                )}
                <div className="text-xs">
                  <span className="font-medium">Subtasks:</span> {template.subtasks?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No templates created yet</p>
          <Button 
            onClick={() => setShowCreateTemplate(true)}
            className="bg-ca-blue hover:bg-ca-blue-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      )}

      <FormDialog
        open={showCreateTemplate}
        onOpenChange={setShowCreateTemplate}
        title="Create New Template"
        description="Create a reusable template for tasks"
        showFooter={false}
      >
        <DatabaseCreateTemplateForm onSuccess={() => setShowCreateTemplate(false)} />
      </FormDialog>

      {editingTemplate && (
        <FormDialog
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
          title="Edit Template"
          description="Update template details"
          showFooter={false}
        >
          <DatabaseCreateTemplateForm 
            templateId={editingTemplate}
            onSuccess={() => setEditingTemplate(null)} 
          />
        </FormDialog>
      )}
    </div>
  );
}

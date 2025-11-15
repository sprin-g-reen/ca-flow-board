
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Calendar, Play, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FormDialog } from '@/components/shared/FormDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTemplates } from '@/hooks/useTemplates';
import { useRecurringTasks } from '@/hooks/useRecurringTasks';
import { useEmployees } from '@/hooks/useEmployees';
import { DatabaseCreateTemplateForm } from './DatabaseCreateTemplateForm';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export function DatabaseTemplateManager() {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const { templates, isLoading, deleteTemplate, duplicateTemplate, isDuplicating } = useTemplates();
  const { generateRecurringTasks, isGenerating } = useRecurringTasks();
  const { employees } = useEmployees();

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gst': return '📊';
      case 'itr': return '📋';
      case 'roc': return '🏢';
      default: return '📝';
    }
  };

  // Group templates by category
  const groupedTemplates = (templates || []).reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Array<(typeof templates)[0]>>);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee?.employee_id || 'Unassigned';
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const result = await Swal.fire({
      title: 'Delete Template?',
      text: 'Are you sure you want to delete this template?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      deleteTemplate(templateId);
      Swal.fire('Deleted!', 'Template has been deleted.', 'success');
    }
  };

  const handleDuplicateTemplate = (templateId: string) => {
    duplicateTemplate(templateId);
    toast.success("Template has been successfully duplicated.");
  };

    const handleGenerateRecurringTasks = async () => {
    try {
      console.log('Generate recurring tasks button clicked');
      const result = await generateRecurringTasks();
      
      // Show success message with count
      const generatedCount = result?.data?.generated_count || 0;
      if (generatedCount > 0) {
        toast.success(`Successfully generated ${generatedCount} new task(s)!`);
      } else {
        toast.info('No new tasks needed at this time');
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      toast.error('Failed to generate tasks. Please try again.');
    }
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

      <div className="space-y-6">
        {Object.keys(groupedTemplates).length > 0 ? (
          <Accordion type="multiple" className="space-y-4">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
              const templatesArray = categoryTemplates as Array<any>;
              return (
              <AccordionItem key={category} value={category} className="border rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 rounded-t-lg data-[state=open]:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-800">{getCategoryLabel(category)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {templatesArray.length} template{templatesArray.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 bg-gray-50/50 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {templatesArray.map((template) => (
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
                                onClick={() => handleDuplicateTemplate(template.id)}
                                disabled={isDuplicating}
                              >
                                <Copy className="h-4 w-4" />
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
                            {template.subtasks && template.subtasks.length > 0 && (
                              <div className="mt-3">
                                <details className="group">
                                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 flex items-center gap-1">
                                    <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                                    View Subtasks ({template.subtasks.length})
                                  </summary>
                                  <div className="mt-2 pl-4 space-y-1">
                                    {template.subtasks.map((subtask, index) => (
                                      <div key={subtask.id || index} className="text-xs p-2 bg-gray-50 rounded">
                                        <div className="font-medium">{subtask.title}</div>
                                        {subtask.description && (
                                          <div className="text-gray-600 mt-1">{subtask.description}</div>
                                        )}
                                        {subtask.dueDate && (
                                          <div className="text-blue-600 mt-1">Due: {subtask.dueDate}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(template.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
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
      </div>

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

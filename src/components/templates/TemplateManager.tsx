
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { deleteTaskTemplate } from '@/store/slices/tasksSlice';
import { Badge } from '@/components/ui/badge';
import { FormDialog } from '@/components/shared/FormDialog';
import { CreateTemplateForm } from '@/components/forms/CreateTemplateForm';
import Swal from 'sweetalert2';

export function TemplateManager() {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const { taskTemplates } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gst_filing': return 'bg-green-100 text-green-800';
      case 'itr_filing': return 'bg-blue-100 text-blue-800';
      case 'roc_filing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'gst_filing': return 'GST Filing';
      case 'itr_filing': return 'ITR Filing';
      case 'roc_filing': return 'ROC Filing';
      default: return 'Other';
    }
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
      dispatch(deleteTaskTemplate(templateId));
      Swal.fire('Deleted!', 'Template has been deleted.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Templates</h2>
        <Button 
          onClick={() => setShowCreateTemplate(true)}
          className="bg-ca-blue hover:bg-ca-blue-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taskTemplates.map((template) => (
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
                {template.isRecurring && (
                  <Badge variant="outline">
                    {template.recurrencePattern}
                  </Badge>
                )}
                {template.isPayableTask && (
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
                <h4 className="font-medium text-sm">Subtasks ({template.subtasks.length})</h4>
                <div className="space-y-1">
                  {template.subtasks.slice(0, 3).map((subtask) => (
                    <div key={subtask.id} className="text-xs bg-gray-50 p-2 rounded">
                      {subtask.title}
                    </div>
                  ))}
                  {template.subtasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{template.subtasks.length - 3} more subtasks
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {taskTemplates.length === 0 && (
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
        <CreateTemplateForm onSuccess={() => setShowCreateTemplate(false)} />
      </FormDialog>
    </div>
  );
}

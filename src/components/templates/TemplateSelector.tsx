
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTemplates, TaskTemplate } from '@/hooks/useTemplates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: TaskTemplate) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function TemplateSelector({ onSelectTemplate, selectedCategory, onCategoryChange }: TemplateSelectorProps) {
  const { templates, isLoading } = useTemplates();

  const filteredTemplates = selectedCategory && selectedCategory !== 'all'
    ? templates.filter(template => template.category === selectedCategory)
    : templates;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'gst': return 'GST Filing';
      case 'itr': return 'ITR Filing';
      case 'roc': return 'ROC Filing';
      default: return 'Other';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gst': return 'bg-green-100 text-green-800';
      case 'itr': return 'bg-blue-100 text-blue-800';
      case 'roc': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="gst">GST Filing</SelectItem>
            <SelectItem value="itr">ITR Filing</SelectItem>
            <SelectItem value="roc">ROC Filing</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-ca-blue/20"
            onClick={() => onSelectTemplate(template)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{template.title}</CardTitle>
                <Badge className={getCategoryColor(template.category)}>
                  {getCategoryLabel(template.category)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
              <div className="flex gap-2 flex-wrap mb-3">
                {template.is_recurring && (
                  <Badge variant="outline" className="text-xs">
                    {template.recurrence_pattern}
                  </Badge>
                )}
                {template.is_payable_task && (
                  <Badge variant="secondary" className="text-xs">
                    ₹{template.price}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {template.subtasks?.length || 0} subtasks
                </Badge>
              </div>
              <Button 
                size="sm" 
                className="w-full bg-ca-blue hover:bg-ca-blue-dark"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTemplate(template);
                }}
              >
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {selectedCategory ? 'No templates found for this category' : 'No templates available'}
          </p>
        </div>
      )}
    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useState } from "react";
import { FormDialog } from "@/components/shared/FormDialog";
import { Plus, Download, Upload, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreateTemplateForm } from "@/components/forms/CreateTemplateForm";

const AdminTemplates = () => {
  const { taskTemplates } = useSelector((state: RootState) => state.tasks);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTemplates = taskTemplates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadge = (category: string) => {
    const styles = {
      gst_filing: "bg-blue-100 text-blue-800",
      itr_filing: "bg-green-100 text-green-800",
      roc_filing: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge className={styles[category as keyof typeof styles] || styles.other}>
        {category.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const exportToExcel = () => {
    console.log("Exporting templates to Excel...");
    // TODO: Implement Excel export functionality
  };

  const importFromExcel = () => {
    console.log("Importing templates from Excel...");
    // TODO: Implement Excel import functionality
  };

  return (
    <div className="p-8 space-y-8">
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-ca-blue-dark">Task Templates</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage reusable task templates for GST, ITR, ROC filings and more
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={importFromExcel}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                className="bg-ca-blue hover:bg-ca-blue-dark"
                onClick={() => setShowAddTemplate(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search templates..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} template(s) found
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow border border-border">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1">{template.title}</CardTitle>
                    {getCategoryBadge(template.category)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="space-y-2">
                    {template.isRecurring && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.recurrencePattern}
                        </Badge>
                      </div>
                    )}
                    
                    {template.isPayableTask && (
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Payable Task
                        </Badge>
                        <span className="text-sm font-medium">₹{template.price?.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {template.subtasks?.length || 0} subtask(s)
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Clone
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No templates found</p>
              <Button 
                className="bg-ca-blue hover:bg-ca-blue-dark"
                onClick={() => setShowAddTemplate(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <FormDialog
        open={showAddTemplate}
        onOpenChange={setShowAddTemplate}
        title="Create New Template"
        description="Create a reusable task template with subtasks and payment configuration"
        showFooter={false}
        className="max-w-4xl"
      >
        <CreateTemplateForm onSuccess={() => setShowAddTemplate(false)} />
      </FormDialog>
    </div>
  );
};

export default AdminTemplates;

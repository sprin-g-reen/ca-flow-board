
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, DollarSign, FileText, Repeat } from 'lucide-react';

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  order: number;
  estimatedDays?: number;
}

export interface CategoryWorkflow {
  id: string;
  category: 'gst_filing' | 'itr_filing' | 'roc_filing' | 'other';
  name: string;
  description: string;
  steps: WorkflowStep[];
  recurrence?: 'monthly' | 'yearly';
  estimatedDuration: string;
  typicalPrice: number;
  deadlines: string[];
  tags: string[];
}

export const CATEGORY_WORKFLOWS: CategoryWorkflow[] = [
  {
    id: 'gst_monthly',
    category: 'gst_filing',
    name: 'GST Filing - Monthly',
    description: 'Complete monthly GST filing process including data collection, GSTR1, and GST 3B filing with tax payment',
    recurrence: 'monthly',
    estimatedDuration: '15-20 days',
    typicalPrice: 5000,
    deadlines: ['10th (GSTR1)', '20th (GST 3B & Payment)'],
    tags: ['Monthly', 'Recurring', 'Tax Filing'],
    steps: [
      {
        id: 'gst_step_1',
        title: 'Collection of data from clients',
        description: 'Gather all necessary documents and data from client including invoices, receipts, purchase records, and previous month GST data',
        dueDate: '5th of every month',
        order: 1,
        estimatedDays: 3,
      },
      {
        id: 'gst_step_2',
        title: 'GSTR1 Filing',
        description: 'File GSTR1 return by 10th of every month - upload sales data, invoice details, and validate all entries',
        dueDate: '10th of every month',
        order: 2,
        estimatedDays: 2,
      },
      {
        id: 'gst_step_3',
        title: 'GST 3B Filing & Tax Payment',
        description: 'File GST 3B return and make tax payment by 20th of every month including CGST, SGST, and IGST calculations',
        dueDate: '20th of every month',
        order: 3,
        estimatedDays: 3,
      },
    ],
  },
  {
    id: 'itr_annual',
    category: 'itr_filing',
    name: 'ITR Filing - Annual',
    description: 'Comprehensive annual ITR filing process with detailed financial analysis and tax optimization',
    recurrence: 'yearly',
    estimatedDuration: '30-45 days',
    typicalPrice: 15000,
    deadlines: ['31st July (Individual)', '31st October (Audit cases)'],
    tags: ['Annual', 'Tax Return', 'Compliance'],
    steps: [
      {
        id: 'itr_step_1',
        title: 'Collection of data from clients',
        description: 'Gather annual financial data including Form 16, bank statements, investment proofs, house property details, and previous year ITR',
        order: 1,
        estimatedDays: 7,
      },
      {
        id: 'itr_step_2',
        title: 'Finalization of accounts',
        description: 'Review and finalize all account statements, calculate income from all sources, verify deductions and exemptions',
        order: 2,
        estimatedDays: 10,
      },
      {
        id: 'itr_step_3',
        title: 'Tax calculation and planning',
        description: 'Calculate tax liability, identify tax-saving opportunities, plan advance tax, and optimize deductions under various sections',
        order: 3,
        estimatedDays: 7,
      },
      {
        id: 'itr_step_4',
        title: 'ITR filing and verification',
        description: 'Submit ITR forms online before the due date, obtain acknowledgment, and complete e-verification process',
        order: 4,
        estimatedDays: 5,
      },
    ],
  },
  {
    id: 'roc_annual',
    category: 'roc_filing',
    name: 'ROC Filing - Annual',
    description: 'Complete ROC annual compliance including all statutory forms and financial statements filing',
    recurrence: 'yearly',
    estimatedDuration: '20-30 days',
    typicalPrice: 8000,
    deadlines: ['30th September (AOC-4)', '30th October (MGT-7)'],
    tags: ['Annual', 'Company Law', 'Compliance'],
    steps: [
      {
        id: 'roc_step_1',
        title: 'Form AOC-4 Filing',
        description: 'Prepare and submit Annual Return (Form AOC-4) with financial statements including Balance Sheet and P&L Account',
        order: 1,
        estimatedDays: 10,
      },
      {
        id: 'roc_step_2',
        title: 'Form MGT-7 Filing',
        description: 'Prepare and submit Annual Return of the company (Form MGT-7) with details of shareholding, board meetings, and AGM',
        order: 2,
        estimatedDays: 8,
      },
      {
        id: 'roc_step_3',
        title: 'Form ADT-1 Filing (if applicable)',
        description: 'File auditor appointment/resignation form and ensure compliance with auditor rotation requirements',
        order: 3,
        estimatedDays: 3,
      },
    ],
  },
  {
    id: 'other_custom',
    category: 'other',
    name: 'Custom Task Workflow',
    description: 'Flexible workflow for custom tasks with configurable deadlines and pricing',
    estimatedDuration: 'Variable',
    typicalPrice: 0,
    deadlines: ['Custom deadline as per requirement'],
    tags: ['Custom', 'Flexible', 'Ad-hoc'],
    steps: [
      {
        id: 'custom_step_1',
        title: 'Initial consultation and requirement analysis',
        description: 'Understand client requirements and define scope of work',
        order: 1,
        estimatedDays: 2,
      },
      {
        id: 'custom_step_2',
        title: 'Task execution',
        description: 'Execute the custom task as per defined requirements',
        order: 2,
        estimatedDays: 5,
      },
      {
        id: 'custom_step_3',
        title: 'Review and delivery',
        description: 'Review completed work and deliver to client with documentation',
        order: 3,
        estimatedDays: 2,
      },
    ],
  },
];

export const getWorkflowByCategory = (category: string): CategoryWorkflow | undefined => {
  return CATEGORY_WORKFLOWS.find(workflow => workflow.category === category);
};

export const getCategoryOptions = () => {
  return CATEGORY_WORKFLOWS.map(workflow => ({
    value: workflow.category,
    label: workflow.name,
    description: workflow.description,
  }));
};

interface CategoryWorkflowCardProps {
  workflow: CategoryWorkflow;
  onSelectWorkflow?: (workflow: CategoryWorkflow) => void;
  isSelected?: boolean;
}

export const CategoryWorkflowCard: React.FC<CategoryWorkflowCardProps> = ({ 
  workflow, 
  onSelectWorkflow,
  isSelected = false 
}) => {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-ca-blue' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
          </div>
          {workflow.recurrence && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Repeat className="h-3 w-3" />
              {workflow.recurrence}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {workflow.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{workflow.estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>₹{workflow.typicalPrice.toLocaleString()}</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4" />
            Key Deadlines
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {workflow.deadlines.map((deadline, index) => (
              <li key={index}>• {deadline}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4" />
            Workflow Steps ({workflow.steps.length})
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {workflow.steps.map((step, index) => (
              <li key={step.id} className="flex items-start gap-2">
                <span className="font-medium text-ca-blue">{index + 1}.</span>
                <span>{step.title}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {onSelectWorkflow && (
          <Button 
            onClick={() => onSelectWorkflow(workflow)}
            className="w-full"
            variant={isSelected ? "default" : "outline"}
          >
            {isSelected ? "Selected" : "Use This Workflow"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

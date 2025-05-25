import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TaskStatus = 'todo' | 'inprogress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'gst_filing' | 'itr_filing' | 'roc_filing' | 'other';

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  isRecurring: boolean;
  recurrencePattern?: 'monthly' | 'yearly' | 'custom';
  deadline?: string;
  subtasks: SubTask[];
  price?: number;
  isPayableTask: boolean;
  payableTaskType?: 'payable_task_1' | 'payable_task_2';
  assignedEmployeeId?: string;
  createdBy: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted?: boolean;
  completed?: boolean;
  order?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  clientId: string;
  clientName: string;
  assignedTo: string[];
  createdBy: string;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  isTemplate: boolean;
  templateId?: string;
  parentTaskId?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  attachments?: string[];
  subtasks?: SubTask[];
  comments?: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
  }[];
  price?: number;
  isPayableTask: boolean;
  payableTaskType?: 'payable_task_1' | 'payable_task_2';
  quotationSent?: boolean;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  quotationNumber?: string;
}

interface TaskState {
  tasks: Task[];
  taskTemplates: TaskTemplate[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  taskTemplates: [],
  isLoading: false,
  error: null,
};

// Enhanced mock templates for the new categories
const mockTemplates: TaskTemplate[] = [
  {
    id: 'template_gst_monthly',
    title: 'GST Filing - Monthly',
    description: 'Monthly GST filing process including data collection and returns',
    category: 'gst_filing',
    isRecurring: true,
    recurrencePattern: 'monthly',
    subtasks: [
      {
        id: 'gst_1',
        title: 'Collection of data from clients',
        description: 'Gather all necessary documents and data from client',
        dueDate: '5th of every month',
        isCompleted: false,
        order: 1,
      },
      {
        id: 'gst_2',
        title: 'GSTR1 Filing',
        description: 'File GSTR1 return by 10th of every month',
        dueDate: '10th of every month',
        isCompleted: false,
        order: 2,
      },
      {
        id: 'gst_3',
        title: 'GST 3B Filing & Tax Payment',
        description: 'File GST 3B and make tax payment by 20th of every month',
        dueDate: '20th of every month',
        isCompleted: false,
        order: 3,
      },
    ],
    price: 5000,
    isPayableTask: true,
    payableTaskType: 'payable_task_1',
    createdBy: '201',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'template_itr_annual',
    title: 'ITR Filing - Annual',
    description: 'Annual ITR filing process with custom deadlines',
    category: 'itr_filing',
    isRecurring: true,
    recurrencePattern: 'yearly',
    subtasks: [
      {
        id: 'itr_1',
        title: 'Collection of data from clients',
        description: 'Gather annual financial data and documents',
        isCompleted: false,
        order: 1,
      },
      {
        id: 'itr_2',
        title: 'Finalization of accounts',
        description: 'Review and finalize all account statements',
        isCompleted: false,
        order: 2,
      },
      {
        id: 'itr_3',
        title: 'Tax payment',
        description: 'Calculate and process tax payments',
        isCompleted: false,
        order: 3,
      },
      {
        id: 'itr_4',
        title: 'ITR filing',
        description: 'Submit ITR forms before deadline',
        isCompleted: false,
        order: 4,
      },
    ],
    price: 15000,
    isPayableTask: true,
    payableTaskType: 'payable_task_1',
    createdBy: '201',
    createdAt: '2024-01-01T11:00:00Z',
  },
  {
    id: 'template_roc_annual',
    title: 'ROC Filing - Annual',
    description: 'Annual ROC filing including all required forms',
    category: 'roc_filing',
    isRecurring: true,
    recurrencePattern: 'yearly',
    subtasks: [
      {
        id: 'roc_1',
        title: 'Form 1 Filing',
        description: 'Prepare and submit Form 1',
        isCompleted: false,
        order: 1,
      },
      {
        id: 'roc_2',
        title: 'Form 2 Filing',
        description: 'Prepare and submit Form 2',
        isCompleted: false,
        order: 2,
      },
      {
        id: 'roc_3',
        title: 'Form 3 Filing',
        description: 'Prepare and submit Form 3',
        isCompleted: false,
        order: 3,
      },
    ],
    price: 8000,
    isPayableTask: true,
    payableTaskType: 'payable_task_2',
    createdBy: '201',
    createdAt: '2024-01-01T12:00:00Z',
  },
];

// Enhanced mock tasks
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Monthly GST Filing - ABC Corp',
    description: 'Complete GST filing process for ABC Corp - March 2024',
    status: 'todo',
    priority: 'high',
    category: 'gst_filing',
    clientId: '101',
    clientName: 'ABC Corp',
    assignedTo: ['301'],
    createdBy: '201',
    createdAt: '2024-04-15T12:00:00Z',
    dueDate: '2024-04-25T12:00:00Z',
    isTemplate: false,
    templateId: 'template_gst_monthly',
    isRecurring: true,
    recurrencePattern: 'monthly',
    price: 5000,
    isPayableTask: true,
    payableTaskType: 'payable_task_1',
    quotationSent: false,
    paymentStatus: 'pending',
    quotationNumber: 'QUO-2024-001',
    subtasks: [
      {
        id: 'gst_1_abc',
        title: 'Collection of data from ABC Corp',
        description: 'Gather all necessary documents and data from ABC Corp',
        dueDate: '2024-04-05T12:00:00Z',
        isCompleted: true,
        order: 1,
      },
      {
        id: 'gst_2_abc',
        title: 'GSTR1 Filing for ABC Corp',
        description: 'File GSTR1 return for ABC Corp',
        dueDate: '2024-04-10T12:00:00Z',
        isCompleted: false,
        order: 2,
      },
      {
        id: 'gst_3_abc',
        title: 'GST 3B Filing & Tax Payment for ABC Corp',
        description: 'File GST 3B and make tax payment for ABC Corp',
        dueDate: '2024-04-20T12:00:00Z',
        isCompleted: false,
        order: 3,
      },
    ],
  },
  {
    id: '2',
    title: 'Annual ITR Filing - XYZ Industries',
    description: 'Complete ITR filing for XYZ Industries - FY 2023-24',
    status: 'inprogress',
    priority: 'high',
    category: 'itr_filing',
    clientId: '102',
    clientName: 'XYZ Industries',
    assignedTo: ['302', '303'],
    createdBy: '201',
    createdAt: '2024-04-10T10:30:00Z',
    dueDate: '2024-07-31T17:00:00Z',
    isTemplate: false,
    templateId: 'template_itr_annual',
    isRecurring: false,
    price: 15000,
    isPayableTask: true,
    payableTaskType: 'payable_task_1',
    quotationSent: true,
    paymentStatus: 'pending',
    quotationNumber: 'QUO-2024-002',
  },
];

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    ...initialState,
    tasks: mockTasks,
    taskTemplates: mockTemplates,
  },
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex((task) => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
    },
    setTaskTemplates: (state, action: PayloadAction<TaskTemplate[]>) => {
      state.taskTemplates = action.payload;
    },
    addTaskTemplate: (state, action: PayloadAction<TaskTemplate>) => {
      state.taskTemplates.push(action.payload);
    },
    updateTaskTemplate: (state, action: PayloadAction<TaskTemplate>) => {
      const index = state.taskTemplates.findIndex((template) => template.id === action.payload.id);
      if (index !== -1) {
        state.taskTemplates[index] = action.payload;
      }
    },
    deleteTaskTemplate: (state, action: PayloadAction<string>) => {
      state.taskTemplates = state.taskTemplates.filter((template) => template.id !== action.payload);
    },
    updateTaskStatus: (
      state,
      action: PayloadAction<{ taskId: string; status: TaskStatus }>
    ) => {
      const { taskId, status } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = status;
        if (status === 'completed') {
          task.completedAt = new Date().toISOString();
        } else {
          delete task.completedAt;
        }
      }
    },
    updateSubtaskStatus: (
      state,
      action: PayloadAction<{ taskId: string; subtaskId: string; isCompleted: boolean }>
    ) => {
      const { taskId, subtaskId, isCompleted } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task && task.subtasks) {
        const subtask = task.subtasks.find((s) => s.id === subtaskId);
        if (subtask) {
          subtask.isCompleted = isCompleted;
        }
      }
    },
    generateQuotation: (
      state,
      action: PayloadAction<{ taskId: string; quotationNumber: string }>
    ) => {
      const { taskId, quotationNumber } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.quotationSent = true;
        task.quotationNumber = quotationNumber;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setTaskTemplates,
  addTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  updateTaskStatus,
  updateSubtaskStatus,
  generateQuotation,
  setLoading,
  setError,
} = tasksSlice.actions;

export default tasksSlice.reducer;

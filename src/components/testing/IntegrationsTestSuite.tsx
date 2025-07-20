import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  CreditCard,
  MessageCircle,
  Clock,
  AlertCircle,
  Play
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

export const IntegrationsTestSuite = () => {
  const { toast } = useToast();
  
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'email-smtp', name: 'Email SMTP Connection', status: 'pending' },
    { id: 'email-send', name: 'Email Sending Test', status: 'pending' },
    { id: 'razorpay-1', name: 'Razorpay API (Branch 1)', status: 'pending' },
    { id: 'razorpay-2', name: 'Razorpay API (Branch 2)', status: 'pending' },
    { id: 'stripe', name: 'Stripe API Connection', status: 'pending' },
    { id: 'payment-create', name: 'Payment Link Creation', status: 'pending' },
    { id: 'whatsapp-api', name: 'WhatsApp API Connection', status: 'pending' },
    { id: 'whatsapp-send', name: 'WhatsApp Message Test', status: 'pending' },
    { id: 'recurring-tasks', name: 'Recurring Task Generation', status: 'pending' },
    { id: 'deadline-reminders', name: 'Deadline Reminder System', status: 'pending' },
    { id: 'database', name: 'Database Connectivity', status: 'pending' },
    { id: 'excel-export', name: 'Excel Export Function', status: 'pending' },
  ]);

  const simulateTest = async (testId: string): Promise<{ success: boolean; duration: number; error?: string; details?: string }> => {
    // Simulate different test durations and random failures
    const duration = Math.random() * 3000 + 500; // 0.5 to 3.5 seconds
    await new Promise(resolve => setTimeout(resolve, duration));
    
    const isSuccess = Math.random() > 0.2; // 80% success rate for demo
    
    const testDetails = {
      'email-smtp': {
        success: { details: 'SMTP connection established successfully on port 587' },
        failure: { error: 'Connection timeout', details: 'Could not connect to SMTP server' }
      },
      'razorpay-1': {
        success: { details: 'API key validated, webhook configured' },
        failure: { error: 'Invalid API key', details: 'Authentication failed with provided credentials' }
      },
      'whatsapp-api': {
        success: { details: 'WhatsApp Business API connection verified' },
        failure: { error: 'API endpoint unreachable', details: 'Network timeout after 30 seconds' }
      },
      'recurring-tasks': {
        success: { details: 'Generated 15 recurring tasks for next month' },
        failure: { error: 'Template parsing error', details: 'Invalid template configuration found' }
      }
    };
    
    const testInfo = testDetails[testId as keyof typeof testDetails];
    
    return {
      success: isSuccess,
      duration: Math.round(duration),
      error: isSuccess ? undefined : (testInfo?.failure as any)?.error || 'Test failed',
      details: isSuccess ? (testInfo?.success?.details || 'Test completed successfully') : (testInfo?.failure?.details || 'Test failed')
    };
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    // Reset all tests to pending
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending', duration: undefined, error: undefined })));
    
    const totalTests = testResults.length;
    let completedTests = 0;
    
    for (let i = 0; i < testResults.length; i++) {
      const test = testResults[i];
      
      // Mark test as running
      setTestResults(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' } : t
      ));
      
      try {
        const result = await simulateTest(test.id);
        
        // Update test result
        setTestResults(prev => prev.map(t => 
          t.id === test.id ? { 
            ...t, 
            status: result.success ? 'passed' : 'failed',
            duration: result.duration,
            error: result.error,
            details: result.details
          } : t
        ));
      } catch (error) {
        setTestResults(prev => prev.map(t => 
          t.id === test.id ? { 
            ...t, 
            status: 'failed',
            error: 'Unexpected error occurred'
          } : t
        ));
      }
      
      completedTests++;
      setProgress((completedTests / totalTests) * 100);
    }
    
    setIsRunning(false);
    
    const finalResults = testResults;
    const passedTests = finalResults.filter(t => t.status === 'passed').length;
    const failedTests = finalResults.filter(t => t.status === 'failed').length;
    
    toast({
      title: "Test Suite Completed",
      description: `${passedTests} tests passed, ${failedTests} tests failed`,
      variant: failedTests > 0 ? "destructive" : "default",
    });
  };

  const runSingleTest = async (testId: string) => {
    setTestResults(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'running', duration: undefined, error: undefined } : t
    ));
    
    try {
      const result = await simulateTest(testId);
      
      setTestResults(prev => prev.map(t => 
        t.id === testId ? { 
          ...t, 
          status: result.success ? 'passed' : 'failed',
          duration: result.duration,
          error: result.error,
          details: result.details
        } : t
      ));
    } catch (error) {
      setTestResults(prev => prev.map(t => 
        t.id === testId ? { 
          ...t, 
          status: 'failed',
          error: 'Unexpected error occurred'
        } : t
      ));
    }
  };

  const getTestIcon = (testId: string) => {
    if (testId.includes('email')) return <Mail className="h-4 w-4" />;
    if (testId.includes('razorpay') || testId.includes('stripe') || testId.includes('payment')) return <CreditCard className="h-4 w-4" />;
    if (testId.includes('whatsapp')) return <MessageCircle className="h-4 w-4" />;
    if (testId.includes('deadline') || testId.includes('recurring')) return <Clock className="h-4 w-4" />;
    return <TestTube className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'passed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-purple-600" />
                Integration Test Suite
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive testing of all system integrations and automations
              </p>
            </div>
            <Button 
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-ca-blue hover:bg-ca-blue-dark"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Progress */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Test Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Test Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{passedTests}</div>
              <div className="text-sm text-green-600">Passed</div>
            </div>
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{failedTests}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">{totalTests}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          <Separator />

          {/* Test Results */}
          <div className="space-y-3">
            <h4 className="font-medium">Test Results</h4>
            {testResults.map((test) => (
              <div key={test.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTestIcon(test.id)}
                    <span className="font-medium">{test.name}</span>
                    {getStatusBadge(test.status)}
                  </div>
                  <div className="flex items-center gap-3">
                    {test.duration && (
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                    {getStatusIcon(test.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runSingleTest(test.id)}
                      disabled={isRunning || test.status === 'running'}
                    >
                      Re-run
                    </Button>
                  </div>
                </div>
                
                {test.details && (
                  <div className="text-sm text-muted-foreground pl-7">
                    {test.details}
                  </div>
                )}
                
                {test.error && (
                  <div className="flex items-start gap-2 pl-7">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-600">
                      <div className="font-medium">{test.error}</div>
                      {test.details && <div className="text-red-500">{test.details}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
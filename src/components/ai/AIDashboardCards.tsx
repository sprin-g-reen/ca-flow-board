import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, History, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AIDashboardCards = ({ 
  onSummaryClick, 
  onHistoryClick, 
  isGeneratingSummary = false, 
  aiConfigured = null 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className={`transition-colors ${aiConfigured === false ? 'border-orange-200 bg-orange-50/50' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">AI Summary</CardTitle>
            {aiConfigured === true && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            )}
            {aiConfigured === false && (
              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Setup Required
              </Badge>
            )}
          </div>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            {aiConfigured === false 
              ? "AI service requires configuration. Contact your administrator."
              : "Get a quick summary of the current system status."
            }
          </p>
          <Button 
            onClick={onSummaryClick} 
            size="sm" 
            disabled={isGeneratingSummary || aiConfigured === false}
            className="flex items-center gap-2"
          >
            {isGeneratingSummary && <Loader className="h-4 w-4 animate-spin" />}
            {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
          </Button>
        </CardContent>
      </Card>
      
      <Card className={`transition-colors ${aiConfigured === false ? 'border-orange-200 bg-orange-50/50' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">AI History</CardTitle>
            {aiConfigured === true && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            )}
            {aiConfigured === false && (
              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Setup Required
              </Badge>
            )}
          </div>
          <History className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            {aiConfigured === false 
              ? "AI service requires configuration. Contact your administrator."
              : "View past AI queries and responses."
            }
          </p>
          <Button 
            onClick={onHistoryClick} 
            size="sm" 
            variant="outline"
            disabled={aiConfigured === false}
          >
            View History
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

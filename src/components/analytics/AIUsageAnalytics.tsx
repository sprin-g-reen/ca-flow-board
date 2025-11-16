import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Bot, MessageSquare, Clock, TrendingUp, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const getValidatedToken = () => {
  const token = localStorage.getItem('ca_flow_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const AIUsageAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30days');

  // Fetch AI usage statistics from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-usage-stats', timeRange],
    queryFn: async () => {
      const token = getValidatedToken();
      const response = await fetch(`${API_BASE_URL}/ai/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch AI analytics');
      }

      const result = await response.json();
      return result.data;
    },
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading AI analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Failed to load AI analytics</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use real data if available, otherwise show empty state
  const stats = data?.summary || {
    totalQueries: 0,
    totalResponses: 0,
    averageResponseTime: 0,
    successRate: 0
  };

  const hasData = stats.totalQueries > 0;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasData && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No AI Usage Data Yet</h3>
            <p className="text-muted-foreground">
              Start using the AI Assistant to see analytics here. Click the sparkle button ✨ in the top-right corner.
            </p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === '7days' ? 'Last 7 days' : timeRange === '30days' ? 'Last 30 days' : timeRange === '90days' ? 'Last 90 days' : 'Last year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalResponses} successful responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              Average AI processing time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.topUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users interacted with AI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Queries */}
      {data?.topQueries && data.topQueries.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Most Popular AI Queries
          </CardTitle>
          <CardDescription>
            Top queries made to the AI assistant in selected time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topQueries.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.query}</p>
                    <p className="text-sm text-muted-foreground">{item.count} queries</p>
                  </div>
                </div>
                <div className="h-2 w-24 rounded-full bg-secondary">
                  <div 
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(item.count / data.topQueries[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Usage by User Role */}
      {data?.usageByUser && data.usageByUser.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Usage by User Role
          </CardTitle>
          <CardDescription>
            Distribution of AI queries across different user roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.usageByUser.map((user, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground">{user.queries} queries</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${(user.queries / stats.totalQueries) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Top Functions Called */}
      {data?.topFunctions && data.topFunctions.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Most Used AI Functions
          </CardTitle>
          <CardDescription>
            Functions the AI called to retrieve data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topFunctions.map((fn, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{fn.name}</span>
                <span className="text-sm text-muted-foreground">{fn.count} calls</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
      </>
      )}

      {/* Implementation Notice */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Bot className="h-5 w-5" />
            AI Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">AI Assistant Chatbox</p>
                <p>Standalone AI assistant available via floating button (top right)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">@AI Chat Integration (Planned)</p>
                <p>Use @AI in any chat room to get context-aware AI responses - coming soon!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Usage Analytics API</p>
                <p>Backend endpoint for tracking AI usage statistics - needs implementation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

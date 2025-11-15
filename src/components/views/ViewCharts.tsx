import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/services/api';

interface ViewChartsProps {
  viewId: string;
  entity: string;
  fieldDefinitions: any[];
}

const COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function ViewCharts({ viewId, entity, fieldDefinitions }: ViewChartsProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [groupByField, setGroupByField] = useState<string>('');
  const [valueField, setValueField] = useState<string>('');
  const [aggregation, setAggregation] = useState<'count' | 'sum' | 'avg' | 'min' | 'max'>('count');
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Get fields that can be used for grouping (select, text, date, boolean)
  const groupableFields = fieldDefinitions.filter(
    f => ['select', 'text', 'boolean', 'computed'].includes(f.type) || f.options
  );

  // Get numeric fields for aggregation
  const numericFields = fieldDefinitions.filter(f => f.type === 'number');

  useEffect(() => {
    // Set default groupBy field
    if (groupableFields.length > 0 && !groupByField) {
      // Try to find a meaningful field
      const statusField = groupableFields.find(f => f.name === 'status');
      const roleField = groupableFields.find(f => f.name === 'role');
      const departmentField = groupableFields.find(f => f.name === 'department');
      
      setGroupByField(
        statusField?.name || 
        roleField?.name || 
        departmentField?.name || 
        groupableFields[0].name
      );
    }
  }, [fieldDefinitions, groupByField]);

  const loadChartData = async () => {
    if (!groupByField) {
      toast({
        title: "Select Group By Field",
        description: "Please select a field to group the data by.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        chartType,
        groupBy: groupByField,
        aggregation,
      });

      if (aggregation !== 'count' && valueField) {
        params.append('yAxis', valueField);
      }

      const response = await apiClient.get(`/views/${viewId}/chart?${params.toString()}`) as {
        success: boolean;
        data: any;
        chartType: string;
      };

      if (response.success) {
        setChartData(response.data);
      }
    } catch (error: any) {
      console.error('Error loading chart data:', error);
      toast({
        title: "Failed to Load Chart",
        description: error.message || "Could not generate chart data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No data available for visualization</p>
            <p className="text-sm mt-2">Try adjusting your filters or group by field</p>
          </div>
        </div>
      );
    }

    const data = chartData.labels.map((label: string, index: number) => ({
      name: label || 'Unknown',
      value: chartData.datasets[0].data[index] || 0,
    }));

    const maxValue = Math.max(...data.map((d: any) => d.value));
    const yAxisMax = Math.ceil(maxValue * 1.1);

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, yAxisMax]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#4F46E5" 
                name={aggregation === 'count' ? 'Count' : `${aggregation} of ${valueField}`}
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, yAxisMax]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4F46E5" 
                strokeWidth={3}
                name={aggregation === 'count' ? 'Count' : `${aggregation} of ${valueField}`}
                dot={{ fill: '#4F46E5', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, yAxisMax]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#4F46E5" 
                fill="#818CF8"
                fillOpacity={0.6}
                name={aggregation === 'count' ? 'Count' : `${aggregation} of ${valueField}`}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Chart Configuration
          </CardTitle>
          <CardDescription>
            Configure your visualization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chart Type */}
            <div>
              <Label>Chart Type</Label>
              <Select value={chartType} onValueChange={(val: any) => setChartType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Bar Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="h-4 w-4" />
                      Line Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4" />
                      Pie Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="area">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Area Chart
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group By */}
            <div>
              <Label>Group By</Label>
              <Select value={groupByField} onValueChange={setGroupByField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  {groupableFields.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Aggregation */}
            <div>
              <Label>Aggregation</Label>
              <Select value={aggregation} onValueChange={(val: any) => setAggregation(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count</SelectItem>
                  {numericFields.length > 0 && (
                    <>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="min">Minimum</SelectItem>
                      <SelectItem value="max">Maximum</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Value Field (for non-count aggregations) */}
            {aggregation !== 'count' && numericFields.length > 0 && (
              <div>
                <Label>Value Field</Label>
                <Select value={valueField} onValueChange={setValueField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {numericFields.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button 
            onClick={loadChartData} 
            disabled={loading || !groupByField}
            className="w-full md:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating...' : 'Generate Chart'}
          </Button>
        </CardContent>
      </Card>

      {chartData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {chartData.datasets[0].label || 'Data Visualization'}
            </CardTitle>
            <CardDescription>
              Showing {chartType} chart grouped by {groupByField}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderChart()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

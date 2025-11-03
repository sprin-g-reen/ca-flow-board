import React from 'react';
import { CustomMultiSelect, Option } from './custom-multi-select';

interface SafeMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplay?: number;
}

class MultiSelectErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('MultiSelect error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MultiSelect error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-9 border border-gray-200 rounded-md flex items-center justify-center text-gray-500 text-sm">
          Selection unavailable
        </div>
      );
    }

    return this.props.children;
  }
}

export function SafeMultiSelect({ options = [], selected = [], onChange, ...props }: SafeMultiSelectProps) {
  // Additional safety checks
  const safeOptions = Array.isArray(options) ? options.filter(opt => opt && opt.value && opt.label) : [];
  const safeSelected = Array.isArray(selected) ? selected.filter(s => typeof s === 'string') : [];
  
  const handleChange = React.useCallback((value: string[]) => {
    try {
      onChange(Array.isArray(value) ? value : []);
    } catch (error) {
      console.error('Error in MultiSelect onChange:', error);
      onChange([]);
    }
  }, [onChange]);

  return (
    <MultiSelectErrorBoundary>
      <CustomMultiSelect
        options={safeOptions}
        selected={safeSelected}
        onChange={handleChange}
        {...props}
      />
    </MultiSelectErrorBoundary>
  );
}
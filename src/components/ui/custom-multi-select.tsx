import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplay?: number;
}

export function CustomMultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select items...",
  className,
  maxDisplay = 3
}: CustomMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ensure we have safe arrays
  const safeOptions = Array.isArray(options) ? options.filter(opt => opt && opt.value && opt.label) : [];
  const safeSelected = Array.isArray(selected) ? selected.filter(s => typeof s === 'string') : [];

  // Filter options based on search term
  const filteredOptions = safeOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = safeOptions.filter(option => safeSelected.includes(option.value));

  const handleUnselect = (item: string) => {
    onChange(safeSelected.filter(i => i !== item));
  };

  const handleSelect = (item: string) => {
    if (safeSelected.includes(item)) {
      handleUnselect(item);
    } else {
      onChange([...safeSelected, item]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between min-h-10 h-auto"
        onClick={() => setOpen(!open)}
      >
        <div className="flex gap-1 flex-wrap max-w-full">
          {safeSelected.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {selectedOptions.slice(0, maxDisplay).map((option) => (
            <Badge
              variant="secondary"
              key={option.value}
              className="mr-1 mb-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnselect(option.value);
              }}
            >
              {option.icon && <option.icon className="h-3 w-3 mr-1" />}
              {option.label}
              <X className="ml-1 h-3 w-3 cursor-pointer" />
            </Badge>
          ))}
          {safeSelected.length > maxDisplay && (
            <Badge variant="secondary" className="mr-1 mb-1">
              +{safeSelected.length - maxDisplay} more
            </Badge>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No options found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onClick={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      safeSelected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.icon && <option.icon className="mr-2 h-4 w-4" />}
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
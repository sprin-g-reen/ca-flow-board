import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface Option {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  maxDisplay?: number
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ options = [], selected = [], onChange, placeholder = "Select items...", className, maxDisplay = 3 }, ref) => {
    const [open, setOpen] = React.useState(false)

    // Ensure we have safe arrays
    const safeOptions = Array.isArray(options) ? options : []
    const safeSelected = Array.isArray(selected) ? selected : []

    const handleUnselect = (item: string) => {
      onChange(safeSelected.filter((i) => i !== item))
    }

    const handleSelect = (item: string) => {
      if (safeSelected.includes(item)) {
        handleUnselect(item)
      } else {
        onChange([...safeSelected, item])
      }
    }

    const selectedOptions = safeOptions.filter((option) => safeSelected.includes(option.value))

    return (
      <div ref={ref} className={className}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between min-h-10 h-auto"
            >
              <div className="flex gap-1 flex-wrap">
                {safeSelected.length === 0 && placeholder}
                {selectedOptions.slice(0, maxDisplay).map((option) => (
                  <Badge
                    variant="secondary"
                    key={option.value}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(option.value)
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
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            {safeOptions.length > 0 ? (
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {safeOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          safeSelected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.icon && <option.icon className="mr-2 h-4 w-4" />}
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No options available
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }
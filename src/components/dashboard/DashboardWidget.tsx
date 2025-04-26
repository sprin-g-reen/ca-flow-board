
import { useDrag, useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardWidgetProps {
  id: string;
  index: number;
  children: React.ReactNode;
  moveWidget: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (id: string) => void;
}

export const DashboardWidget = ({ id, index, children, moveWidget, onRemove }: DashboardWidgetProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'WIDGET',
    hover: (item: { id: string; index: number }, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;
      moveWidget(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  return (
    <div 
      ref={(node) => drag(drop(node))} 
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="transition-transform duration-200 ease-in-out cursor-move relative group"
    >
      <Card className="h-full">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(id)}
        >
          <X className="h-4 w-4" />
        </Button>
        {children}
      </Card>
    </div>
  );
};

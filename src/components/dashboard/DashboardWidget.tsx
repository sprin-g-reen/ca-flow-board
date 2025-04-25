
import { useDrag, useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';

interface DashboardWidgetProps {
  id: string;
  index: number;
  children: React.ReactNode;
  moveWidget: (dragIndex: number, hoverIndex: number) => void;
}

export const DashboardWidget = ({ id, index, children, moveWidget }: DashboardWidgetProps) => {
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
      className="transition-transform duration-200 ease-in-out cursor-move"
    >
      <Card className="h-full">
        {children}
      </Card>
    </div>
  );
};

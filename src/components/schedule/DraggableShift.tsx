import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Shift, Employee, DAILY_STATUS, POSITIONS } from '../../types';

interface DraggableShiftProps {
  shift: Shift;
  employee: Employee;
  onShiftClick: (shift: Shift) => void;
}

const DraggableShift: React.FC<DraggableShiftProps> = ({ shift, employee, onShiftClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: shift.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: shift.color || '#3B82F6',
    borderColor: shift.status ? shift.color : undefined,
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}${minutes > 0 ? `:${minutes}` : ''} ${period}`;
  };

  // CRITICAL FIX: Check if position is in predefined list before translating
  const getPositionDisplay = (position: string): string => {
    if (POSITIONS.includes(position)) {
      // For predefined positions, use the position key for translation
      return position;
    } else {
      // For custom positions, display directly
      return position;
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onShiftClick(shift)}
      className={`mb-2 p-2 rounded-md cursor-move transform transition-all hover:scale-[1.02] hover:shadow-md ${
        shift.status ? 'bg-opacity-15 border-2' : ''
      }`}
      style={style}
    >
      <div className={shift.status ? 'text-gray-800' : 'text-white'}>
        <div className="font-medium text-sm flex items-center justify-between">
          <span>{`${employee.firstName} ${employee.lastName}`}</span>
        </div>
        <div className="text-xs opacity-90">
          {shift.status ? DAILY_STATUS[shift.status].label : getPositionDisplay(shift.position)}
        </div>
        <div className="text-xs mt-1 opacity-80">
          {formatTime(shift.start)} - {formatTime(shift.end)}
        </div>
      </div>
    </div>
  );
};

export default DraggableShift;
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Shift, Employee, DAILY_STATUS, POSITIONS } from '../../types';

// Generate shift colors based on employee ID
const generateShiftColor = (employeeId: string): string => {
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#6366F1'  // indigo
  ];
  
  // Simple hash function to get consistent color for same employee
  let hash = 0;
  for (let i = 0; i < employeeId.length; i++) {
    hash = employeeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Get text color based on background color brightness
const getTextColor = (bgColor: string): string => {
  // For hex colors
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#1F2937' : '#FFFFFF';
};

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

  // Calculate shift duration
  const calculateShiftDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    // Handle overnight shifts
    if (hours < 0) {
      hours += 24;
    }
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    return parseFloat((hours + minutes / 60).toFixed(1));
  };

  // Get shift duration
  const shiftDuration = shift.start && shift.end ? calculateShiftDuration(shift.start, shift.end) : 0;

  // Get employee-specific color
  const employeeColor = generateShiftColor(employee.id);
  const textColor = getTextColor(employeeColor);

  // Enhanced styling with more visual appeal
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: shift.status ? DAILY_STATUS[shift.status].color : employeeColor,
    borderColor: shift.status ? `${DAILY_STATUS[shift.status].color}80` : undefined,
    color: shift.status ? getTextColor(DAILY_STATUS[shift.status].color) : textColor,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)',
    borderRadius: '8px',
    overflow: 'hidden',
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
      className={`mb-2 p-3 rounded-lg cursor-move transform transition-all hover:scale-[1.02] hover:shadow-md ${
        shift.status ? 'bg-opacity-15 border-2' : 'border border-transparent'
      }`}
      style={style}
    >
      <div className="relative">
        {/* Employee avatar/initials */}
        <div className="font-medium text-sm flex items-center justify-between mb-2">
          <div className={`flex items-center ${shift.status ? 'w-full justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 bg-white bg-opacity-20 shadow-sm overflow-hidden">
              {employee.profilePicture ? (
                <img 
                  src={employee.profilePicture} 
                  alt={`${employee.firstName} ${employee.lastName}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span style={{ color: textColor }}>
                  {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </span>
              )}
            </div>
            <span className="font-semibold">{shift.status ? DAILY_STATUS[shift.status].label : `${employee.firstName} ${employee.lastName}`}</span>
          </div>
          {!shift.status ? (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-white bg-opacity-25 shadow-sm">
              {shiftDuration}h
            </span>
          ) : null}
        </div>
        
        {!shift.status && (
          <>
            {/* Time range with clock icon */}
            <div className="text-xs opacity-80 font-medium flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-1"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {shift.start && shift.end ? `${shift.start} - ${shift.end}` : ''}
            </div>
          </>
        )}
        
        {/* Coupure indicator if applicable */}
        {shift.hasCoupure && (
          <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-bl-md">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="10" 
              height="10" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableShift;
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Shift, Employee } from '../../types';
import DraggableShift from './DraggableShift';

interface DroppableDayProps {
  dayIndex: number;
  shifts: Shift[];
  employees: Employee[];
  onShiftClick: (shift: Shift) => void;
}

const DroppableDay: React.FC<DroppableDayProps> = ({
  dayIndex,
  shifts,
  employees,
  onShiftClick,
}) => {
  const { setNodeRef } = useDroppable({
    id: `day-${dayIndex}`,
  });

  const getEmployee = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  return (
    <div
      ref={setNodeRef}
      className="p-2 border-r min-h-[120px] relative group hover:bg-gray-50"
    >
      {shifts.map(shift => {
        const employee = getEmployee(shift.employeeId);
        if (!employee) return null;

        return (
          <DraggableShift
            key={shift.id}
            shift={shift}
            employee={employee}
            onShiftClick={onShiftClick}
          />
        );
      })}
    </div>
  );
};

export default DroppableDay;
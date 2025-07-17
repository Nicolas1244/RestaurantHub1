import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus, Clock, User, AlertTriangle } from 'lucide-react';
import { format, addDays, parseISO, isWithinInterval, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Shift, Employee } from '../../types';
import { useTranslation } from 'react-i18next';

interface ScheduleGridProps {
  shifts: Shift[];
  employees: Employee[];
  onUpdateShift: (shift: Shift) => void;
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  onDeleteShift: (shiftId: string) => void;
  weekStartDate: Date;
  onOpenShiftModal: (employeeId: string, day: number) => void;
}

const DraggableShift: React.FC<{
  shift: Shift;
  employee: Employee;
  onDelete: () => void;
}> = ({ shift, employee, onDelete }) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: shift.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'regularShift':
        return 'bg-blue-500 text-white';
      case 'paidLeave':
        return 'bg-green-500 text-white';
      case 'publicHoliday':
        return 'bg-red-500 text-white';
      case 'public_holiday_worked':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'regularShift':
        return '';
      case 'paidLeave':
        return t('shifts.cp');
      case 'publicHoliday':
        return t('shifts.public_holiday');
      case 'public_holiday_worked':
        return t('shifts.public_holiday_worked');
      default:
        return type;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative p-2 rounded text-xs cursor-move mb-1
        ${getShiftTypeColor(shift.type)}
        ${isDragging ? 'opacity-50' : ''}
        hover:shadow-md transition-shadow
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {shift.type === 'regularShift' ? (
            <>
              <div className="font-medium">
                {shift.start} - {shift.end}
              </div>
              {shift.position && (
                <div className="text-xs opacity-90 mt-1">
                  {shift.position}
                </div>
              )}
            </>
          ) : (
            <div className="font-medium">
              {getShiftTypeLabel(shift.type)}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-1 text-white hover:text-red-200 transition-colors"
        >
          ×
        </button>
      </div>
      {shift.notes && (
        <div className="text-xs opacity-90 mt-1 truncate">
          {shift.notes}
        </div>
      )}
    </div>
  );
};

const DroppableDay: React.FC<{
  day: number;
  employee: Employee;
  shifts: Shift[];
  weekStartDate: Date;
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  onDeleteShift: (shiftId: string) => void;
  onOpenShiftModal: (employeeId: string, day: number) => void;
}> = ({ day, employee, shifts, weekStartDate, onAddShift, onDeleteShift, onOpenShiftModal }) => {
  const { t } = useTranslation();
  const { isOver, setNodeRef } = useDroppable({
    id: `${employee.id}-${day}`,
  });

  const dayShifts = shifts.filter(s => s.employeeId === employee.id && s.day === day);
  const currentDate = addDays(weekStartDate, day);
  
  // Check if employee is under contract for this day
  const contractStart = parseISO(employee.startDate);
  const contractEnd = employee.endDate ? parseISO(employee.endDate) : null;
  const isEmployeeActive = currentDate >= contractStart && (!contractEnd || currentDate <= contractEnd);

  // Check if contract is ending soon (within 7 days)
  const isContractEndingSoon = contractEnd && 
    isWithinInterval(contractEnd, { start: currentDate, end: addDays(currentDate, 7) });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[80px] p-2 border border-gray-200 rounded
        ${isOver ? 'bg-blue-50 border-blue-300' : 'bg-white'}
        ${!isEmployeeActive ? 'bg-gray-50 opacity-50' : ''}
        transition-colors
      `}
    >
      {!isEmployeeActive ? (
        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
          <AlertTriangle size={16} className="mr-1" />
          Hors contrat
        </div>
      ) : (
        <>
          {dayShifts.map((shift) => (
            <DraggableShift
              key={shift.id}
              shift={shift}
              employee={employee}
              onDelete={() => onDeleteShift(shift.id)}
            />
          ))}
          
          {isContractEndingSoon && (
            <div className="text-xs text-orange-600 mb-1 flex items-center">
              <AlertTriangle size={12} className="mr-1" />
              {t('shifts.endingSoon')}
            </div>
          )}
          
          <button
            onClick={() => onOpenShiftModal(employee.id, day)}
            className="w-full py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors flex items-center justify-center"
          >
            <Plus size={14} className="mr-1" />
            {t('shifts.addShift')}
          </button>
        </>
      )}
    </div>
  );
};

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  shifts,
  employees,
  onUpdateShift,
  onAddShift,
  onDeleteShift,
  weekStartDate,
  onOpenShiftModal,
}) => {
  const { t, i18n } = useTranslation();

  const days = [
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
    t('days.sunday'),
  ];

  const formatDate = (date: Date) => {
    return format(date, 'd MMMM', { 
      locale: i18n.language === 'fr' ? fr : undefined 
    });
  };

  const calculateEmployeeHours = (employeeId: string) => {
    const employeeShifts = shifts.filter(s => s.employeeId === employeeId);
    let totalHours = 0;
    let overtimeHours = 0;
    let publicHolidayHours = 0;
    let cpHours = 0;

    employeeShifts.forEach(shift => {
      if (shift.type === 'regularShift' && shift.start && shift.end) {
        const [startHour, startMin] = shift.start.split(':').map(Number);
        const [endHour, endMin] = shift.end.split(':').map(Number);
        const hours = (endHour + endMin / 60) - (startHour + startMin / 60);
        totalHours += hours;
      } else if (shift.type === 'paidLeave') {
        cpHours += 8; // Assuming 8 hours for paid leave
      } else if (shift.type === 'public_holiday_worked') {
        publicHolidayHours += 8; // Assuming 8 hours for public holiday worked
      }
    });

    const employee = employees.find(e => e.id === employeeId);
    const weeklyHours = employee?.weeklyHours || 35;
    
    if (totalHours > weeklyHours) {
      overtimeHours = totalHours - weeklyHours;
    }

    return {
      totalHours,
      overtimeHours,
      publicHolidayHours,
      cpHours,
      numberOfShifts: employeeShifts.filter(s => s.type === 'regularShift').length
    };
  };

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <User size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-lg text-gray-500 mb-2">
          {t('schedule.noEmployees')}
        </p>
        <p className="text-sm text-gray-400">
          {t('staff.selectRestaurantPrompt')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-9 gap-0 border-b border-gray-200">
        <div className="p-4 bg-gray-50 font-medium text-gray-700 border-r border-gray-200">
          {t('staff.employee')}
        </div>
        {days.map((day, index) => (
          <div key={index} className="p-4 bg-gray-50 text-center border-r border-gray-200 last:border-r-0">
            <div className="font-medium text-gray-700">{day}</div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(addDays(weekStartDate, index))}
            </div>
          </div>
        ))}
        <div className="p-4 bg-gray-50 font-medium text-gray-700 text-center">
          {t('schedule.weeklySummary')}
        </div>
      </div>

      {/* Employee Rows */}
      {employees.map((employee) => {
        const hours = calculateEmployeeHours(employee.id);
        
        return (
          <div key={employee.id} className="grid grid-cols-9 gap-0 border-b border-gray-200 last:border-b-0">
            {/* Employee Info */}
            <div className="p-4 border-r border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {employee.position}
                  </div>
                  <div className="text-xs text-gray-400">
                    {employee.weeklyHours}H
                  </div>
                  <div className="text-xs text-gray-400">
                    {employee.contractType}
                  </div>
                </div>
              </div>
            </div>

            {/* Days */}
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className="border-r border-gray-200 last:border-r-0">
                <DroppableDay
                  day={day}
                  employee={employee}
                  shifts={shifts}
                  weekStartDate={weekStartDate}
                  onAddShift={onAddShift}
                  onDeleteShift={onDeleteShift}
                  onOpenShiftModal={onOpenShiftModal}
                />
              </div>
            ))}

            {/* Weekly Summary */}
            <div className="p-4 bg-gray-50 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('schedule.totalWorkedHours')}:</span>
                  <span className="font-medium">{hours.totalHours.toFixed(1)}H</span>
                </div>
                {hours.overtimeHours > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>{t('schedule.overtimeHours')}:</span>
                    <span className="font-medium">+{hours.overtimeHours.toFixed(1)}H</span>
                  </div>
                )}
                {hours.publicHolidayHours > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>{t('schedule.publicHolidayHours')}:</span>
                    <span className="font-medium">{hours.publicHolidayHours}H</span>
                  </div>
                )}
                {hours.cpHours > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('schedule.cpHours')}:</span>
                    <span className="font-medium">{hours.cpHours}H</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('schedule.numberOfShifts')}:</span>
                  <span className="font-medium">{hours.numberOfShifts}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScheduleGrid;
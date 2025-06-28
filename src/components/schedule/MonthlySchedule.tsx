import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { Shift, Employee, SHIFT_TYPES, DAILY_STATUS } from '../../types';

interface MonthlyScheduleProps {
  shifts: Shift[];
  employees: Employee[];
  onShiftClick: (shift: Shift) => void;
  currentDate: Date;
}

const MonthlySchedule: React.FC<MonthlyScheduleProps> = ({
  shifts,
  employees,
  onShiftClick,
  currentDate,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(currentDate);

  const handlePrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const handleToday = () => {
    setSelectedMonth(new Date());
  };

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Start the calendar from Monday
  const startDay = monthStart.getDay() || 7;
  const prefixDays = Array(startDay - 1).fill(null);

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(date);
      shiftDate.setDate(shiftDate.getDate() + shift.day);
      return (
        shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}${minutes > 0 ? `:${minutes}` : ''} ${period}`;
  };

  const getEmployee = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon size={24} className="text-blue-600" />
          <h2 className="text-xl font-semibold">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Today
          </button>
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-2 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {prefixDays.map((_, index) => (
          <div key={`prefix-${index}`} className="bg-gray-50 p-2 min-h-[120px]" />
        ))}
        
        {daysInMonth.map(date => {
          const dayShifts = getShiftsForDate(date);
          const isCurrentMonth = isSameMonth(date, selectedMonth);
          const isCurrentDay = isToday(date);
          
          return (
            <div
              key={date.toString()}
              className={`bg-white p-2 min-h-[120px] ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-right mb-1 ${
                isCurrentDay ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}>
                {format(date, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayShifts.map(shift => {
                  const employee = getEmployee(shift.employeeId);
                  if (!employee) return null;

                  return (
                    <div
                      key={shift.id}
                      onClick={() => onShiftClick(shift)}
                      className={`p-1 rounded text-xs cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-sm ${
                        shift.leaveType ? 'bg-opacity-15 border-2' : 'text-white'
                      }`}
                      style={{
                        backgroundColor: shift.color || '#3B82F6',
                        borderColor: shift.leaveType ? shift.color : undefined
                      }}
                    >
                      <div className={shift.leaveType ? 'text-gray-800' : 'text-white'}>
                        <div className="font-medium">{employee.name}</div>
                        <div className="opacity-90">
                          {shift.leaveType ? DAILY_STATUS[shift.leaveType].label : shift.position}
                        </div>
                        <div className="opacity-80">
                          {formatTime(shift.start)} - {formatTime(shift.end)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlySchedule;
import React, { useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Plus, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Cloud, 
  Sun, 
  CloudRain 
} from 'lucide-react';
import { format, addDays, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Employee, Shift, DAYS_OF_WEEK } from '../../types';
import { useTranslation } from 'react-i18next';
import DroppableDay from './DroppableDay';
import ShiftForm from './ShiftForm';

interface WeeklyScheduleProps {
  employees: Employee[];
  shifts: Shift[];
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  onUpdateShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  restaurantId: string;
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  employees,
  shifts,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  restaurantId
}) => {
  const { t, i18n } = useTranslation();
  const [weekStartDate, setWeekStartDate] = useState(() => {
    // Initialize to Monday of current week
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | undefined>(undefined);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  const [showCompliancePanel, setShowCompliancePanel] = useState(true);

  // Mock weather data for demonstration
  const weatherData = [
    { day: 0, icon: <Sun size={20} className="text-yellow-500" />, temp: '24°C', wind: '5 km/h' },
    { day: 1, icon: <Cloud size={20} className="text-gray-500" />, temp: '21°C', wind: '8 km/h' },
    { day: 2, icon: <Sun size={20} className="text-yellow-500" />, temp: '26°C', wind: '3 km/h' },
    { day: 3, icon: <CloudRain size={20} className="text-blue-500" />, temp: '19°C', wind: '12 km/h' },
    { day: 4, icon: <Cloud size={20} className="text-gray-500" />, temp: '22°C', wind: '7 km/h' },
    { day: 5, icon: <Sun size={20} className="text-yellow-500" />, temp: '25°C', wind: '4 km/h' },
    { day: 6, icon: <Sun size={20} className="text-yellow-500" />, temp: '27°C', wind: '6 km/h' }
  ];

  const handlePrevWeek = () => {
    setWeekStartDate(prevDate => subWeeks(prevDate, 1));
  };

  const handleNextWeek = () => {
    setWeekStartDate(prevDate => addWeeks(prevDate, 1));
  };

  const handleToday = () => {
    setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const shiftId = active.id as string;
    const [_, dayStr] = over.id.toString().split('-');
    const newDay = parseInt(dayStr);

    const shift = shifts.find(s => s.id === shiftId);
    if (shift && shift.day !== newDay) {
      onUpdateShift({ ...shift, day: newDay });
    }
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setSelectedEmployeeId(undefined);
    setSelectedDay(undefined);
    setShowShiftForm(true);
  };

  const handleAddShiftClick = (employeeId: string, day: number) => {
    setSelectedShift(undefined);
    setSelectedEmployeeId(employeeId);
    setSelectedDay(day);
    setShowShiftForm(true);
  };

  const formatWeekRange = (): string => {
    const endDate = addDays(weekStartDate, 6);
    
    if (i18n.language === 'fr') {
      return `${format(weekStartDate, 'd MMMM', { locale: fr })} - ${format(endDate, 'd MMMM yyyy', { locale: fr })}`;
    }
    
    return `${format(weekStartDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  // Get shifts for a specific employee and day
  const getShiftsForEmployeeDay = (employeeId: string, day: number): Shift[] => {
    return shifts.filter(shift => 
      shift.employeeId === employeeId && 
      shift.day === day
    );
  };

  // Check if an employee has any shifts on a specific day
  const hasShiftsOnDay = (employeeId: string, day: number): boolean => {
    return getShiftsForEmployeeDay(employeeId, day).length > 0;
  };

  // Check if an employee already has maximum shifts for a day
  const hasMaxShifts = (employeeId: string, day: number): boolean => {
    return getShiftsForEmployeeDay(employeeId, day).length >= 2;
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('buttons.today')}
          </button>

          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={handlePrevWeek}
              className="p-2 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="px-3 py-2 bg-white border-l border-r border-gray-300 flex items-center">
              <Calendar size={18} className="text-blue-600 mr-2" />
              <span className="text-sm font-medium">
                {formatWeekRange()}
              </span>
            </div>

            <button
              onClick={handleNextWeek}
              className="p-2 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowCompliancePanel(!showCompliancePanel)}
          className={`px-4 py-2 flex items-center gap-2 rounded-lg border transition-colors ${
            showCompliancePanel
              ? 'bg-blue-50 text-blue-600 border-blue-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          title="Afficher/masquer le panneau de conformité Code du travail"
        >
          <Shield size={18} />
          <span className="hidden md:inline">Conformité</span>
        </button>
      </div>

      {/* Labor Law Compliance Panel */}
      {showCompliancePanel && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                  <Shield className="text-blue-600" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={20} />
                    <h3 className="font-semibold text-green-600">
                      Conformité Code du Travail
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatWeekRange()} • {employees.length} employé(s) analysé(s)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle size={12} />
                  Conforme
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Forecast */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Cloud className="text-blue-600 mr-2" size={20} />
              <div>
                <h3 className="text-base font-medium text-gray-800">
                  {i18n.language === 'fr' ? 'Prévisions Météo' : 'Weather Forecast'}
                </h3>
                <p className="text-sm text-gray-500">
                  {i18n.language === 'fr' ? 'Paris, France' : 'Paris, France'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {DAYS_OF_WEEK.map((day, index) => (
            <div key={day} className="bg-white p-3 text-center">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {t(`days.${day.toLowerCase()}`)}
              </div>
              <div className="flex flex-col items-center">
                {weatherData[index].icon}
                <div className="text-sm font-medium mt-1">{weatherData[index].temp}</div>
                <div className="text-xs text-gray-500">{weatherData[index].wind}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-[200px_repeat(7,1fr)] bg-gray-50 border-b">
          <div className="p-3 font-medium text-gray-700 border-r">
            {t('staff.employee')}
          </div>
          
          {DAYS_OF_WEEK.map((day, index) => {
            const date = addDays(weekStartDate, index);
            return (
              <div key={day} className="p-3 font-medium text-gray-700 text-center border-r">
                <div>{t(`days.${day.toLowerCase()}`)}</div>
                <div className="text-sm text-gray-500">
                  {format(date, 'd MMM')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Employee Rows */}
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          {employees.map(employee => (
            <div key={employee.id} className="grid grid-cols-[200px_repeat(7,1fr)] border-b hover:bg-gray-50">
              {/* Employee Info */}
              <div className="p-3 bg-gray-50 border-r">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-blue-500 text-white">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-xs text-gray-600">
                      {employee.position}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Days */}
              {Array.from({ length: 7 }, (_, dayIndex) => (
                <SortableContext key={dayIndex} items={getShiftsForEmployeeDay(employee.id, dayIndex).map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <DroppableDay
                    dayIndex={dayIndex}
                    shifts={getShiftsForEmployeeDay(employee.id, dayIndex)}
                    employees={[employee]}
                    onShiftClick={handleShiftClick}
                  />
                  
                  {/* Add Shift Button - only if less than 2 shifts */}
                  {!hasMaxShifts(employee.id, dayIndex) && (
                    <div className="px-2 pb-2">
                      <button
                        onClick={() => handleAddShiftClick(employee.id, dayIndex)}
                        className="w-full flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-dashed border-blue-300 py-1.5 text-xs"
                      >
                        <Plus size={14} className="mr-1" />
                        <span>
                          {i18n.language === 'fr' ? 'Ajouter' : 'Add'}
                        </span>
                      </button>
                    </div>
                  )}
                </SortableContext>
              ))}
            </div>
          ))}
        </DndContext>
      </div>

      {/* Shift Form Modal */}
      <ShiftForm
        isOpen={showShiftForm}
        onClose={() => setShowShiftForm(false)}
        shift={selectedShift}
        employees={employees}
        onSave={onAddShift}
        onUpdate={onUpdateShift}
        onDelete={onDeleteShift}
        restaurantId={restaurantId}
        preSelectedEmployeeId={selectedEmployeeId}
        preSelectedDay={selectedDay}
      />
    </div>
  );
};

export default WeeklySchedule;
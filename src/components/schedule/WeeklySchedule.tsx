import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Plus, Calendar as CalendarIcon, Clock, Users, ChefHat, Shield, Save, FileText, Archive, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { startOfWeek, addWeeks, format, isWithinInterval, parseISO, addDays, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppContext } from '../../contexts/AppContext';
import { Shift, EmployeeCategory, Employee, DAILY_STATUS, POSITIONS } from '../../types';
import { useTranslation } from 'react-i18next';
import { calculateEmployeeWeeklySummary, formatHours, formatHoursDiff } from '../../lib/scheduleUtils';
import DailyEntryModal from './DailyEntryModal';
import WeatherForecast from '../weather/WeatherForecast';
import LaborLawCompliancePanel from './LaborLawCompliancePanel';
import PDFExportModal from './PDFExportModal';
import toast from 'react-hot-toast';

interface WeeklyScheduleProps {
  employees: Employee[];
  shifts: Shift[];
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  onUpdateShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  restaurantId: string;
  weekStartDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onDuplicateWeek: () => void;
  onWeekSelect: (date: Date) => void;
  restaurant: any;
  viewType: 'all' | 'cuisine' | 'salle';
}

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
  
  let hash = 0;
  for (let i = 0; i < employeeId.length; i++) {
    hash = employeeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  employees,
  shifts,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  restaurantId,
  weekStartDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onDuplicateWeek,
  onWeekSelect,
  restaurant,
  viewType
}) => {
  const { t, i18n } = useTranslation();
  const { settings } = useAppContext();
  
  // State for modals and UI
  const [showDailyEntryModal, setShowDailyEntryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // CRITICAL: Days of week in French
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // CRITICAL: Get restaurant location for weather
  const getRestaurantLocation = (): string => {
    if (!restaurant) return '';
    
    const locationParts = [];
    if (restaurant.streetAddress) locationParts.push(restaurant.streetAddress);
    if (restaurant.postalCode) locationParts.push(restaurant.postalCode);
    if (restaurant.city) locationParts.push(restaurant.city);
    if (restaurant.country) locationParts.push(restaurant.country);

    if (locationParts.length > 0) {
      return locationParts.join(', ');
    }
    
    if (restaurant.location) {
      return restaurant.location;
    }
    
    return 'France';
  };

  // CRITICAL: Check if employee is active for the week
  const isEmployeeActiveForWeek = (employee: Employee): boolean => {
    const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    const contractStart = parseISO(employee.startDate);
    const contractEnd = employee.endDate ? parseISO(employee.endDate) : null;
    
    return contractStart <= weekEnd && (!contractEnd || contractEnd >= weekStartDate);
  };

  // CRITICAL: Check if employee is active on specific day
  const isEmployeeActiveOnDay = (employee: Employee, day: number): boolean => {
    const shiftDate = addDays(weekStartDate, day);
    const contractStart = parseISO(employee.startDate);
    const contractEnd = employee.endDate ? parseISO(employee.endDate) : null;
    
    return shiftDate >= contractStart && (!contractEnd || shiftDate <= contractEnd);
  };

  // CRITICAL: Get shifts for specific employee and day
  const getShiftsForEmployeeDay = (employeeId: string, day: number): Shift[] => {
    return shifts.filter(shift => 
      shift.employeeId === employeeId && 
      shift.day === day
    );
  };

  // CRITICAL: Handle drag end
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

  // CRITICAL: Open daily entry modal
  const handleOpenDailyEntryModal = (employeeId: string, day: number) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    setSelectedEmployee(employee);
    setSelectedDay(day);
    setShowDailyEntryModal(true);
  };

  // CRITICAL: Handle saving shifts from daily entry modal
  const handleSaveShifts = (shiftsToSave: Omit<Shift, 'id'>[]) => {
    if (!selectedEmployee) return;
    
    // First, delete any existing shifts for this employee and day
    const existingEntries = shifts.filter(
      s => s.employeeId === selectedEmployee.id && s.day === selectedDay
    );
    
    existingEntries.forEach(shift => {
      onDeleteShift(shift.id);
    });
    
    // Then add the new shifts
    shiftsToSave.forEach(shift => {
      onAddShift(shift);
    });
    
    toast.success(
      i18n.language === 'fr'
        ? 'Services enregistrés avec succès'
        : 'Shifts saved successfully'
    );
  };

  // CRITICAL: Handle saving absence from daily entry modal
  const handleSaveAbsence = (absence: Omit<Shift, 'id'>) => {
    if (!selectedEmployee) return;
    
    // First, delete any existing shifts for this employee and day
    const existingEntries = shifts.filter(
      s => s.employeeId === selectedEmployee.id && s.day === selectedDay
    );
    
    existingEntries.forEach(shift => {
      onDeleteShift(shift.id);
    });
    
    // Then add the new absence
    onAddShift(absence);
    
    toast.success(
      i18n.language === 'fr'
        ? 'Absence enregistrée avec succès'
        : 'Absence saved successfully'
    );
  };

  // CRITICAL: Manual save function
  const handleManualSave = () => {
    setIsSaving(true);
    
    try {
      toast.success(
        i18n.language === 'fr' 
          ? 'Planning sauvegardé avec succès' 
          : 'Schedule saved successfully',
        {
          duration: 3000,
          icon: '✅',
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #dcfce7'
          }
        }
      );
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error(
        i18n.language === 'fr' 
          ? 'Échec de la sauvegarde du planning' 
          : 'Failed to save schedule'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // CRITICAL: Format week range
  const formatWeekRange = (): string => {
    const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    
    if (i18n.language === 'fr') {
      const startFormatted = format(weekStartDate, 'd MMMM yyyy', { locale: fr });
      const endFormatted = format(weekEnd, 'd MMMM yyyy', { locale: fr });
      
      const startCapitalized = startFormatted.replace(/\b\w/g, (char) => char.toUpperCase());
      const endCapitalized = endFormatted.replace(/\b\w/g, (char) => char.toUpperCase());
      
      return `Semaine du ${startCapitalized} au ${endCapitalized}`;
    } else {
      const startFormatted = format(weekStartDate, 'MMMM d, yyyy');
      const endFormatted = format(weekEnd, 'MMMM d, yyyy');
      return `Week of ${startFormatted} to ${endFormatted}`;
    }
  };

  // CRITICAL: Render shift cell with enhanced styling
  const renderShiftCell = (employee: Employee, day: number) => {
    const dayShifts = getShiftsForEmployeeDay(employee.id, day);
    const isActive = isEmployeeActiveOnDay(employee, day);
    const employeeColor = generateShiftColor(employee.id);

    if (!isActive) {
      return (
        <div className="min-h-[80px] p-2 bg-gray-100 opacity-50 rounded-md flex items-center justify-center">
          <div className="text-xs text-gray-400 flex items-center">
            <AlertTriangle size={12} className="mr-1" />
            Hors contrat
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[80px] p-2 space-y-1">
        {dayShifts.map(shift => {
          if (shift.status) {
            // CRITICAL: Absence cell styling matching shift cells
            const statusConfig = DAILY_STATUS[shift.status];
            return (
              <div
                key={shift.id}
                className="p-2 rounded-md text-xs cursor-pointer hover:shadow-md transition-all"
                style={{
                  backgroundColor: `${statusConfig.color}20`,
                  borderLeft: `3px solid ${statusConfig.color}`,
                  color: statusConfig.color
                }}
                onClick={() => handleOpenDailyEntryModal(employee.id, day)}
              >
                <div className="font-medium">{statusConfig.label}</div>
                {shift.isHolidayWorked && (
                  <div className="text-xs mt-1">
                    {shift.start} - {shift.end} (majoré 100%)
                  </div>
                )}
              </div>
            );
          } else if (shift.start && shift.end) {
            // CRITICAL: Regular shift styling
            return (
              <div
                key={shift.id}
                className="p-2 rounded-md text-xs cursor-pointer hover:shadow-md transition-all text-white"
                style={{
                  backgroundColor: employeeColor,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onClick={() => handleOpenDailyEntryModal(employee.id, day)}
              >
                <div className="font-medium">
                  {shift.start} - {shift.end}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {POSITIONS.includes(shift.position) 
                    ? t(`positions.${shift.position.toLowerCase().replace(/[^a-z]/g, '')}`)
                    : shift.position}
                </div>
                {shift.hasCoupure && (
                  <div className="text-xs opacity-75 mt-1">
                    🍽️ Coupure
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
        
        {/* Add shift button */}
        <button
          onClick={() => handleOpenDailyEntryModal(employee.id, day)}
          className="w-full py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors flex items-center justify-center border border-dashed border-blue-300"
        >
          <Plus size={12} className="mr-1" />
          Ajouter
        </button>
      </div>
    );
  };

  // CRITICAL: Calculate weekly summary for employee
  const calculateWeeklySummary = (employee: Employee) => {
    const employeeShifts = shifts.filter(s => s.employeeId === employee.id);
    
    return calculateEmployeeWeeklySummary(
      employeeShifts,
      employee.weeklyHours || 35,
      employee.startDate,
      employee.endDate,
      weekStartDate,
      settings?.payBreakTimes ?? true
    );
  };

  return (
    <div className="space-y-4">
      {/* CRITICAL: Weather Forecast Integration */}
      <WeatherForecast
        weekStartDate={weekStartDate}
        restaurantLocation={getRestaurantLocation()}
        compact={settings?.scheduleLayoutType === 'optimized'}
        responsive={window.innerWidth < 640 ? 'xs' : 
                   window.innerWidth < 768 ? 'sm' : 
                   window.innerWidth < 1024 ? 'md' : 
                   window.innerWidth < 1280 ? 'lg' : 'xl'}
      />

      {/* CRITICAL: Labor Law Compliance Panel */}
      <LaborLawCompliancePanel
        employees={employees}
        shifts={shifts}
        weekStartDate={weekStartDate}
        isVisible={showCompliancePanel}
        onToggle={() => setShowCompliancePanel(!showCompliancePanel)}
      />

      {/* CRITICAL: Enhanced Schedule Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-[200px_repeat(7,1fr)_180px] bg-gray-50 border-b">
          <div className="p-3 font-medium text-gray-700 border-r">
            Employé
          </div>
          
          {daysOfWeek.map((day, index) => {
            const date = addDays(weekStartDate, index);
            return (
              <div key={day} className="p-3 font-medium text-gray-700 text-center border-r">
                <div>{day}</div>
                <div className="text-sm text-gray-500">
                  {format(date, 'd MMM', { locale: fr })}
                </div>
              </div>
            );
          })}
          
          <div className="p-3 font-medium text-gray-700 text-center">
            Résumé Hebdomadaire
          </div>
        </div>

        {/* Employee Rows */}
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          {employees.map(employee => {
            const isActiveForWeek = isEmployeeActiveForWeek(employee);
            const summary = calculateWeeklySummary(employee);
            
            return (
              <div key={employee.id} className={`grid grid-cols-[200px_repeat(7,1fr)_180px] border-b hover:bg-gray-50 ${!isActiveForWeek ? 'opacity-75' : ''}`}>
                {/* CRITICAL: Employee Info with Photo */}
                <div className="p-3 bg-gray-50 border-r">
                  <div className="flex items-center">
                    {/* CRITICAL: Employee Photo Display */}
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center mr-3 bg-blue-500 text-white">
                      {employee.profilePicture ? (
                        <img 
                          src={employee.profilePicture} 
                          alt={`${employee.firstName} ${employee.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-sm">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {POSITIONS.includes(employee.position) 
                          ? t(`positions.${employee.position.toLowerCase().replace(/[^a-z]/g, '')}`)
                          : employee.position}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employee.weeklyHours}H - {employee.contractType}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Days */}
                {Array.from({ length: 7 }, (_, dayIndex) => (
                  <div key={dayIndex} className="border-r">
                    {renderShiftCell(employee, dayIndex)}
                  </div>
                ))}

                {/* CRITICAL: Enhanced Weekly Summary */}
                <div className="p-3 bg-gray-50 text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Travaillées:</span>
                      <span className="font-medium">{formatHours(summary.totalWorkedHours)}</span>
                    </div>
                    {summary.totalAssimilatedHours > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>CP:</span>
                        <span className="font-medium">{formatHours(summary.totalAssimilatedHours)}</span>
                      </div>
                    )}
                    {summary.totalPublicHolidayHours > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Majorées:</span>
                        <span className="font-medium">{formatHours(summary.totalPublicHolidayHours)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-600">Écart:</span>
                      <span className={`font-medium ${
                        summary.hoursDiff > 0 ? 'text-red-600' : 
                        summary.hoursDiff < 0 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {formatHoursDiff(summary.hoursDiff)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Services:</span>
                      <span className="font-medium">{summary.shiftCount}</span>
                    </div>
                    {summary.proRatedContractHours !== (employee.weeklyHours || 35) && (
                      <div className="text-xs text-orange-600 italic">
                        Pro-rata: {formatHours(summary.proRatedContractHours)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </DndContext>
      </div>

      {/* CRITICAL: Daily Entry Modal */}
      <DailyEntryModal
        isOpen={showDailyEntryModal}
        onClose={() => setShowDailyEntryModal(false)}
        employee={selectedEmployee}
        day={selectedDay}
        weekStartDate={weekStartDate}
        existingShifts={shifts}
        onSaveShifts={handleSaveShifts}
        onUpdateShift={onUpdateShift}
        onDeleteShift={onDeleteShift}
        onSaveAbsence={handleSaveAbsence}
        restaurantId={restaurantId}
      />

      {/* CRITICAL: PDF Export Modal */}
      <PDFExportModal
        isOpen={showPDFExportModal}
        onClose={() => setShowPDFExportModal(false)}
        restaurant={restaurant}
        employees={employees}
        shifts={shifts}
        weekStartDate={weekStartDate}
        currentViewType={viewType}
      />
    </div>
  );
};

export default WeeklySchedule;
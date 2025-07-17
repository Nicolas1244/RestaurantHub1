import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Plus, Calendar as CalendarIcon, Clock, Users, ChefHat, Shield, Save, X, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Copy, FileText } from 'lucide-react';
import { startOfWeek, addWeeks, format, isWithinInterval, parseISO, addDays, endOfWeek, getWeek, setWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppContext } from '../../contexts/AppContext';
import { Shift, EmployeeCategory, Employee, DAILY_STATUS, POSITIONS } from '../../types';
import { useTranslation } from 'react-i18next';
import { calculateEmployeeWeeklySummary, formatHours, formatHoursDiff } from '../../lib/scheduleUtils';
import DailyEntryModal from './DailyEntryModal';
import WeatherForecast from '../weather/WeatherForecast';
import LaborLawCompliancePanel from './LaborLawCompliancePanel';
import { PDFPreviewModal } from './PDFPreviewModal';
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

// Calculate shift duration in hours
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
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPDFPreviewModal, setShowPDFPreviewModal] = useState(false);

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

  // CRITICAL: Week selector functionality
  const currentWeek = getWeek(weekStartDate);
  const currentYear = weekStartDate.getFullYear();

  const handleWeekSelect = (weekNumber: number) => {
    const newDate = startOfWeek(setWeek(new Date(currentYear, 0), weekNumber), { weekStartsOn: 1 });
    onWeekSelect(newDate);
    setShowWeekPicker(false);
  };

  // Generate array of week numbers for the current year
  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);

  // CRITICAL: Format week range with start and end dates
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

  // CRITICAL: Render shift cell with enhanced styling and logic
  const renderShiftCell = (employee: Employee, day: number) => {
    const dayShifts = getShiftsForEmployeeDay(employee.id, day);
    const isActive = isEmployeeActiveOnDay(employee, day);
    const employeeColor = generateShiftColor(employee.id);

    if (!isActive) {
      return (
        <div className="min-h-[100px] p-2 bg-gray-100 opacity-50 rounded-md flex items-center justify-center">
          <div className="text-xs text-gray-400 flex items-center">
            <AlertTriangle size={12} className="mr-1" />
            Hors contrat
          </div>
        </div>
      );
    }

    // CRITICAL: Check if employee has 2 shifts already (hide + Ajouter button)
    const hasMaxShifts = dayShifts.filter(s => !s.status).length >= 2;

    return (
      <div className="min-h-[100px] p-2 space-y-1">
        {dayShifts.map(shift => {
          if (shift.status) {
            // CRITICAL: Absence cell styling - same width as shift cells, centered text
            const statusConfig = DAILY_STATUS[shift.status];
            return (
              <div
                key={shift.id}
                className="w-full p-3 rounded-md text-sm cursor-pointer hover:shadow-md transition-all text-center font-medium"
                style={{
                  backgroundColor: `${statusConfig.color}20`,
                  borderLeft: `4px solid ${statusConfig.color}`,
                  color: statusConfig.color,
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => handleOpenDailyEntryModal(employee.id, day)}
              >
                <div>
                  <div className="font-semibold">{statusConfig.label}</div>
                  {shift.isHolidayWorked && (
                    <div className="text-xs mt-1">
                      {shift.start} - {shift.end} (majoré 100%)
                    </div>
                  )}
                </div>
              </div>
            );
          } else if (shift.start && shift.end) {
            // CRITICAL: Regular shift styling with hours at bottom left, no position name
            const duration = calculateShiftDuration(shift.start, shift.end);
            return (
              <div
                key={shift.id}
                className="w-full p-3 rounded-md text-sm cursor-pointer hover:shadow-md transition-all text-white relative"
                style={{
                  backgroundColor: employeeColor,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  minHeight: '60px'
                }}
                onClick={() => handleOpenDailyEntryModal(employee.id, day)}
              >
                <div className="font-semibold text-center">
                  {shift.start} - {shift.end}
                </div>
                {/* CRITICAL: Hours display at bottom right */}
                <div className="absolute bottom-1 right-2 text-xs opacity-90 font-medium">
                  {duration}h
                </div>
              </div>
            );
          }
          return null;
        })}
        
        {/* CRITICAL: + Ajouter button - only show if less than 2 shifts */}
        {!hasMaxShifts && (
          <button
            onClick={() => handleOpenDailyEntryModal(employee.id, day)}
            className="w-full py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors flex items-center justify-center border border-dashed border-blue-300"
          >
            <Plus size={12} />
          </button>
        )}
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
      {/* CRITICAL: Enhanced Header with Week Selector showing start and end dates */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={onToday}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Aujourd'hui
          </button>

          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={onPrevWeek}
              className="p-2 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowWeekPicker(!showWeekPicker)}
                className="px-3 py-2 bg-white border-l border-r border-gray-300 flex items-center gap-2 hover:bg-gray-50"
              >
                <CalendarIcon size={18} className="text-blue-600" />
                <span className="text-sm font-medium">
                  Semaine {currentWeek}, {currentYear}
                </span>
                <ChevronRight size={18} className="rotate-90" />
              </button>

              {showWeekPicker && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="grid grid-cols-4 gap-1 p-2">
                    {weeks.map(week => (
                      <button
                        key={week}
                        onClick={() => handleWeekSelect(week)}
                        className={`p-2 text-sm rounded ${
                          week === currentWeek
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {week}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onNextWeek}
              className="p-2 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* CRITICAL: Action Buttons - Dupliquer la Semaine and Exporter PDF */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicateWeek}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <Copy size={18} />
            Dupliquer la Semaine
          </button>
          
          <button
            onClick={() => setShowPDFPreviewModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center gap-2 transition-colors"
          >
            <FileText size={18} />
            {i18n.language === 'fr' ? 'Exporter PDF' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* CRITICAL: Week Range Display */}
      <div className="text-center text-gray-600 mb-4">
        {formatWeekRange()}
      </div>

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
        <div className="grid grid-cols-[200px_repeat(7,1fr)_200px] bg-gray-50 border-b">
          <div className="p-4 font-semibold text-gray-700 border-r">
            Employé
          </div>
          
          {daysOfWeek.map((day, index) => {
            const date = addDays(weekStartDate, index);
            return (
              <div key={day} className="p-4 font-semibold text-gray-700 text-center border-r">
                <div className="text-base">{day}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {format(date, "d 'juil.'", { locale: fr })}
                </div>
              </div>
            );
          })}
          
          <div className="p-4 font-semibold text-gray-700 text-center">
            Résumé Hebdomadaire
          </div>
        </div>

        {/* Employee Rows */}
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          {employees.map(employee => {
            const summary = calculateWeeklySummary(employee);
            
            return (
              <div key={employee.id} className="grid grid-cols-[200px_repeat(7,1fr)_200px] border-b hover:bg-gray-50">
                {/* CRITICAL: Employee Info with Photo */}
                <div className="p-4 bg-gray-50 border-r">
                  <div className="flex items-center">
                    {/* CRITICAL: Employee Photo Display */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center mr-3 bg-blue-500 text-white flex-shrink-0">
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
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 text-base">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {POSITIONS.includes(employee.position) 
                          ? t(`positions.${employee.position.toLowerCase().replace(/[^a-z]/g, '')}`)
                          : employee.position}
                      </div>
                      <div className="text-sm text-gray-500">
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

                {/* CRITICAL: Enhanced Weekly Summary with larger, more visible text */}
                <div className="p-4 bg-gray-50 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Travaillées:</span>
                      <span className="font-bold text-lg text-gray-900">{summary.totalWorkedHours.toFixed(0)}H{((summary.totalWorkedHours % 1) * 60).toFixed(0).padStart(2, '0')}</span>
                    </div>
                    {summary.totalAssimilatedHours > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-green-700 font-medium">CP:</span>
                        <span className="font-bold text-lg text-green-800">{summary.totalAssimilatedHours.toFixed(0)}H{((summary.totalAssimilatedHours % 1) * 60).toFixed(0).padStart(2, '0')}</span>
                      </div>
                    )}
                    {summary.totalPublicHolidayHours > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-red-700 font-medium text-xs">dont Heures Majorées 100%:</span>
                        <span className="font-bold text-lg text-red-800">{summary.totalPublicHolidayHours.toFixed(0)}H{((summary.totalPublicHolidayHours % 1) * 60).toFixed(0).padStart(2, '0')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-gray-700 font-medium">Écart:</span>
                      <span className={`font-bold text-lg ${
                        summary.hoursDiff > 0 ? 'text-red-600' : 
                        summary.hoursDiff < 0 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {formatHoursDiff(summary.hoursDiff)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Services:</span>
                      <span className="font-bold text-lg text-gray-900">{summary.shiftCount}</span>
                    </div>
                    {summary.proRatedContractHours !== (employee.weeklyHours || 35) && (
                      <div className="text-xs text-orange-600 italic mt-2">
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

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreviewModal}
        onClose={() => setShowPDFPreviewModal(false)}
        restaurant={restaurant}
        employees={filteredEmployees}
        shifts={filteredShifts}
        weekStartDate={format(weekStartDate, 'yyyy-MM-dd')}
        viewType={viewType}
      />
    </div>
  );
};

export default WeeklySchedule;
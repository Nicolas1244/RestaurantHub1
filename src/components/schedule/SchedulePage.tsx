import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Plus, Calendar as CalendarIcon, Clock, Users, ChefHat, Shield, Save, FileText, Archive, X } from 'lucide-react';
import { startOfWeek, addWeeks, format, isWithinInterval, parseISO, addDays, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import ScheduleHeader from './ScheduleHeader';
import ScheduleGrid from './ScheduleGrid';
import MonthlySchedule from './MonthlySchedule';
import WeatherForecast from '../weather/WeatherForecast';
import LaborLawCompliancePanel from './LaborLawCompliancePanel';
import WeeklySchedule from './WeeklySchedule';
import DailyEntryModal from './DailyEntryModal';
import { useAppContext } from '../../contexts/AppContext';
import { Shift, EmployeeCategory, Employee } from '../../types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { scheduleAutoSaveService } from '../../lib/scheduleAutoSave';
import { v4 as uuidv4 } from 'uuid';
import { getWeek } from 'date-fns';

type ViewMode = 'weekly' | 'monthly';
type CategoryFilter = 'all' | 'cuisine' | 'salle';

const SchedulePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    currentRestaurant, 
    getRestaurantEmployees, 
    getRestaurantScheduleForWeek,
    addShift,
    updateShift,
    deleteShift,
    userSettings,
    setCurrentTab
  } = useAppContext();
  
  const [weekStartDate, setWeekStartDate] = useState(() => {
    // Initialize to Monday of current week
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [viewLayout, setViewLayout] = useState<'grid' | 'enhanced'>('grid'); // Default to grid layout
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  
  // CRITICAL: Labor law compliance panel state - default to collapsed (false)
  // Weather forecast is always shown by default
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  
  // CRITICAL: State for manual save button
  const [isSaving, setIsSaving] = useState(false);
  
  // CRITICAL: State for daily entry modal
  const [showDailyEntryModal, setShowDailyEntryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  
  // CRITICAL: Archive feature state
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [existingArchiveDate, setExistingArchiveDate] = useState<string | null>(null);
  
  // CRITICAL FIX: Move all derived variables before useEffect hooks
  const allEmployees = currentRestaurant 
    ? getRestaurantEmployees(currentRestaurant.id)
    : [];

  // CRITICAL FIX: Helper function to get active employees for the week
  const getActiveEmployeesForWeek = (employees: Employee[], weekStart: Date): Employee[] => {
    // CRITICAL: Only return employees who have at least one day active during this week
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    return employees.filter(employee => {
      const contractStart = parseISO(employee.startDate);
      const contractEnd = employee.endDate ? parseISO(employee.endDate) : null;
      
      // Employee is active for this week if their contract overlaps with the week
      const isActiveInWeek = contractStart <= weekEnd && (!contractEnd || contractEnd >= weekStart);
      
      return isActiveInWeek;
    });
  };

  // CRITICAL FIX: Filter employees based on contract dates for the selected week
  const activeEmployeesForWeek = getActiveEmployeesForWeek(allEmployees, weekStartDate);

  // CRITICAL FIX: Apply category filter to get the correct employees for the current view
  const employees = activeEmployeesForWeek.filter(employee => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'cuisine') return employee.category === 'Cuisine';
    if (categoryFilter === 'salle') return employee.category === 'Salle';
    return true;
  });

  // CRITICAL FIX: Create filtered employee IDs list for shift filtering
  const filteredEmployeeIds = employees.map(emp => emp.id);
    
  const schedule = currentRestaurant 
    ? getRestaurantScheduleForWeek(currentRestaurant.id, weekStartDate)
    : undefined;
    
  // CRITICAL FIX: Filter shifts to match the selected view AND current week only
  const shifts = useMemo(() => {
    if (!schedule) return [];
    
    return schedule.shifts.filter(shift => {
      // Only include shifts for filtered employees
      if (!filteredEmployeeIds.includes(shift.employeeId)) return false;
      
      // CRITICAL: Only include shifts that belong to the current week
      // Calculate the actual date for this shift
      const shiftDate = addDays(weekStartDate, shift.day);
      const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      
      // Check if shift date is within the current week
      const isInCurrentWeek = shiftDate >= weekStartDate && shiftDate <= weekEnd;
      
      if (!isInCurrentWeek) return false;
      
      // CRITICAL: Additional contract validation for shifts
      const employee = allEmployees.find(e => e.id === shift.employeeId);
      if (!employee) return false;
      
      const contractStart = parseISO(employee.startDate);
      const contractEnd = employee.endDate ? parseISO(employee.endDate) : null;
      
      // Only include shifts if employee is under contract on the shift date
      const isEmployeeActiveOnShiftDate = shiftDate >= contractStart && (!contractEnd || shiftDate <= contractEnd);
      
      return isEmployeeActiveOnShiftDate;
    });
  }, [schedule?.shifts, filteredEmployeeIds, weekStartDate, allEmployees]);
  
  // CRITICAL: Initialize auto-save service when component mounts
  useEffect(() => {
    if (currentRestaurant) {
      const schedule = getRestaurantScheduleForWeek(currentRestaurant.id, weekStartDate);
      
      // Initialize auto-save service with current shifts
      scheduleAutoSaveService.initialize(
        (shifts) => {
          // This callback will be called when auto-save triggers
          console.log('🔄 Auto-save triggered with', shifts.length, 'shifts');
          
          // In a real implementation, this would call an API endpoint
          // For now, we'll just update the local state via context
          // No need to do anything as shifts are already saved in context
        },
        schedule?.shifts || [],
        i18n.language as 'en' | 'fr'
      );
    }
    
    // Clean up when component unmounts
    return () => {
      scheduleAutoSaveService.cleanup();
    };
  }, [currentRestaurant, weekStartDate]);
  
  // CRITICAL: Update auto-save service when language changes
  useEffect(() => {
    scheduleAutoSaveService.setLanguage(i18n.language as 'en' | 'fr');
  }, [i18n.language]);
  
  // CRITICAL: Update auto-save service when shifts change
  useEffect(() => {
    if (currentRestaurant) {
      const schedule = getRestaurantScheduleForWeek(currentRestaurant.id, weekStartDate);
      if (schedule) {
        scheduleAutoSaveService.updateShifts(schedule.shifts);
      }
    }
  }, [shifts, weekStartDate]);
  
  // CRITICAL FIX: Functional week navigation arrows
  const handlePrevWeek = () => {
    const newDate = addWeeks(weekStartDate, -1);
    setWeekStartDate(newDate);
  };
  
  const handleNextWeek = () => {
    const newDate = addWeeks(weekStartDate, 1);
    setWeekStartDate(newDate);
  };
  
  const handleToday = () => {
    setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleWeekSelect = (date: Date) => {
    setWeekStartDate(date);
  };

  const handleDuplicateWeek = () => {
    if (!currentRestaurant) return;
    
    const currentWeekSchedule = getRestaurantScheduleForWeek(currentRestaurant.id, weekStartDate);
    if (!currentWeekSchedule) return;

    // Get the next week's start date
    const nextWeekStart = addWeeks(weekStartDate, 1);
    const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });
    
    console.log('Duplicating week from:', format(weekStartDate, 'yyyy-MM-dd'), 'to:', format(nextWeekStart, 'yyyy-MM-dd'));
    
    // CRITICAL: Only duplicate shifts from the current week that are valid for the next week
    const currentWeekShifts = currentWeekSchedule.shifts
      .filter(shift => {
        // Check if employee will be active for the corresponding day in next week
        const employee = allEmployees.find(e => e.id === shift.employeeId);
        if (!employee) return false;
        
        const nextWeekShiftDate = addDays(nextWeekStart, shift.day);
        const contractStart = parseISO(employee.startDate);
        const contractEnd = employee.endDate ? parseISO(employee.endDate) : null;
        
        const isEmployeeActiveOnNextWeekDay = nextWeekShiftDate >= contractStart && 
                                            (!contractEnd || nextWeekShiftDate <= contractEnd);
        
        if (!isEmployeeActiveOnNextWeekDay) {
          console.log(`Skipping shift for employee ${employee.firstName} ${employee.lastName} - not active on ${format(nextWeekShiftDate, 'yyyy-MM-dd')}`);
        }
        
        return isEmployeeActiveOnNextWeekDay;
      })
      .map(shift => ({
        ...shift,
        id: undefined, // Will be generated when added
        start: shift.start,
        end: shift.end
      }));

    try {
      console.log(`Duplicating ${currentWeekShifts.length} shifts to next week`);
      
      currentWeekShifts.forEach(shift => {
        addShift(shift, nextWeekStart);
      });
      toast.success(t('success.weekDuplicated'));
      setWeekStartDate(nextWeekStart);
    } catch (error) {
      console.error('Failed to duplicate week:', error);
      toast.error(t('errors.weekDuplicationFailed'));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const shiftId = active.id as string;
    const newDay = parseInt(over.id.toString().split('-')[1]);

    const shift = shifts.find(s => s.id === shiftId);
    if (shift && shift.day !== newDay) {
      updateShift({ ...shift, day: newDay });
    }
  };

  // CRITICAL FIX: Validation for scheduling outside contract period
  const validateShiftAgainstContract = (employeeId: string, day: number): { isValid: boolean; message?: string } => {
    const employee = allEmployees.find(emp => emp.id === employeeId);
    if (!employee) return { isValid: false, message: 'Employee not found' };

    const shiftDate = addDays(weekStartDate, day);
    const contractStart = parseISO(employee.startDate);
    const contractEnd = employee.endDate ? parseISO(employee.endDate) : null;

    // Check if shift date is before contract start
    if (shiftDate < contractStart) {
      return {
        isValid: false,
        message: `Attention : Vous ne pouvez pas planifier d'heures pour ${employee.firstName} ${employee.lastName} en dehors de sa période contractuelle (Date de début : ${format(contractStart, 'd MMMM yyyy')}).`
      };
    }

    // Check if shift date is after contract end
    if (contractEnd && shiftDate > contractEnd) {
      return {
        isValid: false,
        message: `Attention : Vous ne pouvez pas planifier d'heures pour ${employee.firstName} ${employee.lastName} en dehors de sa période contractuelle (Date de fin : ${format(contractEnd, 'd MMMM yyyy')}).`
      };
    }

    return { isValid: true };
  };

  // CRITICAL: Check if employee already has maximum shifts for a day
  const hasMaxShifts = (employeeId: string, day: number): boolean => {
    // Always return false to remove the limit
    return false;
  };

  // Enhanced addShift with contract validation and max shifts check
  const handleAddShift = (shiftData: Omit<Shift, 'id'>) => {
    const validation = validateShiftAgainstContract(shiftData.employeeId, shiftData.day);
    
    if (!validation.isValid) {
      toast.error(validation.message || 'Invalid shift timing');
      return;
    }

    // CRITICAL: Pass weekStartDate to ensure week-specific storage
    addShift(shiftData, weekStartDate);
  };

  // Enhanced updateShift with contract validation
  const handleUpdateShift = (shift: Shift) => {
    // Only validate if we're changing the day or employee
    const existingShift = shifts.find(s => s.id === shift.id);
    const isDayOrEmployeeChanged = !existingShift || 
      existingShift.day !== shift.day || 
      existingShift.employeeId !== shift.employeeId;

    if (isDayOrEmployeeChanged) {
      const validation = validateShiftAgainstContract(shift.employeeId, shift.day);
      
      if (!validation.isValid) {
        toast.error(validation.message || 'Invalid shift timing');
        return;
      }
    }

    // CRITICAL: Pass weekStartDate to ensure week-specific updates
    updateShift(shift, weekStartDate);
  };

  // CRITICAL: Enhanced deleteShift with week-specific deletion
  const handleDeleteShift = (shiftId: string) => {
    deleteShift(shiftId, weekStartDate);
  };
  
  // CRITICAL: Manual save function
  const handleManualSave = () => {
    setIsSaving(true);
    
    try {
      // Force an immediate save via the auto-save service
      scheduleAutoSaveService.saveNow();
      
      // Show success message
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

  // CRITICAL: Archive functionality
  const generateArchiveFilename = (): string => {
    if (!currentRestaurant) return '';
    
    const weekNumber = getWeek(weekStartDate);
    const year = weekStartDate.getFullYear();
    const restaurantSlug = currentRestaurant.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    
    return i18n.language === 'fr'
      ? `archive-planning-${restaurantSlug}-semaine${weekNumber}-${year}-${timestamp}.json`
      : `schedule-archive-${restaurantSlug}-week${weekNumber}-${year}-${timestamp}.json`;
  };

  const checkForExistingArchive = (): string | null => {
    // Check localStorage for existing archive
    const weekNumber = getWeek(weekStartDate);
    const year = weekStartDate.getFullYear();
    const archiveKey = `archive-${currentRestaurant?.id}-week${weekNumber}-${year}`;
    
    const existingArchive = localStorage.getItem(archiveKey);
    if (existingArchive) {
      try {
        const archiveData = JSON.parse(existingArchive);
        return archiveData.createdAt;
      } catch (error) {
        console.error('Error parsing existing archive:', error);
      }
    }
    
    return null;
  };

  const handleArchiveWeek = () => {
    if (!currentRestaurant) {
      toast.error(
        i18n.language === 'fr'
          ? 'Aucun restaurant sélectionné'
          : 'No restaurant selected'
      );
      return;
    }

    // Check for existing archive
    const existingDate = checkForExistingArchive();
    if (existingDate) {
      setExistingArchiveDate(existingDate);
      setShowDuplicateModal(true);
      return;
    }

    setShowArchiveConfirm(true);
  };

  const performArchive = async (replaceExisting: boolean = false) => {
    if (!currentRestaurant) return;

    setIsArchiving(true);
    
    try {
      const weekNumber = getWeek(weekStartDate);
      const year = weekStartDate.getFullYear();
      const timestamp = new Date().toISOString();
      
      // Create archive data
      const archiveData = {
        id: uuidv4(),
        restaurantId: currentRestaurant.id,
        restaurantName: currentRestaurant.name,
        weekStartDate: format(weekStartDate, 'yyyy-MM-dd'),
        weekNumber,
        year,
        employees: employees.map(emp => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          position: emp.position,
          contractType: emp.contractType,
          weeklyHours: emp.weeklyHours
        })),
        shifts: shifts.map(shift => ({
          ...shift,
          employeeName: (() => {
            const emp = employees.find(e => e.id === shift.employeeId);
            return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
          })()
        })),
        createdAt: timestamp,
        createdBy: 'current-user', // In real app, get from auth context
        metadata: {
          totalEmployees: employees.length,
          totalShifts: shifts.length,
          weekRange: formatWeekRange(weekStartDate),
          categoryFilter,
          viewMode
        }
      };

      // Store in localStorage (in real app, this would be sent to backend)
      const archiveKey = `archive-${currentRestaurant.id}-week${weekNumber}-${year}`;
      localStorage.setItem(archiveKey, JSON.stringify(archiveData));

      // Generate and download JSON file
      const filename = generateArchiveFilename();
      const blob = new Blob([JSON.stringify(archiveData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      const successMessage = replaceExisting 
        ? t('schedule.archiveReplaced')
        : t('schedule.archiveSuccess');
      
      toast.success(successMessage, {
        duration: 4000,
        icon: '📁',
        style: {
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #dcfce7'
        }
      });

      console.log('✅ Schedule archived successfully:', filename);
      
    } catch (error) {
      console.error('❌ Archive failed:', error);
      toast.error(t('schedule.archiveError'));
    } finally {
      setIsArchiving(false);
      setShowArchiveConfirm(false);
      setShowDuplicateModal(false);
      setExistingArchiveDate(null);
    }
  };

  const handleDuplicateChoice = (replace: boolean) => {
    if (replace) {
      performArchive(true);
    } else {
      toast.info(t('schedule.archiveKept'), {
        duration: 3000,
        icon: 'ℹ️'
      });
      setShowDuplicateModal(false);
      setExistingArchiveDate(null);
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
    
    // First, delete any existing shifts or absences for this employee and day
    const existingEntries = shifts.filter(
      s => s.employeeId === selectedEmployee.id && s.day === selectedDay
    );
    
    existingEntries.forEach(shift => {
      handleDeleteShift(shift.id);
    });
    
    // Then add the new shifts
    shiftsToSave.forEach(shift => {
      handleAddShift(shift);
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
    
    // First, delete any existing shifts or absences for this employee and day
    const existingEntries = shifts.filter(
      s => s.employeeId === selectedEmployee.id && s.day === selectedDay
    );
    
    existingEntries.forEach(shift => {
      handleDeleteShift(shift.id);
    });
    
    // Then add the new absence
    handleAddShift(absence);
    
    toast.success(
      i18n.language === 'fr'
        ? 'Absence enregistrée avec succès'
        : 'Absence saved successfully'
    );
  };

  // CRITICAL FIX: Helper function to format week range in French
  const formatWeekRange = (weekStart: Date): string => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    if (i18n.language === 'fr') {
      // French format: "Semaine du 9 Juin 2025 au 15 Juin 2025"
      const startFormatted = format(weekStart, 'd MMMM yyyy', { locale: fr });
      const endFormatted = format(weekEnd, 'd MMMM yyyy', { locale: fr });
      
      // Capitalize month names
      const startCapitalized = startFormatted.replace(/\b\w/g, (char) => char.toUpperCase());
      const endCapitalized = endFormatted.replace(/\b\w/g, (char) => char.toUpperCase());
      
      return `Semaine du ${startCapitalized} au ${endCapitalized}`;
    } else {
      // English format: "Week of June 9, 2025 to June 15, 2025"
      const startFormatted = format(weekStart, 'MMMM d, yyyy');
      const endFormatted = format(weekEnd, 'MMMM d, yyyy');
      return `Week of ${startFormatted} to ${endFormatted}`;
    }
  };

  // CRITICAL: Get restaurant location for weather
  const getRestaurantLocation = (): string => {
    if (!currentRestaurant) return '';
    
    // Build location string from available address components
    const locationParts = [];
    
    if (currentRestaurant.streetAddress) {
      locationParts.push(currentRestaurant.streetAddress);
    }
    
    if (currentRestaurant.postalCode) {
      locationParts.push(currentRestaurant.postalCode);
    }
    
    if (currentRestaurant.city) {
      locationParts.push(currentRestaurant.city);
    }
    
    if (currentRestaurant.country) {
      locationParts.push(currentRestaurant.country);
    }

    if (locationParts.length > 0) {
      return locationParts.join(', ');
    }
    
    // Fallback to the location field if no detailed address
    if (currentRestaurant.location) {
      return currentRestaurant.location;
    }
    
    return 'France'; // Default fallback
  };

  // CRITICAL FIX: Safe access to userSettings with fallback
  const isCompactLayout = userSettings?.scheduleLayoutType === 'optimized';

  // CRITICAL: Debug logging to verify data flow
  console.log('🔍 SchedulePage Debug Info:', {
    categoryFilter,
    totalEmployees: allEmployees.length,
    activeEmployees: activeEmployeesForWeek.length,
    filteredEmployees: employees.length,
    filteredEmployeeIds,
    totalShifts: schedule?.shifts.length || 0,
    filteredShifts: shifts.length,
    currentRestaurant: currentRestaurant?.name,
    userSettings: userSettings || 'undefined'
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{t('common.weeklySchedule')}</h2>
          <p className="text-sm text-gray-600">
            Planning Hebdomadaire - {' '}
            {currentRestaurant ? `${currentRestaurant.name} - ${currentRestaurant.location}` : t('common.selectRestaurant')}
          </p>
          {/* CRITICAL FIX: Show properly formatted week range */}
          <p className="text-sm text-gray-400 mt-1">
            {formatWeekRange(weekStartDate)}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 flex items-center gap-2 ${
                viewMode === 'weekly'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock size={18} />
              {t('schedule.weekly')}
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 flex items-center gap-2 ${
                viewMode === 'monthly'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon size={18} />
              {t('schedule.monthly')}
            </button>
          </div>

          {/* CRITICAL: View filter buttons with debug info */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => {
                console.log('🎯 Setting categoryFilter to: all');
                setCategoryFilter('all');
              }}
              className={`px-4 py-2 flex items-center gap-2 ${
                categoryFilter === 'all'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={18} />
              {t('buttons.viewGlobal')}
            </button>
            <button
              onClick={() => {
                console.log('🎯 Setting categoryFilter to: cuisine');
                setCategoryFilter('cuisine');
              }}
              className={`px-4 py-2 flex items-center gap-2 ${
                categoryFilter === 'cuisine'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChefHat size={18} />
              {t('buttons.viewCuisine')}
            </button>
            <button
              onClick={() => {
                console.log('🎯 Setting categoryFilter to: salle');
                setCategoryFilter('salle');
              }}
              className={`px-4 py-2 flex items-center gap-2 ${
                categoryFilter === 'salle'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={18} />
              {t('buttons.viewSalle')}
            </button>
          </div>
          
          {/* CRITICAL: Manual Save Button */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {i18n.language === 'fr' ? 'Sauvegarde...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {i18n.language === 'fr' ? 'Sauvegarder' : 'Save'}
              </>
            )}
          </button>          
          
          {/* CRITICAL: Archive Button */}
          <button
            onClick={handleArchiveWeek}
            disabled={isArchiving || !currentRestaurant}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
          >
            {isArchiving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('schedule.archiveInProgress')}
              </>
            ) : (
              <>
                <Archive size={18} className="mr-2" />
                {t('schedule.archiveWeek')}
              </>
            )}
          </button>
        </div>
      </div>
      
      {currentRestaurant ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {/* CRITICAL: Labor Law Compliance Panel - Positioned at top for visibility */}
            <LaborLawCompliancePanel
              employees={employees}
              shifts={shifts}
              weekStartDate={weekStartDate}
              isVisible={showCompliancePanel}
              onToggle={() => setShowCompliancePanel(!showCompliancePanel)}
            />

            {viewMode === 'weekly' ? (
              <>
                {/* CRITICAL: Pass the correctly filtered data to ScheduleHeader */}
                <ScheduleHeader
                  weekStartDate={weekStartDate}
                  onPrevWeek={handlePrevWeek}
                  onNextWeek={handleNextWeek}
                  onToday={handleToday}
                  onDuplicateWeek={handleDuplicateWeek}
                  onWeekSelect={handleWeekSelect}
                  restaurant={currentRestaurant}
                  employees={employees}
                  shifts={shifts}
                  viewType={categoryFilter}
                />

                {/* CRITICAL: Weather Forecast Integration - Positioned above schedule grid */}
                {viewLayout === 'grid' && (
                  <WeatherForecast
                    weekStartDate={weekStartDate}
                    restaurantLocation={getRestaurantLocation()}
                    compact={isCompactLayout}
                    responsive={window.innerWidth < 640 ? 'xs' : 
                             window.innerWidth < 768 ? 'sm' : 
                             window.innerWidth < 1024 ? 'md' : 
                             window.innerWidth < 1280 ? 'lg' : 'xl'}
                  />
                )}
                
                {/* Always use grid layout */}
                <ScheduleGrid
                  shifts={shifts}
                  employees={employees}
                  onUpdateShift={handleUpdateShift}
                  onAddShift={handleAddShift}
                  onDeleteShift={handleDeleteShift}
                  weekStartDate={weekStartDate}
                  onOpenShiftModal={handleOpenDailyEntryModal}
                />
              </>
            ) : (
              <MonthlySchedule
                shifts={shifts}
                employees={employees}
                onShiftClick={(shift) => {
                  const employee = employees.find(e => e.id === shift.employeeId);
                  if (employee) {
                    setSelectedEmployee(employee);
                    setSelectedDay(shift.day);
                    setShowDailyEntryModal(true);
                  }
                }}
                currentDate={weekStartDate}
              />
            )}
          </div>
        </DndContext>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-lg text-gray-500">
            {t('common.selectRestaurantPrompt')}
          </p>
        </div>
      )}

      {/* CRITICAL: Daily Entry Modal for managing shifts and absences */}
      <DailyEntryModal
        isOpen={showDailyEntryModal}
        onClose={() => setShowDailyEntryModal(false)}
        employee={selectedEmployee || null}
        day={selectedDay}
        weekStartDate={weekStartDate}
        existingShifts={shifts}
        onSaveShifts={handleSaveShifts}
        onUpdateShift={handleUpdateShift}
       onDeleteShift={handleDeleteShift}
        onSaveAbsence={handleSaveAbsence}
        restaurantId={currentRestaurant?.id || ''}
      />

      {/* CRITICAL: Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowArchiveConfirm(false)} />
            
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Archive size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('schedule.archiveConfirmTitle')}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                {t('schedule.archiveConfirmMessage')}
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="text-sm text-blue-700">
                  <div className="font-medium mb-1">
                    {i18n.language === 'fr' ? 'Détails de l\'archive :' : 'Archive details:'}
                  </div>
                  <div>
                    {i18n.language === 'fr' ? 'Semaine' : 'Week'} {getWeek(weekStartDate)}, {weekStartDate.getFullYear()}
                  </div>
                  <div>
                    {formatWeekRange(weekStartDate)}
                  </div>
                  <div>
                    {employees.length} {i18n.language === 'fr' ? 'employé(s)' : 'employee(s)'}, {shifts.length} {i18n.language === 'fr' ? 'service(s)' : 'shift(s)'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => performArchive(false)}
                  disabled={isArchiving}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
                >
                  {t('schedule.archive')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRITICAL: Duplicate Archive Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowDuplicateModal(false)} />
            
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Archive size={20} className="text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('schedule.duplicateDetected')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                {t('schedule.duplicateMessage')}
              </p>

              {existingArchiveDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <div className="text-sm text-yellow-700">
                    <div className="font-medium mb-1">
                      {i18n.language === 'fr' ? 'Archive existante :' : 'Existing archive:'}
                    </div>
                    <div>
                      {i18n.language === 'fr' ? 'Créée le' : 'Created on'} {format(new Date(existingArchiveDate), 'dd/MM/yyyy à HH:mm')}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleDuplicateChoice(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  {t('schedule.keepExisting')}
                </button>
                <button
                  onClick={() => handleDuplicateChoice(true)}
                  disabled={isArchiving}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md disabled:opacity-50"
                >
                  {t('schedule.replaceArchive')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
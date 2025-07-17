import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, Calendar, Plus, Scissors } from 'lucide-react';
import { Employee, Shift, DAYS_OF_WEEK, POSITIONS, DAILY_STATUS, DailyStatus } from '../../types';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface ShiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: Shift;
  employees: Employee[];
  onSave: (shift: Omit<Shift, 'id'>) => void;
  onUpdate: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
  restaurantId: string;
  preSelectedEmployeeId?: string;
  preSelectedDay?: number;
}

const ShiftForm: React.FC<ShiftFormProps> = ({
  isOpen,
  onClose,
  shift,
  employees,
  onSave,
  onUpdate,
  onDelete,
  restaurantId,
  preSelectedEmployeeId,
  preSelectedDay
}) => {
  const { t, i18n } = useTranslation();
  const [employeeId, setEmployeeId] = useState<string>('');
  const [day, setDay] = useState(0);
  const [shifts, setShifts] = useState<Array<{
    id: string;
    start: string;
    end: string;
    type: 'morning' | 'evening';
    isNew?: boolean;
  }>>([]);
  const [hasCoupure, setHasCoupure] = useState(false);
  const [status, setStatus] = useState<DailyStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isHolidayWorked, setIsHolidayWorked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (shift) {
      // Editing a single existing shift
      setEmployeeId(shift.employeeId);
      setDay(shift.day);
      // Find all shifts for this employee and day
      const employeeShifts = existingShifts.filter(
        s => s.employeeId === shift.employeeId && s.day === shift.day
      );
      
      // Initialize with all existing shifts for this employee and day
      setShifts(
        employeeShifts.map(s => ({
          id: s.id,
          start: s.start,
          end: s.end,
          type: s.type
        }))
      );
      setHasCoupure(shift.hasCoupure || false);
      setStatus(shift.status || '');
      setNotes(shift.notes || '');
      setIsHolidayWorked(shift.isHolidayWorked || false);
    } else {
      // Creating new shift(s)
      setEmployeeId(preSelectedEmployeeId || '');
      setDay(preSelectedDay !== undefined ? preSelectedDay : 0);
      setShifts([{
        id: uuidv4(),
        start: '09:00',
        end: '17:00',
        type: 'morning',
        isNew: true
      }]);
      setHasCoupure(false);
      setStatus('');
      setNotes('');
      setIsHolidayWorked(false);
    }
  }, [shift, isOpen, preSelectedEmployeeId, preSelectedDay]);

  const handleAddShift = () => {
    // CRITICAL: Limit to maximum 2 shifts per day
    if (shifts.length >= 2) {
      setValidationError(
        i18n.language === 'fr'
          ? 'Vous ne pouvez pas ajouter plus de 2 services par employé par jour.'
          : 'You cannot add more than 2 services per employee per day.');
      return;
    }
    
    setShifts(prev => [
      ...prev,
      {
        id: uuidv4(),
        start: prev.length > 0 ? '17:00' : '09:00',
        end: prev.length > 0 ? '23:00' : '17:00',
        type: prev.length > 0 ? 'evening' : 'morning',
        isNew: true
      }
    ]);
    
    // If adding a second shift, automatically enable coupure
    if (shifts.length === 1) {
      setHasCoupure(true);
    }
    
    setValidationError(null);
  };

  const handleRemoveShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    
    // If removing a shift and only one remains, disable coupure
    if (shifts.length <= 2) {
      setHasCoupure(false);
    }
    
    setValidationError(null);
  };

  const handleShiftChange = (
    shiftId: string, 
    field: 'start' | 'end', 
    value: string
  ) => {
    setShifts(prev => 
      prev.map(s => 
        s.id === shiftId 
          ? { ...s, [field]: value } 
          : s
      )
    );
    
    setValidationError(null);
  };

  const validateShifts = (): boolean => {
    if (shifts.length <= 1) return true;
    
    // Sort shifts by start time
    const sortedShifts = [...shifts].sort((a, b) => {
      const aStart = a.start.split(':').map(Number);
      const bStart = b.start.split(':').map(Number);
      return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
    });
    
    for (let i = 0; i < sortedShifts.length - 1; i++) {
      const currentShift = sortedShifts[i];
      const nextShift = sortedShifts[i + 1];
      
      const currentEnd = currentShift.end.split(':').map(Number);
      const nextStart = nextShift.start.split(':').map(Number);
      
      const currentEndMinutes = currentEnd[0] * 60 + currentEnd[1];
      const nextStartMinutes = nextStart[0] * 60 + nextStart[1];
      
      if (currentEndMinutes > nextStartMinutes) {
        setValidationError(
          i18n.language === 'fr'
            ? 'Les services se chevauchent. Veuillez ajuster les heures.'
            : 'Shifts are overlapping. Please adjust the times.'
        );
        return false;
      }
    }
    
    return true;
  };

  // Calculate total working hours and break time
  const calculateDaySummary = () => {
    if (shifts.length === 0) return { workingHours: 0, breakHours: 0 };
    
    // Sort shifts by start time
    const sortedShifts = [...shifts].sort((a, b) => a.start.localeCompare(b.start));
    
    // Calculate total working hours
    let totalWorkingHours = 0;
    sortedShifts.forEach(shift => {
      const [startHour, startMin] = shift.start.split(':').map(Number);
      const [endHour, endMin] = shift.end.split(':').map(Number);
      
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
      
      totalWorkingHours += hours + minutes / 60;
    });
    
    // Calculate break hours (coupure)
    let totalBreakMinutes = 0;
    for (let i = 0; i < sortedShifts.length - 1; i++) {
      const currentShift = sortedShifts[i];
      const nextShift = sortedShifts[i + 1];
      
      const currentEnd = currentShift.end.split(':').map(Number);
      const nextStart = nextShift.start.split(':').map(Number);
      
      let currentEndMinutes = currentEnd[0] * 60 + currentEnd[1];
      let nextStartMinutes = nextStart[0] * 60 + nextStart[1];
      
      // Handle overnight breaks
      if (nextStartMinutes < currentEndMinutes) {
        nextStartMinutes += 24 * 60; // Add 24 hours
      }
      
      const breakMinutes = nextStartMinutes - currentEndMinutes;
      totalBreakMinutes += breakMinutes;
    }
    
    return {
      workingHours: Math.round(totalWorkingHours * 10) / 10,
      breakHours: Math.round((totalBreakMinutes / 60) * 10) / 10
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous validation errors
    setValidationError(null);
    
    // Clear any previous validation errors
    setValidationError(null);
    
    if (!employeeId) {
      setValidationError(
        i18n.language === 'fr'
          ? 'Employé non sélectionné'
          : 'No employee selected'
      );
      return;
    }
    
    if (status) {
      // If it's an absence/status, create a single shift with status
      const absenceShift: any = {
        restaurantId,
        employeeId,
        day,
        // For worked holidays, we need to set start and end times
        start: (status === 'PUBLIC_HOLIDAY' && isHolidayWorked) ? 
               (document.getElementById('holidayStart') as HTMLInputElement)?.value || '09:00' : '',
        end: (status === 'PUBLIC_HOLIDAY' && isHolidayWorked) ? 
             (document.getElementById('holidayEnd') as HTMLInputElement)?.value || '17:00' : '',
        position: employees.find(e => e.id === employeeId)?.position || '',
        type: 'morning' as const,
        // For worked holidays, we don't set a status (it's a regular shift with isHolidayWorked flag)
        status: (status === 'PUBLIC_HOLIDAY' && isHolidayWorked) ? undefined : (status as DailyStatus),
        notes,
        // Set the isHolidayWorked flag for PUBLIC_HOLIDAY
        isHolidayWorked: (status === 'PUBLIC_HOLIDAY' && isHolidayWorked) ? true : undefined
      };
      
      if (shift) {
        // Update the existing shift
        onUpdate({ ...absenceShift, id: shift.id });
      } else {
        // Create a new absence shift
        onSave(absenceShift);
      }
      
      onClose();
      return;
    }
    
    // For regular shifts
    if (shifts.length === 0) {
      setValidationError(
        i18n.language === 'fr'
          ? 'Veuillez ajouter au moins un service'
          : 'Please add at least one shift'
      );
      return;
    }
    
    if (!validateShifts()) {
      return;
    }
    
    // Get employee to use their position
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
      setValidationError(
        i18n.language === 'fr'
          ? 'Employé non trouvé'
          : 'Employee not found'
      );
      return;
    }
    
    // Generate a shared shiftGroup ID for related shifts
    const shiftGroupId = uuidv4();
    
    // If we're editing a single shift, we need to handle it specially
    if (shift) {
      // Find the index of the shift we're editing
      const editingShiftIndex = shifts.findIndex(s => s.id === shift.id);
      
      if (editingShiftIndex !== -1) {
        // We're updating an existing shift
        const currentShift = shifts[editingShiftIndex];
        
        const shiftData = {
          id: shift.id,
          restaurantId,
          employeeId,
          day,
          start: currentShift.start,
          end: currentShift.end,
          position: employee.position,
          color: editingShiftIndex === 0 ? '#3B82F6' : '#8B5CF6',
          type: currentShift.type,
          hasCoupure: hasCoupure || shifts.length > 1,
          shiftGroup: shift.shiftGroup || shiftGroupId,
          shiftOrder: editingShiftIndex + 1,
          notes
        };
        
        // Update just this shift
        onUpdate(shiftData);
      }
    } else {
      // We're creating new shifts
      for (let i = 0; i < shifts.length; i++) {
        const currentShift = shifts[i];
        
        const shiftData = {
          restaurantId,
          employeeId,
          day,
          start: currentShift.start,
          end: currentShift.end,
          position: employee.position,
          color: i === 0 ? '#3B82F6' : '#8B5CF6', // Blue for first shift, purple for second
          type: currentShift.type,
          // Add coupure information
          hasCoupure: hasCoupure || shifts.length > 1,
          shiftGroup: shiftGroupId,
          shiftOrder: i + 1,
          notes
        };
        
        // Create new shift
        onSave(shiftData);
      }
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (shift) {
      onDelete(shift.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Get employee name for display
  const employee = employees.find(e => e.id === (shift?.employeeId || employeeId || preSelectedEmployeeId));
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : '';

  // Get day name for display
  const dayName = preSelectedDay !== undefined ? t(`days.${DAYS_OF_WEEK[preSelectedDay].toLowerCase()}`) : '';

  // Calculate day summary
  const { workingHours, breakHours } = calculateDaySummary();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {shift ? (i18n.language === 'fr' ? 'Modifier le Service' : 'Edit Shift') : 
                       (i18n.language === 'fr' ? 'Ajouter un Service' : 'Add Shift')}
            </h3>
            <button 
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="space-y-4">
                {/* Employee and Day Information */}
                {employeeName && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                        {employee?.firstName.charAt(0)}{employee?.lastName.charAt(0)}
                      </div>
                      <div className="text-sm font-medium text-blue-800">
                        {employeeName}
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee Selection */}
                {!employeeName && (
                  <div>
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                      {i18n.language === 'fr' ? 'Employé' : 'Employee'}
                    </label>
                    <select
                      id="employeeId"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">{i18n.language === 'fr' ? '-- Sélectionner un employé --' : '-- Select an employee --'}</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Day Selection */}
                <div>
                  <label htmlFor="day" className="block text-sm font-medium text-gray-700">
                    {i18n.language === 'fr' ? 'Jour' : 'Day'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    {preSelectedDay !== undefined ? (
                      <input
                        type="text"
                        value={dayName}
                        readOnly
                        className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 bg-gray-50 focus:outline-none sm:text-sm rounded-md"
                      />
                    ) : (
                      <select
                        id="day"
                        value={day}
                        onChange={(e) => setDay(parseInt(e.target.value))}
                        required
                        className="mt-1 block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        {DAYS_OF_WEEK.map((dayName, index) => (
                          <option key={index} value={index}>
                            {t(`days.${dayName.toLowerCase()}`)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Status Selection (for absences) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Type d\'Absence (optionnel)' : 'Absence Type (optional)'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('')}
                      className={`p-2 text-sm font-medium rounded-md border ${
                        status === '' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {i18n.language === 'fr' ? 'Service Normal' : 'Regular Shift'}
                    </button>
                    {Object.entries(DAILY_STATUS).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatus(key as DailyStatus)}
                        className={`p-2 text-sm font-medium rounded-md border ${
                          status === key 
                            ? 'text-white' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: status === key ? value.color : undefined,
                          borderColor: status === key ? value.color : undefined
                        }}
                      >
                        {value.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Holiday Worked Option - Only show for PUBLIC_HOLIDAY */}
                  {status === 'PUBLIC_HOLIDAY' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock size={16} className="text-red-500 mr-2" />
                          <span className="text-sm font-medium text-red-700">
                            {i18n.language === 'fr' ? 'Férié travaillé (majoré)' : 'Worked holiday (with overtime)'}
                          </span>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input
                            type="checkbox"
                            id="holidayWorked"
                            checked={isHolidayWorked}
                            onChange={() => setIsHolidayWorked(!isHolidayWorked)}
                            className="sr-only"
                          />
                          <label
                            htmlFor="holidayWorked"
                            className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                              isHolidayWorked ? 'bg-red-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                                isHolidayWorked ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            ></span>
                          </label>
                        </div>
                      </div>
                      
                      {isHolidayWorked && (
                        <div className="mt-3">
                          <p className="text-sm text-red-600">
                            {i18n.language === 'fr' 
                              ? 'Les heures travaillées pendant le 1er Mai seront comptées comme des heures majorées à 100%.'
                              : 'Hours worked during May 1st will be counted with 100% premium pay.'}
                          </p>
                          
                          {/* Time input for worked holiday */}
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <label htmlFor="holidayStart" className="block text-xs font-medium text-red-700">
                                {i18n.language === 'fr' ? 'Heure de début' : 'Start Time'}
                              </label>
                              <input
                                type="time"
                                id="holidayStart"
                                defaultValue={shifts.length > 0 ? shifts[0].start : "09:00"}
                                onChange={(e) => {
                                  // Update the start time for the holiday shift
                                  const newStart = e.target.value;
                                  // We need to update the form state
                                  if (shifts.length > 0) {
                                    setShifts(prev => 
                                      prev.map(s => ({ ...s, start: newStart }))
                                    );
                                  }
                                }}
                                className="mt-1 block w-full border-red-300 focus:ring-red-500 focus:border-red-500 sm:text-xs rounded-md"
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="holidayEnd" className="block text-xs font-medium text-red-700">
                                {i18n.language === 'fr' ? 'Heure de fin' : 'End Time'}
                              </label>
                              <input
                                type="time"
                                id="holidayEnd"
                                defaultValue={shifts.length > 0 ? shifts[0].end : "17:00"}
                                onChange={(e) => {
                                  // Update the end time for the holiday shift
                                  const newEnd = e.target.value;
                                  // We need to update the form state
                                  if (shifts.length > 0) {
                                    setShifts(prev => 
                                      prev.map(s => ({ ...s, end: newEnd }))
                                    );
                                  }
                                }}
                                className="mt-1 block w-full border-red-300 focus:ring-red-500 focus:border-red-500 sm:text-xs rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {status && (
                    <p className="mt-2 text-sm text-gray-500">
                      {i18n.language === 'fr' 
                        ? 'Sélectionner une absence supprimera tous les services planifiés pour ce jour.' 
                        : 'Selecting an absence will remove any scheduled shifts for this day.'}
                    </p>
                  )}
                </div>

                {/* Shift Times (only shown if no status is selected) */}
                {!status && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">
                        {i18n.language === 'fr' ? 'Services' : 'Shifts'}
                      </h4>
                      {/* CRITICAL: Only show "Add service" button if less than 2 shifts */}
                      {shifts.length < 2 && (
                        <button
                          type="button"
                          onClick={handleAddShift}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Plus size={16} className="mr-1" />
                          {i18n.language === 'fr' ? 'Ajouter un service' : 'Add shift'}
                        </button>
                      )}
                    </div>

                    {shifts.map((shiftItem, index) => (
                      <div key={shiftItem.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Clock size={16} className="text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                              {i18n.language === 'fr' ? `Service ${index + 1}` : `Shift ${index + 1}`}
                            </span>
                          </div>
                          {shifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveShift(shiftItem.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`start-${shiftItem.id}`} className="block text-xs font-medium text-gray-700">
                              {i18n.language === 'fr' ? 'Heure de début' : 'Start Time'}
                            </label>
                            <input
                              type="time"
                              id={`start-${shiftItem.id}`}
                              value={shiftItem.start}
                              onChange={(e) => handleShiftChange(shiftItem.id, 'start', e.target.value)}
                              required
                              className="mt-1 block w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-xs rounded-md"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor={`end-${shiftItem.id}`} className="block text-xs font-medium text-gray-700">
                              {i18n.language === 'fr' ? 'Heure de fin' : 'End Time'}
                            </label>
                            <input
                              type="time"
                              id={`end-${shiftItem.id}`}
                              value={shiftItem.end}
                              onChange={(e) => handleShiftChange(shiftItem.id, 'end', e.target.value)}
                              required
                              className="mt-1 block w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-xs rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Coupure Toggle (only shown if there are 2 shifts) */}
                    {shifts.length > 1 && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasCoupure"
                          checked={hasCoupure}
                          onChange={(e) => setHasCoupure(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="hasCoupure" className="ml-2 block text-sm text-gray-700 flex items-center">
                          <Scissors size={16} className="mr-1 text-gray-500" />
                          {i18n.language === 'fr' ? 'Service coupé (Coupure)' : 'Split Shift (Coupure)'}
                        </label>
                      </div>
                    )}

                    {/* Day Summary */}
                    {shifts.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <h5 className="text-sm font-medium text-blue-700 mb-2">
                          {i18n.language === 'fr' ? 'Résumé du jour' : 'Day Summary'}
                        </h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-600">
                              {i18n.language === 'fr' ? 'Heures travaillées' : 'Working hours'}:
                            </span>
                            <span className="font-medium text-blue-800">{workingHours}h</span>
                          </div>
                          {shifts.length > 1 && (
                            <div className="flex justify-between">
                              <span className="text-blue-600">
                                {i18n.language === 'fr' ? 'Heures de coupure' : 'Break hours'}:
                              </span>
                              <span className="font-medium text-orange-600 bg-orange-100 px-2 rounded-full">{breakHours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Field */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    {i18n.language === 'fr' ? 'Notes (optionnel)' : 'Notes (optional)'}
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder={i18n.language === 'fr' ? 'Notes additionnelles...' : 'Additional notes...'}
                  />
                </div>

                {/* Validation Error */}
                {validationError && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="ml-2 text-sm text-red-700">{validationError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {shift 
                  ? (i18n.language === 'fr' ? 'Mettre à jour le Service' : 'Update Shift')
                  : (i18n.language === 'fr' ? 'Ajouter le Service' : 'Add Shift')
                }
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
              >
                {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              
              {shift && (
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} className="mr-2" />
                  {i18n.language === 'fr' ? 'Supprimer' : 'Delete'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShiftForm;
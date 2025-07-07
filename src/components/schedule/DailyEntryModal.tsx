import React, { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Employee, Shift, DailyStatus } from '../../types';

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  day: string;
  existingShifts: Shift[];
  onSaveShift: (shift: Omit<Shift, 'id'>) => void;
  onDeleteShift: (shiftId: string) => void;
  restaurantId: string;
}

const ABSENCE_TYPES: DailyStatus[] = [
  'VACATION',
  'SICK_LEAVE',
  'PERSONAL_LEAVE',
  'PUBLIC_HOLIDAY',
  'TRAINING',
  'UNPAID_LEAVE'
];

export default function DailyEntryModal({
  isOpen,
  onClose,
  employee,
  day,
  existingShifts,
  onSaveShift,
  onDeleteShift,
  restaurantId
}: DailyEntryModalProps) {
  const { t } = useTranslation();
  const [shifts, setShifts] = useState<Omit<Shift, 'id'>[]>([]);
  const [selectedAbsence, setSelectedAbsence] = useState<DailyStatus | null>(null);
  const [isHolidayWorked, setIsHolidayWorked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize with existing shifts or create empty shift
      if (existingShifts.length > 0) {
        setShifts(existingShifts.map(shift => ({
          restaurantId: shift.restaurantId,
          employeeId: shift.employeeId,
          day: shift.day,
          start: shift.start,
          end: shift.end,
          position: shift.position,
          type: shift.type,
          status: shift.status,
          notes: shift.notes || '',
          isHolidayWorked: shift.isHolidayWorked
        })));
        
        // Check if there's an absence status
        const absenceShift = existingShifts.find(shift => 
          ABSENCE_TYPES.includes(shift.status as DailyStatus)
        );
        if (absenceShift) {
          setSelectedAbsence(absenceShift.status as DailyStatus);
          setIsHolidayWorked(absenceShift.isHolidayWorked || false);
        }
      } else {
        setShifts([{
          restaurantId,
          employeeId: employee.id,
          day,
          start: '09:00',
          end: '17:00',
          position: employee.position,
          type: 'morning',
          notes: ''
        }]);
      }
    }
  }, [isOpen, existingShifts, employee, day, restaurantId]);

  const addShift = () => {
    setShifts([...shifts, {
      restaurantId,
      employeeId: employee.id,
      day,
      start: '09:00',
      end: '17:00',
      position: employee.position,
      type: 'evening',
      notes: ''
    }]);
  };

  const updateShift = (index: number, field: keyof Omit<Shift, 'id'>, value: any) => {
    const updatedShifts = [...shifts];
    updatedShifts[index] = { ...updatedShifts[index], [field]: value };
    setShifts(updatedShifts);
  };

  const removeShift = (index: number) => {
    const updatedShifts = shifts.filter((_, i) => i !== index);
    setShifts(updatedShifts);
  };

  const handleSubmit = () => {
    if (selectedAbsence) {
      // Handle absence
      if (selectedAbsence === 'PUBLIC_HOLIDAY' && isHolidayWorked) {
        // Save worked holiday shifts
        shifts.forEach(shift => {
          onSaveShift({
            ...shift,
            isHolidayWorked: true
          });
        });
      } else {
        // Create absence shift
        const absenceShift = {
          restaurantId,
          employeeId: employee.id,
          day,
          start: '',
          end: '',
          position: employee.position,
          type: 'morning' as const,
          status: selectedAbsence,
          notes: '',
          isHolidayWorked: false
        };
        onSaveShift(absenceShift);
      }
    } else {
      // Save regular shifts
      shifts.forEach(shift => {
        onSaveShift(shift);
      });
    }

    // Delete existing shifts that are not in the current shifts array
    existingShifts.forEach(existingShift => {
      const stillExists = shifts.some(shift => 
        shift.start === existingShift.start && 
        shift.end === existingShift.end &&
        shift.position === existingShift.position
      );
      if (!stillExists) {
        onDeleteShift(existingShift.id);
      }
    });

    onClose();
  };

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  };

  const totalHours = shifts.reduce((total, shift) => 
    total + calculateHours(shift.start, shift.end), 0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm text-gray-500 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(day).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Absence Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('schedule.absenceType')}
            </label>
            <select
              value={selectedAbsence || ''}
              onChange={(e) => {
                const value = e.target.value as DailyStatus;
                setSelectedAbsence(value || null);
                if (value !== 'PUBLIC_HOLIDAY') {
                  setIsHolidayWorked(false);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('schedule.workingDay')}</option>
              {ABSENCE_TYPES.map(type => (
                <option key={type} value={type}>
                  {t(`schedule.absenceTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Holiday Worked Option */}
          {selectedAbsence === 'PUBLIC_HOLIDAY' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="holidayWorked"
                  checked={isHolidayWorked}
                  onChange={(e) => setIsHolidayWorked(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="holidayWorked" className="ml-2 text-sm text-gray-700">
                  {t('schedule.workedOnHoliday')}
                </label>
              </div>
            </div>
          )}

          {/* Shifts Section */}
          {(!selectedAbsence || (selectedAbsence === 'PUBLIC_HOLIDAY' && isHolidayWorked)) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('schedule.shifts')}
                </h3>
                <button
                  onClick={addShift}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  {t('schedule.addShift')}
                </button>
              </div>

              <div className="space-y-4">
                {shifts.map((shift, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('schedule.startTime')}
                        </label>
                        <input
                          type="time"
                          value={shift.start}
                          onChange={(e) => updateShift(index, 'start', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('schedule.endTime')}
                        </label>
                        <input
                          type="time"
                          value={shift.end}
                          onChange={(e) => updateShift(index, 'end', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('schedule.position')}
                        </label>
                        <input
                          type="text"
                          value={shift.position}
                          onChange={(e) => updateShift(index, 'position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => removeShift(index)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          {t('common.remove')}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('schedule.notes')}
                      </label>
                      <textarea
                        value={shift.notes || ''}
                        onChange={(e) => updateShift(index, 'notes', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('schedule.notesPlaceholder')}
                      />
                    </div>

                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {calculateHours(shift.start, shift.end).toFixed(1)} {t('schedule.hours')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Hours */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {t('schedule.totalHours')}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {totalHours.toFixed(1)} {t('schedule.hours')}
                  </span>
                </div>
                {totalHours > 8 && (
                  <div className="flex items-center mt-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="text-sm">{t('schedule.overtimeWarning')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
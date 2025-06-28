import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, Calendar } from 'lucide-react';
import { Employee, Shift, DAYS_OF_WEEK } from '../../types';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

interface ShiftModalProps {
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

const ShiftModal: React.FC<ShiftModalProps> = ({
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

  useEffect(() => {
    if (shift) {
      // Editing a single existing shift
      setEmployeeId(shift.employeeId);
      setDay(shift.day);
      setShifts([{
        id: shift.id,
        start: shift.start,
        end: shift.end,
        type: shift.type
      }]);
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
    }
  }, [shift, isOpen, preSelectedEmployeeId, preSelectedDay]);

  const handleAddShift = () => {
    // CRITICAL: Enforce maximum 2 shifts per day
    if (shifts.length >= 2) {
      alert(i18n.language === 'fr' 
        ? 'Maximum 2 services par jour atteints pour cet employé.' 
        : 'Maximum 2 shifts per day reached for this employee.');
      return;
    }
    
    setShifts(prev => [
      ...prev, 
      {
        id: uuidv4(),
        start: '17:00',
        end: '23:00',
        type: 'evening',
        isNew: true
      }
    ]);
  };

  const handleRemoveShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
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
  };

  const validateShifts = (): boolean => {
    // Check for overlapping shifts
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
        alert(i18n.language === 'fr' 
          ? 'Les services se chevauchent. Veuillez ajuster les heures.' 
          : 'Shifts are overlapping. Please adjust the times.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId) {
      alert(i18n.language === 'fr' 
        ? 'Veuillez sélectionner un employé' 
        : 'Please select an employee');
      return;
    }
    
    if (shifts.length === 0) {
      alert(i18n.language === 'fr' 
        ? 'Veuillez ajouter au moins un service' 
        : 'Please add at least one shift');
      return;
    }
    
    if (!validateShifts()) {
      return;
    }
    
    // Get employee to use their position
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
      alert(i18n.language === 'fr'
        ? 'Employé non trouvé'
        : 'Employee not found');
      return;
    }
    
    // Process each shift
    for (let i = 0; i < shifts.length; i++) {
      const currentShift = shifts[i];
      
      const shiftData = {
        restaurantId,
        employeeId,
        day,
        start: currentShift.start,
        end: currentShift.end,
        position: employee.position, // Use employee's position from their profile
        color: '#3B82F6',
        type: currentShift.type
      };
      
      if (shift && currentShift.id === shift.id) {
        // Update existing shift
        onUpdate({ ...shiftData, id: shift.id });
      } else {
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
                {/* Employee name display */}
                {employeeName && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-blue-800">
                        {employeeName}
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Multiple shifts section */}
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
                        <Clock size={16} className="mr-1" />
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
                </div>
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

export default ShiftModal;
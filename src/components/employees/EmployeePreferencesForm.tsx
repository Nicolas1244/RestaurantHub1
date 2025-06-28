import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Briefcase, Check, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { Employee, DAYS_OF_WEEK, SHIFT_TYPES, POSITIONS, EmployeePreference, ShiftType } from '../../types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface EmployeePreferencesFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSave: (employeeId: string, preferences: Omit<EmployeePreference, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const EmployeePreferencesForm: React.FC<EmployeePreferencesFormProps> = ({
  isOpen,
  onClose,
  employee,
  onSave
}) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  // Preferences state
  const [preferredDays, setPreferredDays] = useState<number[]>([]);
  const [preferredShifts, setPreferredShifts] = useState<ShiftType[]>([]);
  const [preferredPositions, setPreferredPositions] = useState<string[]>([]);
  const [minHours, setMinHours] = useState<number>(employee.weeklyHours || 35);
  const [maxHours, setMaxHours] = useState<number>(employee.weeklyHours || 35);
  const [notes, setNotes] = useState<string>('');
  
  // UI state
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);

  // Initialize form with existing preferences
  useEffect(() => {
    if (employee.preferences) {
      setPreferredDays(employee.preferences.preferredDays);
      setPreferredShifts(employee.preferences.preferredShifts);
      setPreferredPositions(employee.preferences.preferredPositions);
      setMinHours(employee.preferences.preferredHours.min);
      setMaxHours(employee.preferences.preferredHours.max);
      setNotes(employee.preferences.notes);
    } else {
      // Default values
      setPreferredDays([1, 2, 3, 4, 5]); // Monday to Friday by default
      setPreferredShifts(['morning', 'evening']);
      setPreferredPositions([employee.position]);
      setMinHours(employee.weeklyHours || 35);
      setMaxHours(employee.weeklyHours || 35);
      setNotes('');
    }
  }, [employee, isOpen]);

  // Toggle day selection
  const toggleDay = (day: number) => {
    if (preferredDays.includes(day)) {
      setPreferredDays(preferredDays.filter(d => d !== day));
    } else {
      setPreferredDays([...preferredDays, day].sort());
    }
  };

  // Toggle shift type selection
  const toggleShiftType = (type: ShiftType) => {
    if (preferredShifts.includes(type)) {
      setPreferredShifts(preferredShifts.filter(t => t !== type));
    } else {
      setPreferredShifts([...preferredShifts, type]);
    }
  };

  // Toggle position selection
  const togglePosition = (position: string) => {
    if (preferredPositions.includes(position)) {
      setPreferredPositions(preferredPositions.filter(p => p !== position));
    } else {
      setPreferredPositions([...preferredPositions, position]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (preferredDays.length === 0) {
        throw new Error(i18n.language === 'fr' 
          ? 'Veuillez sélectionner au moins un jour préféré' 
          : 'Please select at least one preferred day');
      }

      if (preferredShifts.length === 0) {
        throw new Error(i18n.language === 'fr' 
          ? 'Veuillez sélectionner au moins un type de service préféré' 
          : 'Please select at least one preferred shift type');
      }

      if (minHours > maxHours) {
        throw new Error(i18n.language === 'fr' 
          ? 'Les heures minimales ne peuvent pas dépasser les heures maximales' 
          : 'Minimum hours cannot exceed maximum hours');
      }

      const preferencesData = {
        preferredDays,
        preferredShifts,
        preferredPositions,
        preferredHours: {
          min: minHours,
          max: maxHours
        },
        notes
      };

      await onSave(employee.id, preferencesData);
      onClose();
      
      toast.success(i18n.language === 'fr' 
        ? 'Préférences enregistrées avec succès' 
        : 'Preferences saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  // Get position hierarchy level for visual indication
  const getPositionHierarchyLevel = (position: string): number => {
    const hierarchyOrder = [
      'Operations Manager',
      'Chef de Cuisine',
      'Second de Cuisine',
      'Chef de Partie',
      'Commis de Cuisine',
      'Plongeur',
      'Barman/Barmaid',
      'Waiter(s)'
    ];
    
    const index = hierarchyOrder.indexOf(position);
    return index >= 0 ? index : hierarchyOrder.length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {i18n.language === 'fr' 
                ? `Préférences de ${employee.firstName} ${employee.lastName}` 
                : `${employee.firstName} ${employee.lastName}'s Preferences`}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Preferred Days Section */}
              <div>
                <div className="flex items-center mb-3">
                  <Calendar className="text-blue-600 mr-2" size={20} />
                  <h3 className="text-lg font-medium text-gray-800">
                    {i18n.language === 'fr' ? 'Jours Préférés' : 'Preferred Days'}
                  </h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`px-4 py-2 rounded-lg border ${
                        preferredDays.includes(index)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {t(`days.${day.toLowerCase()}`)}
                      {preferredDays.includes(index) && (
                        <Check size={16} className="inline-block ml-2 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
                
                <p className="mt-2 text-sm text-gray-500">
                  {i18n.language === 'fr' 
                    ? 'Sélectionnez les jours où l\'employé préfère travailler' 
                    : 'Select the days the employee prefers to work'}
                </p>
              </div>

              {/* Preferred Shift Types Section */}
              <div>
                <div className="flex items-center mb-3">
                  <Clock className="text-blue-600 mr-2" size={20} />
                  <h3 className="text-lg font-medium text-gray-800">
                    {i18n.language === 'fr' ? 'Services Préférés' : 'Preferred Shifts'}
                  </h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SHIFT_TYPES).map(([type, config]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleShiftType(type as ShiftType)}
                      className={`px-4 py-2 rounded-lg border ${
                        preferredShifts.includes(type as ShiftType)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {t(`shifts.${type}`)}
                      {preferredShifts.includes(type as ShiftType) && (
                        <Check size={16} className="inline-block ml-2 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
                
                <p className="mt-2 text-sm text-gray-500">
                  {i18n.language === 'fr' 
                    ? 'Sélectionnez les types de services que l\'employé préfère' 
                    : 'Select the types of shifts the employee prefers'}
                </p>
              </div>

              {/* Preferred Positions Section - Enhanced Multi-Select Dropdown */}
              <div>
                <div className="flex items-center mb-3">
                  <Briefcase className="text-blue-600 mr-2" size={20} />
                  <h3 className="text-lg font-medium text-gray-800">
                    {i18n.language === 'fr' ? 'Postes Préférés' : 'Preferred Positions'}
                  </h3>
                </div>
                
                {/* Multi-select dropdown */}
                <div className="relative">
                  <div 
                    className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white"
                    onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
                  >
                    <div className="flex flex-wrap gap-1">
                      {preferredPositions.length > 0 ? (
                        preferredPositions.map(position => (
                          <span 
                            key={position} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {t(`positions.${position.toLowerCase().replace(/[^a-z]/g, '')}`)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">
                          {i18n.language === 'fr' 
                            ? 'Sélectionnez les postes préférés...' 
                            : 'Select preferred positions...'}
                        </span>
                      )}
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-500 transition-transform ${isPositionDropdownOpen ? 'transform rotate-180' : ''}`} 
                    />
                  </div>
                  
                  {/* Dropdown menu */}
                  {isPositionDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="p-2">
                        {/* Group positions by category */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">
                            {i18n.language === 'fr' ? 'Cuisine' : 'Kitchen'}
                          </h4>
                          <div className="space-y-1">
                            {POSITIONS
                              .filter(pos => !['Operations Manager', 'Barman/Barmaid', 'Waiter(s)'].includes(pos))
                              .sort((a, b) => getPositionHierarchyLevel(a) - getPositionHierarchyLevel(b))
                              .map(position => (
                                <div 
                                  key={position}
                                  className={`flex items-center px-3 py-2 cursor-pointer rounded-md ${
                                    preferredPositions.includes(position) 
                                      ? 'bg-blue-50' 
                                      : 'hover:bg-gray-100'
                                  }`}
                                  onClick={() => togglePosition(position)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={preferredPositions.includes(position)}
                                    onChange={() => {}}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <label className="ml-2 block text-sm text-gray-900">
                                    {t(`positions.${position.toLowerCase().replace(/[^a-z]/g, '')}`)}
                                  </label>
                                  {/* Hierarchy indicator */}
                                  <div className="ml-auto flex items-center">
                                    <div 
                                      className="h-1.5 bg-gray-300 rounded-full"
                                      style={{ 
                                        width: `${Math.max(1, 5 - getPositionHierarchyLevel(position))}rem`,
                                        opacity: 0.5 + (0.5 * (1 - getPositionHierarchyLevel(position) / POSITIONS.length))
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">
                            {i18n.language === 'fr' ? 'Salle' : 'Front of House'}
                          </h4>
                          <div className="space-y-1">
                            {POSITIONS
                              .filter(pos => ['Operations Manager', 'Barman/Barmaid', 'Waiter(s)'].includes(pos))
                              .sort((a, b) => getPositionHierarchyLevel(a) - getPositionHierarchyLevel(b))
                              .map(position => (
                                <div 
                                  key={position}
                                  className={`flex items-center px-3 py-2 cursor-pointer rounded-md ${
                                    preferredPositions.includes(position) 
                                      ? 'bg-blue-50' 
                                      : 'hover:bg-gray-100'
                                  }`}
                                  onClick={() => togglePosition(position)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={preferredPositions.includes(position)}
                                    onChange={() => {}}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <label className="ml-2 block text-sm text-gray-900">
                                    {t(`positions.${position.toLowerCase().replace(/[^a-z]/g, '')}`)}
                                  </label>
                                  {/* Hierarchy indicator */}
                                  <div className="ml-auto flex items-center">
                                    <div 
                                      className="h-1.5 bg-gray-300 rounded-full"
                                      style={{ 
                                        width: `${Math.max(1, 5 - getPositionHierarchyLevel(position))}rem`,
                                        opacity: 0.5 + (0.5 * (1 - getPositionHierarchyLevel(position) / POSITIONS.length))
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 flex items-center">
                  <div className="mr-2 text-sm text-gray-500">
                    {i18n.language === 'fr' 
                      ? 'Poste actuel :' 
                      : 'Current position:'} 
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    {t(`positions.${employee.position.toLowerCase().replace(/[^a-z]/g, '')}`)}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-gray-500">
                  {i18n.language === 'fr' 
                    ? 'Sélectionnez les postes que l\'employé préfère occuper ou souhaite développer' 
                    : 'Select the positions the employee prefers to work in or wishes to develop'}
                </p>
              </div>

              {/* Preferred Hours Range Section */}
              <div>
                <div className="flex items-center mb-3">
                  <Clock className="text-blue-600 mr-2" size={20} />
                  <h3 className="text-lg font-medium text-gray-800">
                    {i18n.language === 'fr' ? 'Plage d\'Heures Préférée' : 'Preferred Hours Range'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="minHours" className="block text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'fr' ? 'Heures Minimales par Semaine' : 'Minimum Hours per Week'}
                    </label>
                    <input
                      type="number"
                      id="minHours"
                      value={minHours}
                      onChange={(e) => setMinHours(parseInt(e.target.value))}
                      min="0"
                      max="48"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="maxHours" className="block text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'fr' ? 'Heures Maximales par Semaine' : 'Maximum Hours per Week'}
                    </label>
                    <input
                      type="number"
                      id="maxHours"
                      value={maxHours}
                      onChange={(e) => setMaxHours(parseInt(e.target.value))}
                      min="0"
                      max="48"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {minHours > maxHours && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-start">
                    <AlertTriangle size={16} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      {i18n.language === 'fr' 
                        ? 'Les heures minimales ne peuvent pas dépasser les heures maximales' 
                        : 'Minimum hours cannot exceed maximum hours'}
                    </p>
                  </div>
                )}
                
                <p className="mt-2 text-sm text-gray-500">
                  {i18n.language === 'fr' 
                    ? 'Définissez la plage d\'heures hebdomadaires préférée par l\'employé' 
                    : 'Set the employee\'s preferred weekly hours range'}
                </p>
              </div>

              {/* Additional Notes Section */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'fr' ? 'Notes Additionnelles' : 'Additional Notes'}
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={i18n.language === 'fr' 
                    ? 'Ajoutez des notes sur les préférences spécifiques de l\'employé...' 
                    : 'Add notes about the employee\'s specific preferences...'}
                />
              </div>

              {/* Information Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info size={20} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      {i18n.language === 'fr' ? 'À propos des préférences' : 'About preferences'}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {i18n.language === 'fr' 
                        ? 'Les préférences sont utilisées comme guide lors de la création du planning. Le système vous alertera si vous planifiez un service qui ne correspond pas aux préférences de l\'employé, mais vous permettra tout de même de le faire si nécessaire.' 
                        : 'Preferences are used as a guide when creating the schedule. The system will alert you if you schedule a shift that doesn\'t match the employee\'s preferences, but will still allow you to do so if necessary.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading 
                  ? (i18n.language === 'fr' ? 'Enregistrement...' : 'Saving...') 
                  : (i18n.language === 'fr' ? 'Enregistrer les Préférences' : 'Save Preferences')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeePreferencesForm;
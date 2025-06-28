import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Repeat, Trash2, Plus, Info } from 'lucide-react';
import { 
  Employee, 
  EmployeeAvailability, 
  DAYS_OF_WEEK, 
  AVAILABILITY_TYPES, 
  RECURRENCE_TYPES, 
  AvailabilityType, 
  RecurrenceType 
} from '../../types';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface EmployeeAvailabilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  availabilities: EmployeeAvailability[];
  onSave: (employeeId: string, availability: Omit<EmployeeAvailability, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete: (availabilityId: string) => Promise<void>;
}

const EmployeeAvailabilityForm: React.FC<EmployeeAvailabilityFormProps> = ({
  isOpen,
  onClose,
  employee,
  availabilities,
  onSave,
  onDelete
}) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('view');
  
  // New availability state
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>('PREFERRED');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('WEEKLY');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [note, setNote] = useState<string>('');

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab('view');
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setAvailabilityType('PREFERRED');
    setRecurrenceType('WEEKLY');
    setDayOfWeek(1);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime('09:00');
    setEndTime('17:00');
    setNote('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (startTime >= endTime) {
        throw new Error(i18n.language === 'fr' 
          ? 'L\'heure de début doit être antérieure à l\'heure de fin' 
          : 'Start time must be before end time');
      }

      const availabilityData = {
        type: availabilityType,
        recurrence: recurrenceType,
        startTime,
        endTime,
        note: note || undefined,
        // Set either dayOfWeek or date based on recurrence type
        ...(recurrenceType === 'ONCE' 
          ? { date } 
          : { dayOfWeek })
      };

      await onSave(employee.id, availabilityData);
      
      toast.success(i18n.language === 'fr' 
        ? 'Disponibilité enregistrée avec succès' 
        : 'Availability saved successfully');
      
      resetForm();
      setActiveTab('view');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    if (confirm(i18n.language === 'fr' 
      ? 'Êtes-vous sûr de vouloir supprimer cette disponibilité ?' 
      : 'Are you sure you want to delete this availability?')) {
      
      setLoading(true);
      try {
        await onDelete(availabilityId);
        toast.success(i18n.language === 'fr' 
          ? 'Disponibilité supprimée avec succès' 
          : 'Availability deleted successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    }
  };

  // Get availability type color
  const getAvailabilityTypeColor = (type: AvailabilityType): string => {
    return AVAILABILITY_TYPES[type].color;
  };

  // Format day of week
  const formatDayOfWeek = (day: number): string => {
    return t(`days.${DAYS_OF_WEEK[day].toLowerCase()}`);
  };

  // Format recurrence type
  const formatRecurrenceType = (recurrence: RecurrenceType): string => {
    return i18n.language === 'fr' 
      ? RECURRENCE_TYPES[recurrence].labelFr 
      : RECURRENCE_TYPES[recurrence].label;
  };

  // Format availability type
  const formatAvailabilityType = (type: AvailabilityType): string => {
    return i18n.language === 'fr' 
      ? AVAILABILITY_TYPES[type].labelFr 
      : AVAILABILITY_TYPES[type].label;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {i18n.language === 'fr' 
                ? `Disponibilités de ${employee.firstName} ${employee.lastName}` 
                : `${employee.firstName} ${employee.lastName}'s Availability`}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('view')}
            >
              {i18n.language === 'fr' ? 'Disponibilités Existantes' : 'Existing Availabilities'}
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('add')}
            >
              {i18n.language === 'fr' ? 'Ajouter une Disponibilité' : 'Add Availability'}
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'view' ? (
              <div>
                {availabilities.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {i18n.language === 'fr' ? 'Aucune disponibilité' : 'No availabilities'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {i18n.language === 'fr' 
                        ? 'Commencez par ajouter une disponibilité pour cet employé.' 
                        : 'Start by adding an availability for this employee.'}
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setActiveTab('add')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus size={16} className="mr-2" />
                        {i18n.language === 'fr' ? 'Ajouter une Disponibilité' : 'Add Availability'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {i18n.language === 'fr' ? 'Disponibilités Existantes' : 'Existing Availabilities'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('add')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus size={16} className="mr-1" />
                        {i18n.language === 'fr' ? 'Ajouter' : 'Add'}
                      </button>
                    </div>
                    
                    {/* Group availabilities by recurrence type */}
                    <div className="space-y-6">
                      {/* Recurring availabilities */}
                      {availabilities.some(a => a.recurrence !== 'ONCE') && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {i18n.language === 'fr' ? 'Disponibilités Récurrentes' : 'Recurring Availabilities'}
                          </h4>
                          <div className="bg-white shadow overflow-hidden rounded-md">
                            <ul className="divide-y divide-gray-200">
                              {availabilities
                                .filter(a => a.recurrence !== 'ONCE')
                                .map(availability => (
                                  <li key={availability.id} className="px-4 py-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <div 
                                          className="w-3 h-3 rounded-full mr-3" 
                                          style={{ backgroundColor: getAvailabilityTypeColor(availability.type) }}
                                        ></div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {formatDayOfWeek(availability.dayOfWeek!)} • {availability.startTime} - {availability.endTime}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            {formatAvailabilityType(availability.type)} • {formatRecurrenceType(availability.recurrence)}
                                          </p>
                                          {availability.note && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              {availability.note}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAvailability(availability.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {/* One-time availabilities */}
                      {availabilities.some(a => a.recurrence === 'ONCE') && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {i18n.language === 'fr' ? 'Disponibilités Ponctuelles' : 'One-time Availabilities'}
                          </h4>
                          <div className="bg-white shadow overflow-hidden rounded-md">
                            <ul className="divide-y divide-gray-200">
                              {availabilities
                                .filter(a => a.recurrence === 'ONCE')
                                .sort((a, b) => a.date!.localeCompare(b.date!))
                                .map(availability => (
                                  <li key={availability.id} className="px-4 py-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <div 
                                          className="w-3 h-3 rounded-full mr-3" 
                                          style={{ backgroundColor: getAvailabilityTypeColor(availability.type) }}
                                        ></div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {format(new Date(availability.date!), 'dd/MM/yyyy')} • {availability.startTime} - {availability.endTime}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            {formatAvailabilityType(availability.type)}
                                          </p>
                                          {availability.note && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              {availability.note}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAvailability(availability.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Availability Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {i18n.language === 'fr' ? 'Type de Disponibilité' : 'Availability Type'}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(AVAILABILITY_TYPES).map(([type, config]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAvailabilityType(type as AvailabilityType)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                            availabilityType === type
                              ? `bg-${config.color.substring(1)} bg-opacity-10 border-${config.color.substring(1)} text-${config.color.substring(1)}`
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: availabilityType === type ? `${config.color}20` : '',
                            borderColor: availabilityType === type ? `${config.color}40` : '',
                            color: availabilityType === type ? config.color : ''
                          }}
                        >
                          {i18n.language === 'fr' ? config.labelFr : config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recurrence Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {i18n.language === 'fr' ? 'Type de Récurrence' : 'Recurrence Type'}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(RECURRENCE_TYPES).map(([type, config]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setRecurrenceType(type as RecurrenceType)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                            recurrenceType === type
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {i18n.language === 'fr' ? config.labelFr : config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Day Selection (for recurring) or Date (for one-time) */}
                  {recurrenceType === 'ONCE' ? (
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                        {i18n.language === 'fr' ? 'Date' : 'Date'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {i18n.language === 'fr' ? 'Jour de la Semaine' : 'Day of Week'}
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setDayOfWeek(index)}
                            className={`py-2 rounded-lg border text-sm font-medium ${
                              dayOfWeek === index
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {t(`days.${day.toLowerCase()}`).substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                        {i18n.language === 'fr' ? 'Heure de Début' : 'Start Time'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="time"
                          id="startTime"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                        {i18n.language === 'fr' ? 'Heure de Fin' : 'End Time'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="time"
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                      {i18n.language === 'fr' ? 'Note (optionnel)' : 'Note (optional)'}
                    </label>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder={i18n.language === 'fr' 
                        ? 'Ajoutez des détails sur cette disponibilité...' 
                        : 'Add details about this availability...'}
                    />
                  </div>

                  {/* Information Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <Info size={20} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1">
                          {i18n.language === 'fr' ? 'À propos des disponibilités' : 'About availabilities'}
                        </h4>
                        <p className="text-sm text-blue-700">
                          {i18n.language === 'fr' 
                            ? 'Les disponibilités sont utilisées pour indiquer quand un employé peut ou ne peut pas travailler. Le système vous alertera si vous planifiez un service pendant une période d\'indisponibilité.' 
                            : 'Availabilities are used to indicate when an employee can or cannot work. The system will alert you if you schedule a shift during an unavailable period.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('view')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {i18n.language === 'fr' ? 'Retour' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading 
                      ? (i18n.language === 'fr' ? 'Enregistrement...' : 'Saving...') 
                      : (i18n.language === 'fr' ? 'Enregistrer la Disponibilité' : 'Save Availability')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAvailabilityForm;
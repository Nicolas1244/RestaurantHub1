import React, { useState } from 'react';
import { Users, UserPlus, Database, Heart, Calendar } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Employee, EmployeePreference, EmployeeAvailability } from '../../types';
import EmployeeList from '../employees/EmployeeList';
import EmployeeForm from '../employees/EmployeeForm';
import ComprehensiveDirectory from '../employees/ComprehensiveDirectory';
import EmployeePreferencesForm from '../employees/EmployeePreferencesForm';
import EmployeeAvailabilityForm from '../employees/EmployeeAvailabilityForm'; 
import DocumentManager from '../hr/DocumentManager';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

type StaffView = 'list' | 'directory';

const StaffPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentRestaurant,
    getRestaurantEmployees,
    addEmployee,
    updateEmployee,
    addEmployeePreference,
    updateEmployeePreference,
    addEmployeeAvailability,
    deleteEmployeeAvailability,
    getEmployeePreferences,
    getEmployeeAvailabilities
  } = useAppContext();
  
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
  const [currentView, setCurrentView] = useState<StaffView>('list');

  const employees = currentRestaurant 
    ? getRestaurantEmployees(currentRestaurant.id)
    : [];

  const handleAddEmployee = () => {
    setSelectedEmployee(undefined);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleManagePreferences = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowPreferencesForm(true);
  };

  const handleManageAvailability = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAvailabilityForm(true);
  };

  const handleManageDocuments = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDocumentsModal(true);
  };

  // CRITICAL FIX: Remove duplicate toast notifications - let AppContext handle them
  const handleSaveEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      await addEmployee(employeeData);
      setShowEmployeeForm(false);
      // REMOVED: Duplicate toast notification - AppContext already shows success message
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error instanceof Error ? error.message : t('staff.employeeSaveFailed'));
    }
  };

  // CRITICAL FIX: Remove duplicate toast notifications - let AppContext handle them
  const handleUpdateEmployee = async (employee: Employee) => {
    try {
      await updateEmployee(employee);
      setShowEmployeeForm(false);
      // REMOVED: Duplicate toast notification - AppContext already shows success message
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error instanceof Error ? error.message : t('staff.employeeSaveFailed'));
    }
  };

  // Handle saving employee preferences
  const handleSavePreferences = async (
    employeeId: string, 
    preferences: Omit<EmployeePreference, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const existingPreferences = getEmployeePreferences(employeeId);
      
      if (existingPreferences) {
        await updateEmployeePreference({
          ...preferences,
          id: existingPreferences.id,
          employeeId,
          createdAt: existingPreferences.createdAt,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addEmployeePreference({
          ...preferences,
          employeeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error saving employee preferences:', error);
      throw error;
    }
  };

  // Handle saving employee availability
  const handleSaveAvailability = async (
    employeeId: string, 
    availability: Omit<EmployeeAvailability, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await addEmployeeAvailability({
        ...availability,
        employeeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving employee availability:', error);
      throw error;
    }
  };

  // Handle deleting employee availability
  const handleDeleteAvailability = async (availabilityId: string) => {
    try {
      await deleteEmployeeAvailability(availabilityId);
    } catch (error) {
      console.error('Error deleting employee availability:', error);
      throw error;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{t('staff.management')}</h2>
            <p className="text-gray-500">
              {currentRestaurant ? `${currentRestaurant.name} - ${currentRestaurant.location}` : t('staff.selectRestaurantPrompt')}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleAddEmployee}
              className="flex items-center px-4 py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            >
              <UserPlus size={18} className="mr-1" />
              {t('staff.addEmployee')}
            </button>
          </div>
        </div>
      </div>
      
      {/* View Selector Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setCurrentView('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                Liste du Personnel
              </div>
            </button>
            
            <button
              onClick={() => setCurrentView('directory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'directory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Database size={16} className="mr-2" />
                Répertoire Complet
              </div>
            </button>
          </nav>
        </div>
      </div>

      {currentView === 'list' && (
        <EmployeeList
          employees={employees}
          restaurantName={currentRestaurant?.name || t('restaurants.defaultName')}
          onAddEmployee={handleAddEmployee}
          onEditEmployee={handleEditEmployee}
          onManagePreferences={handleManagePreferences}
          onManageAvailability={handleManageAvailability}
          onManageDocuments={handleManageDocuments}
        />
      )}
      
      {currentView === 'directory' && (
        <ComprehensiveDirectory
          employees={employees}
          restaurantName={currentRestaurant?.name || t('restaurants.defaultName')}
        />
      )}

      {showEmployeeForm && (
        <EmployeeForm
          isOpen={showEmployeeForm}
          onClose={() => setShowEmployeeForm(false)}
          employee={selectedEmployee}
          onSave={handleSaveEmployee}
          onUpdate={handleUpdateEmployee}
          restaurantId={currentRestaurant?.id || ''}
        />
      )}

      {showPreferencesForm && selectedEmployee && (
        <EmployeePreferencesForm
          isOpen={showPreferencesForm}
          onClose={() => setShowPreferencesForm(false)}
          employee={selectedEmployee}
          onSave={handleSavePreferences}
        />
      )}

      {showAvailabilityForm && selectedEmployee && (
        <EmployeeAvailabilityForm
          isOpen={showAvailabilityForm}
          onClose={() => setShowAvailabilityForm(false)}
          employee={selectedEmployee}
          availabilities={getEmployeeAvailabilities(selectedEmployee.id)}
          onSave={handleSaveAvailability}
          onDelete={handleDeleteAvailability}
        />
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowDocumentsModal(false)} />
            
            <div className="relative w-full max-w-5xl rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('documents.title')} - {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h2>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <DocumentManager employeeId={selectedEmployee.id} />
              </div>
              
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
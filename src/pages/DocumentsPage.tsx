import React, { useState } from 'react';
import { FileText, Search, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import DocumentManager from '../components/hr/DocumentManager';

const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentRestaurant } = useAppContext();
  const { isManager } = useAuth();
  
  // State for employee filter
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | 'all'>('all');
  
  // Get employees
  const employees = currentRestaurant ? useAppContext().getRestaurantEmployees(currentRestaurant.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-600" size={28} />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {t('documents.management')}
            </h2>
            <p className="text-gray-500">
              {currentRestaurant 
                ? `${currentRestaurant.name} - ${currentRestaurant.location}` 
                : t('common.selectRestaurantPrompt')}
            </p>
          </div>
        </div>
      </div>

      {currentRestaurant ? (
        <div className="space-y-6">
          {/* Employee filter - only show if user is a manager */}
          {isManager() && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Filter className="text-gray-600" size={20} />
                <h3 className="text-lg font-medium text-gray-800">
                  {t('documents.filterByEmployee')}
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedEmployeeId('all')}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    selectedEmployeeId === 'all'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {t('documents.allEmployees')}
                </button>
                
                {employees.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedEmployeeId(employee.id)}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      selectedEmployeeId === employee.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {employee.firstName} {employee.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Document Manager */}
          <DocumentManager 
            employeeId={selectedEmployeeId === 'all' ? undefined : selectedEmployeeId}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('documents.title')}
          </h3>
          <p className="text-gray-500 mb-4">
            {t('common.selectRestaurantPrompt')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
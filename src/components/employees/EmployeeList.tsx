import React, { useState, useMemo } from 'react';
import { Users, FileText, Search, Filter, Heart, Calendar, Edit, Trash2, File } from 'lucide-react';
import { Employee, POSITIONS, EMPLOYEE_CATEGORIES } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { pdf } from '@react-pdf/renderer';
import StaffRegister from './StaffRegister';
import PersonnelListPDF from './PersonnelListPDF';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import toast from 'react-hot-toast';

interface EmployeeListProps {
  employees: Employee[];
  restaurantName: string;
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onManagePreferences: (employee: Employee) => void;
  onManageAvailability: (employee: Employee) => void; 
  onManageDocuments: (employee: Employee) => void;
}

// CRITICAL: Employee status type for filtering
type EmployeeStatus = 'all' | 'active' | 'inactive';

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  restaurantName,
  onAddEmployee,
  onEditEmployee,
  onManagePreferences,
  onManageAvailability,
  onManageDocuments
}) => {
  const { t, i18n } = useTranslation();
  const { currentRestaurant } = useAppContext();

  // CRITICAL: Enhanced state for filtering and sorting with STATUS FILTER
  const [nameFilter, setNameFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState<string[]>([]);
  const [contractTypeFilter, setContractTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus>('active'); // CRITICAL: Default to "Actif(s)"
  const [showFilters, setShowFilters] = useState(false);

  // CRITICAL: Function to determine if employee is currently active
  const isEmployeeActive = (employee: Employee): boolean => {
    const today = new Date();
    const startDate = new Date(employee.startDate);
    const endDate = employee.endDate ? new Date(employee.endDate) : null;

    // Employee is active if:
    // 1. Start date is on or before today AND
    // 2. End date is either null (CDI) OR is in the future (after today)
    const hasStarted = startDate <= today;
    const hasNotEnded = !endDate || endDate > today;

    return hasStarted && hasNotEnded;
  };

  // CRITICAL: Enhanced PDF generation for Personnel Register
  const handleGeneratePersonnelRegister = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading(
        i18n.language === 'fr' 
          ? 'Génération du registre du personnel...' 
          : 'Generating personnel register...'
      );
      
      const blob = await pdf(
        <StaffRegister 
          employees={filteredAndSortedEmployees} 
          restaurantName={restaurantName}
          restaurantLogo={currentRestaurant?.image}
        />
      ).toBlob();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Create object URL and open in new tab for preview
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        // Success toast
        toast.success(
          i18n.language === 'fr' 
            ? 'Registre du personnel généré avec succès' 
            : 'Personnel register generated successfully'
        );
        
        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        // Fallback: trigger download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = `${
          i18n.language === 'fr' 
            ? 'registre-personnel' 
            : 'personnel-register'
        }-${restaurantName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(
          i18n.language === 'fr' 
            ? 'Téléchargement du registre du personnel démarré' 
            : 'Personnel register download started'
        );
      }
    } catch (error) {
      console.error('Failed to generate personnel register PDF:', error);
      toast.error(
        i18n.language === 'fr' 
          ? 'Échec de la génération du registre du personnel' 
          : 'Failed to generate personnel register'
      );
    }
  };

  // CRITICAL: NEW - Enhanced PDF export for filtered personnel list
  const handleExportPersonnelListPDF = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading(
        i18n.language === 'fr' 
          ? 'Génération de la liste du personnel...' 
          : 'Generating personnel list...'
      );
      
      const blob = await pdf(
        <PersonnelListPDF 
          employees={filteredAndSortedEmployees}
          restaurant={currentRestaurant!}
          filters={{
            nameFilter,
            positionFilter,
            contractTypeFilter,
            statusFilter
          }}
        />
      ).toBlob();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Create object URL and open in new tab for preview
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        // Success toast
        toast.success(
          i18n.language === 'fr' 
            ? 'Liste du personnel exportée avec succès' 
            : 'Personnel list exported successfully'
        );
        
        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        // Fallback: trigger download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename based on filters
        let filename = `${
          i18n.language === 'fr' 
            ? 'liste-personnel' 
            : 'personnel-list'
        }-${restaurantName.replace(/\s+/g, '-').toLowerCase()}`;
        if (statusFilter !== 'all') {
          filename += `-${statusFilter}`;
        }
        if (positionFilter.length > 0) {
          filename += `-${positionFilter.join('-').toLowerCase()}`;
        }
        filename += '.pdf';
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(
          i18n.language === 'fr' 
            ? 'Téléchargement de la liste du personnel démarré' 
            : 'Personnel list download started'
        );
      }
    } catch (error) {
      console.error('Failed to export personnel list PDF:', error);
      toast.error(
        i18n.language === 'fr' 
          ? 'Échec de l\'exportation de la liste du personnel' 
          : 'Failed to export personnel list'
      );
    }
  };

  // Helper function to format dates according to selected language
  const formatContractDate = (dateString: string): string => {
    const date = new Date(dateString);
    
    if (i18n.language === 'fr') {
      // French format: "17 Juin 2025" with proper capitalization
      const formattedDate = format(date, 'd MMMM yyyy', { locale: fr });
      return formattedDate.replace(/\b\w/g, (char) => char.toUpperCase());
    } else {
      // English format: "Jun 17, 2025"
      return format(date, 'MMM d, yyyy');
    }
  };

  // Helper function to format contract period (start date and optional end date)
  const formatContractPeriod = (startDate: string, endDate: string | null): string => {
    const formattedStart = formatContractDate(startDate);
    
    if (endDate) {
      const formattedEnd = formatContractDate(endDate);
      return `${formattedStart} - ${formattedEnd}`;
    }
    
    return formattedStart;
  };

  // CRITICAL: Enhanced filter and sort employees with STATUS FILTER - DEFAULT SORTING BY LAST NAME
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter(employee => {
      // Name filter (case-insensitive, searches both first and last name)
      const nameMatch = nameFilter === '' || 
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(nameFilter.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(nameFilter.toLowerCase());

      // Position filter
      const positionMatch = positionFilter.length === 0 || 
        positionFilter.includes(employee.position);

      // Contract type filter
      const contractMatch = contractTypeFilter.length === 0 || 
        contractTypeFilter.includes(employee.contractType);

      // CRITICAL: Status filter - Active/Inactive
      let statusMatch = true;
      if (statusFilter === 'active') {
        statusMatch = isEmployeeActive(employee);
      } else if (statusFilter === 'inactive') {
        statusMatch = !isEmployeeActive(employee);
      }
      // If statusFilter === 'all', statusMatch remains true

      return nameMatch && positionMatch && contractMatch && statusMatch;
    });

    // CRITICAL: Default sorting by last name (ascending), then by first name
    filtered.sort((a, b) => {
      const lastNameComparison = a.lastName.localeCompare(b.lastName);
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }
      // If last names are the same, sort by first name
      return a.firstName.localeCompare(b.firstName);
    });

    return filtered;
  }, [employees, nameFilter, positionFilter, contractTypeFilter, statusFilter]);

  // Handle position filter changes
  const handlePositionFilterChange = (position: string) => {
    setPositionFilter(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  // Handle contract type filter changes
  const handleContractTypeFilterChange = (contractType: string) => {
    setContractTypeFilter(prev => 
      prev.includes(contractType) 
        ? prev.filter(c => c !== contractType)
        : [...prev, contractType]
    );
  };

  // CRITICAL: Handle status filter changes
  const handleStatusFilterChange = (status: EmployeeStatus) => {
    setStatusFilter(status);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setNameFilter('');
    setPositionFilter([]);
    setContractTypeFilter([]);
    setStatusFilter('active'); // CRITICAL: Reset to default "Actif(s)"
  };

  // Get unique positions from employees
  const availablePositions = useMemo(() => {
    const positions = [...new Set(employees.map(emp => emp.position))];
    return positions.sort();
  }, [employees]);

  // Get unique contract types from employees
  const availableContractTypes = useMemo(() => {
    const contractTypes = [...new Set(employees.map(emp => emp.contractType))];
    return contractTypes.sort();
  }, [employees]);

  // CRITICAL: Calculate status counts for display
  const statusCounts = useMemo(() => {
    const active = employees.filter(emp => isEmployeeActive(emp)).length;
    const inactive = employees.filter(emp => !isEmployeeActive(emp)).length;
    return { active, inactive, total: employees.length };
  }, [employees]);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">{t('staff.staffList')}</h2>
            <span className="text-sm text-gray-500">
              ({filteredAndSortedEmployees.length} {
                i18n.language === 'fr' 
                  ? (filteredAndSortedEmployees.length === 1 ? 'employé' : 'employés')
                  : (filteredAndSortedEmployees.length === 1 ? 'employee' : 'employees')
              })
            </span>
          </div>
          
          {/* CRITICAL: Redesigned button section with ENGLISH translations */}
          <div className="flex gap-3">
            {/* CRITICAL: Export Personnel List PDF Button - ENGLISH translation */}
            <button
              onClick={handleExportPersonnelListPDF}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              title={i18n.language === 'fr' ? 'Exporter la liste filtrée en PDF' : 'Export filtered list to PDF'}
            >
              <FileText size={18} className="mr-2" />
              {i18n.language === 'fr' ? 'Exporter PDF' : 'Export PDF'}
            </button>

            {/* CRITICAL: Generate Personnel Register Button - ENGLISH translation */}
            <button
              onClick={handleGeneratePersonnelRegister}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              title={i18n.language === 'fr' ? 'Générer le registre du personnel officiel' : 'Generate official personnel register'}
            >
              <FileText size={18} className="mr-2" />
              {i18n.language === 'fr' ? 'Registre du Personnel' : 'Personnel Register'}
            </button>
          </div>
        </div>

        {/* CRITICAL: Enhanced Filtering Controls with STATUS FILTER */}
        <div className="space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex items-center gap-4">
            {/* Name Filter */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={i18n.language === 'fr' ? 'Rechercher par nom...' : 'Search by name...'}
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* CRITICAL: Status Filter Buttons - Localized labels */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleStatusFilterChange('active')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i18n.language === 'fr' ? `Actif(s) (${statusCounts.active})` : `Active (${statusCounts.active})`}
              </button>
              <button
                onClick={() => handleStatusFilterChange('inactive')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i18n.language === 'fr' ? `Inactif(s) (${statusCounts.inactive})` : `Inactive (${statusCounts.inactive})`}
              </button>
              <button
                onClick={() => handleStatusFilterChange('all')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i18n.language === 'fr' ? `Tous (${statusCounts.total})` : `All (${statusCounts.total})`}
              </button>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                showFilters || positionFilter.length > 0 || contractTypeFilter.length > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} className="mr-2" />
              {i18n.language === 'fr' ? 'Filtres' : 'Filters'}
              {(positionFilter.length > 0 || contractTypeFilter.length > 0) && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                  {positionFilter.length + contractTypeFilter.length}
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {(nameFilter || positionFilter.length > 0 || contractTypeFilter.length > 0 || statusFilter !== 'active') && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {i18n.language === 'fr' ? 'Effacer tout' : 'Clear all'}
              </button>
            )}
          </div>

          {/* CRITICAL: Advanced Filters Panel */}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Position Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Filtrer par Poste' : 'Filter by Position'}
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availablePositions.map(position => (
                      <label key={position} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={positionFilter.includes(position)}
                          onChange={() => handlePositionFilterChange(position)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {/* CRITICAL FIX: Check if position is in predefined list before translating */}
                          {POSITIONS.includes(position) 
                            ? t(`positions.${position.toLowerCase().replace(/[^a-z]/g, '')}`)
                            : position /* Display custom positions directly */}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Contract Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Filtrer par Type de Contrat' : 'Filter by Contract Type'}
                  </label>
                  <div className="space-y-2">
                    {availableContractTypes.map(contractType => (
                      <label key={contractType} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={contractTypeFilter.includes(contractType)}
                          onChange={() => handleContractTypeFilterChange(contractType)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {t(`contractTypes.${contractType.toLowerCase()}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <strong>{t('staff.name')}</strong>
                <span className="ml-1 text-blue-600">↑</span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <strong>{t('staff.position')}</strong>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <strong>{t('staff.contractType')}</strong>
              </th>
              {/* CRITICAL: Add Status column header */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <strong>{i18n.language === 'fr' ? 'Statut' : 'Status'}</strong>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <strong>{t('staff.contractPeriod')}</strong>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <strong>{t('staff.contact')}</strong>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <strong>Préférences</strong>
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  {nameFilter || positionFilter.length > 0 || contractTypeFilter.length > 0 || statusFilter !== 'all'
                    ? (i18n.language === 'fr' 
                        ? 'Aucun employé ne correspond aux critères de recherche.'
                        : 'No employees match the search criteria.')
                    : (i18n.language === 'fr' 
                        ? 'Aucun employé trouvé.'
                        : 'No employees found.')
                  }
                </td>
              </tr>
            ) : (
              filteredAndSortedEmployees.map((employee) => {
                const isActive = isEmployeeActive(employee);
                const hasPreferences = !!employee.preferences;
                const hasAvailabilities = employee.availabilities && employee.availabilities.length > 0;
                const hasDocuments = true; // For demo purposes, assume all employees have documents
                
                return (
                  <tr 
                    key={employee.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      !isActive ? 'bg-gray-50 opacity-75' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white overflow-hidden">
                          {employee.profilePicture ? (
                            <img 
                              src={employee.profilePicture} 
                              alt={`${employee.firstName} ${employee.lastName}`} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                            {employee.firstName} {employee.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {/* CRITICAL FIX: Check if position is in predefined list before translating */}
                        {POSITIONS.includes(employee.position) 
                          ? t(`positions.${employee.position.toLowerCase().replace(/[^a-z]/g, '')}`)
                          : employee.position /* Display custom positions directly */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.contractType === 'CDI'
                          ? 'bg-green-100 text-green-800'
                          : employee.contractType === 'CDD'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t(`contractTypes.${employee.contractType.toLowerCase()}`)}
                      </span>
                    </td>
                    {/* CRITICAL: Status column with visual indicators */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isActive 
                          ? (i18n.language === 'fr' ? 'Actif' : 'Active')
                          : (i18n.language === 'fr' ? 'Inactif' : 'Inactive')
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatContractPeriod(employee.startDate, employee.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onManagePreferences(employee)} 
                          className={`p-1 rounded-full ${hasPreferences ? 'text-purple-600 bg-purple-100' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                          title={i18n.language === 'fr' ? 'Gérer les préférences' : 'Manage preferences'}
                        >
                          <Heart size={16} />
                        </button>
                        <button
                          onClick={() => onManageAvailability(employee)}
                          className={`p-1 rounded-full ${hasAvailabilities ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                          title={i18n.language === 'fr' ? 'Gérer les disponibilités' : 'Manage availability'}
                        >
                          <Calendar size={16} />
                        </button>
                        <button
                          onClick={() => onManageDocuments(employee)}
                          className={`p-1 rounded-full ${hasDocuments ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                          title={i18n.language === 'fr' ? 'Gérer les documents' : 'Manage documents'}
                        >
                          <File size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('common.edit')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeList;
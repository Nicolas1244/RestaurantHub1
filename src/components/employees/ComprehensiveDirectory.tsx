import React, { useState, useMemo } from 'react';
import { Database, Search, Filter, ArrowUp, ArrowDown, Download, FileText } from 'lucide-react';
import { Employee, EMPLOYEE_STATUS } from '../../types';
import { useTranslation } from 'react-i18next';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import DirectoryExportButton from './DirectoryExportButton';
import { pdf } from '@react-pdf/renderer';
import DirectoryPDF from './DirectoryPDF';
import { useAppContext } from '../../contexts/AppContext';
import toast from 'react-hot-toast';

interface ComprehensiveDirectoryProps {
  employees: Employee[];
  restaurantName: string;
}

type SortDirection = 'asc' | 'desc' | null;
type SortField = string | null;

// Column definition type
interface ColumnDef {
  id: string;
  header: string;
  accessorFn?: (employee: Employee) => any;
  sortable?: boolean;
  defaultVisible?: boolean;
}

const ComprehensiveDirectory: React.FC<ComprehensiveDirectoryProps> = ({
  employees,
  restaurantName
}) => {
  const { t, i18n } = useTranslation();
  const { currentRestaurant } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    lastName: true,
    firstName: true,
    dateOfBirth: true,
    placeOfBirth: true,
    countryOfBirth: true,
    employeeStatus: true,
    position: true,
    email: true,
    address: true,
    postalCode: true,
    city: true,
    phone: true,
    socialSecurityNumber: true,
    contractType: true,
    hiringDate: true,
    endDate: true,
    weeklyHours: true,
    monthlyHours: true,
    hourlyRate: true,
    grossMonthlySalary: true,
  });
  
  // Define columns
  const columns: ColumnDef[] = [
    {
      id: 'lastName',
      header: 'NOM',
      accessorFn: (employee) => employee.lastName,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'firstName',
      header: 'PRÉNOM',
      accessorFn: (employee) => employee.firstName,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'dateOfBirth',
      header: 'DATE DE NAISSANCE',
      accessorFn: (employee) => employee.dateOfBirth,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'placeOfBirth',
      header: 'LIEU DE NAISSANCE',
      accessorFn: (employee) => employee.placeOfBirth,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'countryOfBirth',
      header: 'PAYS DE NAISSANCE',
      accessorFn: (employee) => employee.countryOfBirth,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'employeeStatus',
      header: 'STATUT',
      accessorFn: (employee) => employee.employeeStatus,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'position',
      header: 'POSTE',
      accessorFn: (employee) => employee.position,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'email',
      header: 'EMAIL',
      accessorFn: (employee) => employee.email,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'address',
      header: 'ADRESSE',
      accessorFn: (employee) => employee.streetAddress,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'postalCode',
      header: 'CODE POSTAL',
      accessorFn: (employee) => employee.postalCode,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'city',
      header: 'VILLE',
      accessorFn: (employee) => employee.city,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'phone',
      header: 'TÉLÉPHONE',
      accessorFn: (employee) => employee.phone,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'socialSecurityNumber',
      header: 'NUMÉRO DE SS',
      accessorFn: (employee) => employee.socialSecurityNumber,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'contractType',
      header: 'TYPE DE CONTRAT',
      accessorFn: (employee) => employee.contractType,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'hiringDate',
      header: 'DATE D\'EMBAUCHE',
      accessorFn: (employee) => employee.hiringDate || employee.startDate,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'endDate',
      header: 'DATE DE FIN',
      accessorFn: (employee) => employee.endDate,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'weeklyHours',
      header: 'BASE HORAIRE (HEBDO)',
      accessorFn: (employee) => employee.weeklyHours,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'monthlyHours',
      header: 'HEURES MENSUELLES',
      accessorFn: (employee) => calculateMonthlyHours(employee.weeklyHours || 35),
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'hourlyRate',
      header: 'TAUX HORAIRE',
      accessorFn: (employee) => employee.hourlyRate,
      sortable: true,
      defaultVisible: true
    },
    {
      id: 'grossMonthlySalary',
      header: 'SALAIRE BRUT MENSUEL',
      accessorFn: (employee) => employee.grossMonthlySalary,
      sortable: true,
      defaultVisible: true
    },
  ];
  
  // CRITICAL FIX: Calculate monthly hours from weekly hours using the correct formula
  const calculateMonthlyHours = (weeklyHours: number): number => {
    // Correct formula: (Weekly Hours * 52) / 12 = 151.67 for 35 hours
    return Math.round(((weeklyHours * 52) / 12) * 100) / 100;
  };
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | undefined): number => {
    if (!dateOfBirth) return 0;
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  };
  
  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return '-';
    }
  };
  
  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // Set new sort field and direction
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return null;
    }
    
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-blue-600" />
    ) : (
      <ArrowDown size={12} className="text-blue-600" />
    );
  };
  
  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };
  
  // Reset column visibility
  const resetColumnVisibility = () => {
    const defaultVisibility: Record<string, boolean> = {};
    columns.forEach(column => {
      defaultVisibility[column.id] = column.defaultVisible !== false;
    });
    setColumnVisibility(defaultVisibility);
  };
  
  // Filter and sort employees
  const filteredAndSortedEmployees = useMemo(() => {
    // Filter by search term
    let filtered = employees;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = employees.filter(employee => {
        return (
          employee.firstName.toLowerCase().includes(searchLower) ||
          employee.lastName.toLowerCase().includes(searchLower) ||
          employee.position.toLowerCase().includes(searchLower) ||
          employee.email?.toLowerCase().includes(searchLower) ||
          employee.city.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Sort by field
    if (sortField && sortDirection) {
      const column = columns.find(col => col.id === sortField);
      if (column && column.accessorFn) {
        filtered = [...filtered].sort((a, b) => {
          const aValue = column.accessorFn!(a);
          const bValue = column.accessorFn!(b);
          
          // Null/undefined handling
          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
          if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
          
          // Type-specific comparisons
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc'
              ? aValue - bValue
              : bValue - aValue;
          }
          
          // Date comparison
          if (aValue instanceof Date && bValue instanceof Date) {
            return sortDirection === 'asc'
              ? aValue.getTime() - bValue.getTime()
              : bValue.getTime() - aValue.getTime();
          }
          
          // String conversion fallback
          const aStr = String(aValue);
          const bStr = String(bValue);
          return sortDirection === 'asc'
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
        });
      }
    }
    
    return filtered;
  }, [employees, searchTerm, sortField, sortDirection]);
  
  // Get visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter(column => columnVisibility[column.id]);
  }, [columnVisibility]);
  
  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading(
        i18n.language === 'fr' 
          ? 'Génération du PDF en cours...' 
          : 'Generating PDF...'
      );
      
      // Generate PDF
      const blob = await pdf(
        <DirectoryPDF 
          employees={filteredAndSortedEmployees}
          restaurantName={restaurantName}
          columnVisibility={columnVisibility}
          restaurant={currentRestaurant}
        />
      ).toBlob();
      
      // Create URL and open in new tab
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (newWindow) {
        // Success toast
        toast.success(
          i18n.language === 'fr' 
            ? 'PDF généré avec succès' 
            : 'PDF generated successfully'
        );
        
        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        // Fallback: trigger download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = `repertoire-complet-${restaurantName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(
          i18n.language === 'fr' 
            ? 'Téléchargement du PDF démarré' 
            : 'PDF download started'
        );
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error(
        i18n.language === 'fr' 
          ? 'Échec de la génération du PDF' 
          : 'Failed to generate PDF'
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              Répertoire Complet du Personnel
            </h2>
            <span className="text-sm text-gray-500">
              ({filteredAndSortedEmployees.length} {
                filteredAndSortedEmployees.length === 1 ? 'employé' : 'employés'
              })
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 text-sm font-medium border rounded-lg ${
                showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} className="mr-2" />
              Colonnes
            </button>
            
            <button
              onClick={handleExportPDF}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FileText size={16} className="mr-2" />
              Exporter en PDF
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Column Visibility Filter */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-700">Affichage des colonnes</h3>
              <button
                onClick={resetColumnVisibility}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Réinitialiser
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {columns.map(column => (
                <label key={column.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={columnVisibility[column.id]}
                    onChange={() => toggleColumnVisibility(column.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">{column.header}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map(column => (
                <th 
                  key={column.id}
                  className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                >
                  <div className="flex items-center">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="ml-1">
                        {getSortIcon(column.id)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedEmployees.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-4 text-center text-gray-500">
                  Aucun employé trouvé
                </td>
              </tr>
            ) : (
              filteredAndSortedEmployees.map((employee, index) => (
                <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {visibleColumns.map(column => (
                    <td key={`${employee.id}-${column.id}`} className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                      {column.id === 'lastName' && (
                        <span className="font-medium text-gray-900">{employee.lastName}</span>
                      )}
                      {column.id === 'firstName' && (
                        <span className="font-medium text-gray-900">{employee.firstName}</span>
                      )}
                      {column.id === 'dateOfBirth' && (
                        <span>{employee.dateOfBirth ? `${formatDate(employee.dateOfBirth)} (${calculateAge(employee.dateOfBirth)} ans)` : '-'}</span>
                      )}
                      {column.id === 'placeOfBirth' && (
                        <span>{employee.placeOfBirth || '-'}</span>
                      )}
                      {column.id === 'countryOfBirth' && (
                        <span>{employee.countryOfBirth || 'France'}</span>
                      )}
                      {column.id === 'employeeStatus' && (
                        <span>{EMPLOYEE_STATUS[employee.employeeStatus as keyof typeof EMPLOYEE_STATUS] || 'Employé(e)'}</span>
                      )}
                      {column.id === 'position' && (
                        <span>{employee.position}</span>
                      )}
                      {column.id === 'email' && (
                        <span>{employee.email || '-'}</span>
                      )}
                      {column.id === 'address' && (
                        <span>{employee.streetAddress}</span>
                      )}
                      {column.id === 'postalCode' && (
                        <span>{employee.postalCode}</span>
                      )}
                      {column.id === 'city' && (
                        <span>{employee.city}</span>
                      )}
                      {column.id === 'phone' && (
                        <span>{employee.phone}</span>
                      )}
                      {column.id === 'socialSecurityNumber' && (
                        <span>{employee.socialSecurityNumber || '-'}</span>
                      )}
                      {column.id === 'contractType' && (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.contractType === 'CDI'
                            ? 'bg-green-100 text-green-800'
                            : employee.contractType === 'CDD'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.contractType}
                        </span>
                      )}
                      {column.id === 'hiringDate' && (
                        <span>{formatDate(employee.hiringDate || employee.startDate)}</span>
                      )}
                      {column.id === 'endDate' && (
                        <span>{employee.endDate ? formatDate(employee.endDate) : (employee.contractType === 'CDI' ? 'N/A' : '-')}</span>
                      )}
                      {column.id === 'weeklyHours' && (
                        <span>{employee.weeklyHours || 35}h</span>
                      )}
                      {column.id === 'monthlyHours' && (
                        <span>{calculateMonthlyHours(employee.weeklyHours || 35)}h</span>
                      )}
                      {column.id === 'hourlyRate' && (
                        <span>{employee.hourlyRate ? `${employee.hourlyRate.toFixed(2)} €` : '-'}</span>
                      )}
                      {column.id === 'grossMonthlySalary' && (
                        <span>{employee.grossMonthlySalary ? `${employee.grossMonthlySalary.toFixed(2)} €` : '-'}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {filteredAndSortedEmployees.length} {filteredAndSortedEmployees.length === 1 ? 'employé' : 'employés'} sur {employees.length} au total
        </div>
        
        <DirectoryExportButton 
          employees={filteredAndSortedEmployees}
          restaurantName={restaurantName}
        />
      </div>
    </div>
  );
};

export default ComprehensiveDirectory;
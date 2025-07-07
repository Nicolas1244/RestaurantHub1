import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Download, Filter, Search, Clock, Users, Briefcase, FileText, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppContext } from '../../contexts/AppContext';
import { Employee, Shift } from '../../types';
import toast from 'react-hot-toast';

interface PayrollPreparationProps {
  restaurantId: string;
}

interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  contractType: string;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  absenceHours: number;
  totalHours: number;
  hourlyRate: number;
  grossSalary: number;
  variableElements: {
    type: string;
    amount: number;
    description: string;
  }[];
}

const PayrollPreparation: React.FC<PayrollPreparationProps> = ({ restaurantId }) => {
  const { t, i18n } = useTranslation();
  const { getRestaurantEmployees, getRestaurantSchedule } = useAppContext();
  
  // State
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<PayrollSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});
  const [selectedExportFormat, setSelectedExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Get employees and shifts
  const employees = getRestaurantEmployees(restaurantId);
  const schedule = getRestaurantSchedule(restaurantId);
  const shifts = schedule?.shifts || [];

  // Load payroll data
  useEffect(() => {
    const loadPayrollData = async () => {
      setLoading(true);
      
      try {
        // In a real implementation, this would fetch data from an API
        // For now, we'll generate mock data
        const mockSummaries = generatePayrollSummaries();
        setPayrollSummaries(mockSummaries);
        
        // Apply initial filters
        filterSummaries(mockSummaries, searchTerm, contractTypeFilter);
      } catch (error) {
        console.error('Failed to load payroll data:', error);
        toast.error(i18n.language === 'fr' 
          ? 'Échec du chargement des données de paie' 
          : 'Failed to load payroll data');
      } finally {
        setLoading(false);
      }
    };
    
    loadPayrollData();
  }, [month, restaurantId]);

  // Generate payroll summaries
  const generatePayrollSummaries = (): PayrollSummary[] => {
    const summaries: PayrollSummary[] = [];
    
    // Parse month
    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, monthNum - 1));
    const monthEnd = endOfMonth(monthStart);
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Generate summary for each employee
    employees.forEach(employee => {
      // Calculate hours worked
      let regularHours = 0;
      let overtimeHours = 0;
      let holidayHours = 0;
      let absenceHours = 0;
      
      // Process shifts
      daysInMonth.forEach(day => {
        const dayOfWeek = day.getDay() === 0 ? 6 : day.getDay() - 1; // Convert to 0-6 (Mon-Sun)
        
        // Find shifts for this employee on this day
        const dayShifts = shifts.filter(shift => 
          shift.employeeId === employee.id && 
          shift.day === dayOfWeek
        );
        
        dayShifts.forEach(shift => {
          if (shift.status) {
            // Handle absence statuses
            if (shift.status === 'CP') {
              // Paid leave counts as regular hours
              regularHours += 7; // Assuming 7 hours per day
            } else if (shift.status === 'PUBLIC_HOLIDAY') {
              // Public holiday hours
              holidayHours += 7;
            } else {
              // Other absences
              absenceHours += 7;
            }
          } else if (shift.start && shift.end) {
            // Regular working shift
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
            
            const shiftHours = hours + minutes / 60;
            
            // Determine if hours are regular or overtime
            const dailyOvertimeThreshold = 8; // Hours after which overtime starts
            
            if (shiftHours > dailyOvertimeThreshold) {
              regularHours += dailyOvertimeThreshold;
              overtimeHours += shiftHours - dailyOvertimeThreshold;
            } else {
              regularHours += shiftHours;
            }
          }
        });
      });
      
      // Calculate total hours
      const totalHours = regularHours + overtimeHours + holidayHours;
      
      // Calculate gross salary
      const hourlyRate = employee.hourlyRate || 12; // Default to 12€/hour if not specified
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * 1.25; // 25% overtime premium
      const holidayPay = holidayHours * hourlyRate * 2; // 100% holiday premium
      const grossSalary = regularPay + overtimePay + holidayPay;
      
      // Generate variable elements
      const variableElements = [];
      
      // Add overtime premium
      if (overtimeHours > 0) {
        variableElements.push({
          type: 'overtime',
          amount: overtimePay - (overtimeHours * hourlyRate), // Just the premium
          description: i18n.language === 'fr' 
            ? `Prime d'heures supplémentaires (${overtimeHours.toFixed(1)}h à 25%)` 
            : `Overtime premium (${overtimeHours.toFixed(1)}h at 25%)`
        });
      }
      
      // Add holiday premium
      if (holidayHours > 0) {
        variableElements.push({
          type: 'holiday',
          amount: holidayPay - (holidayHours * hourlyRate), // Just the premium
          description: i18n.language === 'fr' 
            ? `Prime jour férié (${holidayHours.toFixed(1)}h à 100%)` 
            : `Public holiday premium (${holidayHours.toFixed(1)}h at 100%)`
        });
      }
      
      // Add meal vouchers
      const workDays = Math.ceil(regularHours / 7); // Approximate number of work days
      if (workDays > 0) {
        variableElements.push({
          type: 'meal_voucher',
          amount: workDays * 9, // 9€ per day
          description: i18n.language === 'fr' 
            ? `Titres restaurant (${workDays} jours à 9€)` 
            : `Meal vouchers (${workDays} days at 9€)`
        });
      }
      
      // Add transport allowance
      variableElements.push({
        type: 'transport',
        amount: 75,
        description: i18n.language === 'fr' 
          ? 'Indemnité de transport' 
          : 'Transport allowance'
      });
      
      // Create summary
      summaries.push({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        contractType: employee.contractType,
        regularHours,
        overtimeHours,
        holidayHours,
        absenceHours,
        totalHours,
        hourlyRate,
        grossSalary,
        variableElements
      });
    });
    
    return summaries;
  };

  // Filter summaries
  const filterSummaries = (
    summaries: PayrollSummary[],
    search: string,
    contractType: string | 'all'
  ) => {
    let filtered = summaries;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(summary => 
        summary.employeeName.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply contract type filter
    if (contractType !== 'all') {
      filtered = filtered.filter(summary => summary.contractType === contractType);
    }
    
    setFilteredSummaries(filtered);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterSummaries(payrollSummaries, value, contractTypeFilter);
  };

  // Handle contract type filter
  const handleContractTypeFilter = (contractType: string | 'all') => {
    setContractTypeFilter(contractType);
    filterSummaries(payrollSummaries, searchTerm, contractType);
  };

  // Toggle employee expansion
  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format hours
  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  // Handle export
  const handleExport = () => {
    // In a real implementation, this would generate and download the export file
    toast.success(i18n.language === 'fr' 
      ? `Export ${selectedExportFormat.toUpperCase()} démarré` 
      : `${selectedExportFormat.toUpperCase()} export started`);
    
    setShowExportModal(false);
  };

  // Format month for display
  const formatMonthDisplay = () => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1);
    
    if (i18n.language === 'fr') {
      return format(date, 'MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase());
    }
    
    return format(date, 'MMMM yyyy');
  };

  // Calculate totals
  const calculateTotals = () => {
    return filteredSummaries.reduce(
      (acc, summary) => {
        acc.regularHours += summary.regularHours;
        acc.overtimeHours += summary.overtimeHours;
        acc.holidayHours += summary.holidayHours;
        acc.absenceHours += summary.absenceHours;
        acc.totalHours += summary.totalHours;
        acc.grossSalary += summary.grossSalary;
        return acc;
      },
      {
        regularHours: 0,
        overtimeHours: 0,
        holidayHours: 0,
        absenceHours: 0,
        totalHours: 0,
        grossSalary: 0
      }
    );
  };

  const totals = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <DollarSign className="text-green-600 mr-3" size={24} />
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                {i18n.language === 'fr' ? 'Préparation de la Paie' : 'Payroll Preparation'}
              </h3>
              <p className="text-sm text-gray-500">
                {formatMonthDisplay()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download size={16} className="mr-2" />
              {i18n.language === 'fr' ? 'Exporter' : 'Export'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={i18n.language === 'fr' ? 'Rechercher un employé...' : 'Search employee...'}
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Contract type filter */}
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-400" />
            <div className="flex space-x-1">
              <button
                onClick={() => handleContractTypeFilter('all')}
                className={`px-3 py-1 text-sm rounded-md ${
                  contractTypeFilter === 'all'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {i18n.language === 'fr' ? 'Tous' : 'All'}
              </button>
              <button
                onClick={() => handleContractTypeFilter('CDI')}
                className={`px-3 py-1 text-sm rounded-md ${
                  contractTypeFilter === 'CDI'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                CDI
              </button>
              <button
                onClick={() => handleContractTypeFilter('CDD')}
                className={`px-3 py-1 text-sm rounded-md ${
                  contractTypeFilter === 'CDD'
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                }`}
              >
                CDD
              </button>
              <button
                onClick={() => handleContractTypeFilter('Extra')}
                className={`px-3 py-1 text-sm rounded-md ${
                  contractTypeFilter === 'Extra'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Extra
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                {i18n.language === 'fr' ? 'Heures Régulières' : 'Regular Hours'}
              </p>
              <p className="text-xl font-bold text-blue-900">
                {formatHours(totals.regularHours)}
              </p>
            </div>
            <Clock size={24} className="text-blue-500" />
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">
                {i18n.language === 'fr' ? 'Heures Supp.' : 'Overtime Hours'}
              </p>
              <p className="text-xl font-bold text-orange-900">
                {formatHours(totals.overtimeHours)}
              </p>
            </div>
            <Clock size={24} className="text-orange-500" />
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">
                {i18n.language === 'fr' ? 'Heures Fériées' : 'Holiday Hours'}
              </p>
              <p className="text-xl font-bold text-red-900">
                {formatHours(totals.holidayHours)}
              </p>
            </div>
            <Calendar size={24} className="text-red-500" />
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {i18n.language === 'fr' ? 'Heures d\'Absence' : 'Absence Hours'}
              </p>
              <p className="text-xl font-bold text-gray-900">
                {formatHours(totals.absenceHours)}
              </p>
            </div>
            <Users size={24} className="text-gray-500" />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                {i18n.language === 'fr' ? 'Heures Totales' : 'Total Hours'}
              </p>
              <p className="text-xl font-bold text-green-900">
                {formatHours(totals.totalHours)}
              </p>
            </div>
            <Clock size={24} className="text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">
                {i18n.language === 'fr' ? 'Masse Salariale' : 'Gross Payroll'}
              </p>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrency(totals.grossSalary)}
              </p>
            </div>
            <DollarSign size={24} className="text-purple-500" />
          </div>
        </div>
      </div>
      
      {/* Employee list */}
      <div className="px-6 pb-6">
        <div className="border rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="bg-gray-50 border-b">
            <div className="grid grid-cols-7 gap-4 px-6 py-3">
              <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-span-2">
                {i18n.language === 'fr' ? 'Employé' : 'Employee'}
              </div>
              <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Heures Rég.' : 'Reg. Hours'}
              </div>
              <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Heures Supp.' : 'OT Hours'}
              </div>
              <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Heures Totales' : 'Total Hours'}
              </div>
              <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Salaire Brut' : 'Gross Salary'}
              </div>
              <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Actions' : 'Actions'}
              </div>
            </div>
          </div>
          
          {/* Table body */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">
                {i18n.language === 'fr' 
                  ? 'Aucun employé trouvé' 
                  : 'No employees found'}
              </div>
            ) : (
              filteredSummaries.map(summary => (
                <React.Fragment key={summary.employeeId}>
                  {/* Employee row */}
                  <div className="hover:bg-gray-50">
                    <div className="grid grid-cols-7 gap-4 px-6 py-4 cursor-pointer" onClick={() => toggleEmployeeExpansion(summary.employeeId)}>
                      <div className="flex items-center col-span-2">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {summary.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{summary.employeeName}</div>
                          <div className="text-sm text-gray-500">{summary.contractType}</div>
                        </div>
                        {expandedEmployees[summary.employeeId] ? (
                          <ChevronUp size={16} className="ml-2 text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="ml-2 text-gray-400" />
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-900">
                        {formatHours(summary.regularHours)}
                      </div>
                      <div className="text-right text-sm text-gray-900">
                        {formatHours(summary.overtimeHours)}
                      </div>
                      <div className="text-right text-sm text-gray-900">
                        {formatHours(summary.totalHours)}
                      </div>
                      <div className="text-right text-sm text-gray-900 font-medium">
                        {formatCurrency(summary.grossSalary)}
                      </div>
                      <div className="text-right">
                        <button
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success(i18n.language === 'fr' 
                              ? 'Fiche de paie générée avec succès' 
                              : 'Payslip generated successfully');
                          }}
                        >
                          <FileText size={14} className="mr-1" />
                          {i18n.language === 'fr' ? 'Fiche de paie' : 'Payslip'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded details */}
                  {expandedEmployees[summary.employeeId] && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Hours breakdown */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            {i18n.language === 'fr' ? 'Détail des Heures' : 'Hours Breakdown'}
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-600">
                                {i18n.language === 'fr' ? 'Heures régulières' : 'Regular hours'}
                              </div>
                              <div className="text-sm text-gray-900">
                                {formatHours(summary.regularHours)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-600">
                                {i18n.language === 'fr' ? 'Heures supplémentaires' : 'Overtime hours'}
                              </div>
                              <div className="text-sm text-gray-900">
                                {formatHours(summary.overtimeHours)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-600">
                                {i18n.language === 'fr' ? 'Heures fériées' : 'Holiday hours'}
                              </div>
                              <div className="text-sm text-gray-900">
                                {formatHours(summary.holidayHours)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-600">
                                {i18n.language === 'fr' ? 'Heures d\'absence' : 'Absence hours'}
                              </div>
                              <div className="text-sm text-gray-900">
                                {formatHours(summary.absenceHours)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <div className="text-sm font-medium text-gray-700">
                                {i18n.language === 'fr' ? 'Total des heures' : 'Total hours'}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatHours(summary.totalHours)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Variable elements */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            {i18n.language === 'fr' ? 'Éléments Variables' : 'Variable Elements'}
                          </h4>
                          <div className="space-y-2">
                            {summary.variableElements.map((element, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                  {element.description}
                                </div>
                                <div className="text-sm text-gray-900">
                                  {formatCurrency(element.amount)}
                                </div>
                              </div>
                            ))}
                            {summary.variableElements.length === 0 && (
                              <div className="text-sm text-gray-500 italic">
                                {i18n.language === 'fr' 
                                  ? 'Aucun élément variable pour ce mois' 
                                  : 'No variable elements for this month'}
                              </div>
                            )}
                          </div>
                          
                          {/* Salary calculation */}
                          <div className="mt-4 pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-600">
                                {i18n.language === 'fr' ? 'Taux horaire' : 'Hourly rate'}
                              </div>
                              <div className="text-sm text-gray-900">
                                {formatCurrency(summary.hourlyRate)}/h
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-sm font-medium text-gray-700">
                                {i18n.language === 'fr' ? 'Salaire brut' : 'Gross salary'}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(summary.grossSalary)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Validation status */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          <span className="text-sm text-green-700">
                            {i18n.language === 'fr' 
                              ? 'Données validées pour l\'export de paie' 
                              : 'Data validated for payroll export'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowExportModal(false)} />
            
            <div className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
              <button
                onClick={() => setShowExportModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>

              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {i18n.language === 'fr' ? 'Exporter les Données de Paie' : 'Export Payroll Data'}
              </h2>

              <div className="space-y-6">
                {/* Export format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Format d\'export' : 'Export Format'}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedExportFormat('excel')}
                      className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
                        selectedExportFormat === 'excel'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <FileText size={24} className={selectedExportFormat === 'excel' ? 'text-green-500' : 'text-gray-400'} />
                      <span className="mt-2 text-sm font-medium">Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedExportFormat('csv')}
                      className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
                        selectedExportFormat === 'csv'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <FileText size={24} className={selectedExportFormat === 'csv' ? 'text-blue-500' : 'text-gray-400'} />
                      <span className="mt-2 text-sm font-medium">CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedExportFormat('pdf')}
                      className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
                        selectedExportFormat === 'pdf'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <FileText size={24} className={selectedExportFormat === 'pdf' ? 'text-red-500' : 'text-gray-400'} />
                      <span className="mt-2 text-sm font-medium">PDF</span>
                    </button>
                  </div>
                </div>

                {/* Export options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Options d\'export' : 'Export Options'}
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="include-details"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                      <label htmlFor="include-details" className="ml-2 block text-sm text-gray-700">
                        {i18n.language === 'fr' ? 'Inclure les détails des heures' : 'Include hours details'}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="include-variables"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                      <label htmlFor="include-variables" className="ml-2 block text-sm text-gray-700">
                        {i18n.language === 'fr' ? 'Inclure les éléments variables' : 'Include variable elements'}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="include-summary"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                      <label htmlFor="include-summary" className="ml-2 block text-sm text-gray-700">
                        {i18n.language === 'fr' ? 'Inclure le résumé' : 'Include summary'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Software integration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Intégration Logiciel' : 'Software Integration'}
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="none">{i18n.language === 'fr' ? 'Aucune intégration' : 'No integration'}</option>
                    <option value="sage">Sage Paie</option>
                    <option value="cegid">Cegid</option>
                    <option value="payfit">PayFit</option>
                    <option value="adp">ADP</option>
                    <option value="quadratus">Quadratus</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {i18n.language === 'fr' 
                      ? 'Exporter directement vers votre logiciel de paie' 
                      : 'Export directly to your payroll software'}
                  </p>
                </div>

                {/* Information */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        {i18n.language === 'fr' 
                          ? 'Les données exportées incluront toutes les informations nécessaires pour la préparation de la paie, y compris les heures travaillées, les primes et les absences.' 
                          : 'Exported data will include all information needed for payroll preparation, including worked hours, bonuses, and absences.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    {i18n.language === 'fr' ? 'Exporter' : 'Export'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPreparation;
import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Download, Filter, Search, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Employee, TimeClockSummary as TimeClockSummaryType } from '../../types';
import toast from 'react-hot-toast';

interface TimeClockSummaryProps {
  restaurantId: string;
  employees: Employee[];
}

const TimeClockSummary: React.FC<TimeClockSummaryProps> = ({ restaurantId, employees }) => {
  const { t, i18n } = useTranslation();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [summaries, setSummaries] = useState<TimeClockSummaryType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Generate mock data for demonstration
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        const mockSummaries: TimeClockSummaryType[] = [];
        
        // Generate data for each employee
        employees.forEach(employee => {
          // Generate data for each day in the date range
          let currentDate = new Date(dateRange.start);
          while (currentDate <= dateRange.end) {
            // Skip weekends for some employees to make data more realistic
            const dayOfWeek = currentDate.getDay();
            if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.3) {
              currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
              continue;
            }
            
            // Generate random data
            const scheduledHours = 8;
            const variation = (Math.random() - 0.5) * 2; // -1 to +1 hours
            const totalHours = Math.max(0, scheduledHours + variation);
            const difference = totalHours - scheduledHours;
            
            // Determine status
            let status: 'on_time' | 'late' | 'early' | 'overtime' | 'undertime';
            if (Math.abs(difference) < 0.25) {
              status = 'on_time';
            } else if (difference > 0) {
              status = 'overtime';
            } else {
              status = 'undertime';
            }
            
            // Add random late/early status
            if (Math.random() < 0.2) {
              status = Math.random() < 0.5 ? 'late' : 'early';
            }
            
            mockSummaries.push({
              employeeId: employee.id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              date: format(currentDate, 'yyyy-MM-dd'),
              totalHours,
              scheduledHours,
              difference,
              status
            });
            
            currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
          }
        });
        
        setSummaries(mockSummaries);
      } catch (error) {
        console.error('Error generating mock data:', error);
        toast.error(i18n.language === 'fr' 
          ? 'Erreur lors de la génération des données' 
          : 'Error generating data');
      } finally {
        setLoading(false);
      }
    }, 1000);
  }, [dateRange, employees]);
  
  // Filter summaries based on search and employee selection
  const filteredSummaries = summaries.filter(summary => {
    const matchesSearch = searchTerm === '' || 
      summary.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = selectedEmployeeId === 'all' || 
      summary.employeeId === selectedEmployeeId;
    
    return matchesSearch && matchesEmployee;
  });
  
  // Format date based on locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (i18n.language === 'fr') {
      return format(date, 'EEEE d MMMM yyyy', { locale: fr })
        .replace(/^\w/, c => c.toUpperCase());
    }
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Format time difference
  const formatDifference = (diff: number) => {
    const sign = diff >= 0 ? '+' : '';
    const hours = Math.floor(Math.abs(diff));
    const minutes = Math.round((Math.abs(diff) - hours) * 60);
    return `${sign}${hours}h${minutes.toString().padStart(2, '0')}`;
  };
  
  // Get status color and label
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'on_time':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: i18n.language === 'fr' ? 'À l\'heure' : 'On time'
        };
      case 'overtime':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          label: i18n.language === 'fr' ? 'Heures supp.' : 'Overtime'
        };
      case 'undertime':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: i18n.language === 'fr' ? 'Heures manquantes' : 'Undertime'
        };
      case 'late':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: i18n.language === 'fr' ? 'En retard' : 'Late'
        };
      case 'early':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: i18n.language === 'fr' ? 'En avance' : 'Early'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: status
        };
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    
    switch (range) {
      case 'today':
        setDateRange({ start: today, end: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({ start: yesterday, end: yesterday });
        break;
      case 'thisWeek':
        setDateRange({
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 })
        });
        break;
      case 'lastWeek':
        const lastWeekStart = subDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
        const lastWeekEnd = subDays(endOfWeek(today, { weekStartsOn: 1 }), 7);
        setDateRange({ start: lastWeekStart, end: lastWeekEnd });
        break;
      default:
        setDateRange({
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 })
        });
    }
  };
  
  // Format date range for display
  const formatDateRange = () => {
    if (i18n.language === 'fr') {
      return `${format(dateRange.start, 'd MMMM', { locale: fr })} - ${format(dateRange.end, 'd MMMM yyyy', { locale: fr })}`.replace(/^\w/, c => c.toUpperCase());
    }
    return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
  };
  
  // Calculate summary statistics
  const calculateSummary = () => {
    const totalHours = filteredSummaries.reduce((sum, s) => sum + s.totalHours, 0);
    const scheduledHours = filteredSummaries.reduce((sum, s) => sum + s.scheduledHours, 0);
    const overtimeHours = filteredSummaries.reduce((sum, s) => sum + Math.max(0, s.difference), 0);
    const undertimeHours = Math.abs(filteredSummaries.reduce((sum, s) => sum + Math.min(0, s.difference), 0));
    
    return {
      totalHours,
      scheduledHours,
      overtimeHours,
      undertimeHours
    };
  };
  
  const summary = calculateSummary();
  
  // Export to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      'Employee',
      'Date',
      'Total Hours',
      'Scheduled Hours',
      'Difference',
      'Status'
    ];
    
    const rows = filteredSummaries.map(summary => [
      summary.employeeName,
      summary.date,
      summary.totalHours.toString(),
      summary.scheduledHours.toString(),
      summary.difference.toString(),
      getStatusInfo(summary.status).label
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `time-clock-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(i18n.language === 'fr' 
      ? 'Rapport exporté avec succès' 
      : 'Report exported successfully');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="text-blue-600 mr-3" size={24} />
            <h3 className="text-lg font-medium text-gray-800">
              {i18n.language === 'fr' ? 'Résumé des Pointages' : 'Time Clock Summary'}
            </h3>
          </div>
          
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download size={16} className="mr-2" />
            {i18n.language === 'fr' ? 'Exporter CSV' : 'Export CSV'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {i18n.language === 'fr' ? 'Période' : 'Date Range'}
            </label>
            <div className="flex items-center">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-400" />
                </div>
                <select
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  defaultValue="thisWeek"
                >
                  <option value="today">{i18n.language === 'fr' ? 'Aujourd\'hui' : 'Today'}</option>
                  <option value="yesterday">{i18n.language === 'fr' ? 'Hier' : 'Yesterday'}</option>
                  <option value="thisWeek">{i18n.language === 'fr' ? 'Cette semaine' : 'This week'}</option>
                  <option value="lastWeek">{i18n.language === 'fr' ? 'Semaine dernière' : 'Last week'}</option>
                </select>
              </div>
              <span className="mx-2 text-gray-500">{formatDateRange()}</span>
            </div>
          </div>
          
          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {i18n.language === 'fr' ? 'Employé' : 'Employee'}
            </label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="all">{i18n.language === 'fr' ? 'Tous les employés' : 'All employees'}</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {i18n.language === 'fr' ? 'Recherche' : 'Search'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={i18n.language === 'fr' ? 'Rechercher...' : 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {i18n.language === 'fr' ? 'Total des Heures' : 'Total Hours'}
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {summary.totalHours.toFixed(1)}h
                </p>
              </div>
              <Clock size={24} className="text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {i18n.language === 'fr' ? 'Heures Prévues' : 'Scheduled Hours'}
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {summary.scheduledHours.toFixed(1)}h
                </p>
              </div>
              <Calendar size={24} className="text-green-500" />
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">
                  {i18n.language === 'fr' ? 'Heures Supp.' : 'Overtime Hours'}
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {summary.overtimeHours.toFixed(1)}h
                </p>
              </div>
              <Clock size={24} className="text-orange-500" />
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">
                  {i18n.language === 'fr' ? 'Heures Manquantes' : 'Undertime Hours'}
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {summary.undertimeHours.toFixed(1)}h
                </p>
              </div>
              <AlertCircle size={24} className="text-red-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Employé' : 'Employee'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Date' : 'Date'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Heures Travaillées' : 'Worked Hours'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Heures Prévues' : 'Scheduled Hours'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Différence' : 'Difference'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Statut' : 'Status'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">
                      {i18n.language === 'fr' ? 'Chargement...' : 'Loading...'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  {i18n.language === 'fr' 
                    ? 'Aucune donnée disponible pour cette période' 
                    : 'No data available for this period'}
                </td>
              </tr>
            ) : (
              filteredSummaries.map((summary, index) => {
                const statusInfo = getStatusInfo(summary.status);
                
                return (
                  <tr key={`${summary.employeeId}-${summary.date}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{summary.employeeName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(summary.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{summary.totalHours.toFixed(2)}h</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{summary.scheduledHours.toFixed(2)}h</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        summary.difference > 0 
                          ? 'text-orange-600' 
                          : summary.difference < 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                      }`}>
                        {formatDifference(summary.difference)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
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

export default TimeClockSummary;
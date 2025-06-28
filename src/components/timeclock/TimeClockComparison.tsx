import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Download, Filter, Search, Clock, AlertCircle, CheckCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfWeek, endOfWeek, parseISO, differenceInMinutes, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Employee, Shift } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import toast from 'react-hot-toast';

interface TimeClockComparisonProps {
  restaurantId: string;
  employees: Employee[];
}

// Mock time clock data structure
interface TimeClockEntry {
  id: string;
  employeeId: string;
  date: string;
  clockInTime: string;
  clockOutTime: string;
  totalHours: number;
}

// Comparison result structure
interface ComparisonResult {
  employeeId: string;
  employeeName: string;
  date: string;
  plannedStart: string;
  plannedEnd: string;
  plannedHours: number;
  actualStart: string;
  actualEnd: string;
  actualHours: number;
  variance: number;
  status: 'on_time' | 'late' | 'early' | 'overtime' | 'undertime' | 'missing_punch';
}

const TimeClockComparison: React.FC<TimeClockComparisonProps> = ({ restaurantId, employees }) => {
  const { t, i18n } = useTranslation();
  const { getRestaurantSchedule } = useAppContext();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Get schedule data
  const schedule = getRestaurantSchedule(restaurantId);
  const shifts = schedule?.shifts || [];
  
  // Generate mock time clock data for demonstration
  const generateMockTimeClockData = (): TimeClockEntry[] => {
    const entries: TimeClockEntry[] = [];
    
    // Generate entries based on shifts with some variations
    shifts.forEach(shift => {
      if (!shift.start || !shift.end || shift.status) return;
      
      const employee = employees.find(e => e.id === shift.employeeId);
      if (!employee) return;
      
      const shiftDate = addDays(dateRange.start, shift.day);
      const dateStr = format(shiftDate, 'yyyy-MM-dd');
      
      // Parse shift times
      const [startHour, startMin] = shift.start.split(':').map(Number);
      const [endHour, endMin] = shift.end.split(':').map(Number);
      
      // Add random variations to create realistic scenarios
      const variation = Math.random();
      
      // On time (40% chance)
      if (variation < 0.4) {
        entries.push({
          id: `${shift.id}-ontime`,
          employeeId: shift.employeeId,
          date: dateStr,
          clockInTime: shift.start,
          clockOutTime: shift.end,
          totalHours: calculateHours(shift.start, shift.end)
        });
      }
      // Late arrival (20% chance)
      else if (variation < 0.6) {
        const lateMinutes = Math.floor(Math.random() * 20) + 5; // 5-25 minutes late
        const newStartHour = startHour + Math.floor((startMin + lateMinutes) / 60);
        const newStartMin = (startMin + lateMinutes) % 60;
        const newStart = `${String(newStartHour).padStart(2, '0')}:${String(newStartMin).padStart(2, '0')}`;
        
        entries.push({
          id: `${shift.id}-late`,
          employeeId: shift.employeeId,
          date: dateStr,
          clockInTime: newStart,
          clockOutTime: shift.end,
          totalHours: calculateHours(newStart, shift.end)
        });
      }
      // Early arrival (15% chance)
      else if (variation < 0.75) {
        const earlyMinutes = Math.floor(Math.random() * 15) + 5; // 5-20 minutes early
        const newStartMin = startMin - earlyMinutes;
        const newStartHour = startHour - (newStartMin < 0 ? 1 : 0);
        const adjustedStartMin = newStartMin < 0 ? 60 + newStartMin : newStartMin;
        const newStart = `${String(newStartHour).padStart(2, '0')}:${String(adjustedStartMin).padStart(2, '0')}`;
        
        entries.push({
          id: `${shift.id}-early`,
          employeeId: shift.employeeId,
          date: dateStr,
          clockInTime: newStart,
          clockOutTime: shift.end,
          totalHours: calculateHours(newStart, shift.end)
        });
      }
      // Overtime (15% chance)
      else if (variation < 0.9) {
        const overtimeMinutes = Math.floor(Math.random() * 45) + 15; // 15-60 minutes overtime
        const newEndMin = endMin + overtimeMinutes;
        const newEndHour = endHour + Math.floor(newEndMin / 60);
        const adjustedEndMin = newEndMin % 60;
        const newEnd = `${String(newEndHour).padStart(2, '0')}:${String(adjustedEndMin).padStart(2, '0')}`;
        
        entries.push({
          id: `${shift.id}-overtime`,
          employeeId: shift.employeeId,
          date: dateStr,
          clockInTime: shift.start,
          clockOutTime: newEnd,
          totalHours: calculateHours(shift.start, newEnd)
        });
      }
      // Missing punch (10% chance)
      else {
        // No entry for this shift - will be detected as missing punch
      }
    });
    
    return entries;
  };
  
  // Helper function to calculate hours between two time strings
  const calculateHours = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
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
    
    return parseFloat((hours + minutes / 60).toFixed(2));
  };
  
  // Compare planned shifts with actual time clock entries
  const compareShiftsWithTimeClockData = (
    shifts: Shift[], 
    timeClockEntries: TimeClockEntry[]
  ): ComparisonResult[] => {
    const results: ComparisonResult[] = [];
    
    // Process each shift
    shifts.forEach(shift => {
      if (!shift.start || !shift.end || shift.status) return;
      
      const employee = employees.find(e => e.id === shift.employeeId);
      if (!employee) return;
      
      const shiftDate = addDays(dateRange.start, shift.day);
      const dateStr = format(shiftDate, 'yyyy-MM-dd');
      
      // Find corresponding time clock entry
      const entry = timeClockEntries.find(e => 
        e.employeeId === shift.employeeId && 
        e.date === dateStr
      );
      
      if (entry) {
        // Calculate variances
        const plannedHours = calculateHours(shift.start, shift.end);
        const actualHours = entry.totalHours;
        const variance = parseFloat((actualHours - plannedHours).toFixed(2));
        
        // Determine status
        let status: ComparisonResult['status'] = 'on_time';
        
        // Check if employee was late
        const startDiffMinutes = getTimeDifferenceInMinutes(shift.start, entry.clockInTime);
        if (startDiffMinutes > 5) {
          status = 'late';
        } else if (startDiffMinutes < -5) {
          status = 'early';
        }
        
        // Check if there was significant overtime or undertime
        if (variance > 0.25) {
          status = 'overtime';
        } else if (variance < -0.25) {
          status = 'undertime';
        }
        
        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          date: dateStr,
          plannedStart: shift.start,
          plannedEnd: shift.end,
          plannedHours,
          actualStart: entry.clockInTime,
          actualEnd: entry.clockOutTime,
          actualHours,
          variance,
          status
        });
      } else {
        // Missing time clock entry
        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          date: dateStr,
          plannedStart: shift.start,
          plannedEnd: shift.end,
          plannedHours: calculateHours(shift.start, shift.end),
          actualStart: '',
          actualEnd: '',
          actualHours: 0,
          variance: -calculateHours(shift.start, shift.end),
          status: 'missing_punch'
        });
      }
    });
    
    return results;
  };
  
  // Helper function to get time difference in minutes
  const getTimeDifferenceInMinutes = (time1: string, time2: string): number => {
    const [hour1, minute1] = time1.split(':').map(Number);
    const [hour2, minute2] = time2.split(':').map(Number);
    
    const totalMinutes1 = hour1 * 60 + minute1;
    const totalMinutes2 = hour2 * 60 + minute2;
    
    return totalMinutes2 - totalMinutes1;
  };
  
  // Load comparison data
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        const timeClockEntries = generateMockTimeClockData();
        const results = compareShiftsWithTimeClockData(shifts, timeClockEntries);
        setComparisonResults(results);
      } catch (error) {
        console.error('Error generating comparison data:', error);
        toast.error(i18n.language === 'fr' 
          ? 'Erreur lors de la génération des données de comparaison' 
          : 'Error generating comparison data');
      } finally {
        setLoading(false);
      }
    }, 1000);
  }, [dateRange, shifts, employees]);
  
  // Filter comparison results
  const filteredResults = comparisonResults.filter(result => {
    const matchesSearch = searchTerm === '' || 
      result.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = selectedEmployeeId === 'all' || 
      result.employeeId === selectedEmployeeId;
    
    const matchesStatus = statusFilter === 'all' || 
      result.status === statusFilter;
    
    return matchesSearch && matchesEmployee && matchesStatus;
  });
  
  // Sort comparison results
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField as keyof ComparisonResult];
    let bValue: any = b[sortField as keyof ComparisonResult];
    
    // Handle string comparisons
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }
    
    // Handle numeric comparisons
    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });
  
  // Format date based on locale
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (i18n.language === 'fr') {
      return format(date, 'EEEE d MMMM yyyy', { locale: fr })
        .replace(/^\w/, c => c.toUpperCase());
    }
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Format time difference
  const formatTimeDifference = (diff: number) => {
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
      case 'missing_punch':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          label: i18n.language === 'fr' ? 'Pointage manquant' : 'Missing punch'
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
  
  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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
      <ArrowUp size={14} className="ml-1" />
    ) : (
      <ArrowDown size={14} className="ml-1" />
    );
  };
  
  // Calculate summary statistics
  const calculateSummary = () => {
    const totalPlannedHours = filteredResults.reduce((sum, result) => sum + result.plannedHours, 0);
    const totalActualHours = filteredResults.reduce((sum, result) => sum + result.actualHours, 0);
    const totalVariance = filteredResults.reduce((sum, result) => sum + result.variance, 0);
    
    const countByStatus = {
      on_time: filteredResults.filter(r => r.status === 'on_time').length,
      late: filteredResults.filter(r => r.status === 'late').length,
      early: filteredResults.filter(r => r.status === 'early').length,
      overtime: filteredResults.filter(r => r.status === 'overtime').length,
      undertime: filteredResults.filter(r => r.status === 'undertime').length,
      missing_punch: filteredResults.filter(r => r.status === 'missing_punch').length
    };
    
    return {
      totalPlannedHours,
      totalActualHours,
      totalVariance,
      countByStatus
    };
  };
  
  const summary = calculateSummary();
  
  // Export to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      'Employee',
      'Date',
      'Planned Start',
      'Planned End',
      'Planned Hours',
      'Actual Start',
      'Actual End',
      'Actual Hours',
      'Variance',
      'Status'
    ];
    
    const rows = sortedResults.map(result => [
      result.employeeName,
      result.date,
      result.plannedStart,
      result.plannedEnd,
      result.plannedHours.toString(),
      result.actualStart || 'N/A',
      result.actualEnd || 'N/A',
      result.actualHours.toString(),
      result.variance.toString(),
      getStatusInfo(result.status).label
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
    link.setAttribute('download', `time-clock-comparison-${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
              {i18n.language === 'fr' ? 'Comparaison Heures Prévues vs. Réelles' : 'Planned vs. Actual Hours Comparison'}
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
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {i18n.language === 'fr' ? 'Statut' : 'Status'}
            </label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{i18n.language === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
              <option value="on_time">{i18n.language === 'fr' ? 'À l\'heure' : 'On time'}</option>
              <option value="late">{i18n.language === 'fr' ? 'En retard' : 'Late'}</option>
              <option value="early">{i18n.language === 'fr' ? 'En avance' : 'Early'}</option>
              <option value="overtime">{i18n.language === 'fr' ? 'Heures supp.' : 'Overtime'}</option>
              <option value="undertime">{i18n.language === 'fr' ? 'Heures manquantes' : 'Undertime'}</option>
              <option value="missing_punch">{i18n.language === 'fr' ? 'Pointage manquant' : 'Missing punch'}</option>
            </select>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {i18n.language === 'fr' ? 'Heures Prévues' : 'Planned Hours'}
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {summary.totalPlannedHours.toFixed(1)}h
                </p>
              </div>
              <Calendar size={24} className="text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {i18n.language === 'fr' ? 'Heures Réelles' : 'Actual Hours'}
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {summary.totalActualHours.toFixed(1)}h
                </p>
              </div>
              <Clock size={24} className="text-green-500" />
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            summary.totalVariance > 0 
              ? 'bg-orange-50 border-orange-100' 
              : summary.totalVariance < 0 
                ? 'bg-red-50 border-red-100' 
                : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {i18n.language === 'fr' ? 'Écart Total' : 'Total Variance'}
                </p>
                <p className={`text-2xl font-bold ${
                  summary.totalVariance > 0 
                    ? 'text-orange-600' 
                    : summary.totalVariance < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                }`}>
                  {formatTimeDifference(summary.totalVariance)}
                </p>
              </div>
              {summary.totalVariance > 0 ? (
                <ArrowUp size={24} className="text-orange-500" />
              ) : summary.totalVariance < 0 ? (
                <ArrowDown size={24} className="text-red-500" />
              ) : (
                <Minus size={24} className="text-gray-500" />
              )}
            </div>
          </div>
        </div>
        
        {/* Status Distribution */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {i18n.language === 'fr' ? 'Distribution des Statuts' : 'Status Distribution'}
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(summary.countByStatus).map(([status, count]) => {
              const statusInfo = getStatusInfo(status);
              return (
                <div 
                  key={status}
                  className={`p-2 rounded-lg ${statusInfo.bgColor} cursor-pointer hover:opacity-90 transition-opacity ${
                    statusFilter === status ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
                >
                  <div className={`text-center ${statusInfo.color}`}>
                    <p className="text-xs font-medium">{statusInfo.label}</p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('employeeName')}
              >
                <div className="flex items-center">
                  {i18n.language === 'fr' ? 'Employé' : 'Employee'}
                  {getSortIcon('employeeName')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  {i18n.language === 'fr' ? 'Date' : 'Date'}
                  {getSortIcon('date')}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Horaire Prévu' : 'Planned Schedule'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Pointage Réel' : 'Actual Clock Times'}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('variance')}
              >
                <div className="flex items-center">
                  {i18n.language === 'fr' ? 'Écart' : 'Variance'}
                  {getSortIcon('variance')}
                </div>
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
            ) : sortedResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  {i18n.language === 'fr' 
                    ? 'Aucune donnée disponible pour cette période' 
                    : 'No data available for this period'}
                </td>
              </tr>
            ) : (
              sortedResults.map((result, index) => {
                const statusInfo = getStatusInfo(result.status);
                
                return (
                  <tr key={`${result.employeeId}-${result.date}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.employeeName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(result.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.plannedStart} - {result.plannedEnd}
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.plannedHours.toFixed(2)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.status === 'missing_punch' ? (
                        <div className="text-sm text-purple-600 font-medium">
                          {i18n.language === 'fr' ? 'Pointage manquant' : 'Missing punch'}
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-gray-900">
                            {result.actualStart} - {result.actualEnd}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.actualHours.toFixed(2)}h
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        result.variance > 0 
                          ? 'text-orange-600' 
                          : result.variance < 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                      }`}>
                        {formatTimeDifference(result.variance)}
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
      
      {/* Explanation Panel */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Info size={20} className="text-blue-500 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900">
              {i18n.language === 'fr' ? 'À propos de ce rapport' : 'About this report'}
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              {i18n.language === 'fr' 
                ? 'Ce rapport compare les heures planifiées dans le planning avec les heures réelles enregistrées par la badgeuse. Les écarts sont calculés et catégorisés pour vous aider à identifier les tendances et les problèmes potentiels.' 
                : 'This report compares the hours scheduled in the planning with the actual hours recorded by the time clock. Variances are calculated and categorized to help you identify trends and potential issues.'}
            </p>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs text-gray-600">
                  {i18n.language === 'fr' ? 'À l\'heure' : 'On time'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                <span className="text-xs text-gray-600">
                  {i18n.language === 'fr' ? 'En retard' : 'Late'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span className="text-xs text-gray-600">
                  {i18n.language === 'fr' ? 'En avance' : 'Early'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                <span className="text-xs text-gray-600">
                  {i18n.language === 'fr' ? 'Heures supp.' : 'Overtime'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-xs text-gray-600">
                  {i18n.language === 'fr' ? 'Heures manquantes' : 'Undertime'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
                <span className="text-xs text-gray-600">
                  {i18n.language === 'fr' ? 'Pointage manquant' : 'Missing punch'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeClockComparison;
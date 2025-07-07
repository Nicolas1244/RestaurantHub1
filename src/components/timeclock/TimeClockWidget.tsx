import React, { useState, useEffect } from 'react';
import { Fingerprint, Clock, LogIn, LogOut, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppContext } from '../../contexts/AppContext';
import { Employee } from '../../types';
import toast from 'react-hot-toast';

interface TimeClockWidgetProps {
  restaurantId: string;
  employees: Employee[];
  compact?: boolean;
}

const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({ 
  restaurantId, 
  employees,
  compact = false
}) => {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isClockingIn, setIsClockingIn] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [clockedInSince, setClockInSince] = useState<Date | null>(null);
  const [totalHoursToday, setTotalHoursToday] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format current time based on locale
  const formattedTime = () => {
    if (i18n.language === 'fr') {
      return format(currentTime, 'HH:mm:ss');
    }
    return format(currentTime, 'h:mm:ss a');
  };

  // Format current date based on locale
  const formattedDate = () => {
    if (i18n.language === 'fr') {
      return format(currentTime, 'EEEE d MMMM yyyy', { locale: fr })
        .replace(/^\w/, c => c.toUpperCase());
    }
    return format(currentTime, 'EEEE, MMMM d, yyyy');
  };

  // Handle employee authentication
  const handleAuthenticate = () => {
    setError(null);
    setLoading(true);
    
    try {
      // For demo purposes, we'll just check if the employee exists
      const employee = employees.find(e => e.id === selectedEmployeeId);
      
      if (!employee) {
        throw new Error(i18n.language === 'fr' 
          ? 'Employé non trouvé' 
          : 'Employee not found');
      }
      
      // In a real implementation, we would validate the PIN against a secure database
      // For this demo, we'll just check if the PIN matches the employee ID
      if (pin !== selectedEmployeeId) {
        throw new Error(i18n.language === 'fr' 
          ? 'Code PIN invalide' 
          : 'Invalid PIN');
      }
      
      // Determine if employee is clocking in or out
      // In a real implementation, we would check the database for the last clock action
      // For this demo, we'll randomly decide
      const lastClockAction = localStorage.getItem(`clock_${selectedEmployeeId}`);
      if (lastClockAction) {
        const { action, timestamp } = JSON.parse(lastClockAction);
        if (action === 'in') {
          setIsClockingIn(false);
          setClockInSince(new Date(timestamp));
          
          // Calculate hours worked so far
          const hoursWorked = (currentTime.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
          setTotalHoursToday(Math.round(hoursWorked * 100) / 100);
        } else {
          setIsClockingIn(true);
          setClockInSince(null);
          setTotalHoursToday(0);
        }
      } else {
        setIsClockingIn(true);
        setClockInSince(null);
        setTotalHoursToday(0);
      }
      
      setIsAuthenticated(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle clock in/out action
  const handleClockAction = async (action: 'in' | 'out') => {
    setLoading(true);
    
    try {
      // In a real implementation, we would save the clock action to the database
      // For this demo, we'll just save to localStorage
      const timestamp = new Date().toISOString();
      localStorage.setItem(`clock_${selectedEmployeeId}`, JSON.stringify({ action, timestamp }));
      
      if (action === 'in') {
        setIsClockingIn(false);
        setClockInSince(new Date());
        setTotalHoursToday(0);
        
        toast.success(i18n.language === 'fr' 
          ? 'Pointage d\'arrivée enregistré' 
          : 'Clock in recorded');
      } else {
        // Calculate total hours worked
        const hoursWorked = clockedInSince 
          ? (currentTime.getTime() - clockedInSince.getTime()) / (1000 * 60 * 60)
          : 0;
        
        setIsClockingIn(true);
        setClockInSince(null);
        setTotalHoursToday(Math.round(hoursWorked * 100) / 100);
        
        toast.success(i18n.language === 'fr' 
          ? 'Pointage de départ enregistré' 
          : 'Clock out recorded');
      }
    } catch (error) {
      toast.error(i18n.language === 'fr' 
        ? 'Erreur lors du pointage' 
        : 'Clock action failed');
      console.error('Clock action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset authentication
  const handleReset = () => {
    setIsAuthenticated(false);
    setSelectedEmployeeId('');
    setPin('');
    setError(null);
  };

  // Get employee name
  const getEmployeeName = () => {
    const employee = employees.find(e => e.id === selectedEmployeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${compact ? 'border' : 'shadow-md'}`}>
      {/* Header */}
      <div className={`bg-blue-600 text-white ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Fingerprint size={compact ? 20 : 24} className="mr-2" />
            <div>
              <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>
                {i18n.language === 'fr' ? 'Badgeuse' : 'Time Clock'}
              </h3>
              <p className={`text-blue-100 ${compact ? 'text-xs' : 'text-sm'}`}>
                {formattedTime()}
              </p>
            </div>
          </div>
          
          <div className={`text-right ${compact ? 'text-xs' : 'text-sm'}`}>
            {formattedDate().split(',')[0]}
          </div>
        </div>
      </div>

      <div className={compact ? 'p-3' : 'p-4'}>
        {!isAuthenticated ? (
          <div className="space-y-3">
            {/* Employee Selection */}
            <div>
              <label htmlFor="employeeId" className={`block font-medium text-gray-700 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                {i18n.language === 'fr' ? 'Employé' : 'Employee'}
              </label>
              <select
                id="employeeId"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${compact ? 'text-xs py-1' : 'text-sm'}`}
              >
                <option value="">
                  {i18n.language === 'fr' ? '-- Sélectionnez votre nom --' : '-- Select your name --'}
                </option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* PIN Entry */}
            <div>
              <label htmlFor="pin" className={`block font-medium text-gray-700 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                {i18n.language === 'fr' ? 'Code PIN' : 'PIN Code'}
              </label>
              <input
                type="password"
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${compact ? 'text-xs py-1' : 'text-sm'}`}
                placeholder={i18n.language === 'fr' ? 'Entrez votre code PIN' : 'Enter your PIN'}
                maxLength={6}
              />
              <p className={`mt-1 text-gray-500 ${compact ? 'text-xs' : 'text-xs'}`}>
                {i18n.language === 'fr' 
                  ? 'Pour cette démo, utilisez votre ID comme PIN' 
                  : 'For this demo, use your ID as the PIN'}
              </p>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="p-2 bg-red-50 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                  <p className="ml-2 text-xs text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              onClick={handleAuthenticate}
              disabled={!selectedEmployeeId || !pin || loading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${compact ? 'text-xs' : 'text-sm'}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <User size={compact ? 14 : 16} className="mr-1" />
                  {i18n.language === 'fr' ? 'S\'identifier' : 'Identify'}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Employee Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                  {getEmployeeName().split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                    {getEmployeeName()}
                  </div>
                  <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {clockedInSince ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle size={compact ? 12 : 14} className="mr-1" />
                        {i18n.language === 'fr' ? 'Pointé depuis ' : 'Clocked in since '}
                        {format(clockedInSince, 'HH:mm')}
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-500">
                        <Clock size={compact ? 12 : 14} className="mr-1" />
                        {i18n.language === 'fr' ? 'Prêt à pointer' : 'Ready to clock in'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleReset}
                className={`text-gray-400 hover:text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}
              >
                {i18n.language === 'fr' ? 'Changer' : 'Change'}
              </button>
            </div>
            
            {/* Clock Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleClockAction('in')}
                disabled={!isClockingIn || loading}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border-2 transition-colors ${
                  isClockingIn
                    ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                } ${compact ? 'text-xs' : 'text-sm'}`}
              >
                <LogIn size={compact ? 16 : 20} className={isClockingIn ? 'text-green-500' : 'text-gray-400'} />
                <span className="mt-1 font-medium">
                  {i18n.language === 'fr' ? 'Arrivée' : 'Clock In'}
                </span>
              </button>
              
              <button
                onClick={() => handleClockAction('out')}
                disabled={isClockingIn || loading}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border-2 transition-colors ${
                  !isClockingIn
                    ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                } ${compact ? 'text-xs' : 'text-sm'}`}
              >
                <LogOut size={compact ? 16 : 20} className={!isClockingIn ? 'text-red-500' : 'text-gray-400'} />
                <span className="mt-1 font-medium">
                  {i18n.language === 'fr' ? 'Départ' : 'Clock Out'}
                </span>
              </button>
            </div>
            
            {/* Hours Summary */}
            {clockedInSince && (
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className={`text-blue-700 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                    {i18n.language === 'fr' ? 'Heures aujourd\'hui:' : 'Hours today:'}
                  </div>
                  <div className={`text-blue-800 font-bold ${compact ? 'text-xs' : 'text-sm'}`}>
                    {totalHoursToday.toFixed(2)}h
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeClockWidget;
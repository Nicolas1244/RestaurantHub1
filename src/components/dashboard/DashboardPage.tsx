import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Clock, 
  Fingerprint,
  AlertTriangle, 
  TrendingUp,
  Calendar,
  ChefHat,
  DollarSign,
  Percent,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { differenceInDays, format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Employee, Shift, TimeClock } from '../../types';
import toast from 'react-hot-toast';
import TimeClockWidget from '../timeclock/TimeClockWidget';

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    currentRestaurant,
    getRestaurantEmployees,
    getRestaurantSchedule, 
    setCurrentTab,
    userSettings
  } = useAppContext();

  const employees = currentRestaurant ? getRestaurantEmployees(currentRestaurant.id) : [];
  const schedule = currentRestaurant ? getRestaurantSchedule(currentRestaurant.id) : undefined;
  const shifts = schedule?.shifts || [];

  // CRITICAL: Contract end notifications - only show when relevant
  useEffect(() => {
    if (!currentRestaurant || employees.length === 0) return;

    const checkContractEndNotifications = () => {
      const today = new Date();
      const upcomingEnds = employees.filter(emp => 
        emp.contractType !== 'CDI' && 
        emp.endDate && 
        differenceInDays(new Date(emp.endDate), today) <= (emp.notificationDays || 30) &&
        differenceInDays(new Date(emp.endDate), today) > 0 // Only future end dates
      );

      // CRITICAL: Show toast notifications for contract ends
      upcomingEnds.forEach(employee => {
        const daysRemaining = differenceInDays(new Date(employee.endDate!), today);
        const endDate = formatContractEndDate(employee.endDate!);
        
        if (daysRemaining <= 3) {
          // Critical: Contract ending in 3 days or less
          toast.error(
            `⚠️ Contrat de ${employee.firstName} ${employee.lastName} se termine le ${endDate} (${daysRemaining} jour${daysRemaining > 1 ? 's' : ''})`,
            {
              duration: 8000,
              id: `contract-end-${employee.id}`, // Prevent duplicates
              style: {
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#991B1B',
              },
            }
          );
        } else if (daysRemaining <= 7) {
          // Warning: Contract ending within a week
          toast(
            `📅 Contrat de ${employee.firstName} ${employee.lastName} se termine le ${endDate} (${daysRemaining} jours)`,
            {
              duration: 6000,
              id: `contract-warning-${employee.id}`,
              icon: '⚠️',
              style: {
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#92400E',
              },
            }
          );
        } else if (daysRemaining <= 14) {
          // Info: Contract ending within two weeks
          toast(
            `📋 Contrat de ${employee.firstName} ${employee.lastName} se termine le ${endDate} (${daysRemaining} jours)`,
            {
              duration: 4000,
              id: `contract-info-${employee.id}`,
              icon: 'ℹ️',
              style: {
                background: '#DBEAFE',
                border: '1px solid #BFDBFE',
                color: '#1E40AF',
              },
            }
          );
        }
      });
    };

    // Check immediately and then every 5 minutes
    checkContractEndNotifications();
    const interval = setInterval(checkContractEndNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentRestaurant, employees, i18n.language]);

  if (!currentRestaurant) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-lg text-gray-500">
          {t('common.selectRestaurantPrompt')}
        </p>
      </div>
    );
  }

  // Calculate schedule metrics
  const calculateScheduleMetrics = () => {
    let totalHours = 0;
    const uniqueEmployees = new Set();

    shifts.forEach(shift => {
      const [startHour, startMinute] = shift.start.split(':').map(Number);
      const [endHour, endMinute] = shift.end.split(':').map(Number);
      const hours = endHour - startHour + (endMinute - startMinute) / 60;
      
      if (!shift.status) {
        totalHours += hours;
      }
      uniqueEmployees.add(shift.employeeId);
    });

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      uniqueEmployees: uniqueEmployees.size,
      totalShifts: shifts.filter(s => !s.status).length
    };
  };

  // CRITICAL: Helper function to format contract end dates in French
  const formatContractEndDate = (dateString: string): string => {
    const date = new Date(dateString);
    
    if (i18n.language === 'fr') {
      // French format: "20 Mars 2025" with proper capitalization
      const formattedDate = format(date, 'd MMMM yyyy', { locale: fr });
      return formattedDate.replace(/\b\w/g, (char) => char.toUpperCase());
    } else {
      // English format: "Mar 20, 2025"
      return format(date, 'MMM d, yyyy');
    }
  };

  const { totalHours, uniqueEmployees, totalShifts } = calculateScheduleMetrics();

  // Placeholder financial data
  const financialData = {
    estimatedRevenue: 2500,
    laborCostPercentage: (totalHours * 15 / 2500) * 100, // Simplified calculation
    averageTicket: 35,
    projectedCovers: 75
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {currentRestaurant.name}
        </h2>
        <p className="text-gray-500">{currentRestaurant.location}</p>
      </div>

      {/* Schedule Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="text-blue-600 mr-3" size={24} />
              <h3 className="text-lg font-medium text-gray-800">
                {t('dashboard.scheduleMetrics')}
              </h3>
            </div>
            <button 
              onClick={() => setCurrentTab('schedule')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {t('common.viewSchedule')}
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('dashboard.plannedHours')}</span>
              <span className="text-lg font-semibold">{totalHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('dashboard.scheduledEmployees')}</span>
              <span className="text-lg font-semibold">{uniqueEmployees}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('dashboard.totalShifts')}</span>
              <span className="text-lg font-semibold">{totalShifts}</span>
            </div>
          </div>
        </div>

        {/* CRITICAL: Simplified Alerts Section - No persistent blocks */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-orange-600 mr-3" size={24} />
              <h3 className="text-lg font-medium text-gray-800">
                {t('dashboard.alerts')}
              </h3>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="text-green-600" size={24} />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Surveillance active des contrats
              </p>
              <p className="text-xs text-gray-500">
                Les notifications apparaîtront automatiquement pour les échéances importantes
              </p>
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <TrendingUp className="text-green-600 mr-3" size={24} />
            <h3 className="text-lg font-medium text-gray-800">
              {t('dashboard.financialSnapshot')}
            </h3>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('dashboard.estimatedRevenue')}</span>
              <span className="text-lg font-semibold">€{financialData.estimatedRevenue}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('dashboard.laborCost')}</span>
              <span className="text-lg font-semibold">
                {financialData.laborCostPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('dashboard.projectedCovers')}</span>
              <span className="text-lg font-semibold">{financialData.projectedCovers}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Clock Widget - Only show if enabled in settings */}
      {userSettings?.timeClockEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Fingerprint className="text-indigo-600 mr-3" size={24} />
                <h3 className="text-lg font-medium text-gray-800">
                  {i18n.language === 'fr' ? 'Badgeuse' : 'Time Clock'}
                </h3>
              </div>
              <button 
                onClick={() => setCurrentTab('timeclock')}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {i18n.language === 'fr' ? 'Voir tous les pointages' : 'View all time clock records'}
              </button>
            </div>
            
            <TimeClockWidget 
              restaurantId={currentRestaurant?.id || ''}
              employees={employees}
              compact={true}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Clock className="text-blue-600 mr-3" size={24} />
              <h3 className="text-lg font-medium text-gray-800">
                {i18n.language === 'fr' ? 'Activité Récente' : 'Recent Activity'}
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Mock recent activity items */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {employees[0]?.firstName} {employees[0]?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {i18n.language === 'fr' ? 'Pointage d\'arrivée à 08:45' : 'Clocked in at 08:45'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {i18n.language === 'fr' ? 'Il y a 35 minutes' : '35 minutes ago'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <LogOut size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {employees[1]?.firstName} {employees[1]?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {i18n.language === 'fr' ? 'Pointage de départ à 17:15' : 'Clocked out at 17:15'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {i18n.language === 'fr' ? 'Hier' : 'Yesterday'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                  <AlertTriangle size={16} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {employees[2]?.firstName} {employees[2]?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {i18n.language === 'fr' ? 'Pointage en retard de 15 minutes' : 'Late clock in by 15 minutes'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {i18n.language === 'fr' ? 'Hier' : 'Yesterday'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentTab('timeclock')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {i18n.language === 'fr' ? 'Voir tous les pointages →' : 'View all time clock records →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setCurrentTab('schedule')}
          className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
        >
          <Calendar className="text-blue-600 mr-3" size={24} />
          <div className="text-left">
            <h4 className="font-medium text-gray-800">{t('dashboard.viewSchedule')}</h4>
            <p className="text-sm text-gray-500">{t('dashboard.manageShifts')}</p>
          </div>
        </button>

        <button
          onClick={() => setCurrentTab('staff')}
          className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
        >
          <Users className="text-purple-600 mr-3" size={24} />
          <div className="text-left">
            <h4 className="font-medium text-gray-800">{t('dashboard.manageStaff')}</h4>
            <p className="text-sm text-gray-500">{t('dashboard.viewEmployees')}</p>
          </div>
        </button>

        <button
          className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
        >
          <ChefHat className="text-orange-600 mr-3" size={24} />
          <div className="text-left">
            <h4 className="font-medium text-gray-800">{t('dashboard.restaurantDetails')}</h4>
            <p className="text-sm text-gray-500">{t('dashboard.updateInfo')}</p>
          </div>
        </button>

        <button
          className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
        >
          <DollarSign className="text-green-600 mr-3" size={24} />
          <div className="text-left">
            <h4 className="font-medium text-gray-800">{t('dashboard.financialReports')}</h4>
            <p className="text-sm text-gray-500">{t('dashboard.viewMetrics')}</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
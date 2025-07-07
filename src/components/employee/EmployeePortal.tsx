import React from 'react';
import { User, Calendar, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import DocumentManager from '../hr/DocumentManager';
import TimeClockWidget from '../timeclock/TimeClockWidget';

const EmployeePortal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { currentRestaurant, getRestaurantEmployees, getRestaurantSchedule } = useAppContext();
  
  // Get employee data if available
  const employee = profile?.restaurantId && currentRestaurant
    ? getRestaurantEmployees(profile.restaurantId).find(e => e.email === profile.email)
    : null;
  
  // Get employee schedule if available
  const schedule = profile?.restaurantId
    ? getRestaurantSchedule(profile.restaurantId)
    : undefined;
  
  // Get employee shifts
  const employeeShifts = employee && schedule
    ? schedule.shifts.filter(s => s.employeeId === employee.id)
    : [];
  
  // Get upcoming shifts (next 7 days)
  const today = new Date();
  const upcomingShifts = employeeShifts.filter(shift => {
    const shiftDate = new Date(today);
    shiftDate.setDate(today.getDate() + shift.day);
    return shiftDate >= today;
  }).sort((a, b) => a.day - b.day).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="text-blue-600" size={28} />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {t('employee.portal')}
          </h2>
          <p className="text-gray-500">
            {profile?.firstName && profile?.lastName
              ? t('employee.welcomeBack', { name: `${profile.firstName} ${profile.lastName}` })
              : t('employee.welcome')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-blue-600" size={20} />
            <h3 className="text-lg font-medium text-gray-800">
              {t('employee.myInfo')}
            </h3>
          </div>
          
          {employee ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mr-4">
                  {employee.profilePicture ? (
                    <img 
                      src={employee.profilePicture} 
                      alt={`${employee.firstName} ${employee.lastName}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </h4>
                  <p className="text-gray-600">{employee.position}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {employee.contractType} • {employee.weeklyHours}h
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">{t('staff.email')}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.email || '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">{t('staff.phoneNumber')}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.phone}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">{t('staff.startDate')}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.startDate}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">{t('staff.endDate')}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.endDate || '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">
                {t('employee.noEmployeeRecord')}
              </p>
            </div>
          )}
        </div>

        {/* Time Clock Widget */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-indigo-600" size={20} />
            <h3 className="text-lg font-medium text-gray-800">
              {t('timeclock.title')}
            </h3>
          </div>
          
          {employee && currentRestaurant ? (
            <TimeClockWidget
              restaurantId={currentRestaurant.id}
              employees={[employee]}
            />
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">
                {t('employee.timeClockUnavailable')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Shifts */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-green-600" size={20} />
          <h3 className="text-lg font-medium text-gray-800">
            {t('employee.upcomingShifts')}
          </h3>
        </div>
        
        {upcomingShifts.length > 0 ? (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    {t('schedule.day')}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {t('shifts.startTime')}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {t('shifts.endTime')}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {t('shifts.position')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {upcomingShifts.map(shift => {
                  const shiftDate = new Date(today);
                  shiftDate.setDate(today.getDate() + shift.day);
                  
                  return (
                    <tr key={shift.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {shiftDate.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shift.start}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shift.end}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shift.position}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">
              {t('employee.noUpcomingShifts')}
            </p>
          </div>
        )}
      </div>

      {/* Documents Section */}
      {employee && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-purple-600" size={20} />
            <h3 className="text-lg font-medium text-gray-800">
              {i18n.language === 'fr' ? 'Mes Documents' : 'My Documents'}
            </h3>
          </div>
          
          <DocumentManager 
            employeeId={employee.id}
            restrictToEmployee={true}
          />
        </div>
      )}

      {/* Recent Time Clock Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-orange-600" size={20} />
          <h3 className="text-lg font-medium text-gray-800">
            {t('employee.recentActivity')}
          </h3>
        </div>
        
        <div className="text-center py-6">
          <p className="text-gray-500">
            {t('employee.noRecentActivity')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
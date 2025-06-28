import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { PerformanceMetrics, Shift, DateRange } from '../../types';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HoursAnalysisProps {
  metrics: PerformanceMetrics[];
  shifts: Shift[];
  dateRange: DateRange;
}

const HoursAnalysis: React.FC<HoursAnalysisProps> = ({ metrics, shifts, dateRange }) => {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'hours' | 'efficiency'>('hours');

  // CRITICAL: Format date based on locale
  const formatDate = (dateString: string): string => {
    const date = parseISO(dateString);
    if (i18n.language === 'fr') {
      return format(date, 'EEE d MMM', { locale: fr }).replace(/^\w/, c => c.toUpperCase());
    }
    return format(date, 'EEE, MMM d');
  };

  // CRITICAL: Calculate hours metrics
  const totalHoursWorked = metrics.reduce((sum, m) => sum + m.totalHoursWorked, 0);
  const totalScheduledHours = metrics.reduce((sum, m) => sum + m.scheduledHours, 0);
  const totalOvertimeHours = metrics.reduce((sum, m) => sum + m.overtimeHours, 0);
  const totalAbsenceHours = metrics.reduce((sum, m) => sum + m.absenceHours, 0);
  
  // CRITICAL: Calculate efficiency
  const efficiency = totalScheduledHours > 0 
    ? (totalHoursWorked / totalScheduledHours) * 100 
    : 100;

  // CRITICAL: Sort data for charts
  const sortedMetrics = [...metrics].sort((a, b) => a.date.localeCompare(b.date));

  // CRITICAL: Get max value for chart scaling
  const maxHours = Math.max(
    ...metrics.map(m => Math.max(m.totalHoursWorked, m.scheduledHours)),
    1
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mr-3">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {i18n.language === 'fr' ? 'Analyse des Heures' : 'Hours Analysis'}
              </h3>
              <p className="text-sm text-gray-500">
                {format(parseISO(dateRange.start), 'dd/MM/yyyy')} - {format(parseISO(dateRange.end), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          {/* View selector */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('hours')}
              className={`px-3 py-1.5 text-sm ${
                view === 'hours'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i18n.language === 'fr' ? 'Heures' : 'Hours'}
            </button>
            <button
              onClick={() => setView('efficiency')}
              className={`px-3 py-1.5 text-sm ${
                view === 'efficiency'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i18n.language === 'fr' ? 'Efficacité' : 'Efficiency'}
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <Clock size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Heures Travaillées' : 'Hours Worked'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {totalHoursWorked.toFixed(1)}h
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <BarChart3 size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Heures Planifiées' : 'Scheduled Hours'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {totalScheduledHours.toFixed(1)}h
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <AlertTriangle size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Heures Supp.' : 'Overtime'}
              </span>
            </div>
            <div className="text-lg font-bold text-orange-600">
              {totalOvertimeHours.toFixed(1)}h
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <CheckCircle size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Efficacité' : 'Efficiency'}
              </span>
            </div>
            <div className={`text-lg font-bold ${efficiency >= 95 ? 'text-green-600' : efficiency >= 85 ? 'text-blue-600' : 'text-orange-600'}`}>
              {efficiency.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-6">
        {/* Hours view */}
        {view === 'hours' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {i18n.language === 'fr' ? 'Heures travaillées vs planifiées' : 'Worked vs Scheduled Hours'}
            </h4>
            
            <div className="h-64 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                <span>{Math.round(maxHours)}h</span>
                <span>{Math.round(maxHours * 0.75)}h</span>
                <span>{Math.round(maxHours * 0.5)}h</span>
                <span>{Math.round(maxHours * 0.25)}h</span>
                <span>0h</span>
              </div>
              
              {/* Chart grid */}
              <div className="absolute left-12 right-0 top-0 bottom-0 flex flex-col justify-between">
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
              </div>
              
              {/* Grouped bars */}
              <div className="absolute left-12 right-0 top-0 bottom-0 flex items-end">
                <div className="flex-1 flex items-end justify-around h-full">
                  {sortedMetrics.map((metric, index) => (
                    <div key={index} className="flex items-end space-x-1">
                      {/* Worked hours bar */}
                      <div 
                        className="w-6 bg-green-500 hover:bg-green-600 transition-colors rounded-t"
                        style={{ height: `${(metric.totalHoursWorked / maxHours) * 100}%` }}
                        title={`${i18n.language === 'fr' ? 'Travaillées' : 'Worked'}: ${metric.totalHoursWorked.toFixed(1)}h`}
                      ></div>
                      
                      {/* Scheduled hours bar */}
                      <div 
                        className="w-6 bg-blue-400 hover:bg-blue-500 transition-colors rounded-t"
                        style={{ height: `${(metric.scheduledHours / maxHours) * 100}%` }}
                        title={`${i18n.language === 'fr' ? 'Planifiées' : 'Scheduled'}: ${metric.scheduledHours.toFixed(1)}h`}
                      ></div>
                      
                      {/* Date label */}
                      <div className="absolute -bottom-6 text-xs text-gray-500 transform -rotate-45 origin-top-left" style={{ left: `${index * (100 / sortedMetrics.length) + (100 / sortedMetrics.length / 2)}%` }}>
                        {formatDate(metric.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-12 flex justify-center gap-6">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-700">
                  {i18n.language === 'fr' ? 'Heures travaillées' : 'Worked hours'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                <span className="text-xs text-gray-700">
                  {i18n.language === 'fr' ? 'Heures planifiées' : 'Scheduled hours'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Efficiency view */}
        {view === 'efficiency' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {i18n.language === 'fr' ? 'Efficacité des heures planifiées' : 'Scheduled Hours Efficiency'}
            </h4>
            
            <div className="flex justify-center mb-6">
              {/* Gauge chart */}
              <div className="relative w-48 h-24">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  {/* Background arc */}
                  <path 
                    d="M10,50 A40,40 0 0,1 90,50" 
                    fill="none" 
                    stroke="#E5E7EB" 
                    strokeWidth="10" 
                  />
                  
                  {/* Value arc */}
                  <path 
                    d="M10,50 A40,40 0 0,1 90,50" 
                    fill="none" 
                    stroke={
                      efficiency >= 95 ? '#10B981' : 
                      efficiency >= 85 ? '#3B82F6' : 
                      efficiency >= 75 ? '#F59E0B' : 
                      '#EF4444'
                    }
                    strokeWidth="10" 
                    strokeDasharray={`${efficiency * 1.26} 126`}
                  />
                  
                  {/* Needle */}
                  <line 
                    x1="50" 
                    y1="50" 
                    x2="50" 
                    y2="20"
                    stroke="#374151" 
                    strokeWidth="2"
                    transform={`rotate(${(efficiency - 50) * 1.8}, 50, 50)`}
                  />
                  
                  {/* Center point */}
                  <circle cx="50" cy="50" r="3" fill="#374151" />
                </svg>
                
                {/* Value label */}
                <div className="absolute bottom-0 left-0 right-0 text-center">
                  <div className={`text-2xl font-bold ${
                    efficiency >= 95 ? 'text-green-600' : 
                    efficiency >= 85 ? 'text-blue-600' : 
                    efficiency >= 75 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {efficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {i18n.language === 'fr' ? 'Efficacité' : 'Efficiency'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Efficiency breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  {i18n.language === 'fr' ? 'Répartition des heures' : 'Hours breakdown'}
                </h5>
                
                <div className="space-y-3">
                  {/* Worked hours */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {i18n.language === 'fr' ? 'Heures travaillées' : 'Worked hours'}
                      </span>
                      <span className="font-medium text-gray-800">
                        {totalHoursWorked.toFixed(1)}h
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Scheduled hours */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {i18n.language === 'fr' ? 'Heures planifiées' : 'Scheduled hours'}
                      </span>
                      <span className="font-medium text-gray-800">
                        {totalScheduledHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(totalScheduledHours / totalHoursWorked) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Overtime hours */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {i18n.language === 'fr' ? 'Heures supplémentaires' : 'Overtime hours'}
                      </span>
                      <span className="font-medium text-orange-600">
                        {totalOvertimeHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${(totalOvertimeHours / totalHoursWorked) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Absence hours */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {i18n.language === 'fr' ? 'Heures d\'absence' : 'Absence hours'}
                      </span>
                      <span className="font-medium text-gray-800">
                        {totalAbsenceHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-500 h-2 rounded-full" 
                        style={{ width: `${(totalAbsenceHours / totalHoursWorked) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  {i18n.language === 'fr' ? 'Analyse d\'efficacité' : 'Efficiency analysis'}
                </h5>
                
                <div className="space-y-4">
                  {/* Efficiency rating */}
                  <div className="flex items-center">
                    {efficiency >= 95 ? (
                      <CheckCircle size={20} className="text-green-500 mr-2" />
                    ) : efficiency >= 85 ? (
                      <CheckCircle size={20} className="text-blue-500 mr-2" />
                    ) : (
                      <AlertTriangle size={20} className="text-orange-500 mr-2" />
                    )}
                    
                    <div>
                      <div className="font-medium text-gray-800">
                        {efficiency >= 95
                          ? (i18n.language === 'fr' ? 'Excellente efficacité' : 'Excellent efficiency')
                          : efficiency >= 85
                          ? (i18n.language === 'fr' ? 'Bonne efficacité' : 'Good efficiency')
                          : (i18n.language === 'fr' ? 'Efficacité à améliorer' : 'Efficiency needs improvement')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {efficiency >= 95
                          ? (i18n.language === 'fr' ? 'Planification optimale des ressources' : 'Optimal resource planning')
                          : efficiency >= 85
                          ? (i18n.language === 'fr' ? 'Bonne utilisation des ressources' : 'Good resource utilization')
                          : (i18n.language === 'fr' ? 'Optimisation possible des plannings' : 'Schedule optimization possible')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h6 className="text-xs font-medium text-gray-700 mb-2">
                      {i18n.language === 'fr' ? 'Recommandations' : 'Recommendations'}
                    </h6>
                    
                    <ul className="text-xs text-gray-600 space-y-2">
                      {efficiency < 85 && (
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-1">•</span>
                          {i18n.language === 'fr' 
                            ? 'Ajustez les plannings pour mieux correspondre aux besoins réels'
                            : 'Adjust schedules to better match actual needs'
                          }
                        </li>
                      )}
                      {totalOvertimeHours > totalHoursWorked * 0.1 && (
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-1">•</span>
                          {i18n.language === 'fr' 
                            ? 'Réduisez les heures supplémentaires en améliorant la planification'
                            : 'Reduce overtime by improving scheduling'
                          }
                        </li>
                      )}
                      {efficiency >= 95 && (
                        <li className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {i18n.language === 'fr' 
                            ? 'Continuez avec cette excellente planification des ressources'
                            : 'Continue with this excellent resource planning'
                          }
                        </li>
                      )}
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-1">•</span>
                        {i18n.language === 'fr' 
                          ? 'Utilisez les prévisions pour optimiser les plannings futurs'
                          : 'Use forecasts to optimize future schedules'
                        }
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HoursAnalysis;
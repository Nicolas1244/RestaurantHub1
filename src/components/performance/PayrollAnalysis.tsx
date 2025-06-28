import React, { useState } from 'react';
import { DollarSign, Users, Percent, BarChart3, PieChart } from 'lucide-react';
import { PerformanceMetrics, Employee, DateRange } from '../../types';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PayrollAnalysisProps {
  metrics: PerformanceMetrics[];
  employees: Employee[];
  dateRange: DateRange;
}

const PayrollAnalysis: React.FC<PayrollAnalysisProps> = ({ metrics, employees, dateRange }) => {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'ratio' | 'distribution'>('ratio');

  // CRITICAL: Format date based on locale
  const formatDate = (dateString: string): string => {
    const date = parseISO(dateString);
    if (i18n.language === 'fr') {
      return format(date, 'EEE d MMM', { locale: fr }).replace(/^\w/, c => c.toUpperCase());
    }
    return format(date, 'EEE, MMM d');
  };

  // CRITICAL: Calculate payroll metrics
  const totalTurnover = metrics.reduce((sum, m) => sum + m.turnover, 0);
  const totalPayroll = metrics.reduce((sum, m) => sum + m.grossPayrollMass, 0);
  const averageRatio = metrics.reduce((sum, m) => sum + m.staffCostRatio, 0) / metrics.length;
  
  // CRITICAL: Calculate position distribution
  const positionDistribution: Record<string, number> = {};
  
  employees.forEach(employee => {
    if (!positionDistribution[employee.position]) {
      positionDistribution[employee.position] = 0;
    }
    
    // Estimate salary based on position and contract type
    let estimatedSalary = 0;
    switch (employee.position) {
      case 'Operations Manager':
        estimatedSalary = 4000;
        break;
      case 'Chef de Cuisine':
        estimatedSalary = 3200;
        break;
      case 'Second de Cuisine':
        estimatedSalary = 2800;
        break;
      case 'Chef de Partie':
        estimatedSalary = 2400;
        break;
      case 'Commis de Cuisine':
        estimatedSalary = 1800;
        break;
      case 'Plongeur':
        estimatedSalary = 1600;
        break;
      case 'Barman/Barmaid':
        estimatedSalary = 2000;
        break;
      case 'Waiter(s)':
        estimatedSalary = 1800;
        break;
      default:
        estimatedSalary = 1800;
    }
    
    // Adjust for contract type
    if (employee.contractType === 'CDD') {
      estimatedSalary *= 1.1; // 10% premium for fixed-term
    } else if (employee.contractType === 'Extra') {
      estimatedSalary *= 1.2; // 20% premium for extra
    }
    
    // Add social charges (42% in France)
    estimatedSalary *= 1.42;
    
    // Distribute monthly salary across the period
    const daysInPeriod = metrics.length;
    const dailySalary = estimatedSalary / 30; // Approximate daily cost
    
    positionDistribution[employee.position] += dailySalary * daysInPeriod;
  });

  // CRITICAL: Calculate category distribution
  const categoryDistribution = {
    'Cuisine': 0,
    'Salle': 0
  };
  
  Object.entries(positionDistribution).forEach(([position, amount]) => {
    const employee = employees.find(e => e.position === position);
    if (employee) {
      categoryDistribution[employee.category] += amount;
    }
  });

  // CRITICAL: Sort data for charts
  const sortedMetrics = [...metrics].sort((a, b) => a.date.localeCompare(b.date));

  // CRITICAL: Get max value for chart scaling
  const maxRatio = Math.max(...metrics.map(m => m.staffCostRatio), 50);

  // CRITICAL: Get color for ratio
  const getRatioColor = (ratio: number): string => {
    if (ratio <= 25) return 'text-green-600';
    if (ratio <= 30) return 'text-blue-600';
    if (ratio <= 35) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mr-3">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {i18n.language === 'fr' ? 'Analyse de la Masse Salariale' : 'Payroll Analysis'}
              </h3>
              <p className="text-sm text-gray-500">
                {format(parseISO(dateRange.start), 'dd/MM/yyyy')} - {format(parseISO(dateRange.end), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          {/* View selector */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('ratio')}
              className={`px-3 py-1.5 text-sm ${
                view === 'ratio'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i18n.language === 'fr' ? 'Ratio CA' : 'Turnover Ratio'}
            </button>
            <button
              onClick={() => setView('distribution')}
              className={`px-3 py-1.5 text-sm ${
                view === 'distribution'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i18n.language === 'fr' ? 'Distribution' : 'Distribution'}
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <DollarSign size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Masse Salariale' : 'Payroll Mass'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {totalPayroll.toLocaleString('fr-FR')}€
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <Percent size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Ratio Moyen' : 'Average Ratio'}
              </span>
            </div>
            <div className={`text-lg font-bold ${getRatioColor(averageRatio)}`}>
              {averageRatio.toFixed(1)}%
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <Users size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Employés' : 'Employees'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {employees.length}
            </div>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-6">
        {/* Ratio view */}
        {view === 'ratio' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {i18n.language === 'fr' ? 'Évolution du ratio Masse Salariale / CA' : 'Staff Cost Ratio Evolution'}
            </h4>
            
            <div className="h-64 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                <span>{Math.round(maxRatio)}%</span>
                <span>{Math.round(maxRatio * 0.75)}%</span>
                <span>{Math.round(maxRatio * 0.5)}%</span>
                <span>{Math.round(maxRatio * 0.25)}%</span>
                <span>0%</span>
              </div>
              
              {/* Chart grid */}
              <div className="absolute left-12 right-0 top-0 bottom-0 flex flex-col justify-between">
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
              </div>
              
              {/* Target line */}
              <div 
                className="absolute left-12 right-0 border-t-2 border-dashed border-green-500 z-10"
                style={{ top: `${100 - (30 / maxRatio * 100)}%` }}
              >
                <div className="absolute right-0 -top-6 bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                  {i18n.language === 'fr' ? 'Cible: 30%' : 'Target: 30%'}
                </div>
              </div>
              
              {/* Bars */}
              <div className="absolute left-12 right-0 top-0 bottom-0 flex items-end">
                <div className="flex-1 flex items-end justify-around h-full">
                  {sortedMetrics.map((metric, index) => {
                    const ratio = metric.staffCostRatio;
                    const ratioColor = 
                      ratio <= 25 ? 'bg-green-500' :
                      ratio <= 30 ? 'bg-blue-500' :
                      ratio <= 35 ? 'bg-yellow-500' :
                      'bg-red-500';
                    
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className={`w-12 ${ratioColor} hover:opacity-80 transition-opacity rounded-t`}
                          style={{ height: `${(ratio / maxRatio) * 100}%` }}
                          title={`${ratio.toFixed(1)}%`}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                          {formatDate(metric.date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-8 flex justify-center gap-6">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-700">≤ 25%</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-xs text-gray-700">≤ 30%</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-xs text-gray-700">≤ 35%</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-xs text-gray-700">&gt; 35%</span>
              </div>
            </div>
          </div>
        )}

        {/* Distribution view */}
        {view === 'distribution' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {i18n.language === 'fr' ? 'Distribution de la masse salariale' : 'Payroll Distribution'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Position distribution */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  {i18n.language === 'fr' ? 'Par poste' : 'By position'}
                </h5>
                
                <div className="space-y-3">
                  {Object.entries(positionDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([position, amount]) => {
                      const percentage = totalPayroll > 0 ? (amount / totalPayroll) * 100 : 0;
                      
                      return (
                        <div key={position} className="flex items-center">
                          <div className="w-32 text-xs text-gray-700 truncate">
                            {position}
                          </div>
                          <div className="flex-1 mx-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-20 text-right">
                            <span className="text-xs font-medium text-gray-700">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* Category distribution */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  {i18n.language === 'fr' ? 'Par catégorie' : 'By category'}
                </h5>
                
                <div className="flex justify-center">
                  {/* Pie chart visualization */}
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Cuisine slice */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="transparent"
                        stroke="#8B5CF6" 
                        strokeWidth="20" 
                        strokeDasharray={`${categoryDistribution['Cuisine'] / (categoryDistribution['Cuisine'] + categoryDistribution['Salle']) * 251.2} 251.2`}
                        transform="rotate(-90 50 50)"
                      />
                      {/* Salle slice */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="transparent"
                        stroke="#EC4899" 
                        strokeWidth="20" 
                        strokeDasharray={`${categoryDistribution['Salle'] / (categoryDistribution['Cuisine'] + categoryDistribution['Salle']) * 251.2} 251.2`}
                        strokeDashoffset={`-${categoryDistribution['Cuisine'] / (categoryDistribution['Cuisine'] + categoryDistribution['Salle']) * 251.2}`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-xs text-gray-700">
                      {i18n.language === 'fr' ? 'Cuisine' : 'Kitchen'} ({(categoryDistribution['Cuisine'] / (categoryDistribution['Cuisine'] + categoryDistribution['Salle']) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
                    <span className="text-xs text-gray-700">
                      {i18n.language === 'fr' ? 'Salle' : 'Front of House'} ({(categoryDistribution['Salle'] / (categoryDistribution['Cuisine'] + categoryDistribution['Salle']) * 100).toFixed(1)}%)
                    </span>
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

export default PayrollAnalysis;
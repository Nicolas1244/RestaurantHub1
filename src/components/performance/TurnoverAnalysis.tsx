import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, ArrowRight, DollarSign, Users } from 'lucide-react';
import { PerformanceMetrics, POSData, DateRange } from '../../types';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TurnoverAnalysisProps {
  posData: POSData[];
  metrics: PerformanceMetrics[];
  dateRange: DateRange;
}

const TurnoverAnalysis: React.FC<TurnoverAnalysisProps> = ({ posData, metrics, dateRange }) => {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'daily' | 'service' | 'category'>('daily');

  // CRITICAL: Format date based on locale
  const formatDate = (dateString: string): string => {
    const date = parseISO(dateString);
    if (i18n.language === 'fr') {
      return format(date, 'EEE d MMM', { locale: fr }).replace(/^\w/, c => c.toUpperCase());
    }
    return format(date, 'EEE, MMM d');
  };

  // CRITICAL: Calculate totals
  const totalTurnover = metrics.reduce((sum, m) => sum + m.turnover, 0);
  const totalCovers = metrics.reduce((sum, m) => sum + m.covers, 0);
  const averageCheck = totalCovers > 0 ? totalTurnover / totalCovers : 0;

  // CRITICAL: Calculate service breakdown
  const lunchTotal = posData.reduce((sum, d) => sum + (d.salesByService?.lunch || 0), 0);
  const dinnerTotal = posData.reduce((sum, d) => sum + (d.salesByService?.dinner || 0), 0);
  const lunchPercentage = totalTurnover > 0 ? (lunchTotal / totalTurnover) * 100 : 0;
  const dinnerPercentage = totalTurnover > 0 ? (dinnerTotal / totalTurnover) * 100 : 0;

  // CRITICAL: Calculate category breakdown
  const categories: Record<string, number> = {};
  posData.forEach(day => {
    Object.entries(day.salesByCategory || {}).forEach(([category, amount]) => {
      categories[category] = (categories[category] || 0) + amount;
    });
  });

  // CRITICAL: Sort data for charts
  const sortedMetrics = [...metrics].sort((a, b) => a.date.localeCompare(b.date));

  // CRITICAL: Get max value for chart scaling
  const maxTurnover = Math.max(...metrics.map(m => m.turnover), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {i18n.language === 'fr' ? 'Analyse du Chiffre d\'Affaires' : 'Turnover Analysis'}
              </h3>
              <p className="text-sm text-gray-500">
                {format(parseISO(dateRange.start), 'dd/MM/yyyy')} - {format(parseISO(dateRange.end), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          {/* View selector */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('daily')}
              className={`px-3 py-1.5 text-sm ${
                view === 'daily'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i18n.language === 'fr' ? 'Journalier' : 'Daily'}
            </button>
            <button
              onClick={() => setView('service')}
              className={`px-3 py-1.5 text-sm ${
                view === 'service'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i18n.language === 'fr' ? 'Services' : 'Services'}
            </button>
            <button
              onClick={() => setView('category')}
              className={`px-3 py-1.5 text-sm ${
                view === 'category'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i18n.language === 'fr' ? 'Catégories' : 'Categories'}
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <DollarSign size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'CA Total' : 'Total Turnover'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {totalTurnover.toLocaleString('fr-FR')}€
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <Users size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Couverts' : 'Covers'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {totalCovers.toLocaleString('fr-FR')}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <TrendingUp size={14} className="mr-1" />
              <span className="text-xs font-medium">
                {i18n.language === 'fr' ? 'Ticket Moyen' : 'Average Check'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {averageCheck.toFixed(2)}€
            </div>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-6">
        {/* Daily view */}
        {view === 'daily' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {i18n.language === 'fr' ? 'Évolution du CA par jour' : 'Daily Turnover Evolution'}
            </h4>
            
            <div className="h-64 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                <span>{Math.round(maxTurnover).toLocaleString('fr-FR')}€</span>
                <span>{Math.round(maxTurnover * 0.75).toLocaleString('fr-FR')}€</span>
                <span>{Math.round(maxTurnover * 0.5).toLocaleString('fr-FR')}€</span>
                <span>{Math.round(maxTurnover * 0.25).toLocaleString('fr-FR')}€</span>
                <span>0€</span>
              </div>
              
              {/* Chart grid */}
              <div className="absolute left-12 right-0 top-0 bottom-0 flex flex-col justify-between">
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
                <div className="border-b border-gray-200 h-0"></div>
              </div>
              
              {/* Bars */}
              <div className="absolute left-12 right-0 top-0 bottom-0 flex items-end">
                <div className="flex-1 flex items-end justify-around h-full">
                  {sortedMetrics.map((metric, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-12 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                        style={{ height: `${(metric.turnover / maxTurnover) * 100}%` }}
                        title={`${metric.turnover.toLocaleString('fr-FR')}€`}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                        {formatDate(metric.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service view */}
        {view === 'service' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {i18n.language === 'fr' ? 'Répartition par service' : 'Service Breakdown'}
            </h4>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Lunch service */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 mr-2">
                      <Calendar size={16} />
                    </div>
                    <span className="font-medium text-gray-800">
                      {i18n.language === 'fr' ? 'Déjeuner' : 'Lunch'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {lunchPercentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="text-xl font-bold text-gray-900 mb-2">
                  {lunchTotal.toLocaleString('fr-FR')}€
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full" 
                    style={{ width: `${lunchPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Dinner service */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-2">
                      <Calendar size={16} />
                    </div>
                    <span className="font-medium text-gray-800">
                      {i18n.language === 'fr' ? 'Dîner' : 'Dinner'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {dinnerPercentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="text-xl font-bold text-gray-900 mb-2">
                  {dinnerTotal.toLocaleString('fr-FR')}€
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-500 h-2.5 rounded-full" 
                    style={{ width: `${dinnerPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Service comparison */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-sm text-gray-700">
                    {i18n.language === 'fr' ? 'Déjeuner' : 'Lunch'}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {lunchTotal.toLocaleString('fr-FR')}€
                </div>
                <ArrowRight size={16} className="text-gray-400" />
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                  <span className="text-sm text-gray-700">
                    {i18n.language === 'fr' ? 'Dîner' : 'Dinner'}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {dinnerTotal.toLocaleString('fr-FR')}€
                </div>
              </div>
              
              <div className="mt-3 text-sm text-gray-600">
                {i18n.language === 'fr' 
                  ? `Le service du dîner génère ${(dinnerPercentage - lunchPercentage).toFixed(1)}% de CA en ${dinnerPercentage > lunchPercentage ? 'plus' : 'moins'} que le déjeuner.`
                  : `Dinner service generates ${(dinnerPercentage - lunchPercentage).toFixed(1)}% ${dinnerPercentage > lunchPercentage ? 'more' : 'less'} revenue than lunch.`
                }
              </div>
            </div>
          </div>
        )}

        {/* Category view */}
        {view === 'category' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {i18n.language === 'fr' ? 'Répartition par catégorie' : 'Category Breakdown'}
            </h4>
            
            <div className="space-y-4">
              {Object.entries(categories).map(([category, amount]) => {
                const percentage = totalTurnover > 0 ? (amount / totalTurnover) * 100 : 0;
                
                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-lg font-bold text-gray-900">
                        {amount.toLocaleString('fr-FR')}€
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnoverAnalysis;
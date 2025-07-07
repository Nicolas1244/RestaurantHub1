import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Clock, Target, BarChart3, Calendar, Settings, RefreshCw, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Minus, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppContext } from '../../contexts/AppContext';
import toast from 'react-hot-toast';

// Types for our performance data
interface KPI {
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  icon: React.ReactNode;
  color: string;
}

interface ChartData {
  date: string;
  value: number;
}

interface PerformanceDashboardProps {
  restaurantId: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ restaurantId }) => {
  const { t, i18n } = useTranslation();
  const { currentRestaurant } = useAppContext();
  
  // State for date range selection
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('week');
  const [customDateRange, setCustomDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  
  // State for loading and data
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [staffCostData, setStaffCostData] = useState<ChartData[]>([]);
  const [showConnectPOSModal, setShowConnectPOSModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    staffCost: true
  });

  // Load performance data on component mount and when dependencies change
  useEffect(() => {
    loadPerformanceData();
  }, [restaurantId, dateRange, customDateRange]);

  // Function to load performance data
  const loadPerformanceData = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would fetch data from an API
      // For now, we'll generate mock data
      
      // Generate date range based on selection
      const range = getDateRangeForPeriod(dateRange);
      
      // Generate mock KPIs
      const mockKpis = generateMockKPIs();
      setKpis(mockKpis);
      
      // Generate mock chart data
      const mockRevenueData = generateMockRevenueData(range);
      setRevenueData(mockRevenueData);
      
      const mockStaffCostData = generateMockStaffCostData(range);
      setStaffCostData(mockStaffCostData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      console.error('Failed to load performance data:', error);
      toast.error(i18n.language === 'fr' 
        ? 'Échec du chargement des données de performance' 
        : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  // Get date range based on selected period
  const getDateRangeForPeriod = (period: 'today' | 'week' | 'month' | 'year' | 'custom') => {
    const today = new Date();
    
    switch (period) {
      case 'today':
        return {
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      case 'week':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        return {
          start: format(weekStart, 'yyyy-MM-dd'),
          end: format(weekEnd, 'yyyy-MM-dd')
        };
      case 'month':
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        return {
          start: format(monthStart, 'yyyy-MM-dd'),
          end: format(monthEnd, 'yyyy-MM-dd')
        };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);
        return {
          start: format(yearStart, 'yyyy-MM-dd'),
          end: format(yearEnd, 'yyyy-MM-dd')
        };
      case 'custom':
        return customDateRange;
      default:
        return {
          start: format(subDays(today, 7), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
    }
  };

  // Generate mock KPIs
  const generateMockKPIs = (): KPI[] => {
    return [
      {
        title: i18n.language === 'fr' ? 'Chiffre d\'Affaires' : 'Revenue',
        value: 12580,
        unit: '€',
        trend: 'up',
        trendValue: 8.5,
        icon: <DollarSign size={20} />,
        color: 'blue'
      },
      {
        title: i18n.language === 'fr' ? 'Taux de Marge Brute' : 'Gross Margin Rate',
        value: 28.4,
        unit: '%',
        trend: 'down',
        trendValue: 2.1,
        icon: <Percent size={20} />,
        color: 'purple'
      },
      {
        title: i18n.language === 'fr' ? 'Ticket Moyen' : 'Average Ticket',
        value: 32.75,
        unit: '€',
        trend: 'up',
        trendValue: 1.2,
        icon: <Target size={20} />,
        color: 'green'
      },
      {
        title: i18n.language === 'fr' ? 'Couverts' : 'Covers',
        value: 384,
        unit: '',
        trend: 'up',
        trendValue: 5.8,
        icon: <Users size={20} />,
        color: 'orange'
      },
      {
        title: i18n.language === 'fr' ? 'Coût Horaire Moyen' : 'Average Hourly Cost',
        value: 14.25,
        unit: '€/h',
        trend: 'stable',
        trendValue: 0.3,
        icon: <Clock size={20} />,
        color: 'red'
      }
    ];
  };

  // Generate mock revenue data
  const generateMockRevenueData = (range: { start: string; end: string }): ChartData[] => {
    const data: ChartData[] = [];
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Generate realistic restaurant data
      const baseTurnover = isWeekend ? 2800 : 2200;
      const variation = (Math.random() - 0.5) * 600;
      const turnover = Math.max(1000, baseTurnover + variation);
      
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        value: Math.round(turnover)
      });
    }
    
    return data;
  };

  // Generate mock staff cost data
  const generateMockStaffCostData = (range: { start: string; end: string }): ChartData[] => {
    const data: ChartData[] = [];
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Generate realistic staff cost ratio
      const baseRatio = isWeekend ? 26 : 30;
      const variation = (Math.random() - 0.5) * 8;
      const ratio = Math.max(20, Math.min(40, baseRatio + variation));
      
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        value: Math.round(ratio * 10) / 10
      });
    }
    
    return data;
  };

  // Format date range for display
  const formatDateRange = () => {
    const range = getDateRangeForPeriod(dateRange);
    const start = parseISO(range.start);
    const end = parseISO(range.end);
    
    if (i18n.language === 'fr') {
      if (dateRange === 'today') {
        return format(start, 'd MMMM yyyy', { locale: fr });
      }
      return `${format(start, 'd MMMM', { locale: fr })} - ${format(end, 'd MMMM yyyy', { locale: fr })}`;
    } else {
      if (dateRange === 'today') {
        return format(start, 'MMMM d, yyyy');
      }
      return `${format(start, 'MMMM d')} - ${format(end, 'MMMM d, yyyy')}`;
    }
  };

  // Get period label
  const getPeriodLabel = (period: 'today' | 'week' | 'month' | 'year' | 'custom'): string => {
    switch (period) {
      case 'today':
        return i18n.language === 'fr' ? 'Aujourd\'hui' : 'Today';
      case 'week':
        return i18n.language === 'fr' ? 'Cette semaine' : 'This week';
      case 'month':
        return i18n.language === 'fr' ? 'Ce mois' : 'This month';
      case 'year':
        return i18n.language === 'fr' ? 'Cette année' : 'This year';
      case 'custom':
        return i18n.language === 'fr' ? 'Période personnalisée' : 'Custom period';
      default:
        return period;
    }
  };

  // Toggle section expansion
  const toggleSection = (section: 'revenue' | 'staffCost') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle connect POS button click
  const handleConnectPOS = () => {
    setShowConnectPOSModal(true);
  };

  // Handle manual entry button click
  const handleManualEntry = () => {
    setShowManualEntryModal(true);
  };

  // Render KPI card
  const renderKPICard = (kpi: KPI) => {
    const getTrendIcon = () => {
      switch (kpi.trend) {
        case 'up':
          return <ArrowUp size={16} className="text-green-500" />;
        case 'down':
          return <ArrowDown size={16} className="text-red-500" />;
        case 'stable':
          return <Minus size={16} className="text-gray-500" />;
      }
    };
    
    const getTrendClass = () => {
      switch (kpi.trend) {
        case 'up':
          return 'text-green-600 bg-green-50';
        case 'down':
          return 'text-red-600 bg-red-50';
        case 'stable':
          return 'text-gray-600 bg-gray-50';
      }
    };
    
    const getColorClass = (color: string) => {
      const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600'
      };
      
      return colorMap[color] || colorMap.blue;
    };
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClass(kpi.color)}`}>
            {kpi.icon}
          </div>
          
          <div className={`flex items-center px-2 py-1 rounded-full ${getTrendClass()}`}>
            {getTrendIcon()}
            <span className="text-xs font-medium ml-1">
              {kpi.trend === 'up' && '+'}
              {kpi.trendValue}%
            </span>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="text-2xl font-bold text-gray-900">
            {kpi.value.toLocaleString('fr-FR')}
            {kpi.unit}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-800">
            {kpi.title}
          </h3>
        </div>
      </div>
    );
  };

  // Render simple bar chart
  const renderBarChart = (data: ChartData[], maxHeight: number = 150) => {
    if (data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="relative h-[200px] mt-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-20 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>{Math.round(maxValue)}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>
        
        {/* Chart grid */}
        <div className="absolute left-12 right-0 top-0 bottom-20 flex flex-col justify-between">
          <div className="border-b border-gray-200 h-0"></div>
          <div className="border-b border-gray-200 h-0"></div>
          <div className="border-b border-gray-200 h-0"></div>
          <div className="border-b border-gray-200 h-0"></div>
          <div className="border-b border-gray-200 h-0"></div>
        </div>
        
        {/* Bars */}
        <div className="absolute left-12 right-0 top-0 bottom-20 flex items-end">
          <div className="flex-1 flex items-end justify-around h-full">
            {data.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                  title={`${item.value}`}
                ></div>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                  {format(parseISO(item.date), 'dd/MM')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render simple line chart
  const renderLineChart = (data: ChartData[], maxHeight: number = 150, color: string = 'purple') => {
    if (data.length === 0) return null;
    
    const maxValue = Math.max(40, Math.max(...data.map(d => d.value)));
    const minValue = Math.min(20, Math.min(...data.map(d => d.value)));
    const range = maxValue - minValue;
    
    // Generate SVG path
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((item.value - minValue) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    const colorMap: Record<string, string> = {
      blue: '#3B82F6',
      purple: '#8B5CF6',
      green: '#10B981',
      orange: '#F59E0B',
      red: '#EF4444'
    };
    
    const lineColor = colorMap[color] || colorMap.purple;
    
    return (
      <div className="relative h-[200px] mt-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-20 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>{Math.round(maxValue)}%</span>
          <span>{Math.round(minValue + range * 0.75)}%</span>
          <span>{Math.round(minValue + range * 0.5)}%</span>
          <span>{Math.round(minValue + range * 0.25)}%</span>
          <span>{Math.round(minValue)}%</span>
        </div>
        
        {/* Chart grid */}
        <div className="absolute left-12 right-0 top-0 bottom-20 flex flex-col justify-between">
          <div className="border-b border-gray-200 h-0"></div>
          <div className="border-b border-gray-200 h-0"></div>
          <div className="border-b border-gray-200 h-0"></div>
          <div className="border-b border-gray-200 h-0"></div>
          <div className="border-b border-gray-200 h-0"></div>
        </div>
        
        {/* Target line at 30% */}
        <div 
          className="absolute left-12 right-0 border-t-2 border-dashed border-green-500 z-10"
          style={{ top: `${100 - ((30 - minValue) / range) * 100}%`, bottom: 'auto' }}
        >
          <div className="absolute right-0 -top-6 bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
            {i18n.language === 'fr' ? 'Cible: 30%' : 'Target: 30%'}
          </div>
        </div>
        
        {/* Line chart */}
        <div className="absolute left-12 right-0 top-0 bottom-20">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            
            {/* Area under the line */}
            <polyline
              points={`0,100 ${points} 100,100`}
              fill={`${lineColor}20`}
              stroke="none"
            />
            
            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((item.value - minValue) / range) * 100;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={lineColor}
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute left-12 right-0 bottom-0 h-20 flex justify-around items-start">
          {data.map((item, index) => (
            <div key={index} className="text-xs text-gray-500 transform -rotate-45 origin-top-left">
              {format(parseISO(item.date), 'dd/MM')}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="text-blue-600 mr-3" size={28} />
            {i18n.language === 'fr' ? 'Tableau de Performance' : 'Performance Dashboard'}
          </h2>
          <p className="text-gray-600 mt-1">
            {currentRestaurant?.name} - {getPeriodLabel(dateRange)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">{i18n.language === 'fr' ? 'Aujourd\'hui' : 'Today'}</option>
            <option value="week">{i18n.language === 'fr' ? 'Cette semaine' : 'This week'}</option>
            <option value="month">{i18n.language === 'fr' ? 'Ce mois' : 'This month'}</option>
            <option value="year">{i18n.language === 'fr' ? 'Cette année' : 'This year'}</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={loadPerformanceData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {i18n.language === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>

          {/* POS connection button */}
          <button
            onClick={handleConnectPOS}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Settings size={16} className="mr-2" />
            {i18n.language === 'fr' ? 'Connecter POS' : 'Connect POS'}
          </button>

          {/* Manual data entry button */}
          <button
            onClick={handleManualEntry}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <BarChart3 size={16} className="mr-2" />
            {i18n.language === 'fr' ? 'Saisie manuelle' : 'Manual entry'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {i18n.language === 'fr' ? 'Chargement des données de performance...' : 'Loading performance data...'}
          </p>
        </div>
      )}

      {/* KPI Overview */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, index) => renderKPICard(kpi))}
        </div>
      )}

      {/* Revenue Analysis */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    {i18n.language === 'fr' ? 'Analyse du Chiffre d\'Affaires' : 'Revenue Analysis'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDateRange()}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => toggleSection('revenue')}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.revenue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
          
          {expandedSections.revenue && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {i18n.language === 'fr' ? 'CA Total' : 'Total Revenue'}
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {revenueData.reduce((sum, item) => sum + item.value, 0).toLocaleString('fr-FR')}€
                      </p>
                    </div>
                    <DollarSign size={24} className="text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {i18n.language === 'fr' ? 'Ticket Moyen' : 'Average Ticket'}
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        32.75€
                      </p>
                    </div>
                    <Target size={24} className="text-green-500" />
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        {i18n.language === 'fr' ? 'Couverts' : 'Covers'}
                      </p>
                      <p className="text-2xl font-bold text-orange-900">
                        384
                      </p>
                    </div>
                    <Users size={24} className="text-orange-500" />
                  </div>
                </div>
              </div>
              
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {i18n.language === 'fr' ? 'Évolution du CA' : 'Revenue Evolution'}
              </h4>
              
              {renderBarChart(revenueData)}
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      {i18n.language === 'fr' 
                        ? 'Le chiffre d\'affaires a augmenté de 8.5% par rapport à la période précédente. Les jours les plus performants sont le vendredi et le samedi.'
                        : 'Revenue has increased by 8.5% compared to the previous period. The best performing days are Friday and Saturday.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Staff Cost Analysis */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mr-3">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    {i18n.language === 'fr' ? 'Analyse de la Masse Salariale' : 'Payroll Analysis'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDateRange()}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => toggleSection('staffCost')}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.staffCost ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
          
          {expandedSections.staffCost && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">
                        {i18n.language === 'fr' ? 'Masse Salariale' : 'Payroll Mass'}
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        3,580€
                      </p>
                    </div>
                    <DollarSign size={24} className="text-purple-500" />
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {i18n.language === 'fr' ? 'Ratio Moyen' : 'Average Ratio'}
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        28.4%
                      </p>
                    </div>
                    <Percent size={24} className="text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {i18n.language === 'fr' ? 'Heures Travaillées' : 'Worked Hours'}
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        251.2h
                      </p>
                    </div>
                    <Clock size={24} className="text-green-500" />
                  </div>
                </div>
              </div>
              
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {i18n.language === 'fr' ? 'Évolution du Ratio Masse Salariale / CA' : 'Staff Cost Ratio Evolution'}
              </h4>
              
              {renderLineChart(staffCostData, 150, 'purple')}
              
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-purple-700">
                      {i18n.language === 'fr' 
                        ? 'Le ratio masse salariale / CA est de 28.4% en moyenne sur la période, en dessous de la cible de 30%. Les jours avec le meilleur ratio sont le vendredi et le samedi.'
                        : 'The staff cost ratio is 28.4% on average for the period, below the target of 30%. The days with the best ratio are Friday and Saturday.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && revenueData.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {i18n.language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
          </h3>
          <p className="text-gray-500 mb-6">
            {i18n.language === 'fr' 
              ? 'Connectez votre système de caisse ou saisissez des données manuellement pour commencer l\'analyse.'
              : 'Connect your POS system or enter data manually to start analyzing performance.'
            }
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleConnectPOS}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Settings size={16} className="mr-2" />
              {i18n.language === 'fr' ? 'Connecter L\'Addition' : 'Connect L\'Addition'}
            </button>
            <button
              onClick={handleManualEntry}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <BarChart3 size={16} className="mr-2" />
              {i18n.language === 'fr' ? 'Saisie manuelle' : 'Manual entry'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Clock, Target, Percent } from 'lucide-react';
import { PerformanceMetrics, KPIData } from '../../types';
import { performanceAnalyticsService } from '../../lib/performanceAnalytics';
import { useTranslation } from 'react-i18next';

interface KPIOverviewProps {
  metrics: PerformanceMetrics[];
  previousMetrics: PerformanceMetrics[];
  loading: boolean;
}

const KPIOverview: React.FC<KPIOverviewProps> = ({ metrics, previousMetrics, loading }) => {
  const { t, i18n } = useTranslation();

  // Generate KPI data
  const kpiData = performanceAnalyticsService.generateKPIData(metrics, previousMetrics);

  // CRITICAL: KPI configuration with icons and colors
  const kpiConfig = [
    {
      key: 'turnover',
      title: i18n.language === 'fr' ? 'Chiffre d\'Affaires' : 'Turnover',
      icon: DollarSign,
      color: 'blue',
      description: i18n.language === 'fr' ? 'CA total de la période' : 'Total revenue for period'
    },
    {
      key: 'staffCostRatio',
      title: i18n.language === 'fr' ? 'Ratio Masse Salariale' : 'Staff Cost Ratio',
      icon: Percent,
      color: 'purple',
      description: i18n.language === 'fr' ? 'Coût du personnel / CA' : 'Staff cost / Revenue'
    },
    {
      key: 'averageCheck',
      title: i18n.language === 'fr' ? 'Ticket Moyen' : 'Average Check',
      icon: Target,
      color: 'green',
      description: i18n.language === 'fr' ? 'CA moyen par couvert' : 'Average revenue per cover'
    },
    {
      key: 'covers',
      title: i18n.language === 'fr' ? 'Couverts' : 'Covers',
      icon: Users,
      color: 'orange',
      description: i18n.language === 'fr' ? 'Nombre total de clients' : 'Total number of customers'
    },
    {
      key: 'averageHourlyCost',
      title: i18n.language === 'fr' ? 'Coût Horaire Moyen' : 'Average Hourly Cost',
      icon: Clock,
      color: 'red',
      description: i18n.language === 'fr' ? 'Coût moyen par heure travaillée' : 'Average cost per worked hour'
    }
  ];

  // CRITICAL: Format value based on type
  const formatValue = (value: number, format: string, unit: string): string => {
    switch (format) {
      case 'currency':
        return `${value.toLocaleString('fr-FR')}${unit}`;
      case 'percentage':
        return `${value.toFixed(1)}${unit}`;
      case 'number':
        return value.toLocaleString('fr-FR');
      default:
        return `${value.toFixed(1)}${unit}`;
    }
  };

  // CRITICAL: Get trend icon and color
  const getTrendDisplay = (trend: 'up' | 'down' | 'stable', percentage: number, isInverted: boolean = false) => {
    // For cost metrics, down is good (green), up is bad (red)
    const actualTrend = isInverted ? (trend === 'up' ? 'down' : trend === 'down' ? 'up' : 'stable') : trend;
    
    switch (actualTrend) {
      case 'up':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          sign: '+'
        };
      case 'down':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          sign: ''
        };
      default:
        return {
          icon: Minus,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          sign: ''
        };
    }
  };

  // CRITICAL: Get color classes for KPI cards
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200',
      red: 'text-red-600 bg-red-50 border-red-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpiConfig.map((config) => {
        const kpi = kpiData[config.key];
        if (!kpi) return null;

        const IconComponent = config.icon;
        const isInverted = config.key === 'staffCostRatio' || config.key === 'averageHourlyCost';
        const trendDisplay = getTrendDisplay(kpi.trend, kpi.trendPercentage, isInverted);
        const TrendIcon = trendDisplay.icon;
        const colorClasses = getColorClasses(config.color);

        return (
          <div key={config.key} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}>
                <IconComponent size={20} />
              </div>
              
              {/* Trend indicator */}
              <div className={`flex items-center px-2 py-1 rounded-full ${trendDisplay.bgColor}`}>
                <TrendIcon size={14} className={`mr-1 ${trendDisplay.color}`} />
                <span className={`text-xs font-medium ${trendDisplay.color}`}>
                  {trendDisplay.sign}{Math.abs(kpi.trendPercentage).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Value */}
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(kpi.current, kpi.format, kpi.unit)}
              </div>
              {kpi.target && (
                <div className="text-sm text-gray-500">
                  {i18n.language === 'fr' ? 'Objectif' : 'Target'}: {formatValue(kpi.target, kpi.format, kpi.unit)}
                </div>
              )}
            </div>

            {/* Title and description */}
            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-1">
                {config.title}
              </h3>
              <p className="text-xs text-gray-500">
                {config.description}
              </p>
            </div>

            {/* Progress bar for target comparison */}
            {kpi.target && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      kpi.current >= kpi.target ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (kpi.current / kpi.target) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KPIOverview;
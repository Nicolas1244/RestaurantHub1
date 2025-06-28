import React, { useState } from 'react';
import { FileText, Calendar, Download, Filter, Search, Clock, AlertCircle, CheckCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Employee } from '../../types';
import TimeClockComparison from './TimeClockComparison';
import TimeClockSummary from './TimeClockSummary';

interface TimeClockReportProps {
  restaurantId: string;
  employees: Employee[];
}

const TimeClockReport: React.FC<TimeClockReportProps> = ({ restaurantId, employees }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'summary' | 'comparison'>('comparison');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'summary'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          {i18n.language === 'fr' ? 'Résumé des Pointages' : 'Time Clock Summary'}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'comparison'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('comparison')}
        >
          {i18n.language === 'fr' ? 'Comparaison Prévu vs. Réel' : 'Planned vs. Actual Comparison'}
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'summary' ? (
        <TimeClockSummary 
          restaurantId={restaurantId}
          employees={employees}
        />
      ) : (
        <TimeClockComparison 
          restaurantId={restaurantId}
          employees={employees}
        />
      )}
    </div>
  );
};

export default TimeClockReport;
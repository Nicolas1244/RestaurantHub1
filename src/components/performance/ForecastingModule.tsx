import React, { useState } from 'react';
import { Calendar, TrendingUp, Edit2, Save, X, Info } from 'lucide-react';
import { POSData, ForecastData } from '../../types';
import { useTranslation } from 'react-i18next';
import { format, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ForecastingModuleProps {
  forecastData: ForecastData[];
  historicalData: POSData[];
  onUpdateForecast: (date: string, forecast: Partial<ForecastData>) => void;
}

const ForecastingModule: React.FC<ForecastingModuleProps> = ({ 
  forecastData, 
  historicalData,
  onUpdateForecast
}) => {
  const { t, i18n } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ turnover: number; covers: number }>({ turnover: 0, covers: 0 });

  // CRITICAL: Format date based on locale
  const formatDate = (dateString: string): string => {
    const date = parseISO(dateString);
    if (i18n.language === 'fr') {
      return format(date, 'EEEE d MMMM', { locale: fr }).replace(/^\w/, c => c.toUpperCase());
    }
    return format(date, 'EEEE, MMMM d');
  };

  // CRITICAL: Start editing a forecast
  const startEditing = (index: number) => {
    const forecast = forecastData[index];
    setEditValues({
      turnover: forecast.forecastedTurnover,
      covers: forecast.forecastedCovers
    });
    setEditingIndex(index);
  };

  // CRITICAL: Save edited forecast
  const saveEditing = () => {
    if (editingIndex !== null) {
      const forecast = forecastData[editingIndex];
      onUpdateForecast(forecast.date, {
        forecastedTurnover: editValues.turnover,
        forecastedCovers: editValues.covers,
        basedOn: 'manual'
      });
      setEditingIndex(null);
    }
  };

  // CRITICAL: Cancel editing
  const cancelEditing = () => {
    setEditingIndex(null);
  };

  // CRITICAL: Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-blue-600';
    if (confidence >= 40) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 mr-3">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {i18n.language === 'fr' ? 'Prévisions' : 'Forecasting'}
            </h3>
            <p className="text-sm text-gray-500">
              {i18n.language === 'fr' ? 'Prévisions pour les 7 prochains jours' : 'Forecasts for the next 7 days'}
            </p>
          </div>
        </div>
      </div>

      {/* Forecast table */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {i18n.language === 'fr' ? 'Date' : 'Date'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {i18n.language === 'fr' ? 'CA Prévu' : 'Forecasted Turnover'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {i18n.language === 'fr' ? 'Couverts Prévus' : 'Forecasted Covers'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {i18n.language === 'fr' ? 'Confiance' : 'Confidence'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {i18n.language === 'fr' ? 'Actions' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecastData.map((forecast, index) => (
                <tr key={forecast.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(forecast.date)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        value={editValues.turnover}
                        onChange={(e) => setEditValues({ ...editValues, turnover: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {forecast.forecastedTurnover.toLocaleString('fr-FR')}€
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        value={editValues.covers}
                        onChange={(e) => setEditValues({ ...editValues, covers: Number(e.target.value) })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {forecast.forecastedCovers}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`text-sm font-medium ${getConfidenceColor(forecast.confidence)}`}>
                        {forecast.confidence}%
                      </div>
                      <div className="relative ml-2 group">
                        <Info size={14} className="text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded p-2 hidden group-hover:block z-10">
                          <div className="font-medium mb-1">
                            {i18n.language === 'fr' ? 'Basé sur' : 'Based on'}:
                          </div>
                          <ul className="space-y-1">
                            {forecast.factors.map((factor, i) => (
                              <li key={i}>• {factor}</li>
                            ))}
                          </ul>
                          <div className="absolute left-0 top-full w-2 h-2 bg-gray-800 transform rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingIndex === index ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEditing}
                          className="p-1 text-green-600 hover:text-green-800"
                          title={i18n.language === 'fr' ? 'Enregistrer' : 'Save'}
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-red-600 hover:text-red-800"
                          title={i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(index)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title={i18n.language === 'fr' ? 'Modifier' : 'Edit'}
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Forecast explanation */}
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <Info size={20} className="text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-orange-800 mb-1">
                {i18n.language === 'fr' ? 'À propos des prévisions' : 'About forecasts'}
              </h4>
              <p className="text-sm text-orange-700">
                {i18n.language === 'fr' 
                  ? 'Les prévisions sont basées sur les données historiques et les tendances saisonnières. La confiance indique la fiabilité de la prévision. Vous pouvez modifier manuellement les prévisions si nécessaire.'
                  : 'Forecasts are based on historical data and seasonal trends. Confidence indicates the reliability of the forecast. You can manually edit forecasts if needed.'
                }
              </p>
              <div className="mt-2 text-xs text-orange-600">
                {i18n.language === 'fr' 
                  ? 'Utilisez ces prévisions pour optimiser vos plannings et votre gestion des stocks.'
                  : 'Use these forecasts to optimize your schedules and inventory management.'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastingModule;
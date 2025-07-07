import React, { useState, useEffect } from 'react';
import { Fingerprint, Clock, Users, Calendar, AlertTriangle, CheckCircle, FileText, Settings } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TimeClockWidget from './TimeClockWidget';
import TimeClockReport from './TimeClockReport';
import toast from 'react-hot-toast';

const TimeClockPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentRestaurant, getRestaurantEmployees, updateSettings } = useAppContext();
  // TEMPORARY: Force time clock to be enabled
  const userSettings = { timeClockEnabled: true };
  const [activeTab, setActiveTab] = useState<'clock' | 'report'>('clock');

  // Get employees for the current restaurant
  const employees = currentRestaurant ? getRestaurantEmployees(currentRestaurant.id) : [];


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Fingerprint className="text-blue-600 mr-3" size={28} />
            {i18n.language === 'fr' ? 'Badgeuse (Pointeuse)' : 'Time Clock'}
          </h2>
          <p className="text-gray-500">
            {currentRestaurant ? `${currentRestaurant.name} - ${currentRestaurant.location}` : t('common.selectRestaurantPrompt')}
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setActiveTab('clock')}
              className={`px-4 py-2 flex items-center gap-2 ${
                activeTab === 'clock'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock size={18} />
              {i18n.language === 'fr' ? 'Pointage' : 'Clock In/Out'}
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 flex items-center gap-2 ${
                activeTab === 'report'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} />
              {i18n.language === 'fr' ? 'Rapports' : 'Reports'}
            </button>
          </div>
        </div>
      </div>

      {!currentRestaurant ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-lg text-gray-500">
            {t('common.selectRestaurantPrompt')}
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'clock' ? (
            <TimeClockWidget 
              restaurantId={currentRestaurant.id}
              employees={employees}
            />
          ) : (
            <TimeClockReport 
              restaurantId={currentRestaurant.id}
              employees={employees}
            />
          )}
        </>
      )}

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Fingerprint className="h-5 w-5 text-indigo-400 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-indigo-800">
              {i18n.language === 'fr' ? 'À propos de la Badgeuse' : 'About Time Clock'}
            </h4>
            <p className="text-sm text-indigo-700 mt-1">
              {i18n.language === 'fr' 
                ? 'La fonction Badgeuse permet de suivre avec précision les heures travaillées par les employés. Elle offre une interface simple pour pointer l\'arrivée et le départ, ainsi que des rapports détaillés comparant les heures prévues aux heures réelles.'
                : 'The Time Clock function allows for accurate tracking of employee work hours. It provides a simple interface for clocking in and out, as well as detailed reports comparing planned hours to actual hours.'
              }
            </p>
            <p className="text-sm text-indigo-700 mt-2">
              {i18n.language === 'fr' 
                ? 'Vous pouvez désactiver cette fonction à tout moment dans les paramètres de l\'application si vous n\'en avez pas besoin.'
                : 'You can disable this function at any time in the application settings if you don\'t need it.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeClockPage;
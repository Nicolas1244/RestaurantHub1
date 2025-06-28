import React, { useState, useEffect } from 'react';
import { Fingerprint, Clock, Users, Calendar, AlertTriangle, CheckCircle, FileText, Settings } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TimeClockInterface from './TimeClockInterface';
import TimeClockReport from './TimeClockReport';
import toast from 'react-hot-toast';

const TimeClockPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentRestaurant, userSettings, getRestaurantEmployees, updateUserSettings } = useAppContext();
  const [activeTab, setActiveTab] = useState<'clock' | 'report'>('clock');

  // Redirect to settings if time clock is disabled
  useEffect(() => {
    if (!userSettings?.timeClockEnabled) {
      // Show notification
      toast.error(
        i18n.language === 'fr' 
          ? 'La fonction Badgeuse est désactivée. Activez-la dans les paramètres.' 
          : 'Time Clock function is disabled. Enable it in settings.',
        { duration: 5000 }
      );
    }
  }, [userSettings?.timeClockEnabled, i18n.language]);

  // Get employees for the current restaurant
  const employees = currentRestaurant ? getRestaurantEmployees(currentRestaurant.id) : [];

  // Handle enabling time clock
  const handleEnableTimeClock = async () => {
    try {
      await updateUserSettings({ timeClockEnabled: true });
      toast.success(
        i18n.language === 'fr' 
          ? 'Fonction Badgeuse activée avec succès' 
          : 'Time Clock function enabled successfully'
      );
    } catch (error) {
      console.error('Failed to enable time clock:', error);
      toast.error(
        i18n.language === 'fr' 
          ? 'Échec de l\'activation de la Badgeuse' 
          : 'Failed to enable Time Clock'
      );
    }
  };

  // If time clock is disabled, show a message with option to enable
  if (!userSettings?.timeClockEnabled) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="max-w-md mx-auto">
          <Fingerprint size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {i18n.language === 'fr' 
              ? 'Fonction Badgeuse désactivée' 
              : 'Time Clock Function Disabled'}
          </h3>
          <p className="text-gray-500 mb-6">
            {i18n.language === 'fr' 
              ? 'La fonction Badgeuse est actuellement désactivée. Cette fonctionnalité permet aux employés de pointer leurs heures d\'arrivée et de départ.'
              : 'The Time Clock function is currently disabled. This feature allows employees to clock in and out for their shifts.'
            }
          </p>
          <button
            onClick={handleEnableTimeClock}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Settings size={16} className="mr-2" />
            {i18n.language === 'fr' ? 'Activer la Badgeuse' : 'Enable Time Clock'}
          </button>
        </div>
      </div>
    );
  }

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
            <TimeClockInterface 
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
import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import PerformanceDashboard from './PerformanceDashboard';
import ConnectPOSModal from './ConnectPOSModal';
import ManualDataEntryModal from './ManualDataEntryModal';
import toast from 'react-hot-toast';

const PerformancePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentRestaurant } = useAppContext();
  const [showConnectPOSModal, setShowConnectPOSModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);

  // Handle POS connection
  const handlePOSConnection = async (credentials: any) => {
    try {
      // In a real implementation, this would connect to the POS system
      console.log('Connecting to POS with credentials:', credentials);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(
        i18n.language === 'fr' 
          ? 'Connexion à L\'Addition réussie' 
          : 'Successfully connected to L\'Addition'
      );
      
      setShowConnectPOSModal(false);
    } catch (error) {
      console.error('Failed to connect to POS:', error);
      toast.error(
        i18n.language === 'fr' 
          ? 'Échec de la connexion à L\'Addition' 
          : 'Failed to connect to L\'Addition'
      );
    }
  };

  // Handle manual data entry
  const handleManualDataEntry = async (data: any) => {
    try {
      // In a real implementation, this would save the data to the database
      console.log('Saving manual data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(
        i18n.language === 'fr' 
          ? 'Données enregistrées avec succès' 
          : 'Data saved successfully'
      );
      
      setShowManualEntryModal(false);
    } catch (error) {
      console.error('Failed to save manual data:', error);
      toast.error(
        i18n.language === 'fr' 
          ? 'Échec de l\'enregistrement des données' 
          : 'Failed to save data'
      );
    }
  };

  return (
    <div>
      {currentRestaurant ? (
        <PerformanceDashboard restaurantId={currentRestaurant.id} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {i18n.language === 'fr' ? 'Tableau de Performance' : 'Performance Dashboard'}
          </h3>
          <p className="text-gray-500 mb-4">
            {i18n.language === 'fr' 
              ? 'Sélectionnez un restaurant pour accéder aux analyses de performance.'
              : 'Select a restaurant to access performance analytics.'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      <ConnectPOSModal
        isOpen={showConnectPOSModal}
        onClose={() => setShowConnectPOSModal(false)}
        onConnect={handlePOSConnection}
      />

      <ManualDataEntryModal
        isOpen={showManualEntryModal}
        onClose={() => setShowManualEntryModal(false)}
        onSave={handleManualDataEntry}
        restaurantId={currentRestaurant?.id || ''}
      />
    </div>
  );
};

export default PerformancePage;
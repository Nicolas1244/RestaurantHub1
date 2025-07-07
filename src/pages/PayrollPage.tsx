import React from 'react';
import { DollarSign, FileText, Download, Calendar, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import PayrollPreparation from '../components/payroll/PayrollPreparation';
import toast from 'react-hot-toast';

const PayrollPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentRestaurant } = useAppContext();
  const { isManager } = useAuth();
  
  // State for integration modals
  const [showIntegrationModal, setShowIntegrationModal] = React.useState(false);
  
  // Handle integration setup
  const handleIntegrationSetup = () => {
    setShowIntegrationModal(true);
  };
  
  // Handle export history
  const handleExportHistory = () => {
    toast.success(i18n.language === 'fr' 
      ? 'Historique des exports téléchargé' 
      : 'Export history downloaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <DollarSign className="text-green-600" size={28} />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {i18n.language === 'fr' ? 'Gestion de la Paie' : 'Payroll Management'}
            </h2>
            <p className="text-gray-500">
              {currentRestaurant 
                ? `${currentRestaurant.name} - ${currentRestaurant.location}` 
                : t('common.selectRestaurantPrompt')}
            </p>
          </div>
        </div>
        
        {isManager() && (
          <div className="flex gap-3">
            <button
              onClick={handleExportHistory}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FileText size={18} className="mr-2" />
              {i18n.language === 'fr' ? 'Historique des Exports' : 'Export History'}
            </button>
            
            <button
              onClick={handleIntegrationSetup}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Settings size={18} className="mr-2" />
              {i18n.language === 'fr' ? 'Configuration Paie' : 'Payroll Setup'}
            </button>
          </div>
        )}
      </div>

      {currentRestaurant ? (
        <div className="space-y-6">
          {/* Payroll Preparation */}
          <PayrollPreparation restaurantId={currentRestaurant.id} />
          
          {/* Integration Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="text-blue-600" size={20} />
              <h3 className="text-lg font-medium text-gray-800">
                {i18n.language === 'fr' ? 'Intégrations Logiciels de Paie' : 'Payroll Software Integrations'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <img src="https://upload.wikimedia.org/wikipedia/fr/thumb/d/db/Logo_Sage.svg/1200px-Logo_Sage.svg.png" alt="Sage" className="h-12 mb-3 object-contain" />
                <h4 className="text-sm font-medium text-gray-900">Sage Paie</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {i18n.language === 'fr' ? 'Intégration disponible' : 'Integration available'}
                </p>
                <button className="mt-3 text-xs text-blue-600 hover:text-blue-800">
                  {i18n.language === 'fr' ? 'Configurer' : 'Configure'}
                </button>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <img src="https://www.cegid.com/wp-content/themes/cegid2019/assets/img/logo-cegid.svg" alt="Cegid" className="h-12 mb-3 object-contain" />
                <h4 className="text-sm font-medium text-gray-900">Cegid</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {i18n.language === 'fr' ? 'Intégration disponible' : 'Integration available'}
                </p>
                <button className="mt-3 text-xs text-blue-600 hover:text-blue-800">
                  {i18n.language === 'fr' ? 'Configurer' : 'Configure'}
                </button>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <img src="https://assets-global.website-files.com/60e4d0d0155c865dfb4d9f6a/60e4d0d0155c86e6f54da0c0_payfit-logo.svg" alt="PayFit" className="h-12 mb-3 object-contain" />
                <h4 className="text-sm font-medium text-gray-900">PayFit</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {i18n.language === 'fr' ? 'Intégration disponible' : 'Integration available'}
                </p>
                <button className="mt-3 text-xs text-blue-600 hover:text-blue-800">
                  {i18n.language === 'fr' ? 'Configurer' : 'Configure'}
                </button>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <img src="https://www.adp.com/-/media/adp/redesign2018/images/shared/adp-logo-blue.svg" alt="ADP" className="h-12 mb-3 object-contain" />
                <h4 className="text-sm font-medium text-gray-900">ADP</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {i18n.language === 'fr' ? 'Intégration disponible' : 'Integration available'}
                </p>
                <button className="mt-3 text-xs text-blue-600 hover:text-blue-800">
                  {i18n.language === 'fr' ? 'Configurer' : 'Configure'}
                </button>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <img src="https://www.eic.fr/files/fck_upload/image/logo-quadratus.png" alt="Quadratus" className="h-12 mb-3 object-contain" />
                <h4 className="text-sm font-medium text-gray-900">Quadratus</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {i18n.language === 'fr' ? 'Intégration disponible' : 'Integration available'}
                </p>
                <button className="mt-3 text-xs text-blue-600 hover:text-blue-800">
                  {i18n.language === 'fr' ? 'Configurer' : 'Configure'}
                </button>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    {i18n.language === 'fr' ? 'À propos des intégrations' : 'About integrations'}
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    {i18n.language === 'fr' 
                      ? 'Les intégrations avec les logiciels de paie vous permettent d\'exporter automatiquement les données de présence, les heures travaillées et les éléments variables de paie directement vers votre solution de paie.' 
                      : 'Payroll software integrations allow you to automatically export attendance data, worked hours, and variable pay elements directly to your payroll solution.'}
                  </p>
                  <p className="mt-2 text-sm text-blue-700">
                    {i18n.language === 'fr' 
                      ? 'Contactez notre support pour configurer une intégration personnalisée avec votre logiciel de paie.' 
                      : 'Contact our support to set up a custom integration with your payroll software.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Export Calendar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-purple-600" size={20} />
              <h3 className="text-lg font-medium text-gray-800">
                {i18n.language === 'fr' ? 'Calendrier des Exports de Paie' : 'Payroll Export Calendar'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {i18n.language === 'fr' ? 'Préparation' : 'Preparation'}
                  </h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {i18n.language === 'fr' ? 'J-5' : 'D-5'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {i18n.language === 'fr' 
                    ? 'Vérification des heures et des éléments variables' 
                    : 'Verification of hours and variable elements'}
                </p>
                <p className="text-xs text-gray-500">
                  {i18n.language === 'fr' ? 'Date limite' : 'Deadline'}: 25/07/2025
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {i18n.language === 'fr' ? 'Validation' : 'Validation'}
                  </h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {i18n.language === 'fr' ? 'J-3' : 'D-3'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {i18n.language === 'fr' 
                    ? 'Validation finale des données de paie' 
                    : 'Final validation of payroll data'}
                </p>
                <p className="text-xs text-gray-500">
                  {i18n.language === 'fr' ? 'Date limite' : 'Deadline'}: 27/07/2025
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {i18n.language === 'fr' ? 'Transmission' : 'Transmission'}
                  </h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {i18n.language === 'fr' ? 'J-1' : 'D-1'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {i18n.language === 'fr' 
                    ? 'Transmission des données au service paie' 
                    : 'Transmission of data to payroll service'}
                </p>
                <p className="text-xs text-gray-500">
                  {i18n.language === 'fr' ? 'Date limite' : 'Deadline'}: 29/07/2025
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <DollarSign size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {i18n.language === 'fr' ? 'Gestion de la Paie' : 'Payroll Management'}
          </h3>
          <p className="text-gray-500 mb-4">
            {i18n.language === 'fr' 
              ? 'Sélectionnez un restaurant pour accéder à la gestion de la paie.' 
              : 'Select a restaurant to access payroll management.'}
          </p>
        </div>
      )}
      
      {/* Integration Setup Modal */}
      {showIntegrationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowIntegrationModal(false)} />
            
            <div className="relative w-full max-w-lg rounded-lg bg-white p-8 shadow-xl">
              <button
                onClick={() => setShowIntegrationModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>

              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {i18n.language === 'fr' ? 'Configuration de l\'Intégration Paie' : 'Payroll Integration Setup'}
              </h2>

              <div className="space-y-6">
                {/* Software selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Logiciel de paie' : 'Payroll Software'}
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{i18n.language === 'fr' ? 'Sélectionner un logiciel' : 'Select software'}</option>
                    <option value="sage">Sage Paie</option>
                    <option value="cegid">Cegid</option>
                    <option value="payfit">PayFit</option>
                    <option value="adp">ADP</option>
                    <option value="quadratus">Quadratus</option>
                  </select>
                </div>

                {/* API credentials */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Identifiants API' : 'API Credentials'}
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder={i18n.language === 'fr' ? 'Clé API' : 'API Key'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder={i18n.language === 'fr' ? 'Secret API' : 'API Secret'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder={i18n.language === 'fr' ? 'URL du service' : 'Service URL'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Export settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n.language === 'fr' ? 'Paramètres d\'export' : 'Export Settings'}
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="auto-export"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="auto-export" className="ml-2 block text-sm text-gray-700">
                        {i18n.language === 'fr' ? 'Export automatique en fin de mois' : 'Automatic export at end of month'}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="notification"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                      <label htmlFor="notification" className="ml-2 block text-sm text-gray-700">
                        {i18n.language === 'fr' ? 'Recevoir des notifications' : 'Receive notifications'}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="validation"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                      <label htmlFor="validation" className="ml-2 block text-sm text-gray-700">
                        {i18n.language === 'fr' ? 'Validation requise avant export' : 'Validation required before export'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Information */}
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        {i18n.language === 'fr' 
                          ? 'Vous devez disposer des identifiants API fournis par votre prestataire de paie pour configurer cette intégration.' 
                          : 'You need API credentials provided by your payroll provider to set up this integration.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowIntegrationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success(i18n.language === 'fr' 
                        ? 'Intégration configurée avec succès' 
                        : 'Integration configured successfully');
                      setShowIntegrationModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {i18n.language === 'fr' ? 'Configurer' : 'Configure'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
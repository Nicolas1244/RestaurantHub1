import React, { useState } from 'react';
import { X, Check, AlertTriangle, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface POSConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: any) => void;
}

const POSConnectionModal: React.FC<POSConnectionModalProps> = ({ isOpen, onClose, onConnect }) => {
  const { t, i18n } = useTranslation();
  const [provider, setProvider] = useState<'laddition' | 'lightspeed' | 'tiller' | 'square' | 'zettle'>('laddition');
  const [apiKey, setApiKey] = useState('');
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRITICAL: Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setApiKey('');
      setStoreId('');
      setError(null);
    }
  }, [isOpen]);

  // CRITICAL: Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!apiKey.trim()) {
        throw new Error(i18n.language === 'fr' ? 'Clé API requise' : 'API Key required');
      }

      if (!storeId.trim()) {
        throw new Error(i18n.language === 'fr' ? 'ID du magasin requis' : 'Store ID required');
      }

      // Connect to POS
      await onConnect({
        provider,
        apiKey,
        storeId
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                <Settings size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {i18n.language === 'fr' ? 'Connecter votre Caisse' : 'Connect your POS'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Provider selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {i18n.language === 'fr' ? 'Système de caisse' : 'POS System'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider('laddition')}
                  className={`flex items-center justify-center p-3 border rounded-lg ${
                    provider === 'laddition'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium mb-1">L'Addition</div>
                    <div className="text-xs text-gray-500">
                      {i18n.language === 'fr' ? 'Recommandé' : 'Recommended'}
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                >
                  <div className="text-center">
                    <div className="font-medium mb-1">Lightspeed</div>
                    <div className="text-xs">
                      {i18n.language === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="mt-3 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                >
                  <div className="text-center">
                    <div className="font-medium mb-1">Tiller</div>
                    <div className="text-xs">
                      {i18n.language === 'fr' ? 'Bientôt' : 'Soon'}
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                >
                  <div className="text-center">
                    <div className="font-medium mb-1">Square</div>
                    <div className="text-xs">
                      {i18n.language === 'fr' ? 'Bientôt' : 'Soon'}
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                >
                  <div className="text-center">
                    <div className="font-medium mb-1">Zettle</div>
                    <div className="text-xs">
                      {i18n.language === 'fr' ? 'Bientôt' : 'Soon'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* L'Addition credentials */}
            {provider === 'laddition' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Clé API' : 'API Key'}
                  </label>
                  <input
                    type="text"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={i18n.language === 'fr' ? 'Votre clé API L\'Addition' : 'Your L\'Addition API key'}
                  />
                </div>
                
                <div>
                  <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'ID du Magasin' : 'Store ID'}
                  </label>
                  <input
                    type="text"
                    id="storeId"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={i18n.language === 'fr' ? 'ID de votre établissement' : 'Your store ID'}
                  />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Info size={16} className="text-blue-500 mt-0.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        {i18n.language === 'fr' 
                          ? 'Vous pouvez trouver votre clé API et ID de magasin dans votre espace L\'Addition, section Intégrations.'
                          : 'You can find your API key and store ID in your L\'Addition dashboard, under Integrations section.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {i18n.language === 'fr' ? 'Connexion...' : 'Connecting...'}
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    {i18n.language === 'fr' ? 'Connecter' : 'Connect'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// CRITICAL: Info icon component
const Info: React.FC<{ size: number; className: string }> = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export default POSConnectionModal;
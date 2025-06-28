import React, { useState } from 'react';
import { X, Save, Calendar, DollarSign, Users, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ManualDataEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  restaurantId: string;
}

const ManualDataEntry: React.FC<ManualDataEntryProps> = ({ isOpen, onClose, onSave, restaurantId }) => {
  const { t, i18n } = useTranslation();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [turnover, setTurnover] = useState('');
  const [covers, setCovers] = useState('');
  const [lunchTurnover, setLunchTurnover] = useState('');
  const [dinnerTurnover, setDinnerTurnover] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRITICAL: Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTurnover('');
      setCovers('');
      setLunchTurnover('');
      setDinnerTurnover('');
      setNotes('');
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
      if (!date) {
        throw new Error(i18n.language === 'fr' ? 'Date requise' : 'Date required');
      }

      if (!turnover || isNaN(Number(turnover)) || Number(turnover) < 0) {
        throw new Error(i18n.language === 'fr' ? 'Chiffre d\'affaires invalide' : 'Invalid turnover');
      }

      if (!covers || isNaN(Number(covers)) || Number(covers) < 0) {
        throw new Error(i18n.language === 'fr' ? 'Nombre de couverts invalide' : 'Invalid covers');
      }

      // Calculate lunch/dinner split if not provided
      let lunch = lunchTurnover ? Number(lunchTurnover) : 0;
      let dinner = dinnerTurnover ? Number(dinnerTurnover) : 0;
      
      if (!lunch && !dinner) {
        // Default split: 40% lunch, 60% dinner
        lunch = Number(turnover) * 0.4;
        dinner = Number(turnover) * 0.6;
      } else if (!lunch) {
        lunch = Number(turnover) - dinner;
      } else if (!dinner) {
        dinner = Number(turnover) - lunch;
      }

      // Validate lunch + dinner = total turnover
      const total = Number(turnover);
      const splitTotal = lunch + dinner;
      
      if (Math.abs(total - splitTotal) > 1) { // Allow for small rounding errors
        throw new Error(
          i18n.language === 'fr' 
            ? 'La somme déjeuner + dîner doit égaler le CA total' 
            : 'Lunch + dinner must equal total turnover'
        );
      }

      // Save data
      const data = {
        date,
        restaurantId,
        turnover: Number(turnover),
        covers: Number(covers),
        averageCheck: Number(covers) > 0 ? Number(turnover) / Number(covers) : 0,
        salesByService: {
          lunch,
          dinner
        },
        notes,
        enteredBy: 'user',
        enteredAt: new Date().toISOString()
      };

      await onSave(data);
      // Success toast is handled by the parent component
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  // CRITICAL: Update total when lunch/dinner values change
  React.useEffect(() => {
    if (lunchTurnover && dinnerTurnover) {
      const lunch = Number(lunchTurnover) || 0;
      const dinner = Number(dinnerTurnover) || 0;
      setTurnover(String(lunch + dinner));
    }
  }, [lunchTurnover, dinnerTurnover]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-3">
                <DollarSign size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {i18n.language === 'fr' ? 'Saisie Manuelle' : 'Manual Data Entry'}
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
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'fr' ? 'Date' : 'Date'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              {/* Total Turnover */}
              <div>
                <label htmlFor="turnover" className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'fr' ? 'Chiffre d\'Affaires Total (€)' : 'Total Turnover (€)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="turnover"
                    value={turnover}
                    onChange={(e) => setTurnover(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              {/* Covers */}
              <div>
                <label htmlFor="covers" className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'fr' ? 'Nombre de Couverts' : 'Number of Covers'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="covers"
                    value={covers}
                    onChange={(e) => setCovers(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />
                </div>
              </div>
              
              {/* Service breakdown */}
              <div>
                <div className="flex items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    {i18n.language === 'fr' ? 'Répartition par Service (optionnel)' : 'Service Breakdown (optional)'}
                  </h4>
                  <div className="ml-2 relative group">
                    <Info size={14} className="text-gray-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded p-2 hidden group-hover:block z-10">
                      {i18n.language === 'fr' 
                        ? 'Si non renseigné, une répartition 40% déjeuner / 60% dîner sera appliquée par défaut.'
                        : 'If not provided, a default split of 40% lunch / 60% dinner will be applied.'
                      }
                      <div className="absolute left-0 top-full w-2 h-2 bg-gray-800 transform rotate-45"></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lunchTurnover" className="block text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'fr' ? 'Déjeuner (€)' : 'Lunch (€)'}
                    </label>
                    <input
                      type="number"
                      id="lunchTurnover"
                      value={lunchTurnover}
                      onChange={(e) => setLunchTurnover(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="dinnerTurnover" className="block text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'fr' ? 'Dîner (€)' : 'Dinner (€)'}
                    </label>
                    <input
                      type="number"
                      id="dinnerTurnover"
                      value={dinnerTurnover}
                      onChange={(e) => setDinnerTurnover(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n.language === 'fr' ? 'Notes (optionnel)' : 'Notes (optional)'}
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder={i18n.language === 'fr' ? 'Événements spéciaux, météo, etc.' : 'Special events, weather, etc.'}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {i18n.language === 'fr' ? 'Enregistrement...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {i18n.language === 'fr' ? 'Enregistrer' : 'Save'}
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

export default ManualDataEntry;
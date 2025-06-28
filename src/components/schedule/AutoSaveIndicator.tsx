import React, { useState, useEffect } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  status: 'idle' | 'saving' | 'success' | 'error';
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ lastSaved, status }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  
  // Show indicator when status changes to saving, success, or error
  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);
      
      // Hide after a delay for success or error
      if (status === 'success' || status === 'error') {
        const timer = setTimeout(() => {
          setVisible(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [status]);
  
  // Format last saved time
  const formatLastSaved = (): string => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffSec < 60) {
      return t('schedule.savedJustNow');
    } else if (diffMin < 60) {
      return t('schedule.savedMinutesAgo', { minutes: diffMin });
    } else {
      return lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center px-4 py-2 rounded-lg shadow-md transition-all duration-300 ${
      status === 'saving' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
      status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
      status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
      'bg-gray-50 text-gray-700 border border-gray-200'
    }`}>
      {status === 'saving' && (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          <span className="text-sm">{t('schedule.savingInProgress')}</span>
        </>
      )}
      
      {status === 'success' && (
        <>
          <Check size={16} className="text-green-600 mr-2" />
          <span className="text-sm">{t('schedule.savedSuccessfully')} {formatLastSaved()}</span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertCircle size={16} className="text-red-600 mr-2" />
          <span className="text-sm">{t('schedule.saveFailed')}</span>
        </>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
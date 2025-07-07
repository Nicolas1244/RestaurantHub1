import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
        <UtensilsCrossed className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {t('common.appName')}
      </h2>
      <div className="mt-4 flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
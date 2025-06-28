import React from 'react';
import { useTranslation } from 'react-i18next';
import Flag from 'react-world-flags';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', flag: 'GB' },
    { code: 'fr', label: 'Français', flag: 'FR' },
  ];

  return (
    <div className="relative inline-block">
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="appearance-none bg-transparent pl-10 pr-8 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="flex items-center">
            {lang.label}
          </option>
        ))}
      </select>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-4">
        <Flag
          code={languages.find(lang => lang.code === i18n.language)?.flag || 'GB'}
          className="h-full w-full object-cover rounded-sm"
        />
      </div>
    </div>
  );
};

export default LanguageSelector;
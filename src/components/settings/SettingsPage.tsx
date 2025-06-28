import React, { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Globe, Clock, Save, RotateCcw, Layout, Monitor, Cloud, MapPin, DollarSign, Fingerprint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { TIME_INPUT_TYPES, TimeInputType, SCHEDULE_LAYOUT_TYPES, ScheduleLayoutType } from '../../types';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppContext();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setHasChanges(false);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    toast.success(t('settings.reset'));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
              </div>
              <div className="flex items-center space-x-3">
                {hasChanges && (
                  <button
                    onClick={handleReset}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>{t('common.reset')}</span>
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{t('common.save')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* General Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.general')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.language')}
                  </label>
                  <select
                    value={localSettings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.timezone')}
                  </label>
                  <select
                    value={localSettings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.currency')}
                  </label>
                  <select
                    value={localSettings.currency}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.dateFormat')}
                  </label>
                  <select
                    value={localSettings.dateFormat}
                    onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.schedule')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.timeInputType')}
                  </label>
                  <select
                    value={localSettings.timeInputType}
                    onChange={(e) => handleSettingChange('timeInputType', e.target.value as TimeInputType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.keys(TIME_INPUT_TYPES).map(type => (
                      <option key={type} value={type}>
                        {t(`settings.timeInput.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.scheduleLayout')}
                  </label>
                  <select
                    value={localSettings.scheduleLayout}
                    onChange={(e) => handleSettingChange('scheduleLayout', e.target.value as ScheduleLayoutType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.keys(SCHEDULE_LAYOUT_TYPES).map(layout => (
                      <option key={layout} value={layout}>
                        {t(`settings.layout.${layout}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.weekStartsOn')}
                  </label>
                  <select
                    value={localSettings.weekStartsOn}
                    onChange={(e) => handleSettingChange('weekStartsOn', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>{t('days.sunday')}</option>
                    <option value={1}>{t('days.monday')}</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={localSettings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoSave" className="ml-2 block text-sm text-gray-700">
                    {t('settings.autoSave')}
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.notifications')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={localSettings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                    {t('settings.emailNotifications')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    checked={localSettings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-700">
                    {t('settings.pushNotifications')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="contractExpiryAlerts"
                    checked={localSettings.contractExpiryAlerts}
                    onChange={(e) => handleSettingChange('contractExpiryAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="contractExpiryAlerts" className="ml-2 block text-sm text-gray-700">
                    {t('settings.contractExpiryAlerts')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="scheduleChangeAlerts"
                    checked={localSettings.scheduleChangeAlerts}
                    onChange={(e) => handleSettingChange('scheduleChangeAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="scheduleChangeAlerts" className="ml-2 block text-sm text-gray-700">
                    {t('settings.scheduleChangeAlerts')}
                  </label>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Layout className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.display')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.theme')}
                  </label>
                  <select
                    value={localSettings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">{t('settings.themes.light')}</option>
                    <option value="dark">{t('settings.themes.dark')}</option>
                    <option value="auto">{t('settings.themes.auto')}</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="compactView"
                    checked={localSettings.compactView}
                    onChange={(e) => handleSettingChange('compactView', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="compactView" className="ml-2 block text-sm text-gray-700">
                    {t('settings.compactView')}
                  </label>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.security')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.sessionTimeout')}
                  </label>
                  <select
                    value={localSettings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 {t('common.minutes')}</option>
                    <option value={60}>1 {t('common.hour')}</option>
                    <option value={120}>2 {t('common.hours')}</option>
                    <option value={480}>8 {t('common.hours')}</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="twoFactorAuth"
                    checked={localSettings.twoFactorAuth}
                    onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-700">
                    {t('settings.twoFactorAuth')}
                  </label>
                </div>
              </div>
            </div>

            {/* Integration Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Cloud className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.integrations')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="posIntegration"
                    checked={localSettings.posIntegration}
                    onChange={(e) => handleSettingChange('posIntegration', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="posIntegration" className="ml-2 block text-sm text-gray-700">
                    {t('settings.posIntegration')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="weatherIntegration"
                    checked={localSettings.weatherIntegration}
                    onChange={(e) => handleSettingChange('weatherIntegration', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="weatherIntegration" className="ml-2 block text-sm text-gray-700">
                    {t('settings.weatherIntegration')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="calendarSync"
                    checked={localSettings.calendarSync}
                    onChange={(e) => handleSettingChange('calendarSync', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="calendarSync" className="ml-2 block text-sm text-gray-700">
                    {t('settings.calendarSync')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="backupEnabled"
                    checked={localSettings.backupEnabled}
                    onChange={(e) => handleSettingChange('backupEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="backupEnabled" className="ml-2 block text-sm text-gray-700">
                    {t('settings.backupEnabled')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
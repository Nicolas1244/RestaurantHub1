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
      toast.success(t('settings.saveSuccess'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('settings.saveError'));
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    toast.success(t('settings.resetSuccess'));
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
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.schedule.title')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.schedule.timeInputType')}
                  </label>
                  <select
                    value={localSettings.timeInputType}
                    onChange={(e) => handleSettingChange('timeInputType', e.target.value as TimeInputType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(TIME_INPUT_TYPES).map(([type, config]) => (
                      <option key={type} value={type}>
                        {t(`settings.schedule.timeInputTypes.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.schedule.layoutType')}
                  </label>
                  <select
                    value={localSettings.scheduleLayoutType}
                    onChange={(e) => handleSettingChange('scheduleLayoutType', e.target.value as ScheduleLayoutType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(SCHEDULE_LAYOUT_TYPES).map(([layout, config]) => (
                      <option key={layout} value={layout}>
                        {t(`settings.schedule.layoutTypes.${layout}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.schedule.weekStart')}
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
                    {t('settings.schedule.autoSave')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="payBreakTimes"
                    checked={localSettings.payBreakTimes}
                    onChange={(e) => handleSettingChange('payBreakTimes', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="payBreakTimes" className="ml-2 block text-sm text-gray-700">
                    {t('settings.schedule.payBreakTimes')}
                  </label>
                </div>
              </div>

              <div className="pl-8 mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  {t('settings.breakPayment.description')}
                </p>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.notifications.title')}</h2>
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
                    {t('settings.notifications.emailNotifications')}
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
                    {t('settings.notifications.pushNotifications')}
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
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.display.title')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.display.theme')}
                  </label>
                  <select
                    value={localSettings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">{t('settings.display.themes.light')}</option>
                    <option value="dark">{t('settings.display.themes.dark')}</option>
                    <option value="auto">{t('settings.display.themes.auto')}</option>
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
                    {t('settings.display.compactMode')}
                  </label>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.security.title')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.security.sessionTimeout')}
                  </label>
                  <select
                    value={localSettings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 {t('settings.security.minutes')}</option>
                    <option value={60}>1 {t('settings.security.hour')}</option>
                    <option value={120}>2 {t('settings.security.hours')}</option>
                    <option value={480}>8 {t('settings.security.hours')}</option>
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
                    {t('settings.security.twoFactor')}
                  </label>
                </div>
              </div>
            </div>

            {/* Integration Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Cloud className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.integration.title')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="weatherEnabled"
                    checked={localSettings.weatherEnabled}
                    onChange={(e) => handleSettingChange('weatherEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="weatherEnabled" className="ml-2 block text-sm text-gray-700">
                    {t('settings.integration.weatherEnabled')}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="weatherAutoLocation"
                    checked={localSettings.weatherAutoLocation}
                    onChange={(e) => handleSettingChange('weatherAutoLocation', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="weatherAutoLocation" className="ml-2 block text-sm text-gray-700">
                    {t('settings.integration.weatherAutoLocation')}
                  </label>
                </div>

                {!localSettings.weatherAutoLocation && (
                  <div>
                    <label htmlFor="weatherLocation" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.integration.weatherLocation')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="weatherLocation"
                        value={localSettings.weatherLocation || ''}
                        onChange={(e) => handleSettingChange('weatherLocation', e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder={t('settings.integration.weatherLocationPlaceholder')}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="posIntegration"
                    checked={localSettings.posIntegration}
                    onChange={(e) => handleSettingChange('posIntegration', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="posIntegration" className="ml-2 block text-sm text-gray-700">
                    {t('settings.integration.posSync')}
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

              <div className="pl-8 mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  {t('settings.weatherIntegration.description')}
                </p>
              </div>
            </div>

            {/* Time Clock Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Fingerprint className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('settings.timeclock.title')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="timeClockEnabled"
                    checked={localSettings.timeClockEnabled}
                    onChange={(e) => handleSettingChange('timeClockEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="timeClockEnabled" className="ml-2 block text-sm text-gray-700">
                    {t('settings.timeclock.enabled')}
                  </label>
                </div>
              </div>

              <div className="pl-8 mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  {t('settings.timeclock.enabledDescription')}
                </p>
                {localSettings.timeClockEnabled && (
                  <p className="text-sm text-blue-700 mt-2">
                    {t('settings.timeclock.accessInstructions')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
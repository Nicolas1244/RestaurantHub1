import React from 'react';
import { Settings, User, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UserProfile from '../auth/UserProfile';
import UserRoleManagement from '../auth/UserRoleManagement';
import { useAuth } from '../../contexts/AuthContext';

const UserSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-blue-600" size={28} />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {t('auth.userSettings')}
          </h2>
          <p className="text-gray-500">
            {t('auth.userSettingsDescription')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-blue-600" size={20} />
              <h3 className="text-lg font-medium text-gray-800">
                {t('auth.userProfile')}
              </h3>
            </div>
            <UserProfile />
          </div>
        </div>

        {isAdmin() && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-purple-600" size={20} />
                <h3 className="text-lg font-medium text-gray-800">
                  {t('auth.userManagement')}
                </h3>
              </div>
              <UserRoleManagement />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettingsPage;
import React, { forwardRef } from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Users, 
  Calendar, 
  Settings,
  ChevronDown,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isAutoControlled?: boolean; // CRITICAL: Keep prop for functionality but remove visual indicators
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  isCollapsed,
  onToggleCollapse,
  isAutoControlled = false
}, ref) => {
  const { t, i18n } = useTranslation();
  const { 
    restaurants, 
    currentRestaurant, 
    setCurrentRestaurant,
    currentTab,
    setCurrentTab,
    userSettings
  } = useAppContext();
  
  const [isRestaurantDropdownOpen, setIsRestaurantDropdownOpen] = React.useState(false);

  // CRITICAL: Close restaurant dropdown when sidebar collapses
  React.useEffect(() => {
    if (isCollapsed) {
      setIsRestaurantDropdownOpen(false);
    }
  }, [isCollapsed]);

  const NavItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    tab: 'dashboard' | 'restaurants' | 'schedule' | 'staff' | 'settings' | 'performance' | 'timeclock';
    isActive?: boolean;
    onClick?: () => void;
    hidden?: boolean;
  }> = ({ icon, label, tab, isActive = false, onClick, hidden = false }) => {
    if (hidden) return null;
    
    return (
      <li 
        className={`flex items-center rounded-lg mb-1 cursor-pointer transition-all duration-200 ${
          isCollapsed ? 'p-2 justify-center' : 'p-3'
        } ${isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'hover:bg-gray-100 text-gray-700 hover:text-blue-600'}`}
        onClick={() => {
          setCurrentTab(tab);
          if (onClick) onClick();
        }}
        title={isCollapsed ? label : undefined}
      >
        <span className={isCollapsed ? '' : 'mr-3'}>{icon}</span>
        {!isCollapsed && <span className="font-medium">{label}</span>}
      </li>
    );
  };

  const sidebarClass = isMobileMenuOpen 
    ? 'translate-x-0 opacity-100' 
    : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100';

  return (
    <>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div 
        ref={ref} // CRITICAL: Forward ref for hover detection
        className={`fixed left-0 top-0 bottom-0 bg-white shadow-lg z-30 transition-all duration-300 ease-in-out ${sidebarClass} ${
          isCollapsed ? 'w-16' : 'w-64'
        }`} // CRITICAL: Removed auto-control visual indicators
      >
        <div className="flex flex-col h-full">
          {/* CRITICAL: Clean Header - NO AUTO-CONTROL INDICATORS */}
          <div className={`border-b border-gray-200 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            {isCollapsed ? (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed size={20} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-800 flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <UtensilsCrossed size={18} className="text-white" />
                  </div>
                  {t('common.appName')}
                </h1>
              </div>
            )}
          </div>

          {/* CRITICAL: Restaurant Selector - Clean without auto-expand hints */}
          {!isCollapsed && (
            <div className="p-4 border-b border-gray-100">
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsRestaurantDropdownOpen(!isRestaurantDropdownOpen)}
              >
                <div className="flex items-center min-w-0 flex-1">
                  {currentRestaurant?.image ? (
                    <img 
                      src={currentRestaurant.image}
                      alt={currentRestaurant.name}
                      className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3 flex-shrink-0">
                      {currentRestaurant?.name.charAt(0) || 'R'}
                    </div>
                  )}
                  <span className="font-medium text-gray-800 truncate">
                    {currentRestaurant?.name || t('common.selectRestaurant')}
                  </span>
                </div>
                <ChevronDown 
                  size={18}
                  className={`transition-transform duration-200 flex-shrink-0 ml-2 ${isRestaurantDropdownOpen ? 'rotate-180' : ''}`}
                />
              </div>

              {/* CRITICAL: Restaurant Dropdown */}
              {isRestaurantDropdownOpen && (
                <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  {restaurants.map(restaurant => (
                    <div 
                      key={restaurant.id}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors
                      ${currentRestaurant?.id === restaurant.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                      onClick={() => {
                        setCurrentRestaurant(restaurant);
                        setIsRestaurantDropdownOpen(false);
                      }}
                    >
                      {restaurant.image ? (
                        <img 
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-6 h-6 rounded-full object-cover mr-3 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3 flex-shrink-0">
                          {restaurant.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {restaurant.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CRITICAL: Collapsed Restaurant Indicator - Clean without auto-expand hints */}
          {isCollapsed && currentRestaurant && (
            <div className="p-2 border-b border-gray-100">
              <div 
                className="flex items-center justify-center p-2 bg-gray-50 rounded-lg transition-all duration-200"
                title={currentRestaurant.name}
              >
                {currentRestaurant.image ? (
                  <img 
                    src={currentRestaurant.image}
                    alt={currentRestaurant.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {currentRestaurant.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CRITICAL: Navigation Menu - Clean without auto-expand hints */}
          <nav className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <ul>
              <NavItem 
                icon={<LayoutDashboard size={20} />} 
                label={t('nav.dashboard')}
                tab="dashboard"
                isActive={currentTab === 'dashboard'}
              />
              <NavItem 
                icon={<UtensilsCrossed size={20} />} 
                label={t('nav.restaurants')}
                tab="restaurants"
                isActive={currentTab === 'restaurants'}
              />
              <NavItem 
                icon={<Users size={20} />} 
                label={t('nav.staff')} 
                tab="staff"
                isActive={currentTab === 'staff'}
              />
              <NavItem 
                icon={<Calendar size={20} />} 
                label={t('nav.schedule')} 
                tab="schedule"
                isActive={currentTab === 'schedule'}
              />
              <NavItem 
                icon={<TrendingUp size={20} />} 
                label={i18n.language === 'fr' ? 'Performance' : 'Performance'} 
                tab="performance"
                isActive={currentTab === 'performance'}
              />
              {/* CRITICAL: Time Clock nav item - only visible when enabled in settings */}
              <NavItem 
                icon={<Fingerprint size={20} />} 
                label={i18n.language === 'fr' ? 'Badgeuse' : 'Time Clock'} 
                tab="timeclock"
                isActive={currentTab === 'timeclock'}
                hidden={!userSettings?.timeClockEnabled}
              />
            </ul>
          </nav>

          {/* CRITICAL: Settings at Bottom - Clean without auto-expand hints */}
          <div className={`border-t border-gray-200 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <NavItem 
              icon={<Settings size={20} />} 
              label={t('nav.settings')}
              tab="settings"
              isActive={currentTab === 'settings'}
            />
          </div>
        </div>
      </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
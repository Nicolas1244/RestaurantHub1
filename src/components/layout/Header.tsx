import React from 'react';
import { Menu, Bell, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  toggleMobileMenu: () => void;
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleMobileMenu, toggleSidebar, isSidebarCollapsed }) => {
  const { currentRestaurant } = useAppContext();
  const { t, i18n } = useTranslation();

  const today = new Date();
  
  // Format date based on selected language with proper capitalization
  const formatDate = (date: Date): string => {
    if (i18n.language === 'fr') {
      // French format: "Samedi 14 Juin 2025" - with proper capitalization
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };
      const formattedDate = date.toLocaleDateString('fr-FR', options);
      
      // CRITICAL FIX: Ensure both day and month are capitalized
      // Split the date and capitalize the first letter of each word (day and month)
      return formattedDate.replace(/\b\w/g, (char) => char.toUpperCase());
    } else {
      // English format: "Saturday, June 14, 2025"
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    }
  };

  const formattedDate = formatDate(today);

  return (
    <header className={`bg-white border-b border-gray-200 h-16 fixed top-0 right-0 left-0 z-10 shadow-sm transition-all duration-300 ${
      isSidebarCollapsed ? 'lg:left-16' : 'lg:left-64'
    }`}>
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center">
          {/* CRITICAL: Mobile Menu Toggle */}
          <button 
            className="text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden mr-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={toggleMobileMenu}
            title="Toggle mobile menu"
          >
            <Menu size={24} />
          </button>

          {/* CRITICAL: Clean Desktop Sidebar Toggle Button - NO AUTO-CONTROL INDICATORS */}
          <div className="hidden lg:flex items-center mr-4">
            <button
              className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          </div>
          
          {/* CRITICAL: Date Display */}
          <div className="hidden md:flex items-center">
            <Calendar size={20} className="text-blue-600 mr-2" />
            <span className="text-gray-500 font-medium">{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* CRITICAL: Language Selector */}
          <LanguageSelector />

          {/* CRITICAL: Current Restaurant Display */}
          {currentRestaurant && (
            <div className="mr-6 hidden md:block">
              <h2 className="text-lg font-semibold text-gray-800">
                {currentRestaurant.name}
              </h2>
              <p className="text-sm text-gray-500">{currentRestaurant.location}</p>
            </div>
          )}

          {/* CRITICAL: Notifications */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
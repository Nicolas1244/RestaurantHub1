import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isEmployee } = useAuth();
  const [isManuallyControlled, setIsManuallyControlled] = useState(false); // CRITICAL: Track manual override
  
  // Redirect to login if not authenticated
  if (!isEmployee()) {
    return <Navigate to="/auth" replace />;
  }
  
  // CRITICAL: Refs and state for automatic retraction
  const sidebarRef = useRef<HTMLDivElement>(null);
  const autoCollapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // CRITICAL: Enhanced manual toggle with override tracking
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    setIsManuallyControlled(true); // Mark as manually controlled
    
    // Clear any pending auto-collapse timer
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }

    // Reset manual control after a delay to allow auto-behavior to resume
    setTimeout(() => {
      setIsManuallyControlled(false);
    }, 5000); // 5 seconds of manual control override
  };

  // CRITICAL: Automatic retraction logic with hover detection
  useEffect(() => {
    const handleMouseEnter = () => {
      isHoveringRef.current = true;
      
      // Clear any pending collapse timer
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }

      // Expand sidebar immediately when hovering (if not manually controlled)
      if (!isManuallyControlled && isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
      }
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;

      // Only start auto-collapse timer if not manually controlled
      if (!isManuallyControlled) {
        // Clear any existing timer
        if (autoCollapseTimerRef.current) {
          clearTimeout(autoCollapseTimerRef.current);
        }

        // Start 1-second timer for auto-collapse
        autoCollapseTimerRef.current = setTimeout(() => {
          // Double-check that we're still not hovering and not manually controlled
          if (!isHoveringRef.current && !isManuallyControlled) {
            setIsSidebarCollapsed(true);
          }
          autoCollapseTimerRef.current = null;
        }, 1000); // 1 second delay as requested
      }
    };

    // CRITICAL: Only attach listeners on desktop (lg breakpoint and above)
    const checkScreenSize = () => {
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      
      if (isDesktop && sidebarRef.current) {
        sidebarRef.current.addEventListener('mouseenter', handleMouseEnter);
        sidebarRef.current.addEventListener('mouseleave', handleMouseLeave);
      }
    };

    // Initial check
    checkScreenSize();

    // Listen for window resize to enable/disable auto-retraction
    window.addEventListener('resize', checkScreenSize);

    // Cleanup function
    return () => {
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener('mouseenter', handleMouseEnter);
        sidebarRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('resize', checkScreenSize);
      
      // Clear any pending timer
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
      }
    };
  }, [isSidebarCollapsed, isManuallyControlled]);

  // CRITICAL: Reset manual control when mobile menu is used
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsManuallyControlled(false);
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        ref={sidebarRef} // CRITICAL: Pass ref for hover detection
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isAutoControlled={!isManuallyControlled} // CRITICAL: Pass auto-control state
      />
      <Header 
        toggleMobileMenu={toggleMobileMenu}
        toggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <main className={`pt-16 min-h-screen transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
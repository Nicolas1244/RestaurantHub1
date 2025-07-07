import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../contexts/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRoles = ['admin', 'manager', 'employee'],
  redirectPath = '/auth'
}) => {
  const { loading, profile, hasAccess } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Check if user is authenticated and has required role
  const hasRequiredAccess = profile && hasAccess(requiredRoles);

  // Redirect if not authenticated or doesn't have required role
  if (!hasRequiredAccess) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render the protected route
  return <Outlet />;
};

export default ProtectedRoute;
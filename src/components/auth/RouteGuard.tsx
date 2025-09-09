import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSupervisor?: boolean;
  allowVendor?: boolean;
  redirectTo?: string;
}

export function RouteGuard({
  children,
  requireAdmin = false,
  requireSupervisor = false,
  allowVendor = false,
  redirectTo = '/propostas',
}: RouteGuardProps) {
  const permissions = useUserPermissions();

  if (permissions.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Check admin access
  if (requireAdmin && !permissions.isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check supervisor access (includes admin)
  if (requireSupervisor && !(permissions.isAdmin || permissions.isSupervisor)) {
    return <Navigate to={redirectTo} replace />;
  }

  // If vendor is not allowed and user is vendor, redirect
  if (!allowVendor && permissions.isVendor) {
    return <Navigate to="/propostas/calculos" replace />;
  }

  return <>{children}</>;
}
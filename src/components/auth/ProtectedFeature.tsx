import React from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface ProtectedFeatureProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSupervisor?: boolean;
  requireVendor?: boolean;
  requirePermission?: keyof ReturnType<typeof useUserPermissions>;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function ProtectedFeature({
  children,
  requireAdmin = false,
  requireSupervisor = false,
  requireVendor = false,
  requirePermission,
  fallback,
  showFallback = true,
}: ProtectedFeatureProps) {
  const permissions = useUserPermissions();

  if (permissions.loading) {
    return null;
  }

  let hasAccess = true;

  if (requireAdmin && !permissions.isAdmin) {
    hasAccess = false;
  }

  if (requireSupervisor && !(permissions.isAdmin || permissions.isSupervisor)) {
    hasAccess = false;
  }

  if (requireVendor && !permissions.isVendor) {
    hasAccess = false;
  }

  if (requirePermission && !permissions[requirePermission]) {
    hasAccess = false;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar esta funcionalidade.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
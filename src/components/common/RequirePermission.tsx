import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, hasPermission } from '@libraryos/shared';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RequirePermissionProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
  fallback,
}) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const allowed = role ? hasPermission(role, permission) : false;

  if (!allowed) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
        <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold mb-1">Permission Required</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          This feature requires the privilege: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{permission}</code>.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Return
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@libraryos/shared';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RequireRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ roles, children, fallback }) => {
  const { role, hasRole } = useAuth();
  const navigate = useNavigate();

  // If no role or role not allowed
  const hasAccess = hasRole(roles);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          Your current account role ({role || 'Guest'}) does not have permission to view or manage this section.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate('/staff')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

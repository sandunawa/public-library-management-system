import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { BookOpen, Home, AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ErrorBoundaryPage: React.FC = () => {
  const error = useRouteError();

  let errorMessage = 'An unexpected error occurred while loading this library view.';
  let statusCode = 'System Error';

  if (isRouteErrorResponse(error)) {
    statusCode = `${error.status} ${error.statusText}`;
    errorMessage = error.data?.message || 'The requested library catalog page or resource could not be found.';
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl border bg-card shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {statusCode}
          </span>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Page Not Found or Navigation Error
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {errorMessage}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="default" className="font-semibold">
            <Link to="/">
              <Home className="w-4 h-4 mr-1.5" />
              Return to Catalog Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="font-semibold">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 text-center animate-fade-in">
      <div className="max-w-md w-full">
        <EmptyState
          imageSrc="/images/error-state.webp"
          title={`${statusCode} — Library View Error`}
          description={errorMessage}
          actionNode={
            <div className="flex flex-col sm:flex-row gap-2 justify-center w-full">
              <Button asChild variant="primary" size="default" className="font-semibold">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Catalog Home
                </Link>
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => window.location.reload()}
                className="font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload View
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
};

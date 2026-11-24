import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 text-center animate-fade-in">
      <div className="max-w-md w-full">
        <EmptyState
          imageSrc="/images/not-found.webp"
          title="Catalogue Page Not Found (404)"
          description="The library catalog resource or page you requested does not exist or may have been relocated."
          actionNode={
            <Button asChild size="default" className="font-semibold">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Catalog Home
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
};

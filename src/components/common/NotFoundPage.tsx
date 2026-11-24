import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl border bg-card shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            404 — Page Not Found
          </span>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Catalogue Page Not Found
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page you requested does not exist or may have been relocated.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Button asChild className="font-semibold">
            <Link to="/">
              <Home className="w-4 h-4 mr-1.5" />
              Back to Catalog Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

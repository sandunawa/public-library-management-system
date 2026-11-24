import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark' | 'high-contrast' | 'warm-paper';

export const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('libraryos-theme') as Theme) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-high-contrast', 'theme-warm-paper');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'high-contrast') {
      root.classList.add('theme-high-contrast');
    } else if (theme === 'warm-paper') {
      root.classList.add('theme-warm-paper');
    }

    localStorage.setItem('libraryos-theme', theme);
  }, [theme]);

  return (
    <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg text-xs">
      <button
        type="button"
        title="Light Mode"
        aria-label="Light Mode"
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded transition-colors ${
          theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title="Dark Mode"
        aria-label="Dark Mode"
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded transition-colors ${
          theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

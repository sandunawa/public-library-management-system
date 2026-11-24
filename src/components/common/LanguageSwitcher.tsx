import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg text-xs font-medium">
      <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1" />
      <button
        type="button"
        onClick={() => handleLanguageChange('en')}
        className={`px-2 py-1 rounded transition-colors ${
          i18n.language === 'en'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange('si')}
        className={`px-2 py-1 rounded transition-colors font-sinhala ${
          i18n.language === 'si'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        සිංහල
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange('ta')}
        className={`px-2 py-1 rounded transition-colors font-tamil ${
          i18n.language === 'ta'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
};

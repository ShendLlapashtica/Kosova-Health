import React from 'react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  return (
    <footer className="w-full bg-surface-container-low mt-16 py-8 border-t border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm font-bold text-primary text-sm tracking-tight">
            KosovaHealth
          </span>
          <span className="text-outline">
            {language === 'al'
              ? '© 2025 Platforma Kombëtare e Analitikës Shëndetësore & Regjistri i Barnatoreve. Prishtinë, Kosovë.'
              : '© 2025 Kosovo Health Analytics & Laboratory Registry. Prishtinë, Republic of Kosovo.'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 font-medium text-secondary">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            {language === 'al' ? 'Rrjeti i Laboratorëve Prishtinë Aktiv' : 'Prishtina Laboratory Network Active'}
          </span>
          <button type="button" className="hover:text-primary transition-colors">
            {language === 'al' ? 'Politika e Privatësisë' : 'Clinical Privacy Policy'}
          </button>
          <button type="button" className="hover:text-primary transition-colors">
            {language === 'al' ? 'Kushtet e Kujdesit' : 'Terms of Care'}
          </button>
          <span className="text-error font-medium">
            {language === 'al' ? 'Urgjenca: 194' : 'Emergency: 194'}
          </span>
        </div>
      </div>
    </footer>
  );
};

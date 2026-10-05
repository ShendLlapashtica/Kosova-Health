import React from 'react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = (al: string, en: string) => (language === 'al' ? al : en);
  return (
    <footer className="w-full bg-surface-container-low mt-16 py-8 border-t border-surface-container-high/60">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs text-on-surface-variant">
        <div className="flex flex-col gap-1">
          <span className="font-headline-sm font-bold text-primary text-sm tracking-tight">KosovaHealth</span>
          <span>{t('© 2026 KosovaHealth · Prishtinë', '© 2026 KosovaHealth · Prishtina')}</span>
          <span className="text-outline">{t('Udhëzim i thjeshtë, jo diagnozë. Për çdo shqetësim, pyet mjekun.', 'Simple guidance, not a diagnosis. Ask your doctor about anything that worries you.')}</span>
        </div>

        <div className="flex flex-col gap-1 md:items-end">
          <span className="text-error font-bold">{t('Urgjenca: 194', 'Emergency: 194')}</span>
          <span>🔒 {t('PDF-të lexohen vetëm në pajisjen tënde — nuk dërgohen askund.', 'PDFs are read only on your device — never uploaded.')}</span>
          <span className="text-outline">
            {t('Të dhënat: dyqanet online në Kosovë · Open Food Facts · © OpenStreetMap', 'Data: Kosovo online shops · Open Food Facts · © OpenStreetMap')}
          </span>
        </div>
      </div>
    </footer>
  );
};

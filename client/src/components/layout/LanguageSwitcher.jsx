import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils.js';

/** EN | IT toggle. Persists via the i18n `languageChanged` handler. */
export default function LanguageSwitcher({ tone = 'ink', className }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('it') ? 'it' : 'en';

  const base = tone === 'white' ? 'text-white/70' : 'text-ink/50';
  const active = tone === 'white' ? 'text-white' : 'text-primary';

  return (
    <div className={cn('inline-flex items-center gap-1 text-small font-medium', className)}>
      {['en', 'it'].map((lng, i) => (
        <span key={lng} className="inline-flex items-center">
          {i > 0 && <span className={cn('mx-1', base)} aria-hidden="true">|</span>}
          <button
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            aria-pressed={current === lng}
            className={cn(
              'rounded px-1 uppercase transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              current === lng ? active : cn(base, 'hover:opacity-100')
            )}
          >
            {lng}
          </button>
        </span>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Modal, Input, Button } from '../ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Login dialog (Figma 12:356). Labelled email + password, password reveal
 * toggle, remember-me, and a disabled "Login with Google" future feature.
 */
export default function LoginModal({ open, onClose }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      onClose();
      setForm({ email: '', password: '' });
    } catch (err) {
      setError(
        err.response?.status === 401
          ? t('auth.errors.invalidCredentials')
          : t('auth.errors.generic')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('auth.loginTitle')}>
      <div className="p-7">
        <h2 className="text-h2 text-ink">{t('auth.loginTitle')}</h2>
        <p className="mt-1 text-body text-ink/60">{t('auth.loginSubtitle')}</p>

        <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
          <Input
            label={t('auth.email')}
            type="email"
            icon={Mail}
            required
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label={t('auth.password')}
            type={showPw ? 'text' : 'password'}
            icon={Lock}
            required
            autoComplete="current-password"
            placeholder={t('auth.passwordPlaceholder')}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                className="rounded p-1 text-ink/50 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <label className="flex items-center gap-2 text-small text-ink/70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-ink/30 text-primary focus:ring-primary/40"
            />
            {t('auth.rememberMe')}
          </label>

          {error && <p className="text-small text-red-600" role="alert">{error}</p>}

          <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
            {t('auth.loginButton')}
          </Button>
        </form>

        <p className="mt-4 text-center text-small text-ink/70">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" onClick={onClose} className="font-semibold text-primary hover:underline">
            {t('auth.getStarted')}
          </Link>
        </p>

        <div className="my-5 flex items-center gap-3 text-small text-ink/40">
          <span className="h-px flex-1 bg-ink/15" />
          {t('auth.orDivider')}
          <span className="h-px flex-1 bg-ink/15" />
        </div>

        <Button
          variant="outline"
          size="lg"
          disabled
          className="w-full"
          title={t('auth.googleSoon')}
        >
          {t('auth.googleLogin')} · {t('common.comingSoon')}
        </Button>
      </div>
    </Modal>
  );
}

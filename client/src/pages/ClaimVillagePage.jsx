import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, User, Mail, Lock, Building2, Map, MapPin, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Input, Button } from '../components/ui/index.js';
import api from '../lib/api.js';

/**
 * Public "claim your village" form — the front door to the officer lifecycle.
 *
 * Posts to `POST /api/users/officer-request`, which creates a `pending` officer
 * account plus an auditable `OfficerRequest` for the admin queue. The account
 * can authenticate immediately but `requireActive` blocks every write until an
 * admin approves it, so this page promises review, not access.
 *
 * Municipality, region and province may be pre-filled from the query string —
 * the village detail page links here with its own values so an officer arriving
 * from their village does not retype what the platform already knows.
 */
export default function ClaimVillagePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    municipalityName: params.get('municipality') ?? '',
    region: params.get('region') ?? '',
    province: params.get('province') ?? '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Named when arriving from a village page, so the confirmation can be specific.
  const villageName = params.get('village') ?? '';

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = t('auth.errors.firstNameRequired');
    if (!form.lastName.trim()) next.lastName = t('auth.errors.lastNameRequired');
    if (!form.email.trim()) next.email = t('auth.errors.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t('auth.errors.emailInvalid');
    if (!form.password) next.password = t('auth.errors.passwordRequired');
    else if (form.password.length < 6) next.password = t('auth.errors.passwordShort');
    if (form.confirmPassword !== form.password) next.confirmPassword = t('auth.errors.confirmMismatch');
    if (!form.municipalityName.trim()) next.municipalityName = t('claim.errors.municipalityRequired');
    if (!form.region.trim()) next.region = t('claim.errors.regionRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/users/officer-request', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        municipalityName: form.municipalityName,
        region: form.region,
        province: form.province || undefined,
        message: form.message || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      // 422 returns a field-keyed error object; surface it against the fields.
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors) setErrors(fieldErrors);
      setSubmitError(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 size={30} aria-hidden="true" />
          </div>
          <h1 className="text-h1 text-ink">{t('claim.successTitle')}</h1>
          <p className="mt-3 text-body-lg text-ink/70">
            {villageName
              ? t('claim.successBodyVillage', { village: villageName })
              : t('claim.successBody', { municipality: form.municipalityName })}
          </p>
          <p className="mt-4 text-body text-ink/60">{t('claim.successNext')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="brand" onClick={() => navigate('/')}>{t('common.backHome')}</Button>
            <Button variant="outline" onClick={() => navigate('/villages')}>
              {t('footer.allVillages')}
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-body text-ink/60 hover:text-primary"
      >
        <ArrowLeft size={18} /> {t('common.back')}
      </button>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-h1 text-ink">{t('claim.title')}</h1>
          <p className="mt-3 max-w-2xl text-body-lg text-ink/70">{t('claim.subtitle')}</p>

          <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
            <fieldset className="space-y-5">
              <legend className="mb-1 text-h3 text-ink">{t('claim.sectionMunicipality')}</legend>
              <Input
                label={t('claim.municipalityName')}
                icon={Building2}
                required
                value={form.municipalityName}
                onChange={set('municipalityName')}
                error={errors.municipalityName}
                hint={t('claim.municipalityHint')}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label={t('dash.common.region')}
                  icon={Map}
                  required
                  value={form.region}
                  onChange={set('region')}
                  error={errors.region}
                />
                <Input
                  label={t('dash.common.province')}
                  icon={MapPin}
                  value={form.province}
                  onChange={set('province')}
                  error={errors.province}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-5 pt-2">
              <legend className="mb-1 text-h3 text-ink">{t('claim.sectionContact')}</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label={t('auth.firstName')}
                  icon={User}
                  required
                  value={form.firstName}
                  onChange={set('firstName')}
                  error={errors.firstName}
                />
                <Input
                  label={t('auth.lastName')}
                  icon={User}
                  required
                  value={form.lastName}
                  onChange={set('lastName')}
                  error={errors.lastName}
                />
              </div>
              <Input
                label={t('auth.email')}
                type="email"
                icon={Mail}
                required
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                hint={t('claim.emailHint')}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label={t('auth.password')}
                  type="password"
                  icon={Lock}
                  required
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                />
                <Input
                  label={t('auth.confirmPassword')}
                  type="password"
                  icon={Lock}
                  required
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  error={errors.confirmPassword}
                />
              </div>
            </fieldset>

            <div>
              <label htmlFor="claim-message" className="mb-1.5 block text-small font-medium text-ink">
                {t('claim.message')}
              </label>
              <textarea
                id="claim-message"
                rows={4}
                value={form.message}
                onChange={set('message')}
                placeholder={t('claim.messagePlaceholder')}
                className="w-full rounded-card bg-white p-4 text-body text-ink shadow-input placeholder:text-[#757575] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              <p className="mt-1.5 text-small text-ink/60">{t('claim.messageHint')}</p>
            </div>

            {submitError && (
              <p className="text-body text-red-600" role="alert">{submitError}</p>
            )}

            <Button type="submit" variant="brand" loading={loading} className="w-full sm:w-auto">
              {t('claim.submit')}
            </Button>
          </form>
        </div>

        {/* What happens next */}
        <aside className="lg:pt-24">
          <div className="rounded-card bg-white p-6 shadow-card">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck size={20} aria-hidden="true" />
              <h2 className="text-h3 text-ink">{t('claim.asideTitle')}</h2>
            </div>
            <ol className="mt-4 space-y-3 text-body text-ink/70">
              <li>{t('claim.step1')}</li>
              <li>{t('claim.step2')}</li>
              <li>{t('claim.step3')}</li>
            </ol>
            <p className="mt-5 text-small text-ink/60">{t('claim.asideNote')}</p>
            <p className="mt-4 text-small text-ink/60">
              {t('claim.touristInstead')}{' '}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                {t('claim.touristLink')}
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}

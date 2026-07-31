import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Mail, Phone, MapPin, Lock, Camera } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Input, Button } from '../components/ui/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import { cn } from '../lib/utils.js';

/** 0–4 password-strength score with a label key. */
function scorePassword(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

const STRENGTH = ['strengthWeak', 'strengthWeak', 'strengthFair', 'strengthGood', 'strengthStrong'];
const STRENGTH_COLOR = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-primary'];

export default function SignupPage() {
  const { t } = useTranslation();
  const { register, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', city: '', password: '', confirmPassword: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const strength = scorePassword(form.password);

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = t('auth.errors.firstNameRequired');
    if (!form.lastName.trim()) next.lastName = t('auth.errors.lastNameRequired');
    if (!form.email.trim()) next.email = t('auth.errors.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t('auth.errors.emailInvalid');
    if (!form.password) next.password = t('auth.errors.passwordRequired');
    else if (form.password.length < 6) next.password = t('auth.errors.passwordShort');
    if (form.confirmPassword !== form.password) next.confirmPassword = t('auth.errors.confirmMismatch');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        city: form.city || undefined,
      });

      // Registration is complete and the user is authenticated; upload the
      // avatar as a follow-up call. A failed upload must not block sign-up.
      if (avatarFile) {
        try {
          const fd = new FormData();
          fd.append('avatar', avatarFile);
          const res = await api.patch('/auth/me', fd, { headers: { 'Content-Type': undefined } });
          updateUser({ avatar: res.data.data.user.avatar });
        } catch {
          /* ignore avatar upload failure — account already created */
        }
      }

      navigate('/');
    } catch (err) {
      setSubmitError(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Container className="py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-body text-ink/60 hover:text-primary"
      >
        <ArrowLeft size={18} /> {t('common.backHome')}
      </button>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <div className="order-2 lg:order-1">
          <h1 className="text-display text-ink">{t('auth.signupTitle')}</h1>
          <p className="mt-2 text-body-lg text-ink/70">{t('auth.signupSubtitle')}</p>

          <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={submit} noValidate>
            <Input label={t('auth.firstName')} icon={User} required value={form.firstName}
              onChange={set('firstName')} error={errors.firstName} autoComplete="given-name" />
            <Input label={t('auth.lastName')} icon={User} required value={form.lastName}
              onChange={set('lastName')} error={errors.lastName} autoComplete="family-name" />
            <Input label={t('auth.email')} type="email" icon={Mail} required value={form.email}
              onChange={set('email')} error={errors.email} autoComplete="email"
              placeholder={t('auth.emailPlaceholder')} className="sm:col-span-2" />
            <Input label={t('auth.phone')} icon={Phone} value={form.phone} onChange={set('phone')}
              hint={t('auth.optional')} autoComplete="tel" />
            <Input label={t('auth.city')} icon={MapPin} value={form.city} onChange={set('city')}
              hint={t('auth.optional')} autoComplete="address-level2" />

            <div className="sm:col-span-2">
              <Input label={t('auth.password')} type="password" icon={Lock} required
                value={form.password} onChange={set('password')} error={errors.password}
                autoComplete="new-password" />
              {form.password && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-1.5 flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={cn('flex-1 rounded-full',
                        i < strength ? STRENGTH_COLOR[strength] : 'bg-ink/10')} />
                    ))}
                  </div>
                  <span className="text-small text-ink/60">
                    {t('auth.passwordStrength')}: {t(`auth.${STRENGTH[strength]}`)}
                  </span>
                </div>
              )}
            </div>

            <Input label={t('auth.confirmPassword')} type="password" icon={Lock} required
              value={form.confirmPassword} onChange={set('confirmPassword')}
              error={errors.confirmPassword} autoComplete="new-password" className="sm:col-span-2" />

            {submitError && <p className="text-small text-red-600 sm:col-span-2" role="alert">{submitError}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full sm:w-auto">
                {t('auth.createAccount')}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-body text-ink/70">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t('auth.loginInstead')}
            </Link>
          </p>
        </div>

        {/* Avatar */}
        <div className="order-1 flex flex-col items-center lg:order-2 lg:pt-24">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-white shadow-card"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera size={36} className="text-ink/40" aria-hidden="true" />
            )}
            <span className="absolute inset-0 hidden items-center justify-center bg-black/30 text-small font-medium text-white group-hover:flex">
              {t('auth.uploadPhoto')}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          <p className="mt-3 text-center text-small font-medium text-ink">{t('auth.avatar')}</p>
          <p className="mt-1 max-w-[220px] text-center text-small text-ink/50">{t('auth.avatarHint')}</p>
        </div>
      </div>
    </Container>
  );
}

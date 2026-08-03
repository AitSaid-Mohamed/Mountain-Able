import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mail, Phone, MapPin, Building2, Shield, CalendarDays, Mountain, Sparkles,
  MessageSquare, Users, Map as MapIcon, Lock, Pencil, Trash2, Monitor, BadgeCheck,
  MapPinCheck, Heart,
} from 'lucide-react';
import { PageHeader, InfoBar, Panel, FieldRow } from '../../components/dashboard/index.js';
import { StatCard, Button, Input, Modal, ConfirmDialog } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useOfficerScope } from '../../context/OfficerScopeContext.jsx';
import api from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState('info');

  return (
    <div>
      <PageHeader
        title={t('profile.title')}
        tabs={[
          { key: 'info', label: t('profile.information') },
          { key: 'security', label: t('profile.security') },
        ]}
        activeTab={tab}
        onTab={setTab}
      />
      {tab === 'info' ? <InformationTab user={user} locale={i18n.language} /> : <SecurityTab user={user} />}
    </div>
  );
}

/** Role-specific stat cards, sourced from real API data only. */
function useProfileStats(user, t) {
  const officer = useOfficerScope();
  const overview = useFetch(user.role === 'admin' || user.role === 'authority' ? '/stats/overview' : null);
  const usersMeta = useFetch(user.role === 'admin' ? '/users' : null, { params: { limit: 1 } });
  const pending = useFetch(user.role === 'admin' ? '/comments/pending' : null, { params: { limit: 1 } });
  const regions = useFetch(user.role === 'authority' ? '/stats/regions' : null);
  const meStats = useFetch(user.role === 'tourist' ? '/me/stats' : null);
  const s = (k) => t(`dash.stat.${k}`);

  if (user.role === 'tourist') {
    return [
      { icon: MapPinCheck, label: t('my.stats.visited'), value: meStats.data?.villagesVisited ?? '—' },
      { icon: Heart, label: t('my.stats.favorited'), value: meStats.data?.villagesFavorited ?? '—' },
      { icon: MessageSquare, label: t('my.stats.reviews'), value: meStats.data?.reviewsWritten ?? '—' },
    ];
  }
  if (user.role === 'officer') {
    return [
      { icon: Mountain, label: s('villagesManaged'), value: officer.totals?.villages ?? '—' },
      { icon: Sparkles, label: s('attractionsPublished'), value: officer.totals?.attractions ?? '—' },
      { icon: MessageSquare, label: s('reviewsReceived'), value: officer.totals?.reviews ?? '—' },
    ];
  }
  if (user.role === 'admin') {
    return [
      { icon: Users, label: s('totalUsers'), value: usersMeta.meta?.total ?? '—' },
      { icon: Mountain, label: s('villagesOnPlatform'), value: overview.data?.villages ?? '—' },
      { icon: Shield, label: s('pendingModeration'), value: pending.meta?.total ?? '—' },
    ];
  }
  return [
    { icon: MapIcon, label: s('regionsMonitored'), value: regions.data?.length ?? '—' },
    { icon: Mountain, label: s('villagesTracked'), value: overview.data?.villages ?? '—' },
    { icon: MessageSquare, label: s('reviewsAnalysed'), value: overview.data?.comments ?? '—' },
  ];
}

function InformationTab({ user, locale }) {
  const { t } = useTranslation();
  const stats = useProfileStats(user, t);
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  const roleValue = t(`roles.${user.role}`);
  const badges = [
    { icon: Mail, label: user.email },
    { icon: user.role === 'officer' ? Building2 : Shield, label: user.role === 'officer' ? (user.municipalityId?.name ?? t('profile.municipality')) : roleValue },
    { icon: CalendarDays, label: `${t('profile.memberSince')} ${formatDate(user.createdAt, locale)}` },
  ];

  return (
    <div className="space-y-6">
      <InfoBar user={user} badges={badges} />

      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s, i) => (
          <StatCard key={i} layout="tile" icon={s.icon} value={s.value} label={s.label} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[620px_440px]">
        <Panel icon={Users} title={t('profile.personalInfo')}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldRow icon={Users} label={t('profile.firstName')} value={user.firstName} />
            <FieldRow icon={Users} label={t('profile.lastName')} value={user.lastName} />
            <FieldRow icon={Mail} label={t('profile.email')} value={user.email} />
            <FieldRow icon={Phone} label={t('profile.phone')} value={user.phone} />
            <FieldRow icon={MapPin} label={t('profile.city')} value={user.city} />
            {user.role === 'officer' ? (
              <FieldRow icon={Building2} label={t('profile.municipality')} value={user.municipalityId?.name} />
            ) : (
              <FieldRow icon={Shield} label={t('profile.role')} value={roleValue} />
            )}
          </div>
        </Panel>

        <Panel icon={Pencil} title={t('profile.quickActions')}>
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex h-[47px] w-full max-w-[347px] items-center justify-center gap-2 rounded-pill border-2 border-[#08f] text-[16px] font-medium text-[#08f] transition hover:bg-[#08f]/5"
            >
              <Pencil size={18} /> {t('profile.editAccount')}
            </button>
            <button
              type="button"
              onClick={() => setDelOpen(true)}
              className="flex h-[47px] w-full max-w-[347px] items-center justify-center gap-2 rounded-pill border-2 border-[#ef4444] text-[16px] font-medium text-[#ef4444] transition hover:bg-[#ef4444]/5"
            >
              <Trash2 size={18} /> {t('profile.deleteAccount')}
            </button>
          </div>
        </Panel>
      </div>

      <EditAccountModal open={editOpen} onClose={() => setEditOpen(false)} user={user} />
      <DeleteAccountDialog open={delOpen} onClose={() => setDelOpen(false)} user={user} />
    </div>
  );
}

function EditAccountModal({ open, onClose, user }) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '', city: user.city ?? '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/auth/me', form);
      updateUser(res.data.data.user);
      toast.success(t('profile.saved'));
      onClose();
    } catch {
      toast.error(t('auth.errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md" title={t('profile.editAccount')}>
      <form className="space-y-4 p-6" onSubmit={save}>
        <h2 className="text-h3 text-ink">{t('profile.editAccount')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('profile.firstName')} value={form.firstName} onChange={set('firstName')} required />
          <Input label={t('profile.lastName')} value={form.lastName} onChange={set('lastName')} required />
          <Input label={t('profile.phone')} value={form.phone} onChange={set('phone')} />
          <Input label={t('profile.city')} value={form.city} onChange={set('city')} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="brand" loading={saving}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteAccountDialog({ open, onClose, user }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [confirm, setConfirm] = useState('');

  const onConfirm = () => {
    // The platform has no self-service account deletion endpoint; deletion is an
    // administrator action. Surface that honestly rather than faking success.
    toast.info(t('dash.admin.cannotSelf'));
    onClose();
    setConfirm('');
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('profile.deleteAccount')}>
      <div className="p-6">
        <h3 className="text-h3 text-red-600">{t('profile.deleteAccount')}</h3>
        <p className="mt-2 text-body text-ink/70">{t('profile.deleteWarning')}</p>
        <Input
          className="mt-4"
          label={t('profile.deleteConfirmType', { email: user.email })}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={user.email}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" className="!bg-red-500" disabled={confirm !== user.email} onClick={onConfirm}>
            {t('profile.deleteAccount')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SecurityTab({ user }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const strength = Math.min(4, [form.next.length >= 6, form.next.length >= 10, /[A-Z]/.test(form.next) && /[a-z]/.test(form.next), /\d/.test(form.next) && /[^A-Za-z0-9]/.test(form.next)].filter(Boolean).length);

  const submit = (e) => {
    e.preventDefault();
    // No password-change endpoint yet — see report notes.
    toast.info(t('profile.passwordSoon'));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Panel icon={Lock} title={t('profile.changePassword')}>
        <form className="space-y-4" onSubmit={submit}>
          <Input type="password" label={t('profile.currentPassword')} value={form.current} onChange={set('current')} />
          <Input type="password" label={t('profile.newPassword')} value={form.next} onChange={set('next')} />
          {form.next && (
            <div className="flex h-1.5 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`flex-1 rounded-full ${i < strength ? 'bg-primary' : 'bg-ink/10'}`} />
              ))}
            </div>
          )}
          <Input type="password" label={t('profile.confirmPassword')} value={form.confirm} onChange={set('confirm')} />
          <Button type="submit" variant="brand">{t('profile.changePassword')}</Button>
        </form>
      </Panel>

      <div className="space-y-6">
        <Panel icon={Monitor} title={t('profile.activeSession')}>
          <p className="text-body text-ink/70">{t('profile.sessionInfo')}</p>
        </Panel>
        <Panel icon={BadgeCheck} title={t('profile.accountStatus')}>
          <p className="text-body">
            <span className="mr-2 text-ink/60">{t('roles.' + user.role)}</span>
            <span className={`rounded-pill px-3 py-1 text-small font-medium ${user.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
              {t('dash.common.' + user.status)}
            </span>
          </p>
        </Panel>
      </div>
    </div>
  );
}

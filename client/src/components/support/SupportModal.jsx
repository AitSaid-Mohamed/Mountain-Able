import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Modal, Input, Button } from '../ui/index.js';

/**
 * Support dialog (Figma 12:386). Left: email + message + submit. Right: other
 * contact channels. The form logs the submission (no backend endpoint) and
 * shows a success state.
 */
export default function SupportModal({ open, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    // No support endpoint yet — log the submission and simulate a send.
    // eslint-disable-next-line no-console
    console.info('[support] submission', form);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    setSent(true);
  };

  const close = () => {
    onClose();
    // Reset shortly after close so the animation isn't jarring.
    setTimeout(() => {
      setSent(false);
      setForm({ email: '', message: '' });
    }, 200);
  };

  return (
    <Modal open={open} onClose={close} size="lg" title={t('support.title')}>
      <div className="p-7">
        <h2 className="text-h2 text-ink">{t('support.title')}</h2>
        <p className="mt-1 text-body text-ink/60">{t('support.subtitle')}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2 md:divide-x md:divide-ink/10">
          {/* Left: form */}
          <div className="md:pr-6">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 size={40} className="text-primary" />
                <p className="mt-3 text-body text-ink/80">{t('support.success')}</p>
                <Button variant="outline" className="mt-6" onClick={close}>
                  {t('common.close')}
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit} noValidate>
                <Input
                  label={t('support.email')}
                  type="email"
                  icon={Mail}
                  required
                  placeholder={t('support.emailPlaceholder')}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                <div>
                  <label htmlFor="support-msg" className="mb-1.5 block text-small font-medium text-ink">
                    {t('support.message')}
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <textarea
                    id="support-msg"
                    required
                    rows={5}
                    placeholder={t('support.messagePlaceholder')}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full rounded-card bg-white px-4 py-3 text-body text-ink shadow-input placeholder:text-[#757575] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                </div>
                <Button type="submit" variant="brand" loading={sending} className="w-full">
                  {sending ? t('support.sending') : t('support.send')}
                </Button>
              </form>
            )}
          </div>

          {/* Right: channels */}
          <div className="md:pl-6">
            <h3 className="text-body-lg font-semibold text-ink">{t('support.moreWays')}</h3>
            <div className="mt-4 space-y-3">
              <ContactCard
                icon={MessageCircle}
                label={t('support.whatsapp')}
                value={t('support.whatsappValue')}
              />
              <ContactCard
                icon={Mail}
                label={t('support.emailContact')}
                value={t('support.emailValue')}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ContactCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-ink/10 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={20} aria-hidden="true" />
      </div>
      <div>
        <p className="text-small text-ink/50">{label}</p>
        <p className="text-body font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rating, Button } from '../ui/index.js';

/**
 * Review composer: interactive star picker + textarea. Used both to create a
 * new review and to edit an existing one (`initial`).
 */
export default function ReviewForm({ initial, onSubmit, submitting, submitLabel, onCancel }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [content, setContent] = useState(initial?.content ?? '');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      setError(t('village.ratingRequired'));
      return;
    }
    setError('');
    await onSubmit({ rating, content });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="mb-1.5 text-small font-medium text-ink">{t('village.yourRating')}</p>
        <Rating interactive value={rating} onChange={setRating} />
      </div>
      <div>
        <label htmlFor="review-content" className="mb-1.5 block text-small font-medium text-ink">
          {t('village.yourReview')}
        </label>
        <textarea
          id="review-content"
          rows={4}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('village.reviewPlaceholder')}
          className="w-full rounded-card bg-white px-4 py-3 text-body text-ink shadow-input placeholder:text-[#757575] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>
      {error && <p className="text-small text-red-600" role="alert">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="brand" loading={submitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}

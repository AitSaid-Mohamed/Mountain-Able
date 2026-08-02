import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import Container from '../layout/Container.jsx';
import { SectionHeading, ErrorState } from '../ui/index.js';
import VillageCard from '../villages/VillageCard.jsx';
import VillageCardSkeleton from '../villages/VillageCardSkeleton.jsx';

/** "Most Popular" — three top-rated villages. */
export default function MostPopular({ villages, loading, error, onRetry }) {
  const { t } = useTranslation();

  return (
    <section className="py-14">
      <Container>
        <SectionHeading
          action={
            <Link
              to="/villages?sort=-rating"
              className="inline-flex items-center gap-1 text-body font-semibold text-primary hover:underline"
            >
              {t('common.seeMore')}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          }
        >
          {t('home.mostPopular')}
        </SectionHeading>

        <div className="mt-8">
          {error ? (
            <ErrorState error={error} onRetry={onRetry} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? [0, 1, 2].map((i) => <VillageCardSkeleton key={i} />)
                : villages?.map((v) => <VillageCard key={v._id} village={v} />)}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

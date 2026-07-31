import { useFetch } from '../hooks/useFetch.js';
import Hero from '../components/home/Hero.jsx';
import MostPopular from '../components/home/MostPopular.jsx';
import AboutSection from '../components/home/AboutSection.jsx';
import Faq from '../components/home/Faq.jsx';

export default function HomePage() {
  // Top-rated villages feed both the hero photo stack and the Most Popular row.
  const { data, loading, error, refetch } = useFetch('/villages', {
    params: { sort: '-rating', limit: 3 },
  });
  const villages = data ?? [];

  return (
    <>
      <Hero villages={villages} loading={loading} />
      <MostPopular villages={villages} loading={loading} error={error} onRetry={refetch} />
      <AboutSection />
      <Faq />
    </>
  );
}

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from './Container.jsx';
import Logo from './Logo.jsx';
import { useModal } from '../../context/ModalContext.jsx';

export default function Footer() {
  const { t } = useTranslation();
  const { openSupport } = useModal();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('footer.explore'),
      links: [
        { label: t('footer.allVillages'), to: '/villages' },
        { label: t('footer.upcomingEvents'), to: '/events' },
        { label: t('footer.topRated'), to: '/villages?sort=-rating' },
      ],
    },
    {
      title: t('footer.aboutCol'),
      links: [
        { label: t('footer.ourMission'), to: '/about' },
        { label: t('footer.howItWorks'), to: '/about' },
        { label: t('footer.forMunicipalities'), to: '/about' },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { label: t('footer.contactUs'), onClick: openSupport },
        { label: t('footer.faq'), to: '/#faq' },
        { label: t('footer.reportIssue'), onClick: openSupport },
      ],
    },
  ];

  return (
    <footer className="mt-16 bg-primary text-white">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-8">
            <Logo tone="white" />
            <p className="mt-4 max-w-xs text-body text-white/80">{t('footer.tagline')}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-body-lg font-semibold">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="text-body text-white/80 transition hover:text-white">
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={link.onClick}
                        className="text-body text-white/80 transition hover:text-white"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <div className="border-t border-white/20">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-small text-white/70 sm:flex-row">
          <span>
            © {year} Mountain-Able. {t('footer.rights')}
          </span>
          <span>Politecnico di Milano — Master Mountain-Able</span>
        </Container>
      </div>
    </footer>
  );
}

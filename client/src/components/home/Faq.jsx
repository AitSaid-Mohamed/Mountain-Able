import { useState, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import Container from '../layout/Container.jsx';
import { SectionHeading } from '../ui/index.js';
import { cn } from '../../lib/utils.js';

const ITEMS = ['q1', 'q2', 'q3', 'q4', 'q5'];

/** FAQ accordion — single item open at a time, animated height. */
export default function Faq() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const baseId = useId();

  return (
    <section id="faq" className="scroll-mt-24 py-14">
      <Container>
        <SectionHeading>{t('home.faqHeading')}</SectionHeading>
        <div className="mx-auto mt-8 max-w-3xl space-y-3">
          {ITEMS.map((key, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const btnId = `${baseId}-btn-${i}`;
            return (
              <FaqItem
                key={key}
                isOpen={isOpen}
                panelId={panelId}
                btnId={btnId}
                question={t(`home.faq.${key}`)}
                answer={t(`home.faq.a${key.slice(1)}`)}
                onToggle={() => setOpen(isOpen ? null : i)}
              />
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function FaqItem({ isOpen, onToggle, question, answer, panelId, btnId }) {
  const contentRef = useRef(null);
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <h3>
        <button
          id={btnId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-body font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {question}
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={cn('shrink-0 text-primary transition-transform duration-300', isOpen && 'rotate-180')}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        style={{ height: isOpen ? contentRef.current?.scrollHeight : 0 }}
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
      >
        <div ref={contentRef} className="border-t border-ink/10 px-5 py-4 text-body text-ink/70">
          {answer}
        </div>
      </div>
    </div>
  );
}

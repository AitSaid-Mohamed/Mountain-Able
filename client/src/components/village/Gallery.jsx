import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { onImageError, FALLBACK_IMAGE, mediaUrl } from '../../lib/utils.js';

/**
 * Village gallery: one large image on the left, two stacked on the right.
 * Clicking any image opens a keyboard-navigable lightbox.
 */
export default function Gallery({ images = [], cover, name }) {
  const all = [cover, ...images].filter(Boolean).map(mediaUrl);
  const unique = [...new Set(all)];
  const shots = unique.length ? unique : [FALLBACK_IMAGE];
  const [lightbox, setLightbox] = useState(null); // index or null

  const big = shots[0];
  const side = shots.slice(1, 3);
  while (side.length < 2) side.push(big);

  const move = (dir) =>
    setLightbox((i) => (i + dir + shots.length) % shots.length);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <button
          type="button"
          onClick={() => setLightbox(0)}
          className="group relative block overflow-hidden rounded-card"
        >
          <img
            src={big}
            alt={name}
            loading="lazy"
            onError={onImageError}
            className="h-64 w-full object-cover transition group-hover:scale-[1.02] md:h-[351px]"
          />
        </button>
        <div className="grid grid-rows-2 gap-3">
          {side.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightbox(Math.min(i + 1, shots.length - 1))}
              className="group relative block overflow-hidden rounded-card"
            >
              <img
                src={src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                onError={onImageError}
                className="h-[120px] w-full object-cover transition group-hover:scale-[1.03] md:h-[169px]"
              />
            </button>
          ))}
        </div>
      </div>

      {lightbox !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label={name}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X size={24} />
            </button>
            {shots.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); move(-1); }}
                  aria-label="Previous"
                  className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); move(1); }}
                  aria-label="Next"
                  className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            <img
              src={shots[lightbox]}
              alt={name}
              onError={onImageError}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] rounded-card object-contain"
            />
          </div>,
          document.body
        )}
    </>
  );
}

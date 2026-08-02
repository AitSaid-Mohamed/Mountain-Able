import { mediaUrl } from '../../lib/utils.js';

/**
 * Horizontal profile "info bar": large circular avatar, name, and a row of
 * info badges (icon + label). Matches the Figma profile screen treatment.
 */
export default function InfoBar({ user, badges = [] }) {
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="flex flex-col items-center gap-5 rounded-card bg-white p-5 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.15)] sm:flex-row sm:items-center">
      {user?.avatar ? (
        <img src={mediaUrl(user.avatar)} alt="" className="h-[135px] w-[135px] shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-[135px] w-[135px] shrink-0 items-center justify-center rounded-full bg-primary/15 text-4xl font-semibold text-primary">
          {initials || '?'}
        </span>
      )}
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-[20px] font-medium text-ink">
          {user?.firstName} {user?.lastName}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 sm:justify-start">
          {badges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-[14px] text-[#808080]">
              {b.icon && <b.icon size={22} className="text-cta" aria-hidden="true" />}
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

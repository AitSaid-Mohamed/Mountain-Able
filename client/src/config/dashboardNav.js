import {
  LayoutDashboard,
  Mountain,
  Sparkles,
  CalendarDays,
  MessageSquare,
  User,
  Building2,
  Users,
  UserPlus,
  ShieldCheck,
  Tags,
  LifeBuoy,
  Handshake,
  Network,
  Map,
  Trophy,
  Smile,
} from 'lucide-react';

/**
 * Per-role dashboard configuration: the base path, the roles allowed, and the
 * sidebar nav items. The `DashboardLayout` shell is driven entirely by this
 * object so the three dashboards share one layout implementation.
 *
 * The Figma sidebar (Stocks / Staff / Finance …) was a retail-template
 * leftover; these items reflect the tourism domain instead.
 */
export const DASHBOARDS = {
  officer: {
    base: '/dashboard',
    roles: ['officer'],
    titleKey: 'roles.officer',
    items: [
      { to: '', key: 'overview', icon: LayoutDashboard },
      { to: 'villages', key: 'myVillages', icon: Mountain },
      { to: 'attractions', key: 'attractions', icon: Sparkles },
      { to: 'events', key: 'events', icon: CalendarDays },
      { to: 'feedback', key: 'feedback', icon: MessageSquare },
      // `badge` names a count on the inbox summary; the sidebar renders it when
      // non-zero. Officers will not sit watching a queue, so the dashboard has
      // to tell them something is waiting.
      { to: 'coordination', key: 'coordination', icon: Handshake, badge: 'awaitingResponse' },
      { to: 'profile', key: 'profile', icon: User },
    ],
  },
  admin: {
    base: '/admin',
    roles: ['admin'],
    titleKey: 'roles.admin',
    items: [
      { to: '', key: 'overview', icon: LayoutDashboard },
      { to: 'villages', key: 'villages', icon: Mountain },
      { to: 'municipalities', key: 'municipalities', icon: Building2 },
      { to: 'users', key: 'users', icon: Users },
      { to: 'officer-requests', key: 'requests', icon: UserPlus },
      { to: 'moderation', key: 'moderation', icon: ShieldCheck },
      { to: 'categories', key: 'categories', icon: Tags },
      { to: 'support', key: 'support', icon: LifeBuoy },
      { to: 'service-types', key: 'serviceTypes', icon: Network },
      { to: 'profile', key: 'profile', icon: User },
    ],
  },
  authority: {
    base: '/authority',
    roles: ['authority'],
    titleKey: 'roles.authority',
    items: [
      { to: '', key: 'overview', icon: LayoutDashboard },
      { to: 'regions', key: 'regions', icon: Map },
      { to: 'top-villages', key: 'topVillages', icon: Trophy },
      { to: 'satisfaction', key: 'satisfaction', icon: Smile },
      { to: 'coordination', key: 'coordination', icon: Handshake },
      { to: 'profile', key: 'profile', icon: User },
    ],
  },
};

/** Dashboard base path for a role (used by the header user menu). */
export const dashboardBase = (role) => DASHBOARDS[role]?.base;

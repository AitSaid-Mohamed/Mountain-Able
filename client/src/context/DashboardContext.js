import { createContext, useContext } from 'react';

/**
 * Shared dashboard state exposed to every dashboard screen: the active role
 * config, and `readOnly` (true for a `pending` officer, who may view but not
 * mutate anything until an admin approves the account).
 */
export const DashboardContext = createContext({ readOnly: false, config: null, role: null });

export function useDashboard() {
  return useContext(DashboardContext);
}

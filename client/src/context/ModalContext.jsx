import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ModalContext = createContext(null);

/**
 * Global modal coordinator. Lets any component open the Login or Support modal
 * (both are portalled, app-wide dialogs rather than routes). The actual modal
 * components are rendered once in <Layout>.
 */
export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null); // 'login' | 'support' | null

  const openLogin = useCallback(() => setModal('login'), []);
  const openSupport = useCallback(() => setModal('support'), []);
  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo(
    () => ({ modal, openLogin, openSupport, closeModal }),
    [modal, openLogin, openSupport, closeModal]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within a ModalProvider');
  return ctx;
}

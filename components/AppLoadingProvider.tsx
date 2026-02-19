'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AppLoadingContextType {
  isAppLoading: boolean;
  setIsAppLoading: (loading: boolean) => void;
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined);

export function AppLoadingProvider({ children }: { children: ReactNode }) {
  const [isAppLoading, setIsAppLoading] = useState(true);

  return (
    <AppLoadingContext.Provider value={{ isAppLoading, setIsAppLoading }}>
      {children}
    </AppLoadingContext.Provider>
  );
}

export function useAppLoading() {
  const context = useContext(AppLoadingContext);
  if (context === undefined) {
    return { isAppLoading: true, setIsAppLoading: () => {} };
  }
  return context;
}

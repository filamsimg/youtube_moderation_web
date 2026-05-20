'use client';

import { SessionProvider as Provider } from 'next-auth/react';

export default function SessionProvider({ children, session }) {
  return (
    <Provider
      session={session}
      refetchOnWindowFocus={false}  // ← Cegah refresh saat pindah tab
    >
      {children}
    </Provider>
  );
}

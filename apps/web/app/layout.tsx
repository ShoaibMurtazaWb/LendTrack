// =============================================================================
// LendTrack :: Root Next.js Layout (App Router)
// apps/web/app/layout.tsx
// =============================================================================

import React from 'react';
import './global.css';
import Providers from '../components/Providers.js';
import Navigation from '../components/Navigation.js';

export const metadata = {
  title: 'LendTrack | Track Items & Tools Lent Or Borrowed',
  description: 'Manage personal items, track who borrowed what, receive automated reminders, and never lose your tools again.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          <Navigation />
          <main className="app-container">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

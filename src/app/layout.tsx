import type { Metadata } from 'next';
import './globals.css';

/*
 * Placeholder metadata. Title, description, and canonical URL must be derived
 * from config/lgu.config.json via src/lib/lgu-config.ts once that exists —
 * LGU identity is never hardcoded in a component. See context/portal.md.
 */
export const metadata: Metadata = {
  title: 'Civic Portal',
  description: 'Community-led civic portal.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

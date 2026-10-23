import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Creditsplit — Fair credit for collaborative work',
  description: 'Fund collaborative work, independently assess contributions on GenLayer, and verify transparent GEN reward allocations.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

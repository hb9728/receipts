import '../app/globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'receipts',
  description: 'anonymous receipts — image + caption in under 20 seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100`}>
        <div className="max-w-xl mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  );
}

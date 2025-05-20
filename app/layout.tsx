import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BitcoinInsightAI - AI-Powered Bitcoin & sBTC Explorer',
  description: 'AI-powered blockchain explorer for detailed Bitcoin and sBTC transaction analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
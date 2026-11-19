import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shopify Merchant Analytics Dashboard',
  description: 'AI-ready Shopify merchant analytics metric engine and foundation dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}


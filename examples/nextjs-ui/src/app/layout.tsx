import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { ThemeProvider } from '@/components/theme-provider';

const sansFont = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Modern Face API - Demo',
  description: 'Modern face detection and recognition examples using shadcn/ui',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={sansFont.className}>
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto bg-background">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

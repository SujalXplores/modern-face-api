import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarProvider>
      </body>
    </html>
  );
}

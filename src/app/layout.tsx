import type { Metadata } from 'next';
import './globals.css';
import '@/styles/responsive-touch.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import { InstallPromptWrapper } from '@/components/pwa/InstallPromptWrapper';

export const metadata: Metadata = {
  title: 'CareerCompass',
  description: 'Your guide to professional growth and opportunities.',
  icons: {
    icon: 'https://i.postimg.cc/nLrDYrHW/icon.png',
    apple: 'https://i.postimg.cc/nLrDYrHW/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CareerCompass',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#6366f1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
              {children}
              <Toaster />
              <InstallPromptWrapper />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


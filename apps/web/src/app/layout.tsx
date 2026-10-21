import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Providers } from '@/components/providers';
import RuntimeEnvScript from '@/components/runtime-env-script';
import WhatsNew from '@/features/whats-new/WhatsNew';
import { localeDirection, type Locale } from '@/i18n/locales';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return {
    title: t('title'),
    description: t('description'),
    icons: { icon: [{ url: '/design_system/assets/favicon.svg?v=accord-3.3.14', type: 'image/svg+xml' }, { url: '/favicon.svg?v=accord-3.3.14', type: 'image/svg+xml' }, { url: '/favicon.ico?v=accord-3.3.14', sizes: '32x32', type: 'image/x-icon' }], shortcut: '/design_system/assets/favicon.svg?v=accord-3.3.14', apple: '/design_system/assets/favicon.svg?v=accord-3.3.14' },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={localeDirection(locale as Locale)} suppressHydrationWarning>
      <body className="antialiased" data-design-system="accord-milled-carbon-v3.3.0">
        <RuntimeEnvScript />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="itsaplan-theme"
        >
          <NextIntlClientProvider>
            <Providers>
              {children}
              <WhatsNew />
            </Providers>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

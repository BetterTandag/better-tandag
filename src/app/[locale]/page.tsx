import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ContactSection } from '@/components/home/ContactSection';
import { EmergencySection } from '@/components/home/EmergencySection';
import { GettingHere } from '@/components/home/GettingHere';
import { Hero } from '@/components/home/Hero';
import { HistorySection } from '@/components/home/HistorySection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { StatBand } from '@/components/home/StatBand';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { FallbackNotice } from '@/components/ui/FallbackNotice';
import { routing } from '@/i18n/routing';
import { getHomeContent } from '@/lib/content';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const content = await getHomeContent(locale);

  return (
    <>
      <main id="main" tabIndex={-1}>
        {content.hasFallback ? <FallbackNotice /> : null}
        <Hero />
        <StatBand stats={content.stats} />
        <ServicesSection {...content.services} />
        <HistorySection {...content.history} />
        {/*
          Emergency 03, Getting here 04. The two were swapped so the numbers a
          resident may need in a storm come before the travel guide, and the
          eyebrow numbering in messages/ was swapped with them.

          It also breaks up the two dark slabs: Emergency and Contact are both
          full-bleed inverse grounds, and they used to sit one after the other
          with only a margin between them. Getting here now separates them.
        */}
        <EmergencySection {...content.emergency} />
        <GettingHere cards={content.gettingHere} />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}

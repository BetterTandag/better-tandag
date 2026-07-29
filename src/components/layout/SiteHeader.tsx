import { getTranslations } from 'next-intl/server';
import type { NavItem } from '@/data/navigation';
import { PRIMARY_NAV } from '@/data/navigation';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { lguConfig } from '@/lib/lgu-config';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { Logo } from '@/components/ui/Logo';
import { NavLink } from '@/components/ui/NavLink';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Wordmark } from '@/components/ui/Wordmark';
import { MobileNav } from './MobileNav';
import { NavDisclosure } from './NavDisclosure';

/**
 * The sticky header. A Server Component — the interactive pieces
 * (LocaleSwitcher, ThemeToggle, MobileNav, NavDisclosure) are client leaves
 * imported into it. The navigation tree never crosses the boundary: every
 * disclosure receives its child links already rendered.
 *
 * The design's desktop search block was a results dropdown with no input: the
 * field had been removed and the dropdown left behind. It is not ported.
 */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const [t, tNav] = await Promise.all([
    getTranslations('header'),
    getTranslations('nav'),
  ]);

  /**
   * One row of the navigation, at either size.
   *
   * A leaf is a plain `<li>` with a NavLink. A parent is a NavDisclosure, which
   * renders its own `<li>` and the nested `<ul>` — so the submenu is a real
   * child of its parent's list item in both places, and the two surfaces cannot
   * drift apart.
   */
  function navRow(item: NavItem, variant: 'dropdown' | 'inline') {
    const desktop = variant === 'dropdown';

    // Mobile rows carry a rule between them and fill the sheet; desktop rows
    // sit inline in the header row.
    const parentClass = desktop
      ? 'inline-flex min-h-11 items-center text-sm font-medium'
      : 'flex min-h-12 w-full items-center border-b border-line-subtle text-base';

    const childClass = desktop
      ? 'flex min-h-11 items-center rounded-lg px-2.5 text-sm hover:bg-surface-control'
      : 'flex min-h-11 items-center text-sm';

    if (!item.children) {
      return (
        <li key={item.messageKey}>
          <NavLink
            item={item}
            variant={desktop ? 'inline' : 'badge'}
            className={parentClass}
          />
        </li>
      );
    }

    return (
      <NavDisclosure
        key={item.messageKey}
        label={tNav(item.messageKey)}
        variant={variant}
        buttonClassName={parentClass}
      >
        {item.children.map(child => (
          <li key={child.messageKey}>
            <NavLink item={child} variant="badge" className={childClass} />
          </li>
        ))}
      </NavDisclosure>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface-page/85 backdrop-blur-sm backdrop-saturate-150">
      <div className="page-measure flex items-center gap-3 py-2 sm:gap-6">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2 hover:no-underline"
          aria-label={t('homeLink', { portal: lguConfig.portal.name })}
        >
          <Logo idPrefix="header" size={40} />
          {/*
            The province sub-label that used to sit under the wordmark is gone.
            The mark is 40px and the lockup is now two lines; a third line puts
            every line under 13px, which is smaller than the smallest type
            anywhere else on the page. "Surigao del Sur" is not lost — it is the
            hero eyebrow directly below, and the <title>. See the round notes.
          */}
          <Wordmark />
        </Link>

        {/* A real list now, not a row of loose links: the submenus need a
            parent `<li>` to nest inside, and a reader browsing by structure
            gets the group sizes for free.

            `gap-3` at `lg`, not the old `gap-5`. Every label grew a chevron and
            Filipino runs 15-25% longer — "Mga Serbisyo / Pamahalaan / Ang
            Lungsod / Emerhensiya / Kontak" is ~500px of the ~530px the row has
            at 1024px once the logo and the controls are paid for. The wider
            gap comes back at `xl`, where there is room for it. */}
        <nav aria-label={tNav('label')} className="hidden lg:block">
          <ul className="flex items-center gap-3 xl:gap-4">
            {PRIMARY_NAV.map(item => navRow(item, 'dropdown'))}
          </ul>
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <LocaleSwitcher
            current={locale}
            groupLabel={t('languageLabel')}
            labels={{ en: t('english'), fil: t('filipino') }}
            fullNames={{ en: t('englishFull'), fil: t('filipinoFull') }}
            className="hidden sm:flex"
          />
          <ThemeToggle
            toDarkLabel={t('switchToDark')}
            toLightLabel={t('switchToLight')}
            darkAnnouncement={t('themeIsDark')}
            lightAnnouncement={t('themeIsLight')}
          />
          <MobileNav>
            <ul className="grid">
              {PRIMARY_NAV.map(item => navRow(item, 'inline'))}
            </ul>
            <div className="pt-4 sm:hidden">
              <LocaleSwitcher
                current={locale}
                groupLabel={t('languageLabel')}
                labels={{ en: t('english'), fil: t('filipino') }}
                fullNames={{ en: t('englishFull'), fil: t('filipinoFull') }}
              />
            </div>
          </MobileNav>
        </div>
      </div>
    </header>
  );
}

# BetterTandag.org

A community-led, open-source civic portal for the **City of Tandag, Surigao del Sur, Philippines** — built to give residents fast, clear, and modern access to government services, officials, budgets, planning documents, and public information.

Live site: **[bettertandag.org](https://bettertandag.org)**

---

## What's on the Site

### Home Page

- **Hero section** — search card with a live-autocomplete service finder and popular service shortcuts
- **City Stats** — live weather widget (Open-Meteo API), population / barangay / land area figures, link to the full city profile
- **Featured Services** — highlighted service categories
- **Government Quick Links** — Full Disclosure, City Officials, City Profile, FOI Releases, Planning Documents, Barangay Directory
- **History, Leadership, Contact** sections

### Services

Citizen-facing guides across 11 LGU service categories, organized by category:

| Category                      | What's Covered                                                                |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Health Services               | Free check-ups, medicines, vaccines, hospital admission, maternal care        |
| Education                     | Daycare/preschool enrollment, scholarships, supplementary programs            |
| Business                      | Business permits, renewals, public market stalls, trade fairs                 |
| Social Welfare                | Senior citizen / PWD / solo parent assistance, disaster relief, livelihood    |
| Agriculture & Fisheries       | Veterinary services, seeds and fingerlings, farming training, equipment loans |
| Infrastructure & Public Works | Road projects, drainage, public facilities                                    |
| Garbage & Waste Disposal      | Collection schedules, proper disposal                                         |
| Environment                   | Tree planting, CENRO services, environmental compliance                       |
| Disaster Preparedness         | CDRRMO programs, evacuation, early warning                                    |
| Housing & Land Use            | Zoning, housing programs, land use guidance                                   |
| Tourism                       | Must-see places, where to stay, local products, tourism permits               |

### Government

- **Departments & Officials** — Mayor, Vice Mayor, **Sangguniang Panlungsod**, ex-officio members, department directory
- **Transparency Documents** — Full Disclosure Policy (FDP), Annual Budget, SALN, FOI Releases, Planning Downloads (CLUP, CDP, ELA, maps)
- **Reports & Statistics** — City Profile & Statistics, Annual Accomplishment Report, Infrastructure Projects
- **Guides & Regulations** — Legislative information, city ordinances

### City Profile Page

- Live weather widget (temperature, humidity, wind via Open-Meteo — no API key required)
- Population growth charts, economic sector breakdown, population trend line
- 21-barangay directory, awards and recognition
- OpenStreetMap embed showing the City of Tandag (291.73 km² land area)

---

## Tech Stack

| Layer                | Technology                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Framework            | **Next.js 16** (App Router, Turbopack, Cache Components)                                  |
| UI                   | React 19.2 + TypeScript 5.9 (strict)                                                      |
| Rendering            | React Server Components by default; Client Components at interactive leaves               |
| Styling              | Tailwind CSS v4 (`@tailwindcss/postcss`) + `@bettergov/kapwa` + `@tailwindcss/typography` |
| Routing              | Next.js App Router (file-based)                                                           |
| i18n                 | `next-intl` with an `[locale]` segment (EN / FIL)                                         |
| Request interception | `proxy.ts` — Next 16's replacement for `middleware.ts`                                    |
| Content              | Markdown (`react-markdown` + `remark-gfm`) + YAML (`js-yaml`) — **no database**           |
| Charts               | Recharts                                                                                  |
| Icons                | Lucide React                                                                              |
| Forms / validation   | React Hook Form + Zod                                                                     |
| URL state            | `nuqs`                                                                                    |
| Weather              | Open-Meteo API (free, no key)                                                             |
| Testing              | Vitest (unit) + Playwright (E2E)                                                          |
| Tooling              | npm, Node 24, ESLint, Prettier, Husky, lint-staged, commitlint                            |
| Deployment           | Vercel (auto-deploy on push to `main`)                                                    |

**Version ceilings — do not install these at `latest`:**

- **TypeScript stays on 5.9.x.** `typescript-eslint` peers `typescript >=4.8.4 <6.1.0`; TypeScript 7 breaks type-aware linting repo-wide.
- **`lucide-react` stays on 0.577.x.** `@bettergov/kapwa@1.4.1` peers `lucide-react >=0.500.0 <1`.
- **ESLint stays on 9.x.** `eslint-config-next@16.2.12` vendors `eslint-plugin-react@7.37.5`, which peers at `eslint ^9.7` and throws on ESLint 10.

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000 (Turbopack)
npm run build      # Production build
npm start          # Serve the production build
```

Requires **Node 24** (see `.nvmrc`). No Docker, no local database, no Wrangler — `npm install && npm run dev` is the whole setup.

### Quality gate

All five must pass before a pull request:

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint . --max-warnings 0
npm run format:check  # prettier --check .
npm test              # Vitest
npm run test:e2e      # Playwright
```

`next build` does **not** lint in Next.js 16, and `next lint` has been removed — linting is always its own step. E2E requires browsers once: `npx playwright install chromium`.

---

## Configuration

Secrets go in `.env.local` (git-ignored); `.env.example` is the committed template. Only `NEXT_PUBLIC_*` values reach the browser — never put a secret behind that prefix.

---

## Content Structure

_Target structure — not yet populated._

```
content/
├── services/
│   ├── health-services/          # Markdown pages + index.yaml
│   ├── education/
│   ├── business/
│   ├── social-welfare/
│   ├── agriculture-fisheries/
│   ├── infrastructure-public-works/
│   ├── garbage-waste-disposal/
│   ├── environment/
│   ├── disaster-preparedness/
│   ├── housing-land-use/
│   └── tourism/
└── government/
    ├── departments/
    ├── legislative/
    ├── transparency-documents/
    ├── reports-and-statistics/
    └── guides-and-regulations/

src/data/
├── services.yaml       # Service category definitions (slug, icon, description)
├── government.yaml     # Government category definitions
└── navigation.ts       # Navbar + footer link structure

messages/
├── en.json             # English UI strings
└── fil.json            # Filipino UI strings
```

Each category folder contains:

- **`index.yaml`** — lists all pages with `name`, `slug`, `description`, and optional `updatedAt`
- **`[slug].md`** — markdown content for each page, split into `##` sections

Two distinct mechanisms, kept apart: **UI chrome and labels** live in `messages/{en,fil}.json`; **page body copy** lives in markdown.

---

## Adding or Editing Content

Adding a page requires **no code change** — the dynamic route resolves both manifests.

### Add a new service page

1. Add an entry to the category's `index.yaml`:

```yaml
pages:
  - name: 'Your Service Name'
    slug: 'your-service-slug'
    description: 'One-line description shown in the hero.'
    updatedAt: 'July 2026'
```

2. Create the markdown file at `content/services/[category]/your-service-slug.md`:

```markdown
# Your Service Name

Brief intro paragraph.

---

## Section One

Content here...

## Section Two

| Column A | Column B |
| -------- | -------- |
| Value 1  | Value 2  |
```

The `slug` in YAML **must** match the filename exactly. Each `##` heading becomes its own card on the page, and tables render as mobile-friendly cards by default with a "Table view" toggle.

### Add a Filipino translation

Create `[slug].fil.md` alongside the English file. The app serves it automatically when the user switches to FIL, and falls back to English with a visible banner when the translation is missing — that fallback is deliberate.

### Update "Last Updated" on a page

Add `updatedAt: 'Month Year'` to the page entry in `index.yaml`. If omitted, the page footer shows a site-wide default.

---

## Project Structure

_Target structure. Paths mirror URLs — `src/app/` mirrors routes, `content/` mirrors the content tree, `e2e/` mirrors routes._

```
content/                    ALL page copy — markdown + YAML manifests
messages/                   UI strings for next-intl (en, fil)
proxy.ts                    Locale negotiation (NOT middleware.ts)
next.config.ts              cacheComponents, images, turbopack
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx      Locale provider, Navbar, Footer
│   │   ├── page.tsx        /
│   │   ├── services/[category]/[slug]/
│   │   ├── government/
│   │   ├── city-profile/
│   │   ├── not-found.tsx  error.tsx
│   ├── api/                Route Handlers
│   ├── globals.css         Tailwind v4 @theme + Kapwa styles
│   └── sitemap.ts  robots.ts  opengraph-image.tsx
├── components/
│   ├── layout/             Navbar, Footer, InfoBar
│   ├── home/               Hero, ServicesSection, StatsSection
│   ├── ui/                 Breadcrumbs, Section, DisclaimerBar, ScrollToTop
│   └── markdown/           ReactMarkdown overrides, TableWithToggle
├── data/                   services.yaml, government.yaml, navigation.ts
├── hooks/                  Client-only hooks
├── lib/                    content.ts, lgu-config.ts, utils.ts
├── i18n/                   next-intl routing + request config
└── types/
e2e/                        Mirrors routes
```

---

## Key Features

### Server-first rendering

A civic portal is overwhelmingly static reading material. Server-rendering it means residents on slow connections get HTML immediately, and the JavaScript bundle stays proportional to actual interactivity rather than to page count. `'use client'` is a deliberate, leaf-level decision — never a default, and never on a page or layout "to make a child work".

### Degrade, never crash

Every external call is wrapped so an upstream outage renders an empty state rather than failing the page. A weather API timeout must not take down the home page.

### Design system

`@bettergov/kapwa` components layered over a Tandag semantic color scale declared in Tailwind v4's `@theme`. Color comes from a named token (`bg-primary-700`, `text-neutral-900`) — hardcoded hex/rgb/hsl and arbitrary values like `bg-[#16643c]` are a review failure.

### Accessibility

WCAG 2.1 AA is the floor: semantic HTML first, keyboard reachable, visible focus, touch targets ≥ 44 px, and contrast verified against the `@theme` scale. Each page gets an `@a11y`-tagged Playwright check via `@axe-core/playwright`.

---

## SEO

Handled entirely by Next.js built-ins — **no `react-helmet`**:

- `export const metadata` (static) / `generateMetadata` (dynamic) — unique title, description, keywords, Open Graph, and Twitter card per page
- `src/app/sitemap.ts` — generated from the content manifests, so new pages appear automatically
- `src/app/robots.ts`
- File-based `opengraph-image` (1200×630)
- Canonical URLs derived from `config/lgu.config.json`

---

## Deployment

**Vercel**, framework preset **Next.js**. `main` → production; every pull request gets a preview deployment.

Production configuration lives in Vercel project environment variables. There is no `vercel.json` rewrite block — the App Router handles routing, so the reference portal's Vite SPA fallback does not apply here.

---

## About Tandag City

**Tandag** is a component city and the **capital of Surigao del Sur**, in the **Caraga region (Region XIII)** of Mindanao. It became the provincial capital under Republic Act No. 2786, which created Surigao del Sur, and has served as a regional seat far longer — in **1650** Tandag became the capital town of Surigao, then known as Caraga.

Cityhood was granted on **June 25, 2007** under **Republic Act No. 9392**. The Supreme Court invalidated it on November 18, 2008, and Tandag's city status was finally **affirmed on February 15, 2011**.

- **Population:** 63,098 (2024 census) · 62,669 (2020 census)
- **Land area:** 291.73 km² (112.64 sq mi)
- **Barangays:** 21
- **Households:** 14,931
- **Income class:** 3rd city income class
- **Legislative district:** Surigao del Sur's 1st district
- **Coordinates:** 9°04′44″N, 126°11′55″E (9.0789, 126.1986)
- **Elevation:** 88 m (289 ft)
- **ZIP code:** 8300
- **Legislature:** Sangguniang Panlungsod
- **Languages:** Tagon-on, Surigaonon, Cebuano, Tagalog
- **Official site:** [www.tandag.gov.ph](https://www.tandag.gov.ph)

### The 21 barangays

Awasian · Bag-ong Lungsod · Bioto · Bongtud · Buenavista · Dagocdoc · Mabua · Mabuhay · Maitum · Maticdum · Pandanon · Pangi · Quezon · Rosario · Salvacion · San Agustin Norte · San Agustin Sur · San Antonio · San Isidro · San Jose · Telaje

### Landmarks and culture

San Nicolas de Tolentino Cathedral (patron saint's feast on September 10) · **Hinalaran Festival**, a street-dancing competition held the third Sunday of January · Busay Falls and Andap Falls · the Linungao Islands, Twin Linungao Island, and Mancangangi Island · Surigao del Sur Sports Center.

_City facts sourced from [Wikipedia: Tandag](https://en.wikipedia.org/wiki/Tandag). Figures should be verified against the [official city government portal](https://www.tandag.gov.ph) and the Philippine Statistics Authority before being published as page content._

---

## Contributing

Contributions are welcome — including from non-developers. Corrections to city information, new service guides, and Filipino translations are all valuable, and most of them are a markdown file rather than code.

- **Branches:** `main` (production), `development` (integration). Cut feature branches from `development`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) with a scope, enforced by commitlint — e.g. `feat(services): add business permit renewal guide`.
- **Before opening a PR:** the five-command quality gate above must pass.
- Found something wrong with the city data? Open an issue rather than guessing.

---

## License

**CC0 1.0 Universal (public domain).** Content sourced from official City Government of Tandag portals and publicly available government data. All information is provided for transparency and civic use, and is not an official publication of the City Government of Tandag.

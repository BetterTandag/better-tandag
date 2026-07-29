# Contributing to BetterTandag

Thanks for helping. This is a community-run civic portal for the City of Tandag, and it is only as good as the
documents behind it.

**You do not need to be a developer.** Most of what this site needs is not code — it is a corrected phone
number, a service guide written in plain language, or a Filipino translation. Those are markdown and YAML
files, and changing one requires no JavaScript at all.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Please read the accuracy section of it
before contributing any city data — on this project, a wrong number is closer to a harm than a bug.

---

## Contribution Areas

| Area              | Focus                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Corrections**   | A wrong number, address, fee, requirement, or date. **The most valuable thing you can do.**                                                       |
| **Sources**       | Replace a weak citation with the primary record. We publish figures that are true but cite Wikipedia; fixing one of those is a real contribution. |
| **Content**       | Service guides in plain language — "how do I get a business permit". Markdown, no code.                                                           |
| **Translations**  | Filipino, for UI strings or page copy. Partial is fine; the site discloses what is untranslated.                                                  |
| **Accessibility** | Report or fix anything unusable by keyboard, by screen reader, or on a small phone.                                                               |
| **Design**        | Layout, typography, and the token layer — without breaking the 320px floor or the contrast ramp.                                                  |
| **Bug fixes**     | Reported issues, with a regression test.                                                                                                          |
| **Features**      | New routes and sections, per the route map.                                                                                                       |
| **Documentation** | These guides, and the comments in the code.                                                                                                       |

Not sure where something belongs? Open an issue and ask. "I think this is wrong but I don't know what's right"
is a genuinely useful issue.

---

## The rule that matters most: cite the record

**Every published figure about Tandag must trace to a public record** — the official city portal, the PSA, a
Republic Act, a Supreme Court decision, or a comparable source. Store the citation alongside the value in the
same YAML file.

- Wikipedia is a **finding aid, not an authority**. Cite _through_ it to the primary record and record
  `via: wikipedia` so the citation line can name the real source.
- A number nobody can source does not ship, or it ships with its provenance stated in front of it, never
  behind it. See `content/home/emergency.yaml` for how the hotlines handle this.
- If you re-check a value, bump its `lastCheckedAt`. A stale date on an emergency number is its own hazard.
- Never publish a contact as a working `tel:`/`mailto:` link unless it has been verified. The config carries a
  `status` flag for exactly this, and the UI renders unverified values as marked non-links.

If you cannot source something, say so in the pull request. That is a useful contribution too.

### And: no named people outside the data layer

**A person's name is data, not prose.** Don't write anyone's name — an elected official, a department head, a
barangay captain, a fellow contributor — into a document, a code comment, a commit message, or a test fixture.
**Say the role instead**: "the Mayor", "the City DRRM officer", "a maintainer".

Names belong in `content/**` and `config/lgu.config.json` and nowhere else. There a name carries its source and
its check date, is rendered rather than asserted, and can be corrected with a content change after an election.
Written into a design note it is an unsourced political claim with no citation and no obvious place to fix it.

Organisations are fine to name (City DRRM Office, PNP Tandag, PSA), as is a historical figure that reaches the
page through a cited record.

---

## Setup

Requires **Node 24+** and npm. If you are contributing rather than just running it, **fork first** and clone
your fork — see [How to Contribute](#how-to-contribute).

```bash
git clone https://github.com/BetterTandag/better-tandag.git
cd better-tandag
npm install
cp .env.example .env.local
npm run dev          # → http://localhost:3000
```

End-to-end tests need a browser once:

```bash
npx playwright install chromium
```

---

## Content is data, not code

All page content lives in `content/` as markdown bodies plus `index.yaml` manifests, read through the single
module `src/lib/content.ts`. Site chrome (nav labels, button text) lives in `messages/en.json` and
`messages/fil.json`. City identity — name, coordinates, contacts, brand colour — lives in
`config/lgu.config.json`.

**Adding a page should not require a code change.** If it does, the route is wrong — fix the route rather than
working around it in a component.

> ⚠️ **Editing a YAML file may not show up until you restart `npm run dev`.** The loaders are cached with
> `'use cache'` and `cacheLife('max')`, which is right in production — content ships with the build, so a
> deploy is the invalidation. In development the cache has no idea the file changed: `content/` is read at
> runtime, so it is not a module the bundler watches. If your edit seems to do nothing, restart the dev server
> before you go looking for a bug in your YAML. (This cost a real debugging session: a stale entry served the
> old text long after both the content and the code had changed.)

Three rules that will otherwise bite you:

- The `slug` in a YAML manifest must match its markdown filename **exactly**, or the page 404s while the file
  sits there looking correct.
- A Filipino page is `<slug>.fil.md` beside `<slug>.md`. Missing translations fall back to English **with a
  visible banner** — that fallback is deliberate and must never be made silent.

---

## Code standards

Full detail lives in [docs/coding-standards.md](docs/coding-standards.md). The rules most likely to fail
review:

- **Server Components by default.** `'use client'` belongs on the interactive leaf that actually needs state,
  effects, or browser APIs — never on a `page.tsx` or `layout.tsx` to make a child work.
- **Design tokens only.** Colour, spacing, and type come from named `@theme` tokens (`bg-primary-700`,
  `text-ink-secondary`). A hardcoded hex or an arbitrary value (`bg-[#16643c]`, `text-[13px]`) fails the
  build — there is a Vitest scan for it.
- **Accessibility is a gate, not a polish pass.** WCAG 2.1 AA: semantic HTML, keyboard reachable, visible
  focus, labelled controls, 44px touch targets, contrast checked. Every route ships an `@a11y` Playwright
  check.
- **TypeScript strict, no `any`.** Use `unknown` and narrow. Validate anything parsed from YAML, front-matter,
  or an external API with **Zod** at the boundary.
- **Degrade, never crash.** Any external call must render an empty state on failure rather than take the page
  down.
- Treat markdown, YAML, and URL params as untrusted. No raw HTML passthrough. No `console.log` in committed
  code.

---

## How to Contribute

1. **Fork** the repository.
2. **Clone** your fork and install: `npm install`.
3. **Create** a branch — `git checkout -b feature/your-feature-name` (or `fix/…`). `main` is the trunk; there
   is no `development` branch. Maintainers with write access branch directly on the repo; everyone else works
   from a fork.
4. **Make** your changes.
5. **Test** — run the quality gate below, and click through what you changed at a narrow width as well as a
   wide one. Our Playwright suite covers Chromium and a mobile Chromium profile; if you touched layout,
   opening it once in Firefox or Safari is a real help, because CI cannot.
6. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint on a
   `commit-msg` hook. Never bypass hooks with `--no-verify` — if a hook fails, the hook is usually right.
7. **Push** to your fork — `git push origin feature/your-feature-name`.
8. **Open** a Pull Request against `main`.

### Commit message format

```
type(scope): brief description
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `build`, `ci`, `style`. Examples:

```
feat(services): add business permit renewal guide
fix(emergency): correct the second BFP Tandag number
docs(readme): document the content pipeline
```

Content-only changes still use a code type with a content scope —
`docs(content): add business permit renewal guide`. There is no `content:` type, and commitlint will reject
one. Keep the subject under 72 characters; add a body only when the _why_ isn't obvious.

---

## Pull Request Process

1. **Run the quality gate.** All five must pass:

   ```bash
   npm run typecheck && npm run lint && npm run format:check && npm test && npm run test:e2e
   ```

   `next build` does not lint in Next.js 16 and `next lint` has been removed — linting is always its own step.

2. **Update the documentation** if you changed behaviour, a rule, or a published figure.
3. **Add or update tests** — a Vitest unit for logic, a Playwright spec for a route, and a regression test on
   any bug fix.
4. **Describe the change** in the PR: what changed and why.
5. **Cite your sources.** If you added or corrected a figure, link where it came from. This is the part
   reviewers will ask about first.
6. **Say what you tested**, including the narrow width if you touched the UI.
7. **Link the related issue**, and respond to review feedback.

---

## Review Criteria

Reviewers look at:

- **Data accuracy and provenance** — is every new figure sourced, dated, and traceable to a public record?
  This carries the most weight; see [the sourcing rule](#the-rule-that-matters-most-cite-the-record).
- **Accessibility** — semantic HTML, keyboard reachable, visible focus, contrast, 44px targets, and a passing
  `@a11y` check.
- **Correctness** — it does what it says, and the tests would fail if it stopped.
- **Design-system compliance** — named `@theme` tokens only; no hex, no arbitrary values.
- **Rendering boundaries** — Server Components by default, `'use client'` only at an interactive leaf.
- **Mobile** — works at 320px, no horizontal page scroll.
- **Security** — content and params treated as untrusted, no raw HTML passthrough, no secrets, no
  `console.log`.
- **Style consistency** — it reads like the code around it.

A reviewer asking where a number came from is the process working, not an objection to your contribution.

---

## Reporting a problem

- **Wrong city data** — open an issue with the correct value _and_ its source. Please do not guess; an issue
  saying "this looks wrong, I am not sure what is right" is genuinely more useful than a confident wrong fix.
- **Bug or accessibility failure** — open an issue with the page, the viewport or assistive technology, and
  what you expected.
- **Code of Conduct concern** — see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Recognition

Every contributor is recognised in the repository's history and contributor list. Substantial contributions may
be highlighted on the site itself.

Corrections count. Someone who files one well-sourced fix to a wrong hotline number has done more for a
resident of Tandag than most feature work, and the project treats it that way.

---

## Licence

Contributions are released under **CC0 1.0 Universal (public domain)**, the same terms as the rest of the
project. Do not contribute material you are not free to place in the public domain.

---

## Thank You

Thank you for helping make government information accessible to the people of Tandag.

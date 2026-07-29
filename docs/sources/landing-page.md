# Landing page — sources

> ✅ **This list is now a page: `/[locale]/sources`.** That route is _derived_ from the `source` blocks in
> `content/home/stats.yaml` and `content/home/emergency.yaml`, so it cannot fall out of step with the figures.
> **The citation table below is a snapshot for readers of the repo — the route is what ships.** Add or correct
> a citation on the figure it backs; do not maintain a second list here.
>
> The editorial parts of that page — its intro, review date and caveats — live in `content/sources.yaml`.

The consolidated citation list for the landing page. It used to be a "Sources on this page" block in the site
footer; that was replaced by a copyright + version bar, and this file took its place.

> ⚠️ **Per-figure citations are still on the page** — each stat-band caption carries its own source line
> ("2024 census · PSA", "6 urban · 5 coastal · 4 built-up · 6 hinterland"), and every emergency hotline states
> its provenance inline. What a reader lost is the single aggregated list and the one-click links below. On a
> transparency portal that is a real reduction, and restoring it as a `/sources` route generated from this file
> is the cheapest way back.

**Last reviewed:** 28 July 2026

Figures carry the year they belong to. Where we have no source, the space stays empty.

## Sources

| Source                          | What it backs                                                                         | URL                                           | Via       |
| ------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------- | --------- |
| Wikipedia — Tandag              | Census count, land area, barangay classification, cityhood record, history, transport | <https://en.wikipedia.org/wiki/Tandag>        | —         |
| Philippine Statistics Authority | 2024 census — population 63,098, households 14,931                                    | <https://psa.gov.ph>                          | Wikipedia |
| Climate-Data.org                | Annual rainfall, 4,490 mm                                                             | <https://en.climate-data.org>                 | Wikipedia |
| Official Gazette                | Government hotlines — the national 911 line                                           | <https://www.gov.ph/the-government/hotlines/> | —         |

## Standing caveats

- **Wikipedia is a tertiary source.** Cite _through_ it to the primary record (PSA, the RA texts, the Supreme
  Court decisions, Climate-Data.org) rather than to the article itself. The content YAML carries both, as
  `source` plus `via`.
- **Two of the four stat-band figures still cite Wikipedia directly.** `barangays` and `landArea` in
  `content/home/stats.yaml` name the article as their source and carry no `via`, and neither caption carries a
  date. That is a known gap, not an oversight — replacing them with the primary record is a good first
  contribution.
- **`www.tandag.gov.ph` did not resolve** when last checked, so the official city portal is not usable as a
  live source. `config/lgu.config.json` records it with `status: "unreachable"` — do not cite it until that
  changes.
- **The local emergency numbers are contributor-supplied** and unconfirmed against any public posting. They
  ship with that stated on the page and a `lastCheckedAt` date; confirm them against a City / PNP / BFP posting
  and add the URL to that hotline's `source.url` in `content/home/emergency.yaml`.
- **City Hall's street address and map link** were supplied directly by the project owner and carry no public
  citation. The phone and email in the same block remain invented placeholders, gated by
  `contact.cityHall.status`.

## Where the machine-readable copy lives

`content/home/` — `stats.yaml` carries the per-figure citations, `emergency.yaml` the hotline provenance and
its check date. There is no `meta.yaml`; the aggregated list lives here, in this file, and nowhere else.

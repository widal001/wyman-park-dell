# Friends of Wyman Park Dell — Astro

Astro 6 rebuild of the [Friends of Wyman Park Dell](https://wymanparkdell.org/) site.

## Stack

- Astro 6 (static output, deployed to Cloudflare Workers via `@astrojs/cloudflare`)
- Vanilla CSS with design tokens (`src/styles/tokens.css`) — no Tailwind, no UI library
- TypeScript strict, content shapes typed in `src/types/content.ts`
- Hard-coded content in `src/content/*.ts` for now; designed to swap to a CMS (Payload, etc.) later without component changes

## Commands

| Command       | Action                                        |
| ------------- | --------------------------------------------- |
| `pnpm install`| Install dependencies                          |
| `pnpm dev`    | Local dev server at `http://localhost:4321/`  |
| `pnpm build`  | Build static site to `./dist/client/`         |
| `pnpm preview`| Preview build locally                         |

## Project structure

```
src/
├── pages/                # routes (index, about-the-park, friends-of-wyman-park-dell)
├── layouts/BaseLayout    # <html>, header, footer shell
├── components/
│   ├── layout/           # SiteHeader, SiteFooter, MainNav, SocialLinks
│   ├── ui/               # Section, Container, Button — primitives
│   └── blocks/           # Hero, RichText, ImageGallery, Timeline, etc.
├── content/              # site.ts + per-page content (homepage/about/friends)
├── types/content.ts      # PageContent, ContentBlock union — the CMS-shaped contract
└── styles/               # tokens, reset, global
```

## Content adapter pattern

Pages don't render markup directly — they iterate a `ContentBlock[]` and dispatch
each block to its matching component via `BlockRenderer`. Today the blocks come
from a typed TypeScript object; tomorrow they'll come from a CMS query returning
the same shape. Adding a new block type means: add a variant to the union in
`src/types/content.ts`, build a component for it in `src/components/blocks/`,
and add a case to `BlockRenderer.astro`.

## Future Payload integration

When the team is ready, `src/content/*.ts` becomes a build-time fetch from
Payload — components and types stay untouched. See the migration plan for
details.

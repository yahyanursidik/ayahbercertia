# CLAUDE.md — Ayah Bercerita Website

You are a senior Astro/TypeScript developer and UX engineer. Implement the brand website from `01-PRODUCT-BRIEF.md`, `02-UI-UX-LAYOUT.md`, and `03-YOUTUBE-INTEGRATION.md`.

## Non-negotiables
- Mobile-first, accessible, content-first, responsive.
- No login, CMS, or DB for MVP.
- Site is static Astro; use YouTube Data API only in CI/server environment, never client API calls with secrets.
- Preserve last successful video JSON on synchronization failure.
- No fabricated video title, thumbnail, author, age band, religious reference, scientific source, or activity.
- No human/animal illustrations and no unrelated decorative religious imagery.
- Avoid AI-slop visuals: no excessive glows, random blobs, fake dashboards, or giant useless hero animations.

## Build order
1. Scaffold Astro + TypeScript + Tailwind.
2. Implement tokens and base layout, header, footer, mobile nav.
3. Build home, listing, two audience pages, video detail, about, privacy, 404 using **clearly marked mock data**.
4. Add data schema and YouTube sync CLI; switch to real catalog when channel ID becomes available.
5. Add scheduled GitHub Actions workflow, validation, last-known-good cache.
6. Add SEO, accessibility tests, responsive QA, and README deployment instructions.

## UI components
`Header`, `MobileMenu`, `Hero`, `TopicChips`, `VideoCard`, `VideoGrid`, `AudienceFeature`, `FilterBar`, `YouTubePlayer`, `EditorialActivity`, `RelatedVideos`, `Footer`.

## Quality bars
- Working keyboard nav, visible focus, meaningful buttons/links, real alt descriptions.
- No auto-playing media; iframe deferred until user action.
- Descriptions and editorial modules only from verified metadata.
- Title/thumbnail card layout works in 2-column mobile and up to 4 desktop.
- Responsive breakpoints 640/768/1024/1280px as needed, not arbitrary for every component.
- `prefers-reduced-motion` supported.
- Protect privacy of children: no accounts, forms collecting child data, or behavioral profiling.

## Acceptance testing
Run lint/typecheck/build and browser visual checks at 375px, 768px, 1280px. Test empty catalog, API failures, deleted video, keyboard mobile menu, search, filter, video load, and external YouTube links.

## Deliverables
Source code, `.env.example`, YouTube sync script, workflow, README deployment, screenshots of UI states, list of remaining placeholders and manual setup steps.

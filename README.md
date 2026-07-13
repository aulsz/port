# Collins Culbert — Portfolio

A single-page portfolio for Collins Culbert (Electrical Systems Engineering Technology, Texas A&M), built as a full-page "curtain" scroll-jack experience: a fixed hero slides away to reveal five snapped sections (Hero, Profile, Selected Work, Capabilities, Contact).

## Stack

Plain HTML, CSS, and vanilla JS — no build step, no framework, no dependencies to install.

- `index.html` — markup for all five sections
- `styles.css` — design tokens, layout, and animation styles
- `script.js` — scroll-jack engine, letter-reveal animations, orbit/tile animation, nav wiring

Fonts (Geist, Geist Mono, Instrument Serif) load from Google Fonts via CDN `<link>` tags — no local font files.

## How the scroll works

- **Desktop (> 900px):** `#fullpage` is pinned with `position: fixed` and translated by `-N * 100vh` per section. Wheel, keyboard (arrows/space/Home/End), and touch-swipe events drive `goTo(idx)`, which snaps to the next/previous section and fires that section's reveal animation the first time it's shown.
- **Mobile (≤ 900px):** the scroll-jack is disabled entirely (`matchMedia('(max-width: 900px)')`) and the page falls back to natural scrolling, with an `IntersectionObserver`-style scroll check triggering each section's reveal animation as it enters the viewport.
- Resizing across the 900px breakpoint reloads the page so the correct mode initializes cleanly.

## Navigation

Nav links, the drawer, the "Let's Talk" button, and the hero CTAs all route through a shared `bindScrollLinks()` helper in `script.js`. On desktop this calls `goTo()`; on mobile it calls `scrollIntoView()`. Buttons without a real `href` carry a `data-scroll-target="#id"` attribute instead.

## Content

All copy is pulled from the live portfolio at aulsz-port.vercel.app: profile statement, the STM32 vibration-classifier / robotic-hand / Python-to-C-parity case studies, the capabilities toolkit, and contact details. The résumé links point at the hosted PDF on that same site.

## Local preview

No build step — just open `index.html` in a browser, or serve the folder locally:

```
npx serve .
```

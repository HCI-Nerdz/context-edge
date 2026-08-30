# Agent notes — context-edge

## What this is

MVP demos for **Context Edge** (repo slug `context-edge`):

- **Variant A — Map Edge:** thin top/left edges → click slides the activity page off (View Transitions) to reveal a scrollable Alphabet/Google product tree underneath. Map VT is scoped to `.cr-stage` (`src/lib/map-vt.ts`). *Transition style* on the island. Footer *Appearance* is the real page (`html[data-theme]`). Island *Appearance* only themes `.cr-sheet` mocks — follows the page until overridden (`src/lib/theme.ts`)
- **Variant B — Modal Edge:** edge = current node; View Transitions slide sheet to reveal colored ancestry layers (`/demos/modal-edge/`, plus Solid/React/Svelte islands)
- **Variant C — Path Edge:** breadcrumb as color series; paired hover; current-first left marks (`/demos/path-edge/` workshop, plus Solid/React/Svelte islands)
- **L-join:** one geometry — `.cr-rail` / `.cr-rail-corner` / `.cr-rail-top` / `.cr-rail-left` in `global.css`. Path paints segments on top; it does not invent its own idle/hover sizes.

## Links

- Docs: https://hci-nerdz.github.io/docs/hci-nerdz/context-edge.html
- Essay: https://hci-nerdz.github.io/blog/ecosystem-nav-at-the-screen-edge/
- Site desk (vanilla Map Edge): https://hci-nerdz.github.io/demos/context-edge/
- Live MVP / variant index: https://hci-nerdz.github.io/context-edge/ (visual Map / Modal / Path tiles, then island cards)
- Modal Edge: https://hci-nerdz.github.io/context-edge/demos/modal-edge/

## Stack

Astro 5 islands — Solid (`src/components/solid`), React (`src/components/react`), Svelte (`src/components/svelte`), vanilla mount. Shared contracts: `src/lib/org-tree.ts` (Map Edge), `src/lib/nav-stack.ts` (Modal Edge), `src/lib/path-edge.ts` (Path Edge). Routes: `src/lib/demo-routes.ts`.

## Framework hosts

- SolidStart: reuse Solid shell in a root layout; no SolidStart app in this repo.
- Next.js: port React shell as a `"use client"` layout wrapper; Modal Edge can use `document.startViewTransition`.
- See README *Framework impedance match*.

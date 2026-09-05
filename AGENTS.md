# Agent notes — context-edge

## What this is

MVP demos for **Context Edge** (repo slug `context-edge`):

- **Variant A — Map Edge:** thin top/left edges → click slides the activity page off (View Transitions) to reveal a scrollable Alphabet/Google product tree underneath. Map VT is scoped to `.cr-stage` (`src/lib/map-vt.ts`). *Transition style* on the implementation. Footer *Appearance* is the real page (`html[data-theme]`). Implementation *Appearance* only themes `.cr-sheet` mocks — follows the page until overridden (`src/lib/theme.ts`)
- **Variant B — Modal Edge:** edge = current node; scoped View Transitions slide the sheet to reveal colored ancestry layers (`src/lib/modal-vt.ts`; `/demos/modal-edge/` Live/Still on every implementation)
- **Variant C — Path Edge:** breadcrumb as color series on one edge (Top labels or Side marks); full edge length; Live/Still rows with Color/Subtle style + stage edge drag-resize (`/demos/path-edge/` shared workshop mount; Solid/React/Svelte host the same suite)
- **L-join:** Map and Modal share `.cr-rail` / `.cr-rail-corner` / `.cr-rail-top` / `.cr-rail-left` in `global.css`. Path Edge is a single-edge placement (not an L).

## Links

- Docs: https://hci-nerdz.github.io/docs/hci-nerdz/context-edge.html
- Essay: https://hci-nerdz.github.io/blog/ecosystem-nav-at-the-screen-edge/
- Site desk (vanilla Map Edge): https://hci-nerdz.github.io/demos/context-edge/
- Live MVP / variant index: https://hci-nerdz.github.io/context-edge/ (visual Map / Modal / Path tiles, then implementation matrix)
- Modal Edge: https://hci-nerdz.github.io/context-edge/demos/modal-edge/

## Stack

Astro 5 framework implementations — Solid (`src/components/solid`), React (`src/components/react`), Svelte (`src/components/svelte`), vanilla mount. Shared contracts: `src/lib/org-tree.ts` (Map Edge), `src/lib/nav-stack.ts` (Modal Edge), `src/lib/path-edge.ts` (Path Edge). Path workshop: `src/components/vanilla/mountPathEdge.ts`. Routes: `src/lib/demo-routes.ts`.

## Framework hosts

- SolidStart: reuse Solid shell in a root layout; no SolidStart app in this repo.
- Next.js: port React shell as a `"use client"` layout wrapper; Modal Edge can use `document.startViewTransition`.
- See README *Framework impedance match*.

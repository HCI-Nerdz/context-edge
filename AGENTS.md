# Agent notes — context-rails

## What this is

MVP demos for **Nav Edge** / context rails:

- **Variant A — Map Edge:** thin top/left edges → click slides the activity page off (View Transitions) to reveal a scrollable Alphabet/Google product tree underneath. *Transition style* and *Appearance* (light/dark) switchers on the island; `html[data-theme]` is shared with the page and the in-sheet mocks (`src/lib/theme.ts`)
- **Variant B — Modal Edge:** edge = current node; View Transitions slide sheet to reveal colored ancestry layers (`/demos/modal-edge/`)
- **Variant C — Path Edge:** breadcrumb as color series; paired hover; current-first left marks (`/demos/path-edge/`)

## Links

- Docs: https://hci-nerdz.github.io/docs/hci-nerdz/context-rails.html
- Essay: https://hci-nerdz.github.io/blog/when-platforms-overload-the-entrypoint/
- Site desk (vanilla Map Edge): https://hci-nerdz.github.io/demos/context-rails/
- Live MVP: https://hci-nerdz.github.io/context-rails/
- Modal Edge: https://hci-nerdz.github.io/context-rails/demos/modal-edge/

## Stack

Astro 5 islands — Solid (`src/components/solid`), React (`src/components/react`), Svelte (`src/components/svelte`), vanilla mount. Shared contracts: `src/lib/org-tree.ts` (Map Edge), `src/lib/nav-stack.ts` (Modal Edge).

## Framework hosts

- SolidStart: reuse Solid shell in a root layout; no SolidStart app in this repo.
- Next.js: port React shell as a `"use client"` layout wrapper; Modal Edge can use `document.startViewTransition`.
- See README *Framework impedance*.

## Machine facts

`$CODE_ROOT/MEMORIES.md` only — do not commit per-repo `MEMORIES.md`.

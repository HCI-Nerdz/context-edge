# Agent notes — context-rails

## What this is

MVP demos for **Nav Edge** / context rails:

- **Variant A — Map Edge:** thin top/left edges → wireframe ecosystem map (Solid/React/Svelte/vanilla)
- **Variant B — Modal Edge:** edge = current node; View Transitions slide sheet to reveal colored ancestry layers (`/demos/modal-edge/`)

## Links

- Docs: https://hci-nerdz.github.io/docs/hci-nerdz/context-rails.html
- Essay: https://hci-nerdz.github.io/blog/when-platforms-overload-the-entrypoint/
- Site desk (vanilla Map Edge): https://hci-nerdz.github.io/demos/context-rails/
- Live MVP: https://hci-nerdz.github.io/context-rails/
- Modal Edge: https://hci-nerdz.github.io/context-rails/demos/modal-edge/

## Stack

Astro 5 islands — Solid (`src/components/solid`), React (`src/components/react`), Svelte (`src/components/svelte`), vanilla mount. Shared contracts: `src/lib/platforms.ts`, `src/lib/nav-stack.ts`.

## Framework hosts

- SolidStart: reuse Solid shell in a root layout; no SolidStart app in this repo.
- Next.js: port React shell as a `"use client"` layout wrapper; Modal Edge can use `document.startViewTransition`.
- See README *Framework impedance*.

## Machine facts

`$CODE_ROOT/MEMORIES.md` only — do not commit per-repo `MEMORIES.md`.

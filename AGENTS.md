# Agent notes — context-rails

## What this is

MVP demos for **context rails**: thin top/left edge bars that expand on hover and open a wireframe ecosystem nav on click, with stable platform overlay colors.

## Links

- Docs: https://hci-nerdz.github.io/docs/hci-nerdz/context-rails.html
- Essay: https://hci-nerdz.github.io/blog/when-platforms-overload-the-entrypoint/
- Site desk (vanilla): https://hci-nerdz.github.io/demos/context-rails/
- Live MVP: https://hci-nerdz.github.io/context-rails/

## Stack

Astro 5 islands — Solid (`src/components/solid`), React (`src/components/react`), Svelte (`src/components/svelte`), vanilla mount. Shared contract: `src/lib/platforms.ts`.

## Framework hosts

- SolidStart: reuse Solid shell in a root layout; no SolidStart app in this repo.
- Next.js: port React shell as a `"use client"` layout wrapper.
- See README *Framework impedance*.

## Machine facts

`$CODE_ROOT/MEMORIES.md` only — do not commit per-repo `MEMORIES.md`.

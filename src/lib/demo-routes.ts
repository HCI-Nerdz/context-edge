export type FrameworkId = 'vanilla' | 'solid' | 'react' | 'svelte';
export type VariantId = 'map' | 'modal' | 'path';

export const frameworks: { id: FrameworkId; label: string }[] = [
  { id: 'vanilla', label: 'Vanilla' },
  { id: 'solid', label: 'Solid' },
  { id: 'react', label: 'React' },
  { id: 'svelte', label: 'Svelte' },
];

export const variantRoutes: Record<FrameworkId, Record<VariantId, string>> = {
  vanilla: {
    map: 'demos/vanilla-mature/',
    modal: 'demos/modal-edge/',
    path: 'demos/path-edge/',
  },
  solid: {
    map: 'demos/solid-cloud/',
    modal: 'demos/solid-modal/',
    path: 'demos/solid-path/',
  },
  react: {
    map: 'demos/react-suite/',
    modal: 'demos/react-modal/',
    path: 'demos/react-path/',
  },
  svelte: {
    map: 'demos/svelte-community/',
    modal: 'demos/svelte-modal/',
    path: 'demos/svelte-path/',
  },
};

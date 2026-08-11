export type Theme = 'light' | 'dark';

export const THEME_KEY = 'cr-theme';

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* private mode */
  }
  return 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode */
  }
  syncThemeButtons();
  document.dispatchEvent(new CustomEvent('cr-theme', { detail: theme }));
}

export function themeSwitchHtml(active: Theme = readTheme()): string {
  return `
    <nav class="variant-switch" aria-label="Appearance">
      <span class="variant-switch-name">Appearance</span>
      <div class="variant-switch-track" role="radiogroup" aria-label="Appearance">
        <button type="button" class="variant-switch-item${active === 'light' ? ' is-current' : ''}" data-theme="light" role="radio" aria-checked="${active === 'light'}">Light</button>
        <button type="button" class="variant-switch-item${active === 'dark' ? ' is-current' : ''}" data-theme="dark" role="radio" aria-checked="${active === 'dark'}">Dark</button>
      </div>
    </nav>`;
}

export function syncThemeButtons(root: ParentNode = document) {
  const theme = readTheme();
  root.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((btn) => {
    const on = btn.dataset.theme === theme;
    btn.classList.toggle('is-current', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}

export function bootTheme() {
  applyTheme(readTheme());
  const w = window as Window & { __crThemeBoot?: boolean };
  if (w.__crThemeBoot) return;
  w.__crThemeBoot = true;
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest?.('[data-theme]') as
      | HTMLButtonElement
      | null;
    const next = btn?.dataset.theme;
    if (next === 'light' || next === 'dark') applyTheme(next);
  });
}

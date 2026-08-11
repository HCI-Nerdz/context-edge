export type Theme = 'light' | 'dark';

export const THEME_KEY = 'cr-theme';
export const MOCK_THEME_KEY = 'cr-mock-theme';

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* private mode */
  }
  return 'dark';
}

export function hasMockOverride(): boolean {
  try {
    const stored = localStorage.getItem(MOCK_THEME_KEY);
    return stored === 'light' || stored === 'dark';
  } catch {
    return false;
  }
}

export function readMockTheme(): Theme {
  if (hasMockOverride()) {
    try {
      return localStorage.getItem(MOCK_THEME_KEY) as Theme;
    } catch {
      /* private mode */
    }
  }
  return readTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode */
  }
  syncThemeButtons();
  if (!hasMockOverride()) applyMockTheme(theme);
  document.dispatchEvent(new CustomEvent('cr-theme', { detail: theme }));
}

export function applyMockTheme(theme: Theme, persist = false) {
  if (persist) {
    try {
      localStorage.setItem(MOCK_THEME_KEY, theme);
    } catch {
      /* private mode */
    }
  }
  document.querySelectorAll<HTMLElement>('.cr-sheet').forEach((el) => {
    el.dataset.theme = theme;
  });
  syncMockThemeButtons();
  document.dispatchEvent(new CustomEvent('cr-mock-theme', { detail: theme }));
}

export function themeSwitchHtml(scope: 'page' | 'mock' = 'page'): string {
  const active = scope === 'mock' ? readMockTheme() : readTheme();
  const attr = scope === 'mock' ? 'data-mock-theme' : 'data-theme';
  const label = scope === 'mock' ? 'Mock appearance' : 'Appearance';
  return `
    <nav class="variant-switch" aria-label="${label}">
      <span class="variant-switch-name">Appearance</span>
      <div class="variant-switch-track" role="radiogroup" aria-label="${label}">
        <button type="button" class="variant-switch-item${active === 'light' ? ' is-current' : ''}" ${attr}="light" role="radio" aria-checked="${active === 'light'}">Light</button>
        <button type="button" class="variant-switch-item${active === 'dark' ? ' is-current' : ''}" ${attr}="dark" role="radio" aria-checked="${active === 'dark'}">Dark</button>
      </div>
    </nav>`;
}

export function syncThemeButtons(root: ParentNode = document) {
  const theme = readTheme();
  root.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((btn) => {
    if (!btn.hasAttribute('data-theme')) return;
    if (btn.closest('.cr-sheet')) return;
    const on = btn.dataset.theme === theme;
    btn.classList.toggle('is-current', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}

export function syncMockThemeButtons(root: ParentNode = document) {
  const theme = readMockTheme();
  root.querySelectorAll<HTMLButtonElement>('[data-mock-theme]').forEach((btn) => {
    const on = btn.dataset.mockTheme === theme;
    btn.classList.toggle('is-current', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}

export function bootTheme() {
  applyTheme(readTheme());
  applyMockTheme(readMockTheme());
  const w = window as Window & { __crThemeBoot?: boolean };
  if (w.__crThemeBoot) return;
  w.__crThemeBoot = true;
  document.addEventListener('click', (e) => {
    const t = e.target as Element | null;
    const mockBtn = t?.closest?.('[data-mock-theme]') as HTMLButtonElement | null;
    const mockNext = mockBtn?.dataset.mockTheme;
    if (mockNext === 'light' || mockNext === 'dark') {
      applyMockTheme(mockNext, true);
      return;
    }
    const btn = t?.closest?.('[data-theme]') as HTMLButtonElement | null;
    if (btn?.closest('.cr-sheet')) return;
    const next = btn?.dataset.theme;
    if (next === 'light' || next === 'dark') applyTheme(next);
  });
}

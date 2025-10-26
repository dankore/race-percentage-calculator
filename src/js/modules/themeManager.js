const THEME_STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark';
const BODY_DARK_CLASS = 'dark-mode';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

const mediaQueryList =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(MEDIA_QUERY)
    : null;

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors (Safari private mode, etc.)
  }
}

function getPreferredTheme() {
  const storedTheme = readStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  if (mediaQueryList) {
    return mediaQueryList.matches ? 'dark' : 'light';
  }

  return 'light';
}

function applyThemeClasses(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle(DARK_CLASS, theme === 'dark');
  if (document.body) {
    document.body.classList.toggle(BODY_DARK_CLASS, theme === 'dark');
  }
}

function syncToggleIcons(theme) {
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');

  if (!sunIcon || !moonIcon) {
    return;
  }

  const showDark = theme === 'dark';
  moonIcon.classList.toggle('hidden', showDark);
  sunIcon.classList.toggle('hidden', !showDark);
}

export function applyStoredTheme() {
  const theme = getPreferredTheme();
  applyThemeClasses(theme);
  syncToggleIcons(theme);
  return theme;
}

function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');

  if (!themeToggle || themeToggle.dataset.themeToggleInitialized === 'true') {
    applyStoredTheme();
    return;
  }

  applyStoredTheme();

  themeToggle.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    const isDark = document.documentElement.classList.contains(DARK_CLASS);
    const nextTheme = isDark ? 'light' : 'dark';

    applyThemeClasses(nextTheme);
    syncToggleIcons(nextTheme);
    persistTheme(nextTheme);
  });

  themeToggle.dataset.themeToggleInitialized = 'true';
  themeToggle.classList.remove('opacity-0');
}

export function setupThemeToggle() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle, {
      once: true,
    });
  } else {
    initThemeToggle();
  }
}

// Apply the theme as soon as this module is evaluated to avoid flashes.
if (typeof document !== 'undefined') {
  applyStoredTheme();

  if (mediaQueryList) {
    mediaQueryList.addEventListener('change', event => {
      if (readStoredTheme()) {
        return;
      }

      const theme = event.matches ? 'dark' : 'light';
      applyThemeClasses(theme);
      syncToggleIcons(theme);
    });
  }
}

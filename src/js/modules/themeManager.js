const STORAGE_KEY = 'race-calculator-theme';
const VALID_PREFERENCES = new Set(['light', 'dark', 'system']);

let currentPreference = 'system';
let currentResolvedTheme = 'light';
let systemMediaQuery = null;
let systemListenerAttached = false;

let toggleButtons = [];
let toggleRadios = [];
let toggleSelect = null;

const TOGGLE_VARIANTS = {
  pill: {
    groupClass:
      'inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 px-1.5 py-1 shadow-sm backdrop-blur',
    buttonClass:
      'px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500',
    activeClass:
      'bg-indigo-50 text-indigo-700 dark:text-indigo-200 shadow-inner ring-2 ring-indigo-500/60',
  },
};

const root =
  typeof document !== 'undefined' ? document.documentElement : undefined;

function safeGetStoredPreference() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return VALID_PREFERENCES.has(stored) ? stored : null;
  } catch {
    return null;
  }
}

function safeSetStoredPreference(pref) {
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Ignore storage errors (private mode, blocked cookies, etc.)
  }
}

function ensureMediaQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return null;
  if (!systemMediaQuery) {
    systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }
  return systemMediaQuery;
}

function onSystemPreferenceChange() {
  if (currentPreference === 'system') {
    applyThemePreference('system', { persist: false, emit: true, syncUI: false });
  }
}

function attachSystemListener() {
  const mql = ensureMediaQuery();
  if (!mql || systemListenerAttached) return;

  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onSystemPreferenceChange);
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(onSystemPreferenceChange);
  }
  systemListenerAttached = true;
}

function detachSystemListener() {
  const mql = systemMediaQuery;
  if (!mql || !systemListenerAttached) return;

  if (typeof mql.removeEventListener === 'function') {
    mql.removeEventListener('change', onSystemPreferenceChange);
  } else if (typeof mql.removeListener === 'function') {
    mql.removeListener(onSystemPreferenceChange);
  }
  systemListenerAttached = false;
}

function resolveTheme(pref) {
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';

  const mql = ensureMediaQuery();
  return mql && mql.matches ? 'dark' : 'light';
}

function syncToggleUI(pref) {
  if (toggleButtons.length) {
    toggleButtons.forEach(button => {
      const mode = button.dataset.themeMode;
      const isActive = mode === pref;
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');

      const activeClass = button.dataset.activeClass;
      if (activeClass) {
        activeClass
          .split(/\s+/)
          .filter(Boolean)
          .forEach(cls => button.classList.toggle(cls, isActive));
      }
    });
  }

  if (toggleRadios.length) {
    toggleRadios.forEach(radio => {
      radio.checked = radio.value === pref;
    });
  }

  if (toggleSelect) {
    toggleSelect.value = pref;
  }
}

function applyThemePreference(pref, options = {}) {
  const {
    persist = true,
    emit = false,
    syncUI = true,
  } = options;

  const sanitized = VALID_PREFERENCES.has(pref) ? pref : 'system';
  const resolvedTheme = resolveTheme(sanitized);

  currentPreference = sanitized;
  currentResolvedTheme = resolvedTheme;

  if (root) {
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.dataset.themePreference = sanitized;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }

  if (persist) {
    safeSetStoredPreference(sanitized);
  }

  if (sanitized === 'system') {
    attachSystemListener();
  } else {
    detachSystemListener();
  }

  if (syncUI) {
    syncToggleUI(sanitized);
  }

  if (emit && typeof document !== 'undefined') {
    document.dispatchEvent(
      new CustomEvent('themechange', {
        detail: {
          preference: sanitized,
          theme: resolvedTheme,
        },
      })
    );
  }

  return resolvedTheme;
}

export function applyStoredTheme() {
  const storedPreference = safeGetStoredPreference() || 'system';
  return applyThemePreference(storedPreference, {
    persist: false,
    emit: false,
    syncUI: false,
  });
}

export function setupThemeToggle() {
  if (typeof document === 'undefined') return;

  const hydrateToggleContainers = () => {
    const containers = Array.from(
      document.querySelectorAll('[data-theme-toggle]')
    );

    containers.forEach(container => {
      if (container.dataset.themeToggleInitialized === 'true') return;
      if (container.querySelector('[data-theme-mode]')) {
        container.dataset.themeToggleInitialized = 'true';
        return;
      }

      const variantName = container.dataset.themeToggleVariant || 'pill';
      const variantConfig = TOGGLE_VARIANTS[variantName] || TOGGLE_VARIANTS.pill;

      const groupClass =
        container.dataset.themeToggleGroupClass || variantConfig.groupClass;
      const buttonClass =
        container.dataset.themeToggleButtonClass || variantConfig.buttonClass;
      const activeClass =
        container.dataset.themeToggleActiveClass || variantConfig.activeClass;

      const labels = {
        light: container.dataset.themeLabelLight || 'Light',
        dark: container.dataset.themeLabelDark || 'Dark',
        system: container.dataset.themeLabelSystem || 'System',
      };

      const groupEl = document.createElement('div');
      groupEl.className = groupClass;
      groupEl.setAttribute(
        'role',
        container.dataset.themeToggleRole || 'group'
      );
      groupEl.setAttribute(
        'aria-label',
        container.dataset.themeToggleAriaLabel || 'Color theme'
      );

      ['light', 'dark', 'system'].forEach(mode => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.themeMode = mode;
        button.dataset.activeClass = activeClass;
        button.className = buttonClass;
        button.textContent = labels[mode];
        button.setAttribute('aria-pressed', 'false');
        groupEl.appendChild(button);
      });

      container.appendChild(groupEl);
      container.dataset.themeToggleInitialized = 'true';
    });
  };

  hydrateToggleContainers();

  toggleButtons = Array.from(
    document.querySelectorAll('[data-theme-mode]')
  );
  toggleRadios = Array.from(
    document.querySelectorAll('input[name="theme-mode"]')
  );
  toggleSelect = document.querySelector('[data-theme-select]');

  const updatePreference = pref => {
    applyThemePreference(pref, { emit: true });
  };

  if (toggleButtons.length) {
    toggleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const pref = button.dataset.themeMode;
        if (pref) {
          updatePreference(pref);
        }
      });
    });
  }

  if (toggleRadios.length) {
    toggleRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          updatePreference(radio.value);
        }
      });
    });
  }

  if (toggleSelect) {
    toggleSelect.addEventListener('change', () => {
      updatePreference(toggleSelect.value);
    });
  }

  syncToggleUI(currentPreference);
}

export function setTheme(preference) {
  applyThemePreference(preference, { emit: true });
}

export function getThemePreference() {
  return {
    preference: currentPreference,
    theme: currentResolvedTheme,
  };
}

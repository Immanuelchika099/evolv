const THEME_KEY = 'evolv-theme-preference'
const VALID_THEMES = new Set(['system', 'light', 'dark'])

export function getThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return VALID_THEMES.has(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function applyThemePreference(preference = getThemePreference()) {
  const root = document.documentElement
  const safePreference = VALID_THEMES.has(preference) ? preference : 'system'
  const systemPrefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches === true
  const resolvedTheme = safePreference === 'system'
    ? (systemPrefersLight ? 'light' : 'dark')
    : safePreference

  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = safePreference
  root.style.colorScheme = resolvedTheme
  return resolvedTheme
}

export function setThemePreference(preference) {
  const safePreference = VALID_THEMES.has(preference) ? preference : 'system'
  try {
    localStorage.setItem(THEME_KEY, safePreference)
  } catch {}
  applyThemePreference(safePreference)
  window.dispatchEvent(new CustomEvent('evolv-theme-preference-change', {
    detail: { preference: safePreference },
  }))
}

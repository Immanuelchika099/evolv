// EVOLV uses a fixed light appearance. Device appearance and legacy saved
// preferences must never change the app's visual theme.
export function getThemePreference() {
  return 'light'
}

export function applyThemePreference() {
  const root = document.documentElement
  root.dataset.theme = 'light'
  root.dataset.themePreference = 'light'
  root.style.colorScheme = 'light'
  return 'light'
}

export function setThemePreference() {
  applyThemePreference()
  try { localStorage.setItem('evolv-theme-preference', 'light') } catch {}
  window.dispatchEvent(new CustomEvent('evolv-theme-preference-change', {
    detail: { preference: 'light' },
  }))
}

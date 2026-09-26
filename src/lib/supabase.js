import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before using the live app.')
}

/*
 * iOS Home Screen web apps do not copy localStorage from Safari when the
 * app is installed. WebKit does copy cookies, though, so keeping the
 * Supabase session in a cookie lets an already signed-in Safari user open
 * the installed EVOLV web app without signing in again.
 *
 * We deliberately keep Supabase's existing storage key so users already
 * signed in before this change keep the same session. localStorage remains
 * as a secondary copy for normal browser behavior.
 * Existing sessions are migrated into the cookie the first time they are
 * read, so this also works for users who were already signed in.
 */
const AUTH_STORAGE_KEY = 'sb-teufwhvkfjluawtcvjwh-auth-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function readCookie(name) {
  if (typeof document === 'undefined') return null

  const prefix = name + '='
  const item = document.cookie
    .split('; ')
    .find(row => row.startsWith(prefix))

  if (!item) return null

  try {
    return decodeURIComponent(item.slice(prefix.length))
  } catch {
    return item.slice(prefix.length)
  }
}

function writeCookie(name, value) {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    name + '=' + encodeURIComponent(value) +
    '; Max-Age=' + COOKIE_MAX_AGE +
    '; Path=/; SameSite=Lax' + secure
}

function removeCookie(name) {
  if (typeof document === 'undefined') return
  document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax'
}

const sharedAuthStorage = {
  getItem(key) {
    const cookieValue = readCookie(key)
    if (cookieValue) return cookieValue

    const localValue = window.localStorage.getItem(key)

    // Migrate the existing browser session into the cookie so Safari can
    // copy the authenticated state into the Home Screen web app.
    if (localValue) writeCookie(key, localValue)

    return localValue
  },

  setItem(key, value) {
    writeCookie(key, value)
    window.localStorage.setItem(key, value)
  },

  removeItem(key) {
    removeCookie(key)
    window.localStorage.removeItem(key)
  },
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: sharedAuthStorage,
      storageKey: AUTH_STORAGE_KEY,
    },
  },
)

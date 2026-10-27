const EVOLV_ICON = '/evolv-mark.svg?v=7'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch {}

  const title = payload.title || 'EVOLV'
  const options = {
    body: payload.body || 'Take a moment for yourself.',
    icon: payload.icon || EVOLV_ICON,
    badge: payload.badge || EVOLV_ICON,
    tag: payload.tag || 'evolv-daily',
    renotify: true,
    actions: Array.isArray(payload.actions) ? payload.actions : [],
    data: { url: payload.url || '/dashboard', ...(payload.data || {}) }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const notification = event.notification
  const notificationText = [
    notification.title || '',
    notification.body || '',
    ...(notification.actions || []).map(action => action.title || ''),
    event.action || ''
  ].join(' ')
  const isReflectionNotification = /log how you(?:'|’)re feeling|daily reflection|reflection check.?in/i.test(notificationText)
  const target = isReflectionNotification
    ? '/?reflection=1'
    : (notification.data?.url || '/dashboard')
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(target)
        return
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target)
  })())
})

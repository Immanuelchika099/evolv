const ALARM_PREFIX = 'evolv-alarm-'

function nativeAvailable() {
  return Boolean(
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
  )
}

export async function scheduleEvolvAlarm(alarm) {
  if (nativeAvailable()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const permission = await LocalNotifications.checkPermissions()
      if (permission.display !== 'granted') {
        const requested = await LocalNotifications.requestPermissions()
        if (requested.display !== 'granted') {
          throw new Error('Alarm permission was not granted.')
        }
      }

      const id = Math.abs(hashId(alarm.id))
      const date = new Date(alarm.alarm_at)

      if (alarm.repeat_type === 'daily') {
        await LocalNotifications.schedule({
          notifications: [{
            id,
            title: alarm.title,
            body: alarm.note || 'Your Evolv alarm is ready.',
            schedule: { on: { hour: date.getHours(), minute: date.getMinutes() }, repeats: true },
            extra: { evolvAlarmId: alarm.id, kind: 'alarm' }
          }]
        })
      } else {
        await LocalNotifications.schedule({
          notifications: [{
            id,
            title: alarm.title,
            body: alarm.note || 'Your Evolv alarm is ready.',
            schedule: { at: date },
            extra: { evolvAlarmId: alarm.id, kind: 'alarm' }
          }]
        })
      }

      return { native: true, nativeId: String(id) }
    } catch (error) {
      console.error('EVOLV native alarm scheduling failed:', error)
      throw error
    }
  }

  // A browser cannot create a Clock alarm. Keep the alarm stored in Evolv,
  // but never pretend a web timeout is equivalent to a device alarm.
  return { native: false, nativeId: null }
}

export async function cancelEvolvAlarm(alarm) {
  if (!nativeAvailable()) return

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({
      notifications: [{ id: Math.abs(hashId(alarm.native_id || alarm.id)) }]
    })
  } catch (error) {
    console.error('EVOLV native alarm cancellation failed:', error)
  }
}

function hashId(value) {
  let hash = 0
  for (let index = 0; index < String(value).length; index += 1) {
    hash = ((hash << 5) - hash) + String(value).charCodeAt(index)
    hash |= 0
  }
  return hash || 1
}

export function isNativeAlarmAvailable() {
  return nativeAvailable()
}

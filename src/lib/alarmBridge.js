const IOS_DEFAULT_SOUND = 'default'

function nativeAvailable() {
  return Boolean(
    typeof window !== 'undefined' &&
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
  )
}

async function getLocalNotifications() {
  if (!nativeAvailable()) return null
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  return LocalNotifications
}

async function ensureAlarmPermission(LocalNotifications) {
  const permission = await LocalNotifications.checkPermissions()
  if (permission.display === 'granted') return
  const requested = await LocalNotifications.requestPermissions()
  if (requested.display !== 'granted') throw new Error('Alarm permission was not granted.')
}

function getNativeId(alarm) {
  const stored = Number(alarm?.native_id)
  if (Number.isInteger(stored) && stored > 0) return stored
  return Math.abs(hashId(alarm?.id))
}

function buildNotification(alarm, schedule) {
  return {
    id: getNativeId(alarm),
    title: alarm.title,
    body: alarm.note || 'Your Evolv alarm is ready.',
    sound: IOS_DEFAULT_SOUND,
    isExactNotification: true,
    isExactMandatory: false,
    schedule,
    extra: { evolvAlarmId: alarm.id, kind: 'alarm' }
  }
}

export async function scheduleEvolvAlarm(alarm) {
  const LocalNotifications = await getLocalNotifications()
  if (!LocalNotifications) return { native: false, nativeId: null }

  try {
    await ensureAlarmPermission(LocalNotifications)
    const date = new Date(alarm.alarm_at)
    if (Number.isNaN(date.getTime())) throw new Error('That alarm has an invalid date or time.')

    const repeatType = alarm.repeat_type || 'once'
    const notification = (() => {
      if (repeatType === 'daily') {
        return buildNotification(alarm, { on: { hour: date.getHours(), minute: date.getMinutes() }, repeats: true, allowWhileIdle: true })
      }
      if (repeatType === 'weekdays') {
        return [2, 3, 4, 5, 6].map(day => ({
          ...buildNotification(alarm, { on: { weekday: day, hour: date.getHours(), minute: date.getMinutes() }, repeats: true, allowWhileIdle: true }),
          id: weekdayNotificationId(alarm, day)
        }))
      }
      if (repeatType === 'weekly') {
        return buildNotification(alarm, { on: { weekday: date.getDay() + 1, hour: date.getHours(), minute: date.getMinutes() }, repeats: true, allowWhileIdle: true })
      }
      return buildNotification(alarm, { at: date, allowWhileIdle: true })
    })()

    await LocalNotifications.schedule({ notifications: Array.isArray(notification) ? notification : [notification] })
    const primaryId = Array.isArray(notification) ? notification[0].id : notification.id
    return { native: true, nativeId: String(primaryId) }
  } catch (error) {
    console.error('EVOLV native alarm scheduling failed:', error)
    throw error
  }
}

export async function cancelEvolvAlarm(alarm) {
  const LocalNotifications = await getLocalNotifications()
  if (!LocalNotifications) return
  try {
    const ids = alarm?.repeat_type === 'weekdays'
      ? [2, 3, 4, 5, 6].map(day => weekdayNotificationId(alarm, day))
      : [getNativeId(alarm)]
    await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) })
  } catch (error) {
    console.error('EVOLV native alarm cancellation failed:', error)
  }
}

export async function rescheduleEvolvAlarms(alarms = []) {
  const LocalNotifications = await getLocalNotifications()
  if (!LocalNotifications) return []
  await ensureAlarmPermission(LocalNotifications)
  const scheduled = []
  for (const alarm of alarms) {
    if (!alarm?.enabled) continue
    try {
      const result = await scheduleEvolvAlarm(alarm)
      scheduled.push({ ...alarm, native_id: result.nativeId || alarm.native_id, platform: result.native ? 'native' : alarm.platform })
    } catch (error) {
      console.error('EVOLV native alarm restore failed:', alarm?.id, error)
    }
  }
  return scheduled
}

function weekdayNotificationId(alarm, weekday) {
  return Math.abs(hashId(String(alarm.id) + '-weekday-' + weekday))
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
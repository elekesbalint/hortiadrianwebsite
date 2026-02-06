/**
 * Client-side Web Push helpers: register SW, subscribe, and persist subscription.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export type PushSubscriptionPayload = {
  endpoint: string
  p256dh: string
  auth: string
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return false
  return true
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  return Notification.requestPermission()
}

/** Register /sw.js and return the registration. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return null
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await reg.update()
  return reg
}

/**
 * Subscribe for push: needs VAPID public key (NEXT_PUBLIC_VAPID_PUBLIC_KEY).
 * Returns payload to store in DB: { endpoint, p256dh, auth } (base64).
 */
export async function subscribeForPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscriptionPayload | null> {
  if (!vapidPublicKey) return null
  const key = urlBase64ToUint8Array(vapidPublicKey)
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key as BufferSource,
  })
  const p256dh = sub.getKey('p256dh')
  const auth = sub.getKey('auth')
  if (!p256dh || !auth) return null
  return {
    endpoint: sub.endpoint,
    p256dh: arrayBufferToBase64(p256dh),
    auth: arrayBufferToBase64(auth),
  }
}

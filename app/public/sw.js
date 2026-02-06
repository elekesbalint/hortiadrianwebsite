// Service worker for Web Push (Programláz)
self.addEventListener('push', function (event) {
  if (!event.data) return
  let payload = {}
  try {
    payload = event.data.json()
  } catch (_) {
    payload = { title: 'Programláz', body: event.data.text() }
  }
  const title = payload.title || 'Programláz'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: { url: payload.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

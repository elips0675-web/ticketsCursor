importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js')

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/'),
  new workbox.strategies.NetworkOnly()
)

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || [])

self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const { title, body, url, icon } = event.data.json()
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: icon || '/icon.svg',
        badge: '/icon.svg',
        data: { url },
      })
    )
  } catch {
    event.waitUntil(
      self.registration.showNotification(event.data.text(), {
        icon: '/icon.svg',
        badge: '/icon.svg',
      })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

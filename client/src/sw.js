import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'ClimateAI Alert'
  const options = {
    body: data.body || 'A new alert has been issued for your tracked location.',
    icon: '/logo.png',
    badge: '/favicon.svg', 
    vibrate: [200, 100, 200, 100, 200, 100, 200], 
    data: {
      url: 'http://localhost:3000/alerts'
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {

        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url.includes('/alerts') && 'focus' in client) {
            return client.focus()
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url)
        }
      })
    )
  }
})

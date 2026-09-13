self.addEventListener('push', function(e) {
  const data = e.data ? e.data.json() : {}
  const title = data.title || 'Virtus Fan Card'
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo_192.png',
    badge: data.badge || '/logo_192.png',
    image: data.image || null,
    data: data.url ? { url: data.url } : {},
    actions: data.actions || [],
    tag: data.tag || 'virtus-mvp',
    renotify: true
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(e) {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(clients.openWindow(url))
})

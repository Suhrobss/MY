const CACHE = 'pulse-shell-v12';
const STATIC = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const {request} = event;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;
  if(url.pathname === '/api/public') {
    event.respondWith(fetch(request).then(async res => {
      if(res.ok) (await caches.open(CACHE)).put(request, res.clone());
      return res;
    }).catch(() => caches.match(request)));
    return;
  }
  if(url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(request).catch(()=>caches.match(new Request(url.origin+url.pathname))));
});
self.addEventListener('push', event => {
  let payload = {title:'MTWTU Youth Forum',body:'Нове повідомлення організаторів',kind:'info',url:'/?page=updates'};
  try { if(event.data) payload = {...payload,...event.data.json()}; } catch {}
  const safePath = typeof payload.url === 'string' && payload.url.startsWith('/') && !payload.url.startsWith('//') ? payload.url : '/?page=updates';
  const badge = '/icon-192.png';
  event.waitUntil(self.registration.showNotification(payload.title, {
    body:payload.body,
    icon:badge,
    badge,
    tag:payload.id || 'forum-message',
    renotify:true,
    data:{url:safePath}
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/?page=updates', self.location.origin);
  if(url.origin!==self.location.origin) return;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
    for(const client of clients) {
      if(new URL(client.url).origin===url.origin) { await client.focus(); client.navigate(url.toString()); return; }
    }
    return self.clients.openWindow(url.toString());
  }));
});


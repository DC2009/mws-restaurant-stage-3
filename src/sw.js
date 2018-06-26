const cacheName = 'mws-restaurant-1';
var urlsToCache = [
  '/',
  '/restaurant.html',
  '/css/styles.min.css',
  '/js/main.min.js',
  '/js/restaurant_info.min.js',
  '/js/dbhelper.min.js',
  '/js/swhelper.min.js',
  '/js/idb.min.js',
  '/js/lazysizes.min.js',
	//'/data/restaurants.json',
  '/img/1.webp',
  '/img/2.webp',
  '/img/3.webp',
  '/img/4.webp',
  '/img/5.webp',
  '/img/6.webp',
  '/img/7.webp',
  '/img/8.webp',
  '/img/9.webp',
  '/img/10.webp',
  '/img/fakemap.webp'
	//'/img/placeholder.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
		caches.open(cacheName)
			.then((cache) => {
				return cache.addAll(urlsToCache);
			})
	);
});

self.addEventListener('activate', (event) => {
  //event.waitUntil(self.clients.claim());

	event.waitUntil(
		caches.keys().then((cacheNames) => {
  		return Promise.all(
				cacheNames
					.filter((cacheName) => {
						return cacheName.startsWith('mws-restaurant-') && cacheName != cacheName;
					})
					.map((cacheName) => {
						return caches.delete(cacheName);
					})
			);
		})
	);
});

self.addEventListener('fetch', (event) => {
  if (!urlsToCache.includes(event.request.url)) {
    urlsToCache.push(event.request.url);
  }

  event.respondWith(
		caches.match(event.request).then((response) => {
		  return response || fetch(event.request);
		})
	);
});


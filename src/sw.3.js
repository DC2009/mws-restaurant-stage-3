importScripts('js/idb.min.js');

//const dataHost = 'localhost:1337';

const cacheName = 'mws-restaurant-1';
const urlsToCache = [
  '/',
  './index.html',
  './restaurant.html',
  './css/styles.min.css',
  './js/dbhelper.min.js',
  './js/swhelper.min.js',
  './js/idb.min.js',
  './js/main.min.js',
  './js/restaurant_info.min.js',
  './img/1.webp',
  './img/2.webp',
  './img/3.webp',
  './img/4.webp',
  './img/5.webp',
  './img/6.webp',
  './img/7.webp',
  './img/8.webp',
  './img/9.webp',
  './img/10.webp',
];

const IDBVersion = 1;
const IDBName = 'mws-rr2';
let dbPromise;


self.addEventListener('install', function (event) {
  initDB();
  event.waitUntil(
    caches.open(cacheName)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate',  event => {
  event.waitUntil(self.clients.claim());

  const cacheWhitelist = [cacheName];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.endsWith('localhost:1337/restaurants')){
    event.respondWith(
      dbPromise.then(function (db) {
        var tx = db.transaction('restaurants', 'readonly');
        var store = tx.objectStore('restaurants');
        return store.getAll();
      }).then(function (items) {
        if (!items.length) {
          return fetch(event.request)
          .then(function (response) {
            return response.clone().json()
            .then(json => {
              addAllData(json);
              return response;
            });
          });
        } else {
          let response = new Response(JSON.stringify(items), {
            headers: new Headers({
              'Content-type': 'application/json',
              'Access-Control-Allow-Credentials': 'true'
            }),
            type: 'cors',
            status: 200
          });
          return response;
        }
      })
    );

    return; // don't go down
  }

  // normal cases
  event.respondWith(
    caches.match(event.request).then(function(response) {

      if (response) {
        return response;
      }
      return fetch(event.request)
        .then(function(response) {
          return caches.open(cacheName).then(function(cache) {
            if (event.request.url.indexOf('maps') < 0) { // don't cache google maps
              cache.put(event.request.url, response.clone());
            }
            return response;
          });
        });

    }).catch(function(err) {
      console.log('offline mode error:', err);
    })
  );

});


// IndexedDB functions

function initDB() {
  dbPromise = idb.open(IDBName, IDBVersion, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('restaurants')) {
      upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    }
  });
}

function addAllData(rlist) {
  let tx;
  dbPromise.then(function(db) {
    tx = db.transaction('restaurants', 'readwrite');
    var store = tx.objectStore('restaurants');
    rlist.forEach(function(res) {
      store.put(res);  // put is safer because it doesn't give error on duplicate add
    });
    return tx.complete;
  }).then(function() {
  }).catch(function(err) {
    tx.abort();
    return false;
  });
}


// reviews

self.addEventListener('sync', function (event) {
  console.log('sync fired');
  if (event.tag === 'sync') {
    event.waitUntil(
      sendReviews()
      .then(() => {
        console.log('synced');
      })
      .catch(err => {
        console.log(err, 'error syncing');
      })
    );
  } else if (event.tag === 'favorite') {
    event.waitUntil(
      sendFavorites()
      .then(() => {
        console.log('favorites synced');
      })
      .catch(err => {
        console.log(err, 'error syncing favorites');
      })
    );
  }
});

function sendFavorites() {
  return idb.open('favorite', 1).then(db => {
    let tx = db.transaction('outbox', 'readonly');
    return tx.objectStore('outbox').getAll();
  }).then(items => {
    return Promise.all(items.map(item => {
      let id = item.id;
      return fetch(`http://localhost:1337/restaurants/${item.resId}/?is_favorite=${item.favorite}`, {
        method: 'PUT'
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        if (data) {
          idb.open('favorite', 1).then(db => {
            let tx = db.transaction('outbox', 'readwrite');
            return tx.objectStore('outbox').delete(id);
          });
        }
      });
    }));
  });
}

function sendReviews() {
  return idb.open('review', 1).then(db => {
    let tx = db.transaction('outbox', 'readonly');
    return tx.objectStore('outbox').getAll();
  }).then(reviews => {
    return Promise.all(reviews.map(review => {
      let reviewID = review.id;
      delete review.id;
      // POST review
      return fetch('http://localhost:1337/reviews', {
        method: 'POST',
        body: JSON.stringify(review),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(response => {
        console.log(response);
        return response.json();
      }).then(data => {
        console.log('added review', data);
        if (data) {
          idb.open('review', 1).then(db => {
            let tx = db.transaction('outbox', 'readwrite');
            return tx.objectStore('outbox').delete(reviewID);
          });
        }
      });
    }));
  });
}
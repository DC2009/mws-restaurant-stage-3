/**
 * Common database helper functions.
 */
const dbName = 'mws-rr2';
const storeRestaurants = 'restaurants';
const storePendingReviews = 'pending-reviews';

class DBHelper {
	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static get DATABASE_URL() {
		const port = 1337; // Change this to your server port
		return `http://localhost:${port}`;
	}

	/**
	 * Open idb 
	 */
	static openIdb() {
		return idb.open(dbName, 1, upgradeDb => {
			if (!upgradeDb.objectStoreNames.contains(storeRestaurants)) {
				const store = upgradeDb.createObjectStore(storeRestaurants, {
					keyPath: 'id'
				});
			}

			if (!upgradeDb.objectStoreNames.contains(storePendingReviews)) {
				const store = upgradeDb.createObjectStore(storePendingReviews, {
					keyPath: 'id',
					autoIncrement: true
				});
			}

			for (let i=1; i<10; i++) {
				if (!upgradeDb.objectStoreNames.contains(`reviews-restaurant-${i}`)) {
					const store = upgradeDb.createObjectStore(`reviews-restaurant-${i}`, {
						keyPath: 'id',
						autoIncrement: true
					});
				}
			}
		})
	}

	/**
	 * Delete store from idb
	 */
	static deleteStore(transactionName, storeName) {
		return DBHelper.openIdb()
		.then(db => {
			return db
				.transaction(transactionName, 'readwrite')
				.objectStore(storeName)
				.clear()
				.complete;
		});
				
	}


	/**
	* load store from idb
	*/
	static loadStore(transactionName, storeName) {
		return DBHelper.openIdb()
		.then(db => {
			console.log('loadStore: ', transactionName, storeName);
			return db.transaction(transactionName).objectStore(storeName).getAll();
		});
	}

	/**
	 * save data to idb
	 */
	static saveData(data, transactionName, storeName) {
		return DBHelper.openIdb()
		.then(db => {
			if (!db) return;

			const store = db.transaction(transactionName, 'readwrite').objectStore(storeName);

			//Array.from(data).forEach(element = store.put(element));
			for (let el of data) {
				store.put(el);
			};
		});
	}

	/**
	 * Fetch data from server
	 */
	static fetchFromServer(slug, transactionName, storeName) {
		console.log('fetchFromServer beginning slug: ', slug);
		return fetch(`${DBHelper.DATABASE_URL}/${slug}`)
			.then(response => response.json())
			.then(data => {
				//refresh stale data
				console.log('fetchFromServer then slug: ', slug);
				DBHelper.saveData(data, transactionName, storeName);
				return data;
			});
	}

	static fetchRestaurants(callback) {
		const slug = 'restaurants';
		DBHelper.loadStore(storeRestaurants, storeRestaurants)
			.then(data => {
				if (data.length === 0) {
					console.log('retrieve data from server');
					return DBHelper.fetchFromServer(slug, storeRestaurants, storeRestaurants);
				}
				console.log('retrieve data from idb');
				//refresh stale data in idb
				DBHelper.fetchFromServer(slug, storeRestaurants, storeRestaurants);
				return data;
			})
			.then(restaurants => {
				callback(null, restaurants);
			})
			.catch(err => {
				console.log(`Error fetching the restaurants: ${err}`);
				callback(err, null);
			})
	}
	
		/**
	 * Fetch all reviews for a restaurant
	 */
	static fetchReviewsByRestaurantId(id, callback) {
		DBHelper.loadStore(`reviews-restaurant-${id}`, `reviews-restaurant-${id}`)
			.then(data => {
				if (data.length === 0) {
					console.log('DBHelper fetchReviewsByRestaurantId: ', id);
					return DBHelper.fetchFromServer(`reviews/?restaurant_id=${id}`, `reviews-restaurant-${id}`, `reviews-restaurant-${id}`);
				}
				DBHelper.fetchFromServer(`reviews/?restaurant_id=${id}`, `reviews-restaurant-${id}`, `reviews-restaurant-${id}`);
				return data;
			})
			.then(reviews => {
				console.log('DBHelper fetchReviewsByRestaurantId reviews: ', reviews);
				callback(null, reviews);
			})
			.catch(err => {
				console.log(`Error fetching reviews for restaurant ${id}: ${err.status}`);
				callback(err, null);
			})
	}


	
	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const restaurant = restaurants.find((r) => r.id == id);
				if (restaurant) {
					// Got the restaurant
					callback(null, restaurant);
				} else {
					// Restaurant does not exist in the database
					callback('Restaurant does not exist', null);
				}
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine type with proper error handling.
	 */
	static fetchRestaurantByCuisine(cuisine, callback) {
		// Fetch all restaurants  with proper error handling
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter((r) => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch restaurants by a neighborhood with proper error handling.
	 */
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter((r) => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants;
				if (cuisine != 'all') {
					// filter by cuisine
					results = results.filter((r) => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') {
					// filter by neighborhood
					results = results.filter((r) => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch all neighborhoods with proper error handling.
	 */
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
	 * Fetch all cuisines with proper error handling.
	 */
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return `./restaurant.html?id=${restaurant.id}`;
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		return `/img/${restaurant.photograph}`;
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP
		});
		return marker;
	}

	static postReview(review) {
		console.log('DBHelper.postReview: ',review)
		if (!review) return;
		return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(review)
		})
		.then(response => response.json())
		.then(data => {
			console.log('DBHelper postReview response: ', data);
			DBHelper.saveData(
				data, 
				`reviews-restaurant-${self.restaurant.id}`,
				`reviews-restaurant-${self.restaurant.id}`
			);
			return data;
		})
		.catch(error => {
			console.log('DBHelper postReview save review: ', review);
			DBHelper.saveData(
				review,
				storePendingReviews,
				storePendingReviews
			);
		});
	}

}

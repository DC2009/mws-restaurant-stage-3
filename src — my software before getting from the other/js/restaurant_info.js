let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
*/
/*
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};
*/
//window.initMap = () => {
initMap = () => {
    self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
};


document.addEventListener('DOMContentLoaded', (event) => {
  console.log('DOMContentLoaded: ', event);
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			fillBreadcrumb();
      initMap();
    }
  });

});

//document.addEventListener()

/**
 * Get current restaurant from ID.
 */
fetchRestaurantFromId = (id, callback) => {
  DBHelper.fetchRestaurantById(id, (error, restaurant) => {
    self.restaurant = restaurant;
    console.log('fetchRestaurantById: ', self.restaurant);
    if (!restaurant) {
      console.error(error);
      return;
    }
    fillRestaurantHTML();
    callback(null, restaurant);
  });
};

/**
 * Get current restaurant reviews from ID.
 */
fetchReviewsByRestaurantId = (callback) => {
  console.log('fetchReviewsByRestaurantId', self.restaurant.reviews);
  if (self.restaurant.reviews) {
    callback(null, self.restaurant.reviews);
    return;
  }

  DBHelper.fetchReviewsByRestaurantId(self.restaurant.id, (err, reviews) => {
    if (err) {
      console.log(err);
      callback(err, null);
      return;
    }
    self.restaurant['reviews'] = reviews;
    callback(null, self.restaurant.reviews);
  });

  return;
}


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  console.log('fetchRestaurantFromURL restaurant: ', self.restaurant);
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    fetchRestaurantFromId(id, callback);
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-picture');

  const image = document.createElement('img');
  image.className = 'restaurant-img lazyload';
  image.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant) + '.jpg');
  image.alt = `${restaurant.name} cover photo`;

  const webp = document.createElement('source');
  webp.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant)+'.webp');
  webp.setAttribute('type', 'image/webp');

  const jpg = document.createElement('source');
  jpg.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant)+'.jpg');
  jpg.setAttribute('type', 'image/jpg');

  picture.append(webp);
  picture.append(jpg);
  picture.append(image);

/*  
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} cover photo`;
*/
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  document.getElementById('restaurant-id').value = self.restaurant.id;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
	fetchReviewsByRestaurantId((error, reviews) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
      console.log('going to fill the reviews ', reviews);
      fillReviewsHTML(reviews);
    }
  });

};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute('tabindex', 0);
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.setAttribute('tabindex', 0);
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  console.log('fillreviews');
  const container = document.getElementById('reviews-list-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.setAttribute('aria-label', 'Reviews');
  title.setAttribute('tabindex', '0');  
  container.appendChild(title);

  if (!reviews) {
    console.log('no reviews');
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.setAttribute('tabindex', 0);
    container.appendChild(noReviews);
    return;
  }

  console.log('found reviews');
  const ul = document.getElementById('reviews-list');
  reviews.reverse().forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  console.log('createReviewHTML: ', review);
  const li = document.createElement('li');
  li.setAttribute('tabindex', 0);
  
  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toDateString();
  date.classList.add('review_date');
  date.setAttribute('tabindex', 0);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.setAttribute('tabindex', 0);
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.setAttribute('tabindex', 0);
  li.appendChild(comments);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute('tabindex', 0);
  li.appendChild(name);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  console.log('getParameterByName url: ', url);  
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Post a new review
 */
submitReview = (e) => {
  //e.preventDefault();
  console.log('submitreview');
  const name = document.getElementById('user-name').value;
	const rating = document.getElementById('user-rating').value;
	const comments = document.getElementById('user-comment').value;

  const date = Date.now();
	const review = {
    restaurant_id: self.restaurant.id,
    name,
    rating,
    comments,
    createdAt: date,
    updatedAt: date
  };

  DBHelper.postReview(review)
    .then( () => {
      name.value = '';
      rating.value = '';
      comments.value = '';
      const ul = document.getElementById('reviews-list');
      console.log('submitReview: ', ul);
      ul.insertBefore(createReviewHTML(review), ul.childNodes[0]);
      console.log('submitReview review inserted');
    });
};




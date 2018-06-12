let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
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

/**
 * Get current restaurant from ID.
 */
fetchRestaurantFromId = (id, callback) => {
  DBHelper.fetchRestaurantById(id, (error, restaurant) => {
    self.restaurant = restaurant;
    if (!restaurant) {
      console.error(error);
      return;
    }
    fillRestaurantHTML();
    callback(null, restaurant);
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
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

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
  fillCommentRestaurantID();
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
  const li = document.createElement('li');
  
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute('tabindex', 0);
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
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
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

fillCommentRestaurantID = (id = self.restaurant.id) => {
  const restaurantID = document.getElementById('restaurant-id');
  restaurantID.value = id;
};

/**
 * Post a review to the server.
 */
postReview = (id = self.restaurant.id) => {
  const restaurant_id = id;
  const name = document.getElementById('user-name').value;
  const rating = document.getElementById('user-rating').value;
  const comment = document.getElementById('user-comment').value;

  const review = {};
  review['restaurant_id'] = restaurant_id;
  review['name'] = name;
  review['rating'] = rating;
  review['comment'] = comment;
  
  /*if (!navigator.onLine) {
    review = {
      restaurant_id,
      name,
      rating,
      comment,
      createdAt: new Date()
    };

     DBHelper.addToDBOffline(review);
     return;
  }*/
  // when user is online
  fetch('http://localhost:1337/reviews/', {
    method: 'POST',
    body: JSON.stringify(review)
  }).then((response) => {
		// set "restaurants" to null so indexDB can be updated with new comment
//		DBHelper.clearDB();
//		window.location.href = `http://localhost:5000/restaurant.html?id=${id}`;
//    console.log(response);

    document.getElementById('review-form').reset();
    response.json().then((data) => {
      const ul = document.getElementById('reviews-list');
      console.log('ul: ', ul);
      const li = createReviewHTML(data);
      console.log('li: ', li);
      ul.insertBefore(li, ul.childNodes[1]);
      //ul.appendChild(createReviewHTML(data));
      const container = document.getElementById('reviews-list-container');
      container.appendChild(ul);
    });
  });
};



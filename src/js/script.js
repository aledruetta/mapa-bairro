var map;

function initMap() {
  "use strict";

  var bounds = new google.maps.LatLngBounds(
    {lat: -23.532661, lng: -45.230544},
    {lat: -23.380147, lng: -44.832549}
  );
  map = new google.maps.Map(document.getElementById('map'));
  map.fitBounds(bounds);
}

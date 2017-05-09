var map;

function app() {
  "use strict";

  var model = {
    markers: [
      {title: 'Maranduba', position: {lat: -23.532661, lng: -45.230544}},
      {title: 'Picinguaba', position: {lat: -23.380147, lng: -44.832549}}
    ]
  };

  var control = {
    getMarkers: function() {
      return model.markers;
    },

    init: function() {
      view.init();
    }
  };

  var view = {
    initMap: function() {
      map = new google.maps.Map(document.getElementById('map'));
      var markers = control.getMarkers();
      var maranduba = markers[0];
      var picinguaba = markers[1];
      var bounds = new google.maps.LatLngBounds(maranduba.position, picinguaba.position);
      map.fitBounds(bounds);
    },

    init: function() {
      this.initMap();
    }
  };

  control.init();
}

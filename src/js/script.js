function app() {
  "use strict";

  function MapViewModel() {
    var self = this;
    var map = new google.maps.Map(document.getElementById('map'));
    var bounds = new google.maps.LatLngBounds();
    var locations = [
      {title: 'Praia da Caçandoca', position: {lat: -23.5621619, lng: -45.2234441}},
      {title: 'Praia de Maranduba', position: {lat: -23.54036, lng: -45.225302}},
      {title: 'Praia da Lagoinha', position: {lat: -23.5198202, lng: -45.2003742}},
      {title: 'Praia Dura', position: {lat: -23.4940736, lng: -45.1730874}},
      {title: 'Praia Vermelha do Sul', position: {lat: -23.5097394, lng: -45.1755504}},
      {title: 'Praia de Santa Rita', position: {lat: -23.4946283, lng: -45.1054253}},
      {title: 'Praia Grande', position: {lat: -23.4716174, lng: -45.0690359}},
      {title: 'Praia do Cedro', position: {lat: -23.4599192, lng: -45.0372474}},
      {title: 'Praia Vermelha do Centro', position: {lat: -23.4625236, lng: -45.0502857}},
      {title: 'Praia Vermelha do Norte', position: {lat: -23.4191079, lng: -45.0390097}},
      {title: 'Praia Itamambuca', position: {lat: -23.4030911, lng: -45.0047297}},
      {title: 'Praia do Félix', position: {lat: -23.3905835, lng: -44.9740524}},
      {title: 'Praia do Prumirim', position: {lat: -23.3848589, lng: -44.967505}},
      {title: 'Praia da Puruba', position: {lat: -23.3586419, lng: -44.9444224}},
      {title: 'Praia Ubatumirim', position: {lat: -23.3345485, lng: -44.9042858}},
      {title: 'Praia da Almada', position: {lat: -23.3606441, lng: -44.8904074}},
      {title: 'Praia da Fazenda', position: {lat: -23.3696992, lng: -44.8582248}},
      {title: 'Praia de Picinguaba', position: {lat: -23.377047, lng: -44.839927}},
    ];

    self.markers = ko.observableArray([]);

    function initMap() {
      locations.forEach(function(location) {
        createMarker(location);
      });
      map.fitBounds(bounds);
    }

    function createMarker(properties) {
      var marker = new google.maps.Marker(properties);
      marker.setAnimation(google.maps.Animation.DROP);
      marker.setMap(map);
      self.markers().push(marker);
      bounds.extend(marker.position);
    }

    initMap();
  }

  ko.applyBindings(new MapViewModel());
}

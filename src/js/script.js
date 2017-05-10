var map;

function app() {
  "use strict";

  var model = {
    bounds: new google.maps.LatLngBounds(),
    locations: [
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
      {title: 'Praia de Picinguaba', position: {lat: -23.377047, lng: -44.839927}}
    ],
    markers: []
  };

  var control = {
    getLocations: function() {
      return model.locations;
    },

    getBounds: function() {
      return model.bounds;
    },

    extendBounds: function(position) {
      model.bounds.extend(position);
    },

    // Cria marcador, adiciona no array markers e extende as bordas do mapa
    createMarker: function(properties) {
      var marker = new google.maps.Marker(properties);
      marker.setAnimation(google.maps.Animation.DROP);
      model.markers.push(marker);
      this.extendBounds(marker.position);

      return marker;
    },

    getMarkers: function() {
      return model.markers;
    },

    init: function() {
      view.init();
    }
  };

  var view = {
    // Inicializa o mapa posicionando os marcadores iniciais
    // e definindo o tamanho do mapa para contê-los
    initMap: function() {
      map = new google.maps.Map(document.getElementById('map'));
      var locations = control.getLocations();
      var bounds = control.getBounds();
      locations.forEach(function(location) {
        var marker = control.createMarker(location);
        marker.setMap(map);
        view.addButton(marker.title);
      });
      map.fitBounds(bounds);
    },

    addButton: function(title) {
      var $button = $('<button type="button" name="button" class="list-group-item">%text%</button>'.replace(/%text%/, title));
      $('.list-group').append($button);
    },

    init: function() {
      this.initMap();
    }
  };

  control.init();
}

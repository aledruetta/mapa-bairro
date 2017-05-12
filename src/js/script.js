function app() {
  "use strict";

  function MapViewModel() {
    var self = this;
    // objetos da API

    var map = new google.maps.Map(document.getElementById('map'));
    var bounds = new google.maps.LatLngBounds();
    var infowindow = new google.maps.InfoWindow();

    // Dados para marcadores inciais
    var locations = [
      {title: 'Praia da Caçandoca', position: {lat: -23.5621619, lng: -45.2234441}},
      {title: 'Praia de Maranduba', position: {lat: -23.54036, lng: -45.225302}},
      {title: 'Praia da Lagoinha', position: {lat: -23.5198202, lng: -45.2003742}},
      {title: 'Praia Dura', position: {lat: -23.4940736, lng: -45.1730874}},
      {title: 'Praia Vermelha do Sul', position: {lat: -23.5097394, lng: -45.1755504}},
      {title: 'Praia de Santa Rita', position: {lat: -23.493743, lng: -45.102622}},
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

    // Observables
    self.markers = ko.observableArray([]);
    self.filtered = ko.observableArray([]);
    self.searchIn = ko.observable('');
    self.showInfoPanel = ko.observable(false);
    self.showMarkerList = ko.observable(true);
    self.infoPanel = ko.observable(null);

    // Eventos para quando clicar no botão
    self.clickLista = function(marker) {
      self.toggleInfoPanel();
      resetSeach();
      populateInfoPanel(marker);
      updateMap(marker);
    };

    function populateInfoPanel(marker) {
      self.infoPanel({
        title: marker.title,
        endereco: 'rua sei lá o quê',
      });
    }

    self.toggleInfoPanel = function() {
      self.showInfoPanel(self.showMarkerList());
      self.showMarkerList(!self.showInfoPanel());
    };

    function updateMap(marker) {
      resetMarkers();
      map.panTo(marker.position);
      map.setZoom(14);
      marker.setAnimation(google.maps.Animation.BOUNCE);
      window.setTimeout(function() {
        marker.setAnimation(null);
      }, 3000);
      marker.setIcon('http://maps.google.com/mapfiles/kml/paddle/ylw-stars.png');
    }

    // Filtra marcadores dinamicamente segundo o digitado no campo de busca
    self.filterMarkers = function(data, event) {
      // ESC limpa o campo de busca
      if (event.keyCode === 27) {
        resetSeach();
      } else {
        var search = self.searchIn().toLowerCase();
        var filtered = self.markers().filter(function(marker) {
          var title = marker.title.toLowerCase();
          return title.indexOf(search) !== -1;
        });
        self.filtered(filtered);
      }
    };

    function resetSeach() {
      self.searchIn('');
      self.filtered(self.markers());
    }

    // Inicializa o mapa, posiciona os marcadores iniciais e determina
    // as dimensões do mapa para conter todos eles
    function initMap() {
      // Cria e posiciona os marcadores iniciais
      locations.forEach(function(location) {
        createMarker(location);
      });
      // Inicializa a lista
      self.filtered(self.markers());
      // Determina os limites do mapa
      map.fitBounds(bounds);

      // Carrega dados de polígono exportados do Open Street Map
      $.getJSON('/src/json/ubatuba_poly.txt', function(geoJsonTxt) {
        // Cria objeto FeatureCollection com formatação de estilo
        var geojson = {
          "type": "FeatureCollection",
          "features": [{
            "type": "Feature",
            "geometry": {},
            "properties": {
              fillColor: "purple",
              fillOpacity: 0.05,
              strokeColor: "purple",
              strokeOpacity: 0.2,
              strokeWeight: 1
            }
          }],
        };
        // Adiciona os dados importados pro FeatureCollection
        geojson.features[0].geometry = geoJsonTxt;
        // Desenha o polígono no mapa
        map.data.addGeoJson(geojson);
        // Aplica estilo
        setStyleMap();
      });

      function setStyleMap() {
        map.data.setStyle(function(feature) {
          var style = {};
          feature.forEachProperty(function(value, property) {
            style[property] = value;
          });
          return style;
        });
      }
    }

    // Cria marcador, adiciona evento click para infowindow,
    // extende bounds e adiciona o item no array de marcadores
    function createMarker(properties) {
      var marker = new google.maps.Marker(properties);
      marker.setAnimation(google.maps.Animation.DROP);
      marker.setMap(map);
      marker.addListener('click', function() {
        showInfoWindow(marker);
      });
      self.markers().push(marker);
      bounds.extend(marker.position);
    }

    // Icone e animação iniciais para todos os marcadores
    function resetMarkers() {
      self.markers().forEach(function(marker) {
        marker.setIcon(null);
        marker.setAnimation(null);
      });
    }

    // Mostra popup infowindow
    function showInfoWindow(marker) {
      infowindow.setContent(marker.title);
      infowindow.open(map, marker);
    }

    initMap();
  }

  ko.applyBindings(new MapViewModel());
}

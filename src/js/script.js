function app() {
  "use strict";

  function MapViewModel() {
    var self = this;

    // objetos da API
    var map = new google.maps.Map(document.getElementById('map'));
    var bounds = new google.maps.LatLngBounds();
    var infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);

    // Dados para marcadores inciais
    var locations = [
      {title: 'Praia de Picinguaba', position: {lat: -23.377047, lng: -44.839927}},
      {title: 'Praia da Fazenda', position: {lat: -23.3696992, lng: -44.8582248}},
      {title: 'Praia da Almada', position: {lat: -23.3606441, lng: -44.8904074}},
      {title: 'Praia Ubatumirim', position: {lat: -23.3345485, lng: -44.9042858}},
      {title: 'Praia da Puruba', position: {lat: -23.3586419, lng: -44.9444224}},
      {title: 'Praia do Prumirim', position: {lat: -23.3848589, lng: -44.967505}},
      {title: 'Praia do Félix', position: {lat: -23.3905835, lng: -44.9740524}},
      {title: 'Praia Itamambuca', position: {lat: -23.4030911, lng: -45.0047297}},
      {title: 'Praia Vermelha do Norte', position: {lat: -23.4191079, lng: -45.0390097}},
      {title: 'Praia do Cedro', position: {lat: -23.4599192, lng: -45.0372474}},
      {title: 'Praia Vermelha do Centro', position: {lat: -23.4625236, lng: -45.0502857}},
      {title: 'Praia Grande', position: {lat: -23.4716174, lng: -45.0690359}},
      {title: 'Praia de Santa Rita', position: {lat: -23.493743, lng: -45.102622}},
      {title: 'Praia Dura', position: {lat: -23.4940736, lng: -45.1730874}},
      {title: 'Praia Vermelha do Sul', position: {lat: -23.5097394, lng: -45.1755504}},
      {title: 'Praia da Lagoinha', position: {lat: -23.5198202, lng: -45.2003742}},
      {title: 'Praia de Maranduba', position: {lat: -23.54036, lng: -45.225302}},
      {title: 'Praia da Caçandoca', position: {lat: -23.5621619, lng: -45.2234441}},
    ];

    var markers = [];
    var iconRed = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    var iconBlue = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    var iconYellow = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';

    // Observables
    self.filtered = ko.observableArray([]);
    self.places = ko.observableArray([]);
    self.searchIn = ko.observable('');
    self.showInfoPanel = ko.observable(false);
    self.showMarkerList = ko.observable(true);
    self.infoPanel = ko.observable(null);

    // Eventos para quando clicar no botão
    self.clickLista = function(target) {
      target.setIcon(iconBlue);
      target.setZIndex(google.maps.Marker.MAX_ZINDEX);
      target.setAnimation(google.maps.Animation.BOUNCE);
      toggleInfoPanel();
      resetSeach();
      getNearBy(target.getPosition());
      updateMap(target);
      self.infoPanel({
        title: target.title,
        endereco: 'bla, bla, bla',
      });
    };

    // Alternar visulização entre lista de marcadores e informação contextual
    function toggleInfoPanel() {
      self.showInfoPanel(self.showMarkerList());
      self.showMarkerList(!self.showInfoPanel());
    }

    self.mouseOverIcon = function(marker) {
      marker.setIcon(iconBlue);
    };

    self.mouseOutIcon = function(marker) {
      marker.setIcon(iconRed);
    };

    function getNearBy(location) {
      var request = {
        location: location,
        radius: '1000',
      };
      service.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          var points = ['bar', 'restaurant', 'food', 'lodging'];
          var places = results.filter(function(place) {
            return points.some(function(point) {
              return place.types.indexOf(point) !== -1;
            });
          });
          places.forEach(function(place) {
            var name = capitalize(place.name);
            var position = place.geometry.location;
            if (position && position !== location) {
              var marker = createMarker({
                title: name,
                position: place.geometry.location,
                animation: google.maps.Animation.DROP,
                icon: iconYellow,
              });
              self.places.push(marker);
            }
          });
          self.places.sort(function(a, b) {
            if (a.name < b.name) {
              return -1;
            } else if (a.name > b.name) {
              return 1;
            }
            return 0;
          });
        }
      });
    }

    function capitalize(str) {
      var lower = str.toLowerCase();
      return lower.replace(/(?:^|\s)\S/g, function(first) {return first.toUpperCase();});
    }

    self.closeInfoPanel = function() {
      toggleInfoPanel();
      infowindow.close();
      resetPlaces();
      map.fitBounds(bounds);
    };

    function updateMap(marker) {
      map.panTo(marker.position);
      map.setZoom(15);
      window.setTimeout(function() {
        marker.setAnimation(null);
      }, 3000);
    }

    // Filtra marcadores dinamicamente segundo o digitado no campo de busca
    self.filterMarkers = function(data, event) {
      // ESC limpa o campo de busca
      if (event.keyCode === 27) {
        resetSeach();
      } else {
        var search = self.searchIn().toLowerCase();
        var filtered = markers.filter(function(marker) {
          var title = marker.title.toLowerCase();
          return title.indexOf(search) !== -1;
        });
        self.filtered(filtered);
      }
    };

    // Limpa o campo de busca e reinicia a lista
    function resetSeach() {
      self.searchIn('');
      self.filtered(markers);
    }

    function resetPlaces() {
      self.places().forEach(function(place) {
        place.setMap(null);
      });
      self.places([]);
    }

    function getPolygon() {
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
    }

    function setStyleMap() {
      map.data.setStyle(function(feature) {
        var style = {};
        feature.forEachProperty(function(value, property) {
          style[property] = value;
        });
        return style;
      });
    }

    // Cria marcador, adiciona evento click para infowindow,
    // extende bounds e adiciona o item no array de marcadores
    function createMarker(properties) {
      var marker = new google.maps.Marker(properties);
      marker.setMap(map);
      marker.addListener('click', function() {
        showInfoWindow(marker);
      });
      bounds.extend(marker.position);

      return marker;
    }

    // Mostra popup infowindow
    function showInfoWindow(marker) {
      infowindow.setContent(capitalize(marker.title));
      infowindow.open(map, marker);
    }

    // Inicializa o mapa, posiciona os marcadores iniciais e determina
    // as dimensões do mapa para conter todos eles
    function initMap() {
      // Cria e posiciona os marcadores iniciais
      locations.forEach(function(location) {
        var marker = createMarker(location);
        marker.setIcon(iconRed);
        markers.push(marker);
      });
      // Inicializa a lista
      self.filtered(markers);
      // Determina os limites do mapa
      map.fitBounds(bounds);
      // Desenha os limites do município
      getPolygon();
    }

    initMap();
  }

  ko.applyBindings(new MapViewModel());
}

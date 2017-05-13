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
      {title: 'Praia da Caçandoca', position: {lat: -23.5621619, lng: -45.2234441}},
      {title: 'Praia de Maranduba', position: {lat: -23.54036, lng: -45.225302}},
      {title: 'Praia da Lagoinha', position: {lat: -23.5198202, lng: -45.2003742}},
      {title: 'Praia Vermelha do Sul', position: {lat: -23.5097394, lng: -45.1755504}},
      {title: 'Praia Dura', position: {lat: -23.4940736, lng: -45.1730874}},
      {title: 'Praia de Santa Rita', position: {lat: -23.493743, lng: -45.102622}},
      {title: 'Praia Grande', position: {lat: -23.4716174, lng: -45.0690359}},
      {title: 'Praia Vermelha do Centro', position: {lat: -23.4625236, lng: -45.0502857}},
      {title: 'Praia do Cedro', position: {lat: -23.4599192, lng: -45.0372474}},
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

    var tmpMarkers = [];
    var markers = [];
    var isIconToggled = false;
    var iconList = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    var iconPlaces = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    var iconTarget = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    var iconToggled = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

    // Observables
    self.filtered = ko.observableArray([]);
    self.places = ko.observableArray([]);
    self.searchIn = ko.observable('');
    self.showInfoPanel = ko.observable(false);
    self.showMarkerList = ko.observable(true);
    self.infoPanel = ko.observable(null);

    // Eventos para quando clicar no botão
    self.clickLista = function(target) {
      toggleInfoPanel();
      resetSeach();
      getNearBy(target.getPosition());
      updateMap(target);
      self.infoPanel({
        title: target.title,
        endereco: 'bla, bla, bla',
      });
    };

    self.toggleIconColor = function(marker) {
      isIconToggled = !isIconToggled;
      if (isIconToggled) {
        marker.setIcon(iconToggled);
      } else {
        marker.setIcon(iconList);
      }
    };

    // Alternar visulização entre lista de marcadores e informação contextual
    function toggleInfoPanel() {
      self.showInfoPanel(self.showMarkerList());
      self.showMarkerList(!self.showInfoPanel());
    }

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
            if (place.geometry.location !== location) {
              createMarker({
                title: name,
                position: place.geometry.location,
                icon: iconPlaces,
              }, false);
              self.places.push(name);
            }
          });
          self.places.sort();
        }
      });
    }

    function capitalize(str) {
      var lower = str.toLowerCase();
      return lower.replace(/(?:^|\s)\S/g, function(first) {return first.toUpperCase();});
    }

    self.closeInfoPanel = function() {
      toggleInfoPanel();
      resetMarkers();
      resetPlaces();
      map.fitBounds(bounds);
    };

    function updateMap(marker) {
      map.panTo(marker.position);
      map.setZoom(15);
      marker.setZIndex(google.maps.Marker.MAX_ZINDEX);
      marker.setAnimation(google.maps.Animation.BOUNCE);
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

    // Elimina os marcadores temporais, fecha infowindow
    // e reinicia configurações dos marcadores iniciais
    function resetMarkers() {
      infowindow.close();
      tmpMarkers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers.forEach(function(marker) {
        marker.setMap(map);
        marker.setIcon(iconList);
        marker.setAnimation(null);
      });
    }

    function resetPlaces() {
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
    function createMarker(properties, addToMarkers) {
      var marker = new google.maps.Marker(properties);
      marker.setAnimation(google.maps.Animation.DROP);
      marker.setMap(map);
      marker.addListener('click', function() {
        showInfoWindow(marker);
      });
      if (addToMarkers) {
        markers.push(marker);
      } else {
        tmpMarkers.push(marker);
      }
      bounds.extend(marker.position);
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
        location.icon = iconList;
        createMarker(location, true);
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

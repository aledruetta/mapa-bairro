function app() {
  "use strict";

  // objetos Google Maps API
  var map = new google.maps.Map(document.getElementById('map'));
  var bounds = new google.maps.LatLngBounds();
  var infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);
  var geocoder = new google.maps.Geocoder();

  // Dados para marcadores inciais e lista lateral
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

  // Icones para marcadores
  var icons = {
    RED: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    BLUE: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    YELLOW: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  };

  ////////// View Model //////////
  function MapViewModel() {
    var view = this;

    ///// Campo de busca /////
    view.search = {
      text: ko.observable(''),
      reset: function() {
        this.text('');
        view.markerList.reset();
      },
    };

    ///// Lista lateral /////
    view.markerList = {
      all: [],
      filtered: ko.observableArray([]),
      visible: ko.observable(true),

      reset: function() {
        this.filtered(this.all);
      },

      filter: function(data, event) {
        // ESC limpa o campo de busca
        if (event.keyCode === 27) {
          view.search.reset();
        } else {
          var search = view.search.text().toLowerCase();
          var filtered = view.markerList.all.filter(function(marker) {
            var title = marker.title.toLowerCase();
            return title.indexOf(search) !== -1;
          });
          view.markerList.filtered(filtered);
        }
      },

      click: function() {
        this.setZIndex(google.maps.Marker.MAX_ZINDEX);
        this.setAnimation(google.maps.Animation.BOUNCE);
        view.markerList.panToMarker(this);
        view.infoPanel.update(this);
        view.search.reset();
      },

      panToMarker: function(marker) {
        map.panTo(marker.position);
        map.setZoom(15);
        window.setTimeout(function() {
          marker.setAnimation(null);
        }, 3000);
      },
    };

    ///// Seção Places do Painel /////
    view.places = {
      items: ko.observableArray([]),

      click: function(item) {
        showInfoWindow(item.marker);
        view.infoPanel.getAddress(item.marker.getPosition());
        view.infoPanel.photo(item.url);
      },

      reset: function() {
        this.items().forEach(function(place) {
          place.marker.setMap(null);
        });
        this.items([]);
      },
    };

    ///// Painel contextual /////
    view.infoPanel = {
      title: ko.observable(''),
      photo: ko.observable(''),
      wiki: ko.observable(''),
      address: ko.observable(''),
      places: view.places,
      visible: ko.observable(false),

      // Alterna visualização entre a Lista e o Painel
      toggle: function() {
        this.visible(view.markerList.visible());
        view.markerList.visible(!this.visible());
      },

      close: function() {
        infowindow.close();
        this.toggle();
        this.places.reset();
        this.photo('');
        view.search.reset();
        map.fitBounds(bounds);
      },

      update: function(target) {
        var location = target.getPosition();
        this.title(target.title);
        this.getNearBy(location);
        this.getAddress(location);
        this.toggle();
      },

      getAddress: function(location) {
        geocoder.geocode({location: location}, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results[1]) {
              view.infoPanel.address(results[0].formatted_address);
            }
          } else if (staus === google.maps.GeocoderStatus.ZERO_RESULTS) {
            alert('fail');
          }
        });
      },

      getNearBy: function(location) {
        var request = {
          location: location,
          radius: '1000',
        };

        service.nearbySearch(request, function(results, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            var points = ['bar', 'restaurant', 'food', 'lodging'];

            var googleplaces = results.filter(function(place) {
              return points.some(function(point) {
                return place.types.indexOf(point) !== -1;
              });
            });

            googleplaces.forEach(function(place) {
              var name = capitalize(place.name);
              var position = place.geometry.location;
              var url = '';

              if (place.photos && place.photos !== 'undefined') {
                url = place.photos[0].getUrl({
                  maxWidth: 423,
                });
              }

              if (position && position !== location) {
                var marker = createMarker({
                  title: name,
                  position: place.geometry.location,
                  animation: google.maps.Animation.DROP,
                  icon: icons.YELLOW,
                });

                view.places.items.push({marker: marker, url: url});
              }
            });

            view.places.items.sort(function(a, b) {
              if (a.marker.name < b.marker.name) {
                return -1;
              } else if (a.marker.name > b.marker.name) {
                return 1;
              }
              return 0;
            });
          }
        });
      },
    };

    view.mouseOverIcon = function(marker) {
      marker.setIcon(icons.BLUE);
    };

    view.mouseOutIcon = function(marker) {
      marker.setIcon(icons.RED);
    };
  }

  var view = new MapViewModel();
  ko.applyBindings(view);

  function showInfoWindow(marker) {
    infowindow.setContent(capitalize(marker.title));
    infowindow.open(map, marker);
  }

  function capitalize(str) {
    var lower = str.toLowerCase();
    return lower.replace(/(?:^|\s)\S/g, function(first) {return first.toUpperCase();});
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

  function createMarker(properties) {
    var marker = new google.maps.Marker(properties);
    marker.setMap(map);
    marker.addListener('click', function() {
      showInfoWindow(marker);
    });
    bounds.extend(marker.position);

    return marker;
  }

  function initMap() {
    locations.forEach(function(location) {
      var marker = createMarker(location);
      marker.setIcon(icons.RED);
      view.markerList.all.push(marker);
    });

    view.markerList.reset();
    map.fitBounds(bounds);
    getPolygon();
  }

  initMap();
}

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
    {title: 'Casa Rosada', position: {lat: -34.608054, lng: -58.370286}},
    {title: 'Plaza de Mayo', position: {lat: -34.608396, lng: -58.372164}},
    {title: 'Museo Casa Rosada', position: {lat: -34.608706, lng: -58.369563}},
    {title: 'Luna Park (Buenos Aires)', position: {lat: -34.602305, lng: -58.368752}},
    {title: 'Puerto Madero', position: {lat: -34.605135, lng: -58.365641}},
    {title: 'Plaza del Congreso', position: {lat: -34.609821, lng: -58.392606}},
    {title: 'Obelisco de Buenos Aires', position: {lat: -34.603736, lng: -58.381573}},
    {title: 'Teatro Colón', position: {lat: -34.601139, lng: -58.38315}},
    {title: 'Galerías Pacífico', position: {lat: -34.599196, lng: -58.374867}},
    {title: 'Centro Cultural Néstor Kirchner', position: {lat: -34.603495, lng: -58.369553}},
  ];

  // Icones para marcadores
  var icons = {
    RED: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    BLUE: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    YELLOW: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  };

  ////////////////////////////////
  //////// Map View Model ////////
  ////////////////////////////////
  function MapViewModel() {
    var view = this;

    ///// Campo de busca /////
    view.search = {
      text: ko.observable(''),
      enable: ko.observable(true),

      reset: function() {
        this.text('');
        view.markerList.reset();
      },
    };

    ///// Lista lateral /////
    view.markerList = {
      all: [],      // marcadores iniciais
      filtered: ko.observableArray([]),
      visible: ko.observable(true),

      renderMarkers: function() {
        this.clearAll();
        this.showFiltered();
      },

      clearAll: function() {
        this.all.forEach(function(item) {
          item.setVisible(false);
        });
      },

      showFiltered: function() {
        this.filtered().forEach(function(item) {
          item.setVisible(true);
        });
      },

      reset: function() {
        this.filtered(this.all);
        this.renderMarkers();
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
          view.markerList.renderMarkers();
        }
      },

      click: function() {
        this.setZIndex(google.maps.Marker.MAX_ZINDEX);
        this.setAnimation(google.maps.Animation.BOUNCE);
        panToMarker(this, 15);
        view.infoPanel.open(this);
        view.search.reset();
      },
    };

    ///// Seção Places do Painel /////
    view.places = {
      items: ko.observableArray([]),

      // Apresentar informação sobre o Place
      click: function(item) {
        panToMarker(item.marker, 18);
        showInfoWindow(item.marker);
        getAddress(item.marker.getPosition())
          .then(function(response) {
            view.infoPanel.address(response);
          }, function(error) {
            alert(error);
          });
        view.infoPanel.photo(item.url);
        view.infoPanel.title(item.marker.title);
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

      // Fechar Painel
      close: function() {
        view.search.enable(true);
        infowindow.close();
        this.toggle();
        this.places.reset();
        this.photo('');
        view.search.reset();
        map.fitBounds(bounds);
      },

      // Abrir Painel
      open: function(target) {
        var location = target.getPosition();
        view.search.enable(false);
        this.title(target.title);

        // Obter lista de Places e foto
        getNearBy(location).then(function(response) {
          view.places.items(response);
          var url = selectPhoto(view.places.items());
          view.infoPanel.photo(url);
        }, function(error) {
          alert(error);
        });

        // Obter endereço
        getAddress(location).then(function(response) {
          view.infoPanel.address(response);
        }, function(error) {
          alert(error);
        });

        this.toggle();
      },
    };

    view.mouseOverIcon = function(marker) {
      marker.setIcon(icons.BLUE);
    };

    view.mouseOutIcon = function(marker) {
      marker.setIcon(icons.RED);
    };
  }

  // Mostrar popup InfoWindow no marcador
  function showInfoWindow(marker) {
    infowindow.setContent(capitalize(marker.title));
    infowindow.open(map, marker);
  }

  // Capitalizar string
  function capitalize(str) {
    var lower = str.toLowerCase();
    return lower.replace(/(?:^|\s)\S/g, function(first) {return first.toUpperCase();});
  }

  // Obter lista de Places via NearbySearch service
  function getNearBy(location) {
    var request = {
      location: location,
      radius: '1000',
    };

    return new Promise(function(resolve, reject) {
      service.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          var items = [];
          var matchs = ['bar', 'restaurant', 'food', 'lodging'];
          var googleplaces = filterPlaces(matchs, results);

          googleplaces.forEach(function(place) {
            var name = capitalize(place.name);
            var position = place.geometry.location;
            var url = getUrlPhoto(place.photos);
            var rating = place.rating;

            if (position && position !== location) {
              var marker = createMarker({
                title: name,
                position: place.geometry.location,
                animation: google.maps.Animation.DROP,
                icon: icons.YELLOW,
              });

              items.push({marker: marker, url: url, rating: rating});
            }
          });

          sortItems(items);
          resolve(items);

        } else {
          reject(Error('NearbySearch service error: ' + status));
        }
      });
    });
  }

  // Obter polígono
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

  // Obter endereço via Geocoder
  function getAddress(location) {
    return new Promise(function(resolve, reject) {
      geocoder.geocode({location: location}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            resolve(results[0].formatted_address);
          }
        } else if (staus === google.maps.GeocoderStatus.ZERO_RESULTS) {
          reject(Error('Geocoder status: ' + status));
        }
      });
    });
  }

  // Filtrar Places segundo array de tipos
  function filterPlaces(matchs, results) {
    var filtered = results.filter(function(place) {
      return matchs.some(function(match) {
        return place.types.indexOf(match) !== -1;
      });
    });
    return filtered;
  }

  // Obter URL do primeiro elemento do array
  function getUrlPhoto(placePhotos) {
    if (placePhotos && placePhotos !== 'undefined') {
      return placePhotos[0].getUrl({
        maxWidth: 423,
      });
    }
  }

  // Ordenar alfabeticamente um array de Places
  function sortItems(items) {
    var sorted = items.sort(function(a, b) {
      if (a.marker.title < b.marker.title) {
        return -1;
      } else if (a.marker.title > b.marker.title) {
        return 1;
      }
      return 0;
    });
    return sorted;
  }

  // Selecionar uma foto segundo rating do Places
  function selectPhoto(places) {
    var maxRating = 0;
    var bestPlace = null;
    for (var i = 0; i < places.length; i++) {
      var place = places[i];
      if (place.rating > maxRating && place.url) {
        maxRating = place.rating;
        bestPlace = place;
      }
    }
    return bestPlace.url;
  }

  // Centralizar mapa no marcador, aplicar zoom e animação
  function panToMarker(marker, zoom) {
    map.panTo(marker.position);
    map.setZoom(zoom);
    window.setTimeout(function() {
      marker.setAnimation(null);
    }, 3000);
  }

  // Aplicar estilo do polígono
  function setStyleMap() {
    map.data.setStyle(function(feature) {
      var style = {};
      feature.forEachProperty(function(value, property) {
        style[property] = value;
      });
      return style;
    });
  }

  // Crear marcador
  function createMarker(properties) {
    var marker = new google.maps.Marker(properties);
    marker.setMap(map);
    marker.addListener('click', function() {
      showInfoWindow(marker);
    });
    bounds.extend(marker.position);

    return marker;
  }

  // Inicializar mapa com marcadores iniciais, bounds e polígono
  function initMap() {
    locations.forEach(function(location) {
      var marker = createMarker(location);
      marker.setIcon(icons.RED);
      marker.setVisible(false);
      view.markerList.all.push(marker);
    });

    view.markerList.reset();
    map.setZoom(18);
    map.fitBounds(bounds);
    getPolygon();
  }

  var view = new MapViewModel();
  ko.applyBindings(view);

  initMap();
}

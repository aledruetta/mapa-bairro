function app() {
  'use strict';

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
    {title: 'Plaza del Congreso', position: {lat: -34.609708, lng: -58.390334}},
    {title: 'Obelisco de Buenos Aires', position: {lat: -34.603736, lng: -58.381573}},
    {title: 'Teatro Colón', position: {lat: -34.601139, lng: -58.38315}},
    {title: 'Galerías Pacífico', position: {lat: -34.599196, lng: -58.374867}},
    {title: 'Centro Cultural Néstor Kirchner', position: {lat: -34.603495, lng: -58.369553}},
  ];

  // Icones para marcadores
  var icons = {
    RED: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    BLUE: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    GREEN: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  };

  ////////////////////////////////
  //////// Map View Model ////////
  ////////////////////////////////
  function MapViewModel() {
    var view = this;

    ///// Campo de busca /////
    view.search = {
      text: ko.observable(''),
      visible: ko.observable(true),

      reset: function() {
        this.text('');
        view.markerList.showAll(true);
      },
    };

    ///// Lista lateral /////
    view.markerList = {
      items: ko.observableArray([]),
      visible: ko.observable(true),

      // Oculta todos
      showAll: function(bool) {
        this.items().forEach(function(item) {
          item.setVisible(bool);
        });
      },

      // Filtra items da lista segundo uma string
      filter: function(data, event) {
        // ESC limpa o campo de busca
        if (event.keyCode === 27) {
          view.search.reset();
        } else {
          var search = view.search.text().toLowerCase();
          view.markerList.items().forEach(function(item) {
            var title = item.title.toLowerCase();
            if (title.indexOf(search) !== -1) {
              item.setVisible(true);
            } else {
              item.setVisible(false);
            }
          });
        }
      },

      // Apresenta item selecionado na lista
      click: function() {
        animate(this);
        collapseNavBar();
        view.search.reset();
        view.getPlaces(this);
        view.infoPanel.photo(this.photo);
        view.infoPanel.flickr(true);
        view.infoPanel.address(this.address);
        view.infoPanel.wiki(this.wiki);
        view.infoPanel.open(this.title);
        showInfoWindow(this);
      },
    };

    ///// Seção Places do Painel /////
    view.places = {
      items: ko.observableArray([]),

      // Apresentar informação sobre o Place
      click: function(place) {
        collapseNavBar();
        view.infoPanel.title(place.marker.title);
        view.infoPanel.flickr(false);
        view.infoPanel.photo(place.marker.photo);
        view.infoPanel.address(place.marker.address);
        showInfoWindow(place.marker);
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
      flickr: ko.observable(false),
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
        view.search.reset();
        view.search.visible(true);
        infowindow.close();
        this.title('');
        this.photo('');
        this.wiki('');
        this.address('');
        this.places.reset();
        this.toggle();
        map.fitBounds(bounds);
      },

      // Abrir Painel
      open: function(title) {
        view.search.visible(false);
        view.markerList.visible(false);
        this.visible(true);
        this.title(title);
      },
    };

    // Obter lista de Places e foto do marcador
    view.getPlaces = function(marker) {
      getNearBy(marker).then(function(response) {
        view.places.items(response);
        panToBounds(marker);
      }, function(error) {
        alert(error);
      });
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
  function getNearBy(item) {
    var request = {
      location: item.position,
      radius: '500',
    };

    return new Promise(function(resolve, reject) {
      service.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          var items = [];
          var matchs = ['bar', 'restaurant', 'food', 'lodging'];
          var googleplaces = filterPlaces(matchs, results);

          for (var i = 0; i < googleplaces.length; i++) {
            var place = googleplaces[i];
            var name = capitalize(place.name);
            var position = place.geometry.location;
            var url = getUrlPhoto(place.photos);
            var rating = place.rating;

            if (url && position && position !== item.getPosition()) {
              var marker = createMarker({
                title: name,
                position: place.geometry.location,
                animation: google.maps.Animation.DROP,
                icon: icons.GREEN
              });
              marker.photo = url;

              items.push({
                marker: marker,
                rating: rating
              });

              if (items.length >= 10) {
                break;
              }
            }
          }

          sortItems(items);
          resolve(items);

        } else {
          reject(Error('a API do Google Places não está disponível nesse momento'));
        }
      });
    });
  }

  function getFlickr(title) {
    var endpoint = 'https://api.flickr.com/services/rest/?';
    var query = 'method=%method%&api_key=%api_key%&text=%text%&license=%license%' +
      '&content_type=%content_type%&per_page=%per_page%&format=%format%&sort=%sort%' +
      '&extras=%extras%&nojsoncallback=1';
    var url = endpoint + query
      .replace(/%method%/, 'flickr.photos.search')
      .replace(/%api_key%/, 'e7578e7c5110616e04eb5e44bcc7a892')
      .replace(/%text%/, title + ' Buenos Aires')
      .replace(/%license%/, '1,2,3,4,5,6,7')
      .replace(/%content_type%/, 1)
      .replace(/%per_page%/, 10)
      .replace(/%format%/, 'json')
      .replace(/%sort%/, '')
      .replace(/%extras%/, 'url_m');

    return new Promise(function(resolve, reject) {
      $.ajax({
        url: url,
        dataType: 'json',
      })
      .done(function(response) {
        if (response) {
          for (var i = 0; i < response.photos.photo.length; i++) {
            var item = response.photos.photo[i];
            if (Number(item.height_m) < Number(item.width_m)) {
              resolve(item.url_m);
              break;
            }
          }
        }
      })
      .fail(function() {
        reject(Error('a API do Flickr não está disponível nesse momento!'));
      });
    });
  }

  function getWiki(title) {
    var endpoint = 'https://es.wikipedia.org/w/api.php?';
    var query = 'format=%format%&action=%action%&search=%search%&limit=%limit%&callback=?';
    var url = endpoint + query
      .replace(/%format%/, 'json')
      .replace(/%action%/, 'opensearch')
      .replace(/%search%/, title)
      .replace(/%limit%/, 1);

    return new Promise(function(resolve, reject) {
      $.ajax({
        url: url,
        dataType: 'jsonp',
      })
      .done(function(response) {
        if (response) {
          resolve(response[2][0]);
        } else {
          reject(Error('Wikipedia error'));
        }
      })
      .fail(function() {
        reject(Error('a API da Wikipédia não está disponível nesse momento!'));
      });
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
        } else {
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
  }

  function panToBounds(marker) {
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(marker.getPosition());
    view.places.items().forEach(function(item) {
      bounds.extend(item.marker.getPosition());
    });
    map.fitBounds(bounds);
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
    // Marker inheritance
    var googleMapsMarker = new google.maps.Marker(properties);
    var marker = Object.create(googleMapsMarker);
    var proto = Object.getPrototypeOf(marker);

    proto.filtered = ko.observable(true);
    proto.photo = '';
    proto.address = '';
    proto.wiki = '';
    // Obter informação da Wikipedia
    proto.getWiki = function() {
      var self = this;
      getWiki(this.title).then(function(response) {
        self.wiki = response;
      }, function(error) {
        alert(error);
      });
    };
    // Obter endereço do Geocoding
    proto.getAddress = function() {
      var self = this;
      getAddress(this.position).then(function(response) {
        self.address = response;
      }, function(error) {
        alert(error);
      });
    };
    // Obter foto do Flickr ou Places
    proto.getPhoto = function(origin) {
      var self = this;
      if (origin === 'flickr') {
        getFlickr(this.title).then(function(response) {
          self.photo = response;
        }, function(error) {
          alert(error);
        });
      }
    };
    proto.oldSetVisible = proto.setVisible;
    proto.setVisible = function(bool) {
      this.oldSetVisible(bool);
      this.filtered(bool);
    };

    marker.setMap(map);
    marker.setVisible(true);

    marker.addListener('click', function() {
        panToMarker(this, 15);
        view.infoPanel.flickr(this.photo.match('flickr'));
        view.infoPanel.photo(this.photo);
        view.infoPanel.address(this.address);
        view.infoPanel.wiki(this.wiki);
        view.infoPanel.open(this.title);
        showInfoWindow(this);
        animate(this);
    });

    bounds.extend(marker.position);

    return marker;
  }

  function animate(marker) {
    marker.zIndex = google.maps.Marker.MAX_ZINDEX;
    marker.animation = google.maps.Animation.BOUNCE;
    setTimeout(function() {
      marker.setAnimation(null);
    }, 2000);
  }

  function collapseNavBar() {
    var $navbar = $('.col-aside');
    if ($navbar.hasClass('in')) {
      $navbar.removeClass('in');
    }
  }

  // Inicializar mapa com marcadores iniciais, bounds e polígono
  function initMap() {
    locations.forEach(function(location) {
      var marker = createMarker(location);
      marker.getWiki();
      marker.getAddress();
      marker.getPhoto('flickr');
      marker.setIcon(icons.RED);
      view.markerList.items.push(marker);
    });

    map.setZoom(18);
    map.fitBounds(bounds);
  }

  var view = new MapViewModel();
  ko.applyBindings(view);

  initMap();
}

function googleApiError() {
  'use strict';

  $('.app-view').hide();
  $('.error-img').show();
  setTimeout(function() {
    alert('Google Maps não está disponível nesse momento.');
  }, 100);
}

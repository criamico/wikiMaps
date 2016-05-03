(function(){
    angular.module('gmapsApp', [])
    .controller('MapCtrl', function($scope, $http, $timeout){

        $scope.markersList = [];
        $scope.request = {};
        $scope.panelVisible = false;

        // toggle visibility of panel
        $scope.toggleVisibility =function(){
            $scope.panelVisible = $scope.panelVisible ? false : true;
        }


        /*create the customized infoWindow, opens on click*/
        $scope.addInfoWindow = function(interestPoint) {
            google.maps.event.addListener(interestPoint.marker, 'click', function(){
                $scope.infoWindow.open($scope.map, interestPoint.marker);
                $scope.infoWindow.setContent(interestPoint.content);
            });

        };

        /*function executed when the user clicks on a marker*/
        $scope.openInfoWindow = function(e, selectedMarker){
            e.preventDefault();
            google.maps.event.trigger(selectedMarker, 'click');
            $scope.map.panTo(selectedMarker.position);
        };


        /*Create the markers*/
        $scope.createMarker = function(place){
            /*define the model*/
            var interestPoint = {
                marker: {},
                WikiArticles : [],
                icon: ""
            };

            var image = {
              url: place.icon,
              scaledSize: new google.maps.Size(25, 25)
            };

            interestPoint.icon = place.icon;

            interestPoint.marker = new google.maps.Marker({
                map: $scope.map,
                position: new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng()),
                name: place.name,
                address: place.formatted_address,
                icon: image,
                id: place.id
            });


            $scope.$apply(function() { /*force Angular to update the view*/
                $scope.markersList.push(interestPoint);
            });

             /*create the info window */
            interestPoint.content = '<h2>' + interestPoint.marker.name + '</h2>' + '<div class="infoWindowContent">' + interestPoint.marker.address + '</div>';
            $scope.addInfoWindow(interestPoint);
        };



        // call the wikipedia API
        $scope.getWiki = function(poI){
            var wikidata = {};
            var wikiq = '';
            wikiq = poI.marker.name.replace(/\s/g, "_");
            /*console.log(wikiq);*/

            var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + wikiq + '&format=json&callback=JSON_CALLBACK';

            $http({url: wikiUrl, callback: "JSON_CALLBACK", method: "JSONP"})
                .then(function(LoadedData, status, error){ /*take the first result only*/
                    if (LoadedData.data.query.searchinfo.totalhits > 0){
                        wikidata.title = LoadedData.data.query.search[0].title;
                        wikidata.url = "https://en.wikipedia.org/wiki/" + wikidata.title.replace(/\s/g, "_");
                        wikidata.content = LoadedData.data.query.search[0].snippet;

                        poI.WikiArticles.push(wikidata);

                        poI.content ='<div class="infoWindowContent"><h2>' + poI.marker.name + '</h2>' + poI.marker.address +
                         '</br> <a href='+ poI.WikiArticles[0].url +'>'+ poI.WikiArticles[0].url + '</br></a>'+ poI.WikiArticles[0].content +'</div>';

                        wikidata = {};
                    }
                }, function(LoadedData, status, error){
                        alert("Sorry the wikipedia Query was not successful -status: ", status);

                });

            };


        /*call at init and every time a new query is submitted*/
        $scope.newSearch = function(){
            /*Initialize the map*/
            var mapDiv = document.getElementById('map');
            $scope.infoWindow = new google.maps.InfoWindow({maxWidth: 350});
            $scope.markersList = [];



            /*set map options*/
            var mapOptions = {
                    zoom: 12,
                    center: $scope.current.request.location,
                    mapTypeId: google.maps.MapTypeId.ROADMAP /*HYBRID, SATELLITE, TERRAIN*/
            };

            $scope.map = new google.maps.Map(mapDiv, mapOptions);

            google.maps.event.addDomListener(window, "resize", function() {
               var center = $scope.map.getCenter();
               google.maps.event.trigger($scope.map, "resize");
               $scope.map.setCenter(center);
            });


            var geocoder = new google.maps.Geocoder();
            service = new google.maps.places.PlacesService($scope.map);

            $scope.current.address = $scope.address;
            $scope.current.request.radius = '15000';
            $scope.current.request.query = $scope.query;

             /*Call the Google geocoding service to get lat and long of the searched address*/
            geocoder.geocode({'address': $scope.current.address}, function(results, geostatus) {
                if (geostatus === google.maps.GeocoderStatus.OK) {
                    $scope.current.request.location = results[0].geometry.location;
                    $scope.map.setCenter($scope.current.request.location);

                    /*make a request to google places database to retrieve points of interest*/
                    service.textSearch($scope.current.request, function(results, status){
                        if (status == google.maps.places.PlacesServiceStatus.OK) {
                            /*if successfull, create Markers and display them on the map*/
                            for (var i = 0; i < results.length; i++) {
                                $scope.createMarker(results[i]);
                            }
                            /*for each marker, call wikipedia API and retrieve the first result*/
                            for (var i = 0; i < $scope.markersList.length; i++) {
                                $scope.getWiki($scope.markersList[i]);
                            }
                        } else
                            alert('Sorry, Places query was not successful, status: ' + status);
                    });
                } else
                  alert('Sorry, Geocode query was not successful, status ' + geostatus);
            });



        };


        $scope.current = {
            address: '',
            request: {}
        };

        /*Initialize with a query - default is "Museum in Dublin"*/
        $scope.address = 'Dublin';
        $scope.query = 'Museum';
        $scope.radius = 5000; /*up to 50000 meters*/
        var latlng = new google.maps.LatLng(53.348551, -6.264162);

       /* var request = {
            location: latlng,
            radius: '15000',
            query: $scope.query,
        };
        $scope.current.request = $scope.request;*/

        $scope.current.address = $scope.address;
        $scope.current.request.location = latlng;
        $scope.current.request.radius = $scope.radius;
        $scope.current.request.query =  $scope.query;


        $scope.newSearch();





    });




})();
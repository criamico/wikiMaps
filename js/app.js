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

            console.log(wikiq);


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
                });
            };



        /*call at init and every time a new query is submitted*/
        $scope.newSearch = function(){
            /*Initialize the map*/
            var mapDiv = document.getElementById('map');
            $scope.infoWindow = new google.maps.InfoWindow({maxWidth: 350});
            $scope.markersList = [];


            var mapOptions = {
                    zoom: 12,
                    center: $scope.latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP /*HYBRID, SATELLITE, TERRAIN*/
            };

            $scope.map = new google.maps.Map(mapDiv, mapOptions);

            google.maps.event.addDomListener(window, "resize", function() {
               var center = $scope.map.getCenter();
               google.maps.event.trigger($scope.map, "resize");
               $scope.map.setCenter(center);
            });


            /*make a request to google places database*/
            service = new google.maps.places.PlacesService($scope.map);

            service.textSearch($scope.request, function(results, status){
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        $scope.createMarker(results[i]);
                    }
                    for (var i = 0; i < $scope.markersList.length; i++) {
                        $scope.getWiki($scope.markersList[i]);
                    }
                }
            });

        };

        $scope.latlng = new google.maps.LatLng(53.348551, -6.264162);
        $scope.request = {
            location: $scope.latlng,
            radius: '15000',
            query: 'museum',
        };

        $scope.newSearch();




    });




})();
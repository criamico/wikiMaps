(function(){
    angular.module('gmapsApp', [])
    .controller('MapCtrl', function($scope, $http, $timeout){

        $scope.markersList = [];
        $scope.request = {};
        $scope.panelVisible = false;
        $scope.tab = 1;


        /*select tab*/
        $scope.selectTab = function(newTab){
            $scope.tab = newTab;
        };

        /*check which tab is selected*/
        $scope.tabIsSelected = function(newTab){
            return $scope.tab === newTab;
        };


        $scope.IsMobile = function(){
            return (window.innerWidth < 800) ? true : false;

        }

        // When query is empty, hide the whole panel, show it again when a query is submitted
        $scope.panelHidden = function(){
                return $scope.current.request.query !== '' ? false : true;
            };




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
            interestPoint.content = '<div class="infoWindowContent"><h2>' + interestPoint.marker.name + '</h2>' + interestPoint.marker.address + '</div>';
            $scope.addInfoWindow(interestPoint);
        };





        // call the wikipedia API
        $scope.getWiki = function(poI){
            var wikidata = {};
            var wikiq = '';
            wikiq = escape(poI.marker.name);
           /* console.log(wikiq);*/

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

            /*make a request to google places database to retrieve points of interest*/
            $scope.getPlaces = function(){

                service = new google.maps.places.PlacesService($scope.map);
                service.textSearch($scope.current.request, function(results, status){
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        /*if successful, create Markers and display them on the map*/
                        for (var i = 0; i < results.length; i++) {
                            $scope.createMarker(results[i]);
                        }
                        /*for each marker, call wikipedia API and retrieve the first result*/
                        for (var i = 0; i < $scope.markersList.length; i++) {
                            $scope.getWiki($scope.markersList[i]);
                        }
                        $scope.selectTab(2);
                    } else
                        alert('Sorry, Places query was not successful, status: ' + status);
                });
            };



        /*call at init and every time a new query is submitted*/
        $scope.newSearch = function(){
            /*Initialize the map*/
            var mapDiv = document.getElementById('map');
            $scope.infoWindow = new google.maps.InfoWindow({maxWidth: 320});
            $scope.markersList = [];

            $scope.current.address = $scope.address;
            $scope.current.request.radius = $scope.radius;
            $scope.current.request.query = $scope.query;

            /*set map options*/
            var mapOptions = {
                    zoom: 12,
                    center: $scope.current.request.location,
                    mapTypeId: google.maps.MapTypeId.ROADMAP /*HYBRID, SATELLITE, TERRAIN*/,
                    mapTypeControlOptions: {
                        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                        position: google.maps.ControlPosition.RIGHT_CENTER
                    },
                    zoomControl: !$scope.IsMobile(), /*shows controls only for larger screens*/
                    zoomControlOptions: {
                        position: google.maps.ControlPosition.RIGHT_CENTER
                    },
                    streetViewControl: !$scope.IsMobile(), /*shows pegman only for larger screens*/
                    streetViewControlOptions: {
                        position: google.maps.ControlPosition.RIGHT_CENTER
                    },
            };

            $scope.map = new google.maps.Map(mapDiv, mapOptions);

            google.maps.event.addDomListener(window, "resize", function() {
               var center = $scope.map.getCenter();
               google.maps.event.trigger($scope.map, "resize");
               $scope.map.setCenter(center);
            });

            var geocoder = new google.maps.Geocoder();

             /*Call the Google geocoding service to get lat and long for the searched address*/
            geocoder.geocode({'address': $scope.current.address}, function(results, geostatus) {
                if (geostatus === google.maps.GeocoderStatus.OK) {
                    $scope.current.request.location = results[0].geometry.location;
                    $scope.map.setCenter($scope.current.request.location);

                    /*Retrieve list of places*/
                    if ($scope.current.request.query !== '')
                        $scope.getPlaces();


                } else
                  alert('Sorry, Geocode query was not successful, status ' + geostatus);
            });



        };



        // Try to get user location using ipinfo service at loading. If fails, the user is placed at a default location (Dublin)
        $scope.getIpInfo = function(){
            $http({
                method: 'GET',
                url: 'http://ipinfo.io/',
                datatype: 'json'
            })
            .then(function(Ipdata, status, headers, config){
                $scope.address = Ipdata.data.city;
                $scope.newSearch();


                }, function(Ipdata, status, headers, config){
                       console.log("Retrieving ip info was not successful. We are placing you in a default location");
                       $scope.address = 'Dublin';
                       $scope.newSearch();
            });

        };



        $scope.current = {
            address: '',
            request: {}
        };


        /*Initialize with a query - default is "Museum in Dublin"*/
        /*$scope.address = 'Dublin';*/
        $scope.query =  '';
        $scope.radius = 1500; /*up to 50000 meters*/

        $scope.getIpInfo();
        /*$scope.newSearch();*/









    });




})();
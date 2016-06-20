(function(){
    'use strict';
    // call the wikipedia API
    angular.module('gmapsApp')
    .factory('wikiService', ['$http', function($http) {
        return {
            getWiki: function(poI){
                var wikidata = {};
                var wikiq = '';
                wikiq = escape(poI.marker.name);

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

            }


        }



    }]);
})();
(function(){
    'use strict';
    // Try to get user location using ipinfo service at loading. If fails, the user is placed at a default location (Dublin)
    angular.module('gmapsApp')
    .factory('geoIpService', ['$http', '$q', function($http, $q) {
        return {
            getIpInfo: function(){
                //$http is asynchronous, promises ($q) are needed
                var deferred = $q.defer();

                $http({
                    method: 'GET',
                    url: 'http://ipinfo.io/',
                    datatype: 'json'
                })
                .then(function(Ipdata, status, headers, config){
                    deferred.resolve(Ipdata.data);

                    }, function(Ipdata, status, headers, config){
                           console.log("Retrieving ip info was not successful. We are placing you in a default location");
                           deferred.reject(Ipdata.data);
                });
                return deferred.promise;
            }
        };
    }]);
})();
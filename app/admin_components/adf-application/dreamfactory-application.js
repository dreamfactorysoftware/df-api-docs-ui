'use strict';


angular.module('dfApplication', ['dfUtility', 'dfUserManagement', 'ngResource'])

    .run([function () {

    }])

    .service('dfApplicationData', ['$q', '$http', 'INSTANCE_URL', 'dfObjectService', 'UserDataService', 'dfSystemData', '$rootScope', '$location', function ($q, $http, INSTANCE_URL, dfObjectService, UserDataService, dfSystemData, $rootScope, $location) {

        var dfApplicationObj = {
            apis: {}
        };

        function _getApiData(apis, forceRefresh) {
            var deferred = $q.defer();

            var promises = apis.map(function(api) {
                return _loadOne(api, forceRefresh);
            });

            $q.all(promises).then(
                function (response) {
                    deferred.resolve(response);
                },
                function (response) {
                    deferred.reject(response);
                }
            );

            return deferred.promise;
        }

        function _loadOne(api, forceRefresh) {

            var params, options;
            var debugLevel = 0;
            var deferred = $q.defer();

            if (forceRefresh === true) {
                delete dfApplicationObj.apis[api];
            }
            if (dfApplicationObj.apis.hasOwnProperty(api)) {
                if (debugLevel >= 1) console.log('_loadOne(' + api + '): from cache', dfApplicationObj.apis[api]);
                if (debugLevel >= 2) console.log('_loadOne(' + api + '): dfApplicationObj', dfApplicationObj);
                deferred.resolve(dfApplicationObj.apis[api]);
            } else {
                params = {};
                options = {'url': INSTANCE_URL.url + api};
                dfSystemData.resource(options).get(params).$promise.then(
                    function (response) {
                        dfApplicationObj.apis[api] = response;
                        if (debugLevel >= 1) console.log('_loadOne(' + api + ',' +  !!forceRefresh + '): ok from server', dfApplicationObj.apis[api]);
                        if (debugLevel >= 2) console.log('_loadOne(' + api + ',' +  !!forceRefresh + '): dfApplicationObj', dfApplicationObj);
                        deferred.resolve(dfApplicationObj.apis[api]);
                    }, function (error) {
                        if (debugLevel >= 1) console.log('_loadOne(' + api + ',' +  !!forceRefresh + '): error from server', error);
                        if (debugLevel >= 2) console.log('_loadOne(' + api + ',' +  !!forceRefresh + '): dfApplicationObj', dfApplicationObj);
                        deferred.reject(error.data);
                    });
            }

            return deferred.promise;
        }

        // Load a single api synchronously. It would be good to get rid of this
        // but system config relies on it for now. It does not support params, options, or aliasing.

        function _getApiDataSync(api, forceRefresh) {

            var debugLevel = 0;

            if (forceRefresh === true) {
                delete dfApplicationObj.apis[api];
            }
            if (dfApplicationObj.apis.hasOwnProperty(api)) {
                if (debugLevel >= 1) console.log('_getApiDataSync(' + api + '): from cache', dfApplicationObj.apis[api]);
                if (debugLevel >= 2) console.log('_getApiDataSync(' + api + '): dfApplicationObj', dfApplicationObj);
            } else {
                var xhr, currentUser = UserDataService.getCurrentUser();

                if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
                    xhr = new XMLHttpRequest();
                } else {// code for IE6, IE5
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }

                xhr.open("GET", INSTANCE_URL.url + '/system/' + api, false);
                xhr.setRequestHeader("X-DreamFactory-API-Key", "6498a8ad1beb9d84d63035c5d1120c007fad6de706734db9689f8996707e0f7d");
                if (currentUser && currentUser.session_token) {
                    xhr.setRequestHeader("X-DreamFactory-Session-Token", currentUser.session_token);
                }
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send();

                if (xhr.readyState == 4 && xhr.status == 200) {
                    dfApplicationObj.apis[api] = angular.fromJson(xhr.responseText);
                    if (debugLevel >= 1) console.log('_getApiDataSync(' + api + ',' +  !!forceRefresh + '): ok from server', dfApplicationObj.apis[api]);
                    if (debugLevel >= 2) console.log('_getApiDataSync(' + api + ',' +  !!forceRefresh + '): dfApplicationObj', dfApplicationObj);
                } else {
                    if (debugLevel >= 1) console.log('_getApiDataSync(' + api + ',' +  !!forceRefresh + '): error from server', xhr.responseText);
                    if (debugLevel >= 2) console.log('_getApiDataSync(' + api + ',' +  !!forceRefresh + '): dfApplicationObj', dfApplicationObj);
                }
            }

            return dfApplicationObj.apis[api];
        }

        // Resets the dfApplicationObj to initial state
        function _resetApplicationObj() {

            dfApplicationObj = {
                apis: {}
            };
        }

        return {

            // Returns dfApplicationObj that is stored in the service
            getApplicationObj: function () {

                return dfApplicationObj;
            },

            // Resets dfApplicationObj to initial state
            resetApplicationObj: function() {

                _resetApplicationObj();
            },

            // get api data by name
            getApiDataFromCache: function (api) {

                // temporary for backwards compatibility
                var result = undefined;

                // check for data
                if (dfApplicationObj.apis.hasOwnProperty(api)) {

                    // return if it exists
                    if (dfApplicationObj.apis[api].resource) {
                        result = dfApplicationObj.apis[api].resource;
                    }
                    else {
                        result = dfApplicationObj.apis[api];
                    }
                }
                return result;
            },

            // delete api data by name
            deleteApiDataFromCache: function (api) {

                // check for data
                if (dfApplicationObj.apis.hasOwnProperty(api)) {

                    delete dfApplicationObj.apis[api];
                }
            },

            getApiData: function(apis, forceRefresh) {
                return _getApiData(apis, forceRefresh);
            },

            getApiDataSync: function(api, forceRefresh) {
                return _getApiDataSync(api, forceRefresh);
            },

            getQueryParameter: function (key) {
                key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&");
                var match = window.location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
                var result = match && decodeURIComponent(match[1].replace(/\+/g, " "));
                if (result) {
                    return result;
                }
                return '';
            }
        };
    }])

    .service('dfSystemData', ['INSTANCE_URL', '$resource', 'dfObjectService', function (INSTANCE_URL, $resource, dfObjectService) {

        return {

            resource: function (options) {

                options = options || {};

                var defaults = {
                    headers: ''
                };

                options = dfObjectService.mergeObjects(options, defaults);
                var url = options.url || INSTANCE_URL.url + '/system/:api/:id';
                var queryParams = options.queryParams || { api: '@api', id: '@id' };


                // Return a resource for our service so we can just call the operation we want.
                return $resource(url, queryParams, {

                    get: {
                        method: 'GET',
                        headers: options.headers
                    },
                    post: {
                        method: 'POST',
                        headers: options.headers
                    },
                    put: {
                        method: 'PUT',
                        headers: options.headers
                    },
                    patch: {
                        method: 'PATCH',
                        headers: options.headers
                    },
                    delete: {
                        method: 'DELETE',
                        headers: options.headers
                    }
                });
            }
        };
    }])

    // Intercepts outgoing http calls.  Checks for valid session.  If 401 will trigger a pop up login screen.
    .factory('httpValidSession', ['$q', '$rootScope', 'INSTANCE_URL', '$injector', function ($q, $rootScope, INSTANCE_URL, $injector) {

        var refreshSession = function (reject) {

            var $http = $injector.get('$http');
            var UserDataService = $injector.get('UserDataService');
            var user = UserDataService.getCurrentUser();
            var deferred = $injector.get('$q').defer();

            var url = user.is_sys_admin ? '/system/admin/session' : '/user/session';

            $http({
                method: 'PUT',
                url: INSTANCE_URL.url + url
            }).then(function (result) {
                UserDataService.setCurrentUser(result.data);
                retry(reject.config, deferred);
            }, function () {
                newSession(reject, deferred);
            });

            return deferred.promise;
        };

        var retry = function (config, deferred) {

            var request = {
                method: config.method,
                url: config.url
            };
            if (config.params) {
                request.params = config.params;
            }
            if (config.data) {
                request.data = config.data;
            }
            if (config.transformRequest) {
                request.transformRequest = config.transformRequest;
            }
            var $http = $injector.get('$http');
            $http(request).then(deferred.resolve, deferred.reject);
            return deferred.promise;
        };

        var newSession = function (reject, deferred) {

            var UserDataService = $injector.get('UserDataService');
            UserDataService.unsetCurrentUser();

            deferred = deferred || $injector.get('$q').defer();

            $rootScope.$$childHead.openLoginWindow(reject);
            $rootScope.$on('user:login:success', function () {
                retry(reject.config, deferred);
            });

            return deferred.promise;
        };

        return {

            request: function (config) {

                return config;
            },

            requestError: function (reject) {

                return $q.reject(reject);
            },

            response: function (response) {

                return response;
            },

            responseError: function (reject) {

                if (reject.config.url.indexOf('/session') === -1) {
                    var UserDataService = $injector.get('UserDataService');
                    var currentUser = UserDataService.getCurrentUser();
                    if (currentUser) {
                        if (reject.status === 401 || (reject.data && reject.data.error && reject.data.error.code === 401)  ||
                            ((reject.status === 403 || (reject.data && reject.data.error && reject.data.error.code === 403)) && reject.data.error.message.indexOf('The token has been blacklisted') >= 0)) {

                            if (reject.data.error.message.indexOf('Token has expired') >= 0) {
                                //  refresh session
                                return refreshSession(reject);
                            }
                            else {
                                // new session
                                return newSession(reject);
                            }
                        }
                    }
                }
                return $q.reject(reject);
            }
        };
    }]);
'use strict';

/**
 *
 * Main module of the application.
 */
angular
    .module('dreamfactoryApidocsApp', [
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'dfUtility',
        'dfSystemConfig',
        'dfUserManagement',
        'dfServices',
        'dfSwaggerUI'
    ])

    // Set application version number
    .constant('APP_VERSION', '1.0.1')

    // Set API key for this application, also used by df-swagger-ui
    .constant('APP_API_KEY', '36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88')

    .constant('INSTANCE_URL', '')

    // Set global header for calls made to DreamFactory instance
    .config(['$httpProvider', 'APP_API_KEY', function($httpProvider, APP_API_KEY) {

        $httpProvider.defaults.headers.common['X-Dreamfactory-API-Key'] = APP_API_KEY;
        $httpProvider.interceptors.push('httpValidSession');
    }])

    // Configure main app routing rules
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/login', {
                controller: 'LoginCtrl',
                templateUrl: 'views/login.html',
                resolve: {

                    checkLoginRoute: ['UserDataService', '$location', function (UserDataService, $location) {

                        var currentUser = UserDataService.getCurrentUser();

                        if (currentUser && currentUser.session_token) {
                            $location.url('/services');
                        }
                    }]
                }
            })
            .when('/logout', {
                templateUrl: 'views/logout.html',
                controller: 'LogoutCtrl'
            })
            .otherwise({
                controller: 'LoginCtrl',
                templateUrl: 'views/login.html',
                resolve: {

                    checkLoginRoute: ['UserDataService', '$location', function (UserDataService, $location) {

                        var currentUser = UserDataService.getCurrentUser();

                        if (currentUser && currentUser.session_token) {
                            $location.url('/services');
                        }
                    }]
                }
            });
    }])

    // Intercepts outgoing http calls.  Checks for valid session.  If 401 will trigger a pop up login screen.
    .factory('httpValidSession', ['$q', '$rootScope', '$location', 'INSTANCE_URL', '$injector', function ($q, $rootScope, $location, INSTANCE_URL, $injector) {

        var putSession = function (reject) {

            var $http = $injector.get('$http');
            var UserDataService = $injector.get('UserDataService');
            var user = UserDataService.getCurrentUser();
            var deferred = $injector.get('$q').defer();

            var url = user.is_sys_admin ? '/api/v2/system/admin/session' : '/api/v2/user/session';

            $http({
                method: 'PUT',
                url: INSTANCE_URL + url
            }).then(function (result) {
                UserDataService.setCurrentUser(result.data);
                retry(reject.config, deferred);
            }, function () {
                refreshSession(reject, deferred)
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

        var refreshSession = function (reject, deferred) {

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

                if (reject.status === 400 || reject.data.error.code === 400 ||
                    reject.status === 401 || reject.data.error.code === 401 ||
                    reject.status === 403 || reject.data.error.code === 403) {
                    if (reject.config.url.indexOf('/session') === -1) {
                        if (reject.data.error.message === 'Token has expired') {
                            //  put session
                            return putSession(reject);
                        }
                        else {
                            // refresh session
                            return refreshSession(reject);
                        }
                    }
                }
                return $q.reject(reject);
            }
        };
    }]);
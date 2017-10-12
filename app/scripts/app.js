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
            .when('/logout', {
                controller: 'LogoutCtrl',
                templateUrl: 'views/logout.html'
            })
            .otherwise({
                controller: 'LoginCtrl',
                templateUrl: 'views/login.html',
                resolve: {

                    checkLoginRoute: ['$q', 'UserDataService', '$location', function ($q, UserDataService, $location) {

                        var deferred = $q.defer();
                        var currentUser = UserDataService.getCurrentUser();

                        // we're trying to go to login
                        // if we have a valid session then no need to go to login
                        if (currentUser && currentUser.session_id) {
                            $location.url('/services');
                            deferred.reject();
                        } else {
                            deferred.resolve();
                        }
                        return deferred.promise;
                    }]
                }
            });
    }])

    // Intercepts outgoing http calls.  Checks for valid session.  If 401 will trigger a pop up login screen.
    .factory('httpValidSession', ['$q', '$rootScope', '$location', 'INSTANCE_URL', '$injector', function ($q, $rootScope, $location, INSTANCE_URL, $injector) {

        var refreshSession = function (reject) {

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
                    if (reject.status === 400 || (reject.data && reject.data.error && reject.data.error.code === 400) ||
                        reject.status === 401 || (reject.data && reject.data.error && reject.data.error.code === 401) ||
                        ((reject.status === 403 || (reject.data && reject.data.error && reject.data.error.code === 403)) && reject.data.error.message.indexOf('The token has been blacklisted') >= 0)) {

                        if (reject.data.error.message === 'Token has expired') {
                            //  refresh session
                            return refreshSession(reject);
                        }
                        else {
                            // new session
                            return newSession(reject);
                        }
                    }
                }
                return $q.reject(reject);
            }
        };
    }]);
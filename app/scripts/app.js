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
        'dfServices',
        'dfSwaggerUI'
    ])

    // Set application version number
    .constant('APP_VERSION', '1.0.0')

    // Set API key for this application, also used by df-swagger-ui
    .constant('APP_API_KEY', '36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88')

    // Set global header for calls made to DreamFactory instance
    .config(['$httpProvider', 'APP_API_KEY', function($httpProvider, APP_API_KEY) {

        $httpProvider.defaults.headers.common['X-Dreamfactory-API-Key'] = APP_API_KEY;
    }])
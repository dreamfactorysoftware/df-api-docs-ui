/**
 * This file is part of DreamFactory (tm)
 *
 * http://github.com/dreamfactorysoftware/dreamfactory
 * Copyright 2012-2017 DreamFactory Software, Inc. <dspsupport@dreamfactory.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';


angular.module('dfSwaggerUI', ['ngRoute', 'dfUtility'])
    .constant('MOD_SWAGGER_UI_ROUTER_PATH', '/swagger-ui')
    .constant('MOD_SWAGGER_UI_ASSET_PATH', 'admin_components/adf-swagger-ui/')
    .config(['$routeProvider', 'MOD_SWAGGER_UI_ROUTER_PATH', 'MOD_SWAGGER_UI_ASSET_PATH',
        function ($routeProvider, MOD_SWAGGER_UI_ROUTER_PATH, MOD_SWAGGER_UI_ASSET_PATH) {
            $routeProvider
                .when(MOD_SWAGGER_UI_ROUTER_PATH, {
                    templateUrl: MOD_SWAGGER_UI_ASSET_PATH + 'views/main.html',
                    controller: 'SwaggerUiCtrl'
                });
        }])
    .run(['$templateCache', function ($templateCache) {

    }])
    .controller('SwaggerUiCtrl', ['$scope', function($scope) {

    }])

    .directive('dfSwagger', ['MOD_SWAGGER_UI_ASSET_PATH', 'INSTANCE_URL', 'APP_API_KEY', 'UserDataService', function(MOD_SWAGGER_UI_ASSET_PATH, INSTANCE_URL, APP_API_KEY, UserDataService) {

        return {
            restrict: 'E',
            scope: {
                serviceName: "="
            },
            templateUrl: MOD_SWAGGER_UI_ASSET_PATH + 'views/swagger.html',
            link: function( scope, elem, attrs ) {

                var sessionToken = "", user = UserDataService.getCurrentUser();
                if (user && user.session_token) {
                    sessionToken = user.session_token;
                }

                // Build a system
                var ui = SwaggerUIBundle({
                    url: INSTANCE_URL.url + "/api_docs/" + scope.serviceName,
                    requestInterceptor: function(request) {
                        var headers = request.headers || {};
                        headers['X-DreamFactory-API-Key'] = APP_API_KEY;
                        headers['X-DreamFactory-Session-Token'] = sessionToken;
                        return request;
                    },
                    validatorUrl: null,
                    dom_id: '#swagger-ui',
                    tagsSorter: "alpha",
                    operationsSorter: "alpha", // or "method"
                    defaultModelRendering: "example", // or "model"
                    docExpansion: "list",
                    displayOperationId: false,
                    displayRequestDuration: false,
                    filter: false,
                    deepLinking: false,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout"
                });
            }
        };
    }]);
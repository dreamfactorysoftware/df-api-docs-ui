/**
 * This file is part of DreamFactory (tm)
 *
 * http://github.com/dreamfactorysoftware/dreamfactory
 * Copyright 2012-2014 DreamFactory Software, Inc. <support@dreamfactory.com>
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

                var url = INSTANCE_URL + "/api/v2/api_docs/" + scope.serviceName;

                scope.server = INSTANCE_URL + '/df-api-docs-ui/bower_components/df-swagger-ui/dist/index.html';

                scope.server +=
                    "?api_key=" + encodeURIComponent(APP_API_KEY) +
                    "&url=" + encodeURIComponent(url) +
                    "&session_token=" + encodeURIComponent(UserDataService.getCurrentUser().session_token);
            }
        };
    }])




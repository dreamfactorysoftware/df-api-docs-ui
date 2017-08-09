'use strict';

/**
 * @ngdoc function
 * @name dreamfactoryApidocsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dreamfactoryApidocsApp
 */
angular.module('dreamfactoryApidocsApp')

    // MainCtrl is the parent controller of everything.
    .controller('MainCtrl', ['$scope', '$location',
        function ($scope, $location) {

            $scope.title = 'DreamFactory API Docs';

            $location.url("/services");
        }
    ]);
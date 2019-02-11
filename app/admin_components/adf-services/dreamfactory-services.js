'use strict';


angular.module('dfServices', ['ngRoute', 'dfUtility'])
    .constant('MOD_SERVICES_ROUTER_PATH', '/services')
    .constant('MOD_SERVICES_ASSET_PATH', 'admin_components/adf-services/')
    .config(['$routeProvider', 'MOD_SERVICES_ROUTER_PATH', 'MOD_SERVICES_ASSET_PATH',
        function ($routeProvider, MOD_SERVICES_ROUTER_PATH, MOD_SERVICES_ASSET_PATH) {
            $routeProvider
                .when(MOD_SERVICES_ROUTER_PATH, {
                    templateUrl: MOD_SERVICES_ASSET_PATH + 'views/main.html',
                    controller: 'ServicesCtrl'
                });
        }])

    .run(['$templateCache', function ($templateCache) {


    }])

    .controller('ServicesCtrl', ['$rootScope', '$scope', '$location', 'dfApplicationData', 'UserDataService', 'dfNotify', function ($rootScope, $scope, $location, dfApplicationData, UserDataService, dfNotify) {

        $scope.adminApp = dfApplicationData.getQueryParameter("admin_app");
        $scope.apiData = null;
        $scope.services = null;
        $scope.filteredServices = null;
        $scope.selectedGroup = {"name": null};
        $scope.selectedType = {"name": null};
        $scope.searchText = {"value": null};

        // Set empty search result message
        var details = "";
        var user = UserDataService.getCurrentUser();
        if (!user) {
            details = 'You are not logged in. The default role for the API Docs app will determine which active services you have access to.';
        } else if (!user.is_sys_admin) {
            details = 'You are logged in as a non-admin user. Your assigned role for the API Docs app will determine which active services you have access to.';
        } else if (user.is_sys_admin && user.role_id) {
            details = 'You are logged in as a restricted admin. Your assigned role for the API Docs app will g which active services you have access to.';
        } else {
            details = "You are logged in as an admin user which allows access to all active services.";
        }
        $scope.emptySearchResult = {
            title: 'There are no active services that match your search criteria!',
            text: details
        };

        $scope.saveAsFile = function (data, filename) {

            if (!data) {
                return;
            }

            if (!filename) {
                filename = 'download.json';
            }

            if (typeof data === 'object') {
                data = JSON.stringify(data, undefined, 2);
            }

            var blob = new Blob([data], {type: 'text/json'});

            // FOR IE:

            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(blob, filename);
            }
            else{
                var e = document.createEvent('MouseEvents'),
                    a = document.createElement('a');

                a.download = filename;
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
                e.initEvent('click', true, false, window,
                    0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
            }
        };

        $scope.downloadAllServiceDef = function () {

            $scope.dataLoading = true;

            var apis = ["/api_docs"];

            dfApplicationData.getApiData(apis).then(
                function (response) {
                    $scope.saveAsFile(response[0], "all_api_docs.json");
                },
                function (error) {
                    var messageOptions = {
                        module: 'Api Error',
                        type: 'error',
                        provider: 'dreamfactory',
                        message: {"data": error}
                    };
                    dfNotify.error(messageOptions);
                }
            ).finally(function () {
                $scope.dataLoading = false;
            });
        };

        $scope.downloadSelectedServiceDef = function () {

            $scope.dataLoading = true;

            var apis = ["/api_docs/" + $scope.currentEditService.name];

            dfApplicationData.getApiData(apis).then(
                function (response) {
                    $scope.saveAsFile(response[0], $scope.currentEditService.name + "_api_docs.json");
                },
                function (error) {
                    var messageOptions = {
                        module: 'Api Error',
                        type: 'error',
                        provider: 'dreamfactory',
                        message: {"data": error}
                    };
                    dfNotify.error(messageOptions);
                }
            ).finally(function () {
                $scope.dataLoading = false;
            });
        };

        $scope.dataLoading = true;

        $scope.loadTabData = function() {

            var apis = [""];

            dfApplicationData.getApiData(apis).then(
                function (response) {
                    var newApiData = {};
                    apis.forEach(function(value, index) {
                        newApiData[value] = response[index].resource ? response[index].resource : response[index];
                    });
                    $scope.apiData = newApiData;

                },
                function (error) {
                    var messageOptions = {
                        module: 'Api Error',
                        type: 'error',
                        provider: 'dreamfactory',
                        message: {"data": error}
                    };
                    dfNotify.error(messageOptions);
                }
            ).finally(function () {
                $scope.dataLoading = false;
            });
        }();
    }])

    .directive('dfManageServices', ['$rootScope', 'MOD_SERVICES_ASSET_PATH', 'dfApplicationData', 'dfNotify', function ($rootScope, MOD_SERVICES_ASSET_PATH, dfApplicationData, dfNotify) {

        return {
            restrict: 'E',
            scope: false,
            templateUrl: MOD_SERVICES_ASSET_PATH + 'views/df-manage-services.html',
            link: function (scope) {


                var ManagedService = function (record) {

                    return {
                        __dfUI: {
                            selected: false
                        },
                        record: record
                    };
                };

                scope.currentEditService = null;

                scope.fields = [

                    {
                        name: 'name',
                        label: 'Service Name',
                        active: true
                    },
                    {
                        name: 'label',
                        label: 'Label',
                        active: true
                    },
                    {
                        name: 'description',
                        label: 'Description',
                        active: true
                    },
                    {
                        name: 'group',
                        label: 'Group',
                        active: true
                    },
                    {
                        name: 'type_label',
                        label: 'Type',
                        active: true
                    }
                ];

                scope.order = {
                    orderBy: 'name',
                    orderByReverse: false
                };

                scope.editService = function (service) {

                    // make sure we have a valid session before passing control to swagger
                    // also checks for services with no paths defined in service definition
                    var apis = ["/api_docs/" + service.name];

                    dfApplicationData.getApiData(apis).then(
                        function (response) {
                            if (Array.isArray(response) &&
                                Array.isArray(response[0].paths) &&
                                response[0].paths.length === 0) {
                                var messageOptions = {
                                    module: 'Api Error',
                                    type: 'error',
                                    provider: 'dreamfactory',
                                    message: "The service '" + service.name + "' has no API docs."
                                };
                                dfNotify.error(messageOptions);
                            }
                            else {
                                dfNotify.clear();
                                scope.currentEditService = service;
                            }
                        },
                        function (error) {
                            var messageOptions = {
                                module: 'Api Error',
                                type: 'error',
                                provider: 'dreamfactory',
                                message: {"data": error}
                            };
                            dfNotify.error(messageOptions);
                        }
                    );
                };

                scope.orderOnSelect = function (fieldObj) {

                    var orderedBy = scope.order.orderBy;

                    if (orderedBy === fieldObj.name) {
                        scope.order.orderByReverse = !scope.order.orderByReverse;
                    } else {
                        scope.order.orderBy = fieldObj.name;
                        scope.order.orderByReverse = false;
                    }
                };

                scope.$watch('apiData',  function (newValue) {

                    if (newValue) {

                        // build service list

                        var services = [];

                        angular.forEach(scope.apiData[''].services, function (service) {
                            if (service.name !== 'api_docs') {
                                services.push(new ManagedService(service));
                            }
                        });

                        scope.services = services;
                        scope.filteredServices = services;

                        // build group/type data

                        var group, groups = {};

                        angular.forEach(scope.apiData[''].service_types, function (service) {
                            group = service.group;
                            if (group !== 'API Doc' ) {
                                if (!groups.hasOwnProperty(group)) {
                                    groups[group] = [];
                                }
                                groups[group].push({"name": service.name, "label": service.label})
                            }
                        });

                        scope.serviceGroups = groups;

                        // get group and type label from service_type
                        angular.forEach(scope.services, function (service) {
                            angular.forEach(scope.serviceGroups, function (value, key) {
                                angular.forEach(value, function (type) {
                                    if (service.record.type === type.name) {
                                        service.record.group = key;
                                        service.record.type_label = type.label;
                                    }
                                });
                            });
                        });
                    }
                });

                scope.strcmp = function(s1, s2) {

                    // ignore case
                    return s1.toLowerCase().indexOf(s2.toLowerCase()) >= 0;
                };

                scope.applyFilter = function() {

                    if (scope.services) {
                        scope.filteredServices = scope.services.filter(function(service) {
                            var groupMatch = ((scope.selectedGroup.name === null) || (scope.selectedGroup.name === service.record.group));
                            var typeMatch = ((scope.selectedType.name === null) || (scope.selectedType.name === service.record.type));
                            var searchMatchName = ((!scope.searchText.value) || (scope.searchText.value && service.record.name && scope.strcmp(service.record.name, scope.searchText.value)));
                            var searchMatchLabel = ((!scope.searchText.value) || (scope.searchText.value && service.record.label && scope.strcmp(service.record.label, scope.searchText.value)));
                            var searchMatchDesc = ((!scope.searchText.value) || (scope.searchText.value && service.record.description && scope.strcmp(service.record.description, scope.searchText.value)));
                            return groupMatch && typeMatch && (searchMatchName || searchMatchLabel || searchMatchDesc);
                        });
                    }
                };

                scope.$watchCollection('selectedGroup',  function (newValue) {

                        if (newValue) {
                            scope.selectedType = {"name": null};
                            scope.applyFilter();
                        }
                    });

                scope.$watchCollection('selectedType',  function (newValue) {

                    if (newValue) {
                        scope.applyFilter();
                    }
                });

                scope.$watchCollection('searchText',  function (newValue) {

                    if (newValue) {
                        scope.applyFilter();
                    }
                });
            }
        };
    }])

    .directive('dfServiceDetails', ['MOD_SERVICES_ASSET_PATH', function (MOD_SERVICES_ASSET_PATH) {

        return {

            restrict: 'E',
            scope: false,
            templateUrl: MOD_SERVICES_ASSET_PATH + 'views/df-service-details.html',
            link: function (scope) {

                scope.closeService = function () {

                    scope.$parent.currentEditService = null;
                };
            }
        };
    }])

    .directive('dfApiDocsLoading', [function() {
        return {
            restrict: 'E',
            template: "<div class='col-lg-12' ng-if='dataLoading'><span style='display: block; width: 100%; text-align: center; color: #A0A0A0; font-size: 50px; margin-top: 100px'><i class='fa fa-refresh fa-spin'></i></div>"
        };
    }]);
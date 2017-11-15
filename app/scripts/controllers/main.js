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
    .controller('MainCtrl', ['$scope', 'dfApplicationData', '$location', 'UserDataService', 'dfIconService', '$animate',
        function ($scope, dfApplicationData, $location, UserDataService, dfIconService, $animate) {

            // workaround for issue that causes flickering when loading templates
            // https://github.com/angular/angular.js/issues/14015
            $animate.enabled(false);

            $scope.title = 'DreamFactory API Docs';

            $scope.adminApp = dfApplicationData.getQueryParameter("admin_app");
            if ($scope.adminApp) {
                $scope.$parent.bodyStyle = {'padding-top':'0px'};
            } else {
                $scope.$parent.bodyStyle = {'padding-top':'50px'};
            }

            $scope.currentUser = UserDataService.getCurrentUser();

            $scope.topLevelLinks = [

                {
                    path: '#/login',
                    target: null,
                    label: 'Login',
                    name: 'login',
                    icon: dfIconService().login,
                    show: false
                },
                {
                    path: null,
                    target: null,
                    label: UserDataService.getCurrentUser().name,
                    name: 'user',
                    icon: dfIconService().user,
                    show: false,
                    subLinks: [
                        {
                            path: '#/logout',
                            target: null,
                            label: 'Logout',
                            name: 'logout',
                            icon: null,
                            show: false
                        }
                    ]
                }
            ];

            $scope.topLevelNavOptions = {
                links: $scope.topLevelLinks
            };

            // Sets links for navigation
            $scope._setActiveLinks = function(linksArr, activeLinksArr) {

                var found, i;

                angular.forEach(linksArr, function(link) {

                    found = false;

                    for (i = 0; i < activeLinksArr.length; i++) {

                        if (link.name === activeLinksArr[i]) {

                            found = true;
                            break;
                        }
                    }

                    link.show = found;
                });
            };

            // Sets a property on a link in the top level links
            $scope.setTopLevelLinkValue = function (linkName, linkProp, value) {


                for (var i = 0;  i < $scope.topLevelLinks.length; i++) {

                    if ($scope.topLevelLinks[i].name === linkName) {

                        $scope.topLevelLinks[i][linkProp] = value;
                        break;
                    }
                }
            };

            $scope.$watch('currentUser', function(newValue, oldValue) {

                var links = [];

                if (!angular.equals(newValue, oldValue)) {
                    // user changed, reset application object to force reload of all data
                    dfApplicationData.resetApplicationObj();
                }

                if (!newValue) {
                    links.push("login");
                } else {
                    links.push("user");
                    $scope.setTopLevelLinkValue('user', 'label', newValue.name);
                }
                $scope._setActiveLinks($scope.topLevelLinks, links);
            });
        }
    ])

    // Our LoginCtrl controller inherits from our TopLevelAppCtrl controller
    // This controller provides an attachment point for our Login Functionality
    // We inject $location because we'll want to update our location on a successful
    // login and the UserEventsService from our DreamFactory User Management Module to be able
    // to respond to events generated from that module
    .controller('LoginCtrl', ['$scope', '$window', '$location', '$timeout', 'UserDataService', 'UserEventsService', 'SystemConfigDataService', 'dfNotify', function($scope, $window, $location, $timeout, UserDataService, UserEventsService, SystemConfigDataService, dfNotify) {

        // Login options array
        $scope.loginOptions = {
            showTemplate: true
        };

        // Listen for a password set success message
        // This returns a user credentials object which is just the email and password
        // from the register form
        // on success we...
        $scope.$on(UserEventsService.password.passwordSetSuccess, function(e, userCredsObj) {

            // alert success to user
            var messageOptions = {
                module: 'Users',
                type: 'success',
                provider: 'dreamfactory',
                message: 'Password reset successful.'
            };

            dfNotify.success(messageOptions);

            // Send a message to our login directive requesting a login.
            // We send our user credentials object that we received from our successful
            // registration along to it can log us in.
            $scope.$broadcast(UserEventsService.login.loginRequest, userCredsObj);
        });

        // Handle a login error
        // The directive will handle showing the message.  We just have to
        // stop the event propagation
        $scope.$on(UserEventsService.login.loginError, function (e) {
            e.stopPropagation();
        });


        // Listen for the login success message which returns a user data obj
        // When we have a successful login...
        $scope.$on(UserEventsService.login.loginSuccess, function(e, userDataObj) {

            // Set our parent's current user var
            $scope.$parent.currentUser = userDataObj;

            //Login using OAuth...
            var queryString = location.search.substring(1);

            // Hide our login template while services build
            $scope.loginOptions.showTemplate = false;

            // 250ms delay to allow the login screen to process
            // and disappear
            $timeout(function () {

                // Change our app location back to the home page
                if (queryString) {
                    // if logging in using oauth then do a full reload
                    // is needed to remove oauth related info from url.
                    var uri = $location.absUrl().split('?');
                    $window.location.href = uri[0] + '#/services';
                } else {
                    $location.url('/services');
                }
            }, 250);
        });
    }])

    // Our LogoutCtrl controller inherits from out TopLevelAppCtrl controller
    // This controller provides an attachment point for our logout functionality
    // We inject $location and the UserEventsService...same as the LoginCtrl.
    .controller('LogoutCtrl', ['$scope', '$location', 'UserEventsService', function($scope, $location, UserEventsService) {

        // Listen for the logout success message
        // then we...
        $scope.$on(UserEventsService.logout.logoutSuccess, function(e, userDataObj) {

            // Set the current user var on the parent
            // the userDataObj passed with the success message is just a boolean
            // and should be 'false'
            $scope.$parent.currentUser = userDataObj;

            // redirect
            $location.url('/login');
        });
    }]);

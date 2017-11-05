'use strict';


angular.module('dfUtility', [])

    // Set a constant so we can access the 'local' path of our assets
    .constant('MOD_UTILITY_ASSET_PATH', 'admin_components/adf-utility/')

    // Standard section headers
    .directive('dfSectionHeader', [function () {

        return {

            restrict: 'E',
            scope: {
                title: '=?'
            },
            template: '<div class="df-section-header df-section-all-round"><h4>{{title}}</h4></div>',
            link: function (scope, elem, attrs) {}
        };
    }])

    // section tool bar for views
    .directive('dfSectionToolbar', ['MOD_UTILITY_ASSET_PATH', '$compile', '$location', '$timeout', '$route', function (MOD_UTILITY_ASSET_PATH, $compile, $location, $timeout, $route) {


        return {
            restrict: 'E',
            scope: false,
            transclude: true,
            templateUrl : MOD_UTILITY_ASSET_PATH + 'views/df-toolbar.html',
            link: function (scope, elem, attrs) {}
        };
    }])

    // Need to fix this directive.  Kind of does what we want currently though
    .directive('dreamfactoryAutoHeight', ['$window', '$route', function ($window) {

        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                // Return jQuery window ref
                scope._getWindow = function () {
                    return $(window);
                };

                // Return jQuery document ref
                scope._getDocument = function () {
                    return $(document);
                };

                // Return jQuery window or document.  If neither just return the
                // string value for the selector engine
                scope._getParent = function (parentStr) {
                    switch (parentStr) {
                        case 'window':
                            return scope._getWindow();
                            break;

                        case 'document':
                            return scope._getDocument();
                            break;

                        default:
                            return $(parentStr);
                    }
                };

                // TODO: Element position/offset out of whack on route change.  Set explicitly.  Not the best move.
                scope._setElementHeight = function () {
                    angular.element(elem).css({height: scope._getParent(attrs.autoHeightParent).height() - 200 - attrs.autoHeightPadding});

                    /*console.log(scope._getParent(attrs.autoHeightParent).height());
                     console.log($(elem).offset().top)
                     console.log(angular.element(elem).height())*/
                };

                scope._setElementHeight();

                // set height on resize
                angular.element($window).on(
                    'resize', function () {
                        scope._setElementHeight();
                    }
                );
            }
        };
    }])

    // Another shot a resize.  I think the was ripped off of the internet
    .directive('resize', [function ($window) {
        return function (scope, element) {
            var w = angular.element($window);

            scope.getWindowDimensions = function () {
                return {'h': w.height(), 'w': w.width()};
            };

            scope.$watch(
                scope.getWindowDimensions, function (newValue, oldValue) {
                    scope.windowHeight = newValue.h;
                    scope.windowWidth = newValue.w;

                    angular.element(element).css(
                        {
                            width: (
                                newValue.w - angular.element('sidebar').css('width')
                            ) + 'px'
                        }
                    );

                    /*scope.style = function () {
                     return {
                     'height': (newValue.h - 100) + 'px',
                     'width': (newValue.w - 100) + 'px'
                     };
                     };*/

                }, true
            );

            /* w.bind('resize', function () {
             scope.$apply();
             });*/
        };
    }])

    // Used for setting the section heights
    .directive('dfFsHeight', ['$window', '$rootScope', function ($window, $rootScope) {

        return function (scope, elem, attrs) {

            var setSize = function () {


                var _elem = $(elem),
                    winHeight = $(window).height(),
                    winWidth = $(window).width();

                // If this is the swagger iframe
                if (_elem.is('#swagger')) {

                    _elem.attr('height', winHeight - 25 + 'px');
                }
                // else
                else {
                    if (winWidth >= 992) {
                        $(elem).css({
                            height:  winHeight - 120
                        });
                    }
                    else {
                        $(elem).css({
                            height: 'auto'
                        });
                    }
                }
            };

            // Respond to swagger loaded
            scope.$on('apidocs:loaded', function (e) {

                setSize();
            });

            // Respond to component nav change
            $rootScope.$on('$routeChangeSuccess', function (e) {

                setSize();
            });

            $(document).ready(function () {

                setSize();
            });

            // Bind to resize
            $(window).on('resize', function () {

                setSize();
            });
        };
    }])

    // Various Filters.  All used in dfTable.  Possibly elsewhere.
    // I'll find out if so.
    .filter('orderAndShowSchema', [function () {

        return function (items, fields, reverse) {

            var filtered = [];

            angular.forEach(
                fields, function (field) {

                    angular.forEach(
                        items, function (item) {
                            if (item.name === field.name && field.active == true) {

                                filtered.push(item);
                            }
                        }
                    );
                }
            );

            if (reverse) {
                filtered.reverse();
            }
            return filtered;
        };
    }
    ])

    .filter('orderAndShowValue', [function () {

        return function (items, fields, reverse) {

            // Angular sometimes throws a duplicate key error.
            // I'm not sure why.  We were just pushing values onto
            // an array.  So I use a counter to increment the key
            // of our data object that we assign our filtered values
            // to.  Now they are extracted into the table in the correct
            // order.

            var filtered = [];

            // for each field
            angular.forEach(
                fields, function (field) {

                    // search the items for that field
                    for (var _key in items) {

                        // if we find it
                        if (_key === field.name && field.active == true) {

                            // push on to
                            filtered.push(items[_key]);
                        }
                    }
                }
            );

            if (reverse) {
                filtered.reverse();
            }
            return filtered;
        };
    }
    ])

    .filter('orderObjectBy', [function () {
        return function (items, field, reverse) {

            var filtered = [];

            function cmp(a, b) {
                return a == b ? 0 : a < b ? -1 : 1;
            }

            angular.forEach(items, function (item) {
                    filtered.push(item);
                }
            );

            if (filtered.length === 0) {
                return filtered;
            }

            var filterOnThis = filtered[0].record ? filtered[0].record[field] : filtered[0][field]

            switch (typeof filterOnThis) {

                case 'number':

                    filtered.sort(
                        function numberCmp(a, b) {

                            // This checks if we have passed in a 'managed ui object'
                            // Pretty sure all the data that moves into any table
                            // that needs to be sorted will be wrapped in an object and
                            // the data we are looking for will be assigned to the record
                            // property of that object
                            if (a.hasOwnProperty('record') && b.hasOwnProperty('record')) {
                                a = a.record[field];
                                b = b.record[field]
                            }
                            else {
                                a = a[field];
                                b = b[field];
                            }

                            // if the value is null of undefined set to zero
                            a = a === null || a === undefined ? 0 : a;
                            b = b === null || b === undefined ? 0 : b;

                            return cmp(Number(a), Number(b));
                        }
                    );
                    break;

                case 'string':

                    filtered.sort(
                        function sortfn(a, b) {

                            if (a.hasOwnProperty('record') && b.hasOwnProperty('record')) {
                                a = a.record[field];
                                b = b.record[field]
                            }
                            else {
                                a = a[field];
                                b = b[field];
                            }

                            // if the value is null of undefined set to zero
                            a = a === null || a === undefined ? '' : a;
                            b = b === null || b === undefined ? '' : b;

                            var upA = a.toUpperCase();
                            var upB = b.toUpperCase();
                            return (
                                upA < upB
                            ) ? -1 : (
                                upA > upB
                            ) ? 1 : 0;
                        }
                    );
                    break;

                default:
                    filtered.sort(
                        function sortfn(a, b) {

                            if (a.hasOwnProperty('record') && b.hasOwnProperty('record')) {
                                a = a.record[field];
                                b = b.record[field]
                            }
                            else {
                                a = a[field];
                                b = b[field];
                            }

                            // if the value is null of undefined set to empty string
                            a = a === null || a === undefined ? '' : a;
                            b = b === null || b === undefined ? '' : b;

                            var upA = a;
                            var upB = b;
                            return (
                                upA < upB
                            ) ? -1 : (
                                upA > upB
                            ) ? 1 : 0;
                        }
                    );
            }

            if (reverse) {
                filtered.reverse();
            }
            return filtered;
        };
    }
    ])

    .directive('dfEmptySearchResult', ['MOD_UTILITY_ASSET_PATH', '$location', function (MOD_UTILITY_ASSET_PATH, $location) {
        return {
            restrict: 'E',
            scope: false,
            templateUrl: MOD_UTILITY_ASSET_PATH + 'views/df-empty-search-result.html',
            link: function (scope, elem, attrs) {
                if($location.search() && $location.search().filter) {
                    scope.$parent.filterText = ($location.search() && $location.search().filter) ? $location.search().filter : null;
                }
            }
        };
    }])

    // Notification service
    .service('dfNotify', [function() {

        var stack_topleft = {"dir1": "down", "dir2": "right", "push": "top", "firstpos1": 25, "firstpos2": 25, "spacing1": 5, spacing2: 5};

        function pnotify (messageOptions) {

            (function() {

                PNotify.removeAll();

                // Set PNotify options
                PNotify.prototype.options.styling = "fontawesome";

                new PNotify({
                    title: messageOptions.module,
                    type:  messageOptions.type,
                    text:  messageOptions.message,
                    addclass: "stack_topleft",
                    animation: 'fade',
                    animate_speed: 'normal',
                    hide: true,
                    delay: 3000,
                    stack: stack_topleft,
                    mouse_reset: true
                })
            })();
        }

        function parseDreamfactoryError (errorDataObj) {

            var result, error, resource, message;

            // If the exception type is a string we don't need to go any further
            // This was thrown explicitly by the module due to a module error
            // unrelated to the server
            if (Object.prototype.toString.call(errorDataObj) === '[object String]') {

                // store the error
                // and we're done
                result = errorDataObj;

                // the exception is not a string
                // let's assume it came from the server
            } else {

                // parse the message from the error obj
                // for batch error use error.context.resource[].message
                // if not batch error use top level error
                result = "The server returned an unknown error.";
                if (errorDataObj.data) {
                    error = errorDataObj.data.error;
                    if (error) {
                        // default to top level error
                        message = error.message;
                        if (message) {
                            result = message;
                        }
                        if (error.code === 1000 && error.context) {
                            resource = error.context.resource;
                            error = error.context.error;
                            if (resource && error) {
                                result = '';
                                angular.forEach(error, function (index) {
                                    if (result) {
                                        result += '\n';
                                    }
                                    result += resource[index].message;
                                });
                            }
                        }
                    }
                }
            }
            // return message to display to the user
            return result;
        }

        return {

            success: function(options) {

                pnotify(options);
            },

            error: function(options) {

                // sometimes options.message is a string, sometimes it's an object
                options.message = parseDreamfactoryError(options.message);
                pnotify(options);
            },

            warn: function(options) {

                pnotify(options);
            },

            confirmNoSave: function () {

                return confirm('Continue without saving?');
            },

            confirm: function (msg) {

                return confirm(msg);
            },

            clear: function() {

                PNotify.removeAll();
            }
        };
    }])

    // Pop up login screen for session time outs
    .directive('dfPopupLogin', ['MOD_UTILITY_ASSET_PATH', '$compile', '$location', 'UserEventsService', function (MOD_UTILITY_ASSET_PATH, $compile, $location, UserEventsService) {

        return {
            restrict: 'A',
            scope: false,
            link: function (scope, elem, attrs) {

                scope.popupLoginOptions = {
                    showTemplate: true
                };

                scope.openLoginWindow = function (errormsg) {

                    var html = '<div id="df-login-frame" style="overflow: hidden; position: absolute; top:0; z-index:99999; background: rgba(0, 0, 0, .8); width: 100%; height: 100%"><div style="padding-top: 120px;"><dreamfactory-user-login data-in-err-msg="errormsg.data.error.message" data-options="popupLoginOptions"></dreamfactory-user-login></div></div>';
                    $('#popup-login-container').html($compile(html)(scope));
                };

                scope.$on(UserEventsService.login.loginSuccess, function(e, userDataObj) {

                    e.stopPropagation();
                    $('#df-login-frame').remove();
                });

                scope.$on(UserEventsService.login.loginError, function(e, userDataObj) {

                    $('#df-login-frame').remove();
                    $location.url('/logout');
                });
            }
        };
    }])

    // declare our directive and pass in our constant
    .directive('dfTopLevelNavStd', ['MOD_UTILITY_ASSET_PATH', function (MOD_UTILITY_ASSET_PATH) {

        return {

            // Only allow this directive to be used as an element
            restrict: 'E',

            // Use an isolate scope
            scope: {

                // pass in our links.  This will be an array of link objects
                options: '=?'
            },

            // tell the directive where our template is
            templateUrl: MOD_UTILITY_ASSET_PATH + 'views/df-top-level-nav-std.html',

            // link it all together.  We'll be putting some business logic in here to
            // handle updating the active link
            link: function (scope, elem, attrs) {

                scope.links = scope.options.links;
                scope.activeLink = null;
            }
        };
    }])

    // Helps merge objects.  Supports deep merge.  Many modules
    // need this
    .service('dfObjectService', [
        function () {

            return {

                mergeDiff: function (obj1, obj2) {

                    for (var key in obj1) {
                        if (!obj2.hasOwnProperty(key) && key.substr(0,1) !== '$') {

                            obj2[key] = obj1[key];
                        }
                    }

                    return obj2;
                },

                mergeObjects: function (obj1, obj2) {

                    for (var key in obj1) {
                        obj2[key] = obj1[key];
                    }

                    return obj2;
                },

                deepMergeObjects: function (obj1, obj2) {

                    var self = this;

                    for (var _key in obj1) {
                        if (obj2.hasOwnProperty(_key)) {

                            switch (Object.prototype.toString.call(obj2[_key])) {

                                case '[object Object]':
                                    obj2[_key] = self.deepMergeObjects(obj1[_key], obj2[_key]);
                                    break;

                                case '[object Array]':
                                    obj2[_key] = obj1[_key];
                                    //obj2[_key].concat(obj1[_key]);
                                    break;

                                default:
                                    obj2[_key] = obj1[_key];
                            }

                            /*    if(Object.prototype.toString.call(obj2[_key]) === '[object Object]') {

                             obj2[_key] = self.deepMergeObjects(obj1[_key], obj2[_key]);
                             }else {
                             obj2[_key] = obj1[_key];
                             }*/
                        }
                    }

                    return obj2;
                },

                compareObjectsAsJson: function(o, p) {

                    return angular.toJson(o) === angular.toJson(p);
                }
            };
        }
    ])

    // Icon Service
    .service('dfIconService', [function () {

        return function () {

            return {
                login: 'fa fa-fw fa-sign-in',
                user: 'fa fa-fw fa-user'
            };
        };
    }]);

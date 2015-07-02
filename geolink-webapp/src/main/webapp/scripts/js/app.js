var debug = 0;

var app = angular.module('GeolinkClient', ['ui.bootstrap', 'ui.jassa', 'ui.jassa.openlayers', 'ngAnimate']);

app.filter('objectToArray', function() {
    return function (input) {
        var r = _.values(input);
        return r;
    }
});

app.run(['$rootScope', function($rootScope) {
    $rootScope.linkspec = {};
    $rootScope.currentLinkSpec = {};
}]);

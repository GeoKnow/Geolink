var debug = 0;

var app = angular.module('GeolinkClient', ['ui.bootstrap', 'ui.jassa', 'ui.jassa.openlayers','ngAnimate']);

app.filter('objectToArray', function() {
    return function (input) {
        var r = _.values(input);
        return r;
    }
});


/*
 return {
 priority: -10,
 restrict: 'A', /* optional
 postLink: function (scope, el, attrs) {
 var trs = el.children().children();
 console.log('Got element', trs.length, trs);
 /*
 el.detach();
 var tr = angular.element('<tr></tr>');
 console.log('Appending to ', tr, ' the children ', el.children());
 el.parent().parent().append(tr);
 * /
 }
 };
 */

//.directive('include', [function () {
//    return {
//        replace: true,
//        restrict: 'A',
//        templateUrl: function (element, attr) {
//            return attr.pfInclude;
//        }
//    };
//}])


//.directive('include', ['$http', '$templateCache', '$compile', function ($http, $templateCache, $compile) {
//    return {
//        restrict: 'A',
//        link: function (scope, element, attributes) {
//            var templateUrl = scope.$eval(attributes.include);
//            $http.get(templateUrl, {cache: $templateCache}).then(
//                function (tplContent) {
//                    element.replaceWith($compile(tplContent)(scope));
//                }
//            );
//        }
//    };
//}])

//.directive('myRepeatStart', [function() {
//    return {
//        scope: true,
//        priority: 0,
//        compile: function() {
//            return {
//                pre: function(scope, element, attrs) {
//                    //scope.groups = scope.group.subGroups;
//                    //console.log('MyInit: ' + attrs.myInit);
//                    scope.$eval(attrs.myInit);
//                }
//            };
//        }
//    };
//}])
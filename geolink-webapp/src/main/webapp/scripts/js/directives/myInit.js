app.directive('myInit', function () {
    return {
        scope: true,
        priority: 1,
        compile: function () {
            return {
                pre: function (scope, element, attrs) {
                    //scope.groups = scope.group.subGroups;
                    console.log('MyInit: ' + attrs.myInit);
                    scope.$eval(attrs.myInit);
                }
            };
        }
    };
});
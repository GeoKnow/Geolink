app.directive('pullUp', function () {
    return {
        compile: function compile(tElement, tAttrs, transclude) {
            return {
                post: function postLink(scope, elem, attrs) {
                    //console.log(elem);
//                         var parent = elem.parent();
//                         var children = elem.children();
//                         parent.append(children);
//                         elem.detach();


                    //elem.remove();
                    //elem.parent().add
                    setTimeout(function () {
                        var trs = elem.children().children();
                        var parent = elem.parent().parent().parent();
                        console.log('parent', parent);

                        parent.append(trs);
                        elem.remove();
                        //console.log('Got element', trs);
                    }, 500);
                }
            }
        }
    };
});
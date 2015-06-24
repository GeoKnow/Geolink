app.controller('guiCtrl', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope) {
//	accordion-group
	$scope.oneAtATime = true;
	$scope.status = {
		isFirstOpen: false,
	    isFirstDisabled: false,	
	    isLinkSpecOpen: true
	};
	$scope.isCollapsed = false;
    	
//	  dynamicform example: http://plnkr.co/edit/AEtGstSBV6oydtvds52Y?p=preview
//    $("[data-toggle=popover]").popover({
//	      html : true,
//	      container: 'body',
//	      content: function() {
//	        var content = $(this).attr("data-popover-content");
//	        return $(content).children(".popover-body").html();
//	      },
//	      title: function() {
//	        var title = $(this).attr("data-popover-content");
//	        return $(title).children(".popover-heading").html();
//	      }
//    });
//
//    $('body').on('click', 'button#nextBtn', function () {
//    	console.log("CLICKED nextBtn");
//    	"offset = offset + 1"
//    }).on('click', 'button#prevBtn', function () {
//    	console.log("CLICKED prevBtn");
//    	"offset = offset > 0 ? offset - 1 : offset"
//    });
//
//    //eval options
//    $scope.evalData = [];
//    $scope.addNew = function (){
//        $scope.evalData.push({ link: '', eval: '' });
//    };
    
    
//	md-input-container
	$scope.session = {
		username: "BobJr",
		project: "ThisProject"
	};

    $scope.servers = [  {	num: 0,
        'data': {
            id: 'DBpedia',
            type: 'sparql',
            endpoint: 'http://dbpedia.org/sparql',
            graph: 'http://dbpedia.org',
            restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
            'var': '?x',
            properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
        }
    },
        {
            num: 1,
            'data': {
                id: 'LinkedGeoData',
                type: 'sparql',
                endpoint: 'http://linkedgeodata.org/sparql',
                graph: 'http://linkedgeodata.org',
                restrictions: ['?y a <http://linkedgeodata.org/ontology/Airport>'],
                'var': '?y',
                properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
            }
        },
        {	num: 2,
            'data': {
                id: 'FR DBP',
                type: 'sparql',
                endpoint: 'http://fastreboot.de:8890/sparql',
                graph: 'http://fastreboot.de/dbpediatest',
                restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
                'var': '?x',
                properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
            }
        },
        {
            num: 3,
            'data': {
                id: 'FR LGD',
                type: 'sparql',
                endpoint: 'http://fastreboot.de:8890/sparql',
                graph: 'http://fastreboot.de/lgdtest',
                restrictions: ['?y a <http://linkedgeodata.org/ontology/Airport>'],
                'var': '?y',
                properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
            }
        }
    ];

	$scope.prefixes = {
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
        geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#'
    };
	
    $scope.linkspec = {
        prefixes: angular.copy($scope.prefixes),
        sourceInfo: angular.copy($scope.servers[2].data),
        targetInfo: angular.copy($scope.servers[3].data),
        metricExpression: 'AND(trigrams(x.rdfs:label, y.rdfs:label)|0.99, euclidian(x.lat|x.long, y.latitude|y.long)|0.8)',
        acceptanceThreshold: 0.95
    };

    $rootScope.$broadcast("Source",{"graph": $scope.linkspec.sourceInfo.graph, "sparql": $scope.linkspec.sourceInfo.endpoint});
    $rootScope.$broadcast("Target",{"graph": $scope.linkspec.targetInfo.graph, "sparql": $scope.linkspec.targetInfo.endpoint});


    $scope.selectDropdown1 = function(id) {
	    console.log("selectDropdown1 THE IS IS: " + id);
	    $scope.linkspec.sourceInfo = angular.copy($scope.servers[id].data);
        $rootScope.$broadcast("Source",{"graph": $scope.linkspec.sourceInfo.graph, "sparql": $scope.linkspec.sourceInfo.endpoint});
    };
	
	$scope.selectDropdown2 = function(id) {
	    console.log("selectDropdown2 THE IS IS: " + id);
	    $scope.linkspec.targetInfo = angular.copy($scope.servers[id].data);
        $rootScope.$broadcast("Target",{"graph": $scope.linkspec.targetInfo.graph, "sparql": $scope.linkspec.targetInfo.endpoint});
    };

//	SEND THE LINKSPEC
    $scope.sendLinkSpec = function () {
        console.log('Send LinkSpec');
        console.log($scope.linkspec);
        $http({
            method:'POST',
            url:'api/linking/executeFromSpec',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            data: "spec=" + encodeURIComponent(JSON.stringify($scope.linkspec)) + "&" +
            "project=" + encodeURIComponent($scope.session.project) + "&" +
            "username=" + encodeURIComponent($scope.session.username)
        }).success( function (data, status, headers, config) {
            console.log(JSON.stringify(data));
            $rootScope.$broadcast("Link", data);
        }).error( function(data, status, headers, config) {
            console.log(data);
        });
    };

    $rootScope.$on("Evaluation", function(event, data) {
        console.log('Send Evaluation');
        console.log(data);
        $http({
            method:'POST',
            url:'api/linking/evaluation',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            data: "evaluation=" + encodeURIComponent(JSON.stringify(data)) + "&" +
            "project=" + encodeURIComponent($scope.session.project) + "&" +
            "username=" + encodeURIComponent($scope.session.username)
        }).success( function (data, status, headers, config) {
            console.log('done!!!!!!!!!!!: ');
            console.log(data);
//            $scope.addGraph(data.sparql, data.graph);
        }).error( function(data, status, headers, config) {
            console.log('fail on: ' + status);
            console.log('data: ' + data);
        });
    });

}]);

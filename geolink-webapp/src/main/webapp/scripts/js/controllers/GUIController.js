app.controller('guiCtrl', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope) {
//	accordion-group
	$scope.oneAtATime = false;
	$scope.status = {
		isFirstOpen: true,
	    isFirstDisabled: false,	
	    isLinkSpecOpen: true
	};
	
//	md-input-container
	$scope.session = {
		username: "BobJr",
		project: "ThisProject",
	};
	
	$scope.sparql1 = {
		id: 'FR DBP',
		type: 'sparql',
		endpoint: 'http://fastreboot.de:8890/sparql',
		graph: 'http://fastreboot.de/dbpediatest',
		restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
		'var': '?x',
		properties: ['rdfs:label AS nolang->lowercase']
	};
	
	$scope.sparql2 = {
		id: 'FR LGD',
		type: 'sparql',
		endpoint: 'http://fastreboot.de:8890/sparql',
		graph: 'http://fastreboot.de/lgdtest',
		restrictions: ['?y a <http://linkedgeodata.org/ontology/Airport>'],
		'var': '?y',
		properties: ['rdfs:label AS nolang->lowercase']
	};
	
	$scope.prefixes = {
	        rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
	};
	
    $scope.linkspec = {
        prefixes: $scope.prefixes,
        sourceInfo: $scope.sparql1,
        targetInfo: $scope.sparql2,
        metricExpression: 'trigrams(x.rdfs:label, y.rdfs:label)',
        acceptanceThreshold: 0.9
    }; 
    
	$scope.servers = [  {	num: 0,
							'data': { 
								id: 'DBpedia',
								type: 'sparql',
								endpoint: 'http://dbpedia.org/sparql',
								graph: 'http://dbpedia.org',
								restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
								'var': '?x',
								properties: ['rdfs:label AS nolang->lowercase']
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
							properties: ['rdfs:label AS nolang->lowercase']	
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
							properties: ['rdfs:label AS nolang->lowercase']	
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
							properties: ['rdfs:label AS nolang->lowercase']	
							}	
						}
	];

	$scope.selectDropdown1 = function(id) {
	    console.log("selectDropdown1 THE IS IS: " + id);
	    $scope.sparql1=$scope.servers[id].data;
	};
	
	$scope.selectDropdown2 = function(id) {
	    console.log("selectDropdown2 THE IS IS: " + id);
	    $scope.sparql2=$scope.servers[id].data;
	};   
	
//	SEND THE LINKSPEC
    $scope.sendLinkSpec = function () {
    	console.log($scope.sparql1);
    	console.log($scope.sparql2);
        console.log('Send LinkSpec');
        console.log($scope.linkspec);        
        $rootScope.$broadcast("Clear");
        $rootScope.$broadcast("Source1",{"graph": $scope.sparql1.graph, "sparql": $scope.sparql1.endpoint});
        $rootScope.$broadcast("Source2",{"graph": $scope.sparql2.graph, "sparql": $scope.sparql2.endpoint});

        $http({
            method:'POST',
            url:'api/linking/executeFromSpec',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            data: "spec=" + encodeURIComponent(JSON.stringify($scope.linkspec)) + "&" +
            "project=" + encodeURIComponent($scope.session.project) + "&" +
            "username=" + encodeURIComponent($scope.session.username)
        }).success( function (data, status, headers, config) {
            console.log(JSON.stringify(data));
//            $scope.addGraph(data.sparql, data.graph);
            $rootScope.$broadcast("Source3", data);
        }).error( function(data, status, headers, config) {
            console.log(data);
        });
    };   
}]);
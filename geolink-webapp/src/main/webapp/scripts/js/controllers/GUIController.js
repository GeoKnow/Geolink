app.controller('guiCtrl', ['$scope', '$http', '$rootScope', '$window', function($scope, $http, $rootScope, $window) {
//	accordion-group
    $rootScope.guiStatus = {
        oneAtATime: true,					//default: true

        isSessionOpen: true,				//default: true
        isSessionDisabled: false,			//default: false
        isSessionUneditable: false,			//default: false

        isLinkSpecOpen: false,				//default: false
        isLinkSpecDisabled: true,			//default: true
        isLinkSpecUneditable: true,			//default: true

        isEvaluationOpen: false,			//default: false
        isEvaluationDisabled: true,			//default: true
        
        isProposedSpecOpen: false,			//default: false

        isMappingDisabled: false,  			//default: false

        isEvalLinkOpen: false,				//default: false
        isGeomizedLinkOpen: false,			//default: false

        isLoading: false,					//default: false
    };

    $rootScope.graphLink =  {
        geomized : "",
        eval: "",
        evalJSON: "",
        evalJSONshort: "",
        evalPrefix1: "http://example.org/",
        evalPrefix2: "linkEvaluation-of-",
        evalSuffix: "-byuser-"
    };

//	md-input-container
    $rootScope.session = {
        username: "BobJr",
        project: "ThisProject"
    };

    $scope.servers = [
        {
            num: 0,
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
                id: 'FR DBP Min',
                type: 'sparql',
                endpoint: 'http://fastreboot.de:8890/sparql',
                graph: 'http://fastreboot.de/dbpediatest',
                restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
                'var': '?x',
                //properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
                properties: ['rdfs:label']
            }
        },
        {
            num: 3,
            'data': {
                id: 'FR LGD Min',
                type: 'sparql',
                endpoint: 'http://fastreboot.de:8890/sparql',
                graph: 'http://fastreboot.de/lgdtest',
                restrictions: ['?y a <http://linkedgeodata.org/ontology/Airport>'],
                'var': '?y',
                //properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
                properties: ['rdfs:label']
            }
        },
        {	num: 4,
            'data': {
                id: 'FR DBP AIRPORT DE',
                type: 'sparql',
                endpoint: 'http://fastreboot.de:8890/sparql',
                graph: 'http://fastreboot.de/dbpedia/airport/de/',
                restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
                'var': '?x',
                //properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
                properties: ['rdfs:label']
            }
        },
        {
            num: 5,
            'data': {
                id: 'FR LGD AIRPORT DE',
                type: 'sparql',
                endpoint: 'http://fastreboot.de:8890/sparql',
                graph: 'http://fastreboot.de/lgd/airport/de/',
                restrictions: ['?y a <http://linkedgeodata.org/ontology/Airport>'],
                'var': '?y',
                //properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
                properties: ['rdfs:label']
            }
        },
        {	num: 6,
            'data': {
                id: 'FR DBP AIRPORT EU',
                type: 'sparql',
                endpoint: 'http://fastreboot.de:8890/sparql',
                graph: 'http://fastreboot.de/dbpedia/airport/eu/',
                restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
                'var': '?x',
                //properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
                properties: ['rdfs:label']
            }
        },
        {
            num: 7,
            'data': {
                id: 'FR LGD AIRPORT EU',
                type: 'sparql',
                endpoint: 'http://fastreboot.de:8890/sparql',
                graph: 'http://fastreboot.de/lgd/airport/eu/',
                restrictions: ['?y a <http://linkedgeodata.org/ontology/Airport>'],
                'var': '?y',
                //properties: ['rdfs:label AS nolang->lowercase', 'geo:lat', 'geo:long']
                properties: ['rdfs:label']
            }
        }
    ];

    $scope.prefixes = {
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
        geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
        owl: 'http://www.w3.org/2002/07/owl#'
    };
    
    $rootScope.linkspec = {
        prefixes: angular.copy($scope.prefixes),
        sourceInfo: angular.copy($scope.servers[2].data),
        targetInfo: angular.copy($scope.servers[3].data),
        //metricExpression: 'AND(trigrams(x.rdfs:label, y.rdfs:label)|0.99, euclidian(x.lat|x.long, y.lat|y.long)|0.8)',
        metricExpression: 'trigrams(x.rdfs:label, y.rdfs:label)',
        acceptanceThreshold: 0.95,
        acceptanceRelation: 'owl:sameAs'
    };
    
    $rootScope.newLinkspec = angular.copy($rootScope.linkspec);

    $scope.selectDropdown1 = function(id) {
        console.log("selectDropdown1 THE IS IS: " + id);
        $rootScope.linkspec.sourceInfo = angular.copy($scope.servers[id].data);
        $rootScope.$broadcast("Source",{"graph": $rootScope.linkspec.sourceInfo.graph, "sparql": $rootScope.linkspec.sourceInfo.endpoint});
    };

    $scope.selectDropdown2 = function(id) {
        console.log("selectDropdown2 THE IS IS: " + id);
        $rootScope.linkspec.targetInfo = angular.copy($scope.servers[id].data);
        $rootScope.$broadcast("Target",{"graph": $rootScope.linkspec.targetInfo.graph, "sparql": $rootScope.linkspec.targetInfo.endpoint});
    };

    $scope.createSession = function () {
        $rootScope.guiStatus.isLoading = true;
        if ( (_.isEmpty($rootScope.session.project)) || (_.isEmpty($rootScope.session.username)) ) {
            alert("Please fill in both fields");
            $rootScope.guiStatus.isLoading = false;
        } else {
            $http({
                method:'POST',
                url:'api/linking/createSession',
                headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                data: "project=" + encodeURIComponent($rootScope.session.project) + "&" +
                "username=" + encodeURIComponent($rootScope.session.username)
            }).success( function (data, status, headers, config) {
                console.log(data);
                $rootScope.$broadcast("Eval", data);

                $rootScope.graphLink.eval = data.sparql + "?qtxt=select+*+%7B%3Fs+%3Fp+%3Fo%7D&default-graph-uri=" + data.graph;
                $rootScope.graphLink.evalJSON = data.sparql + "?default-graph-uri="+ data.graph +"&query=select+*+%7B%3Fs+%3Fp+%3Fo%7D&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";
                $rootScope.graphLink.evalJSONshort = data.sparql + "?default-graph-uri="+ data.graph +"&query=select+*+%7B%3Fs+<http%3A%2F%2Fwww.linklion.org%2Fontology%23hasEvalStatus>+%3Fo%7D&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";;

                $rootScope.guiStatus.isEvalLinkOpen = true;
                console.log($rootScope.graphLink.eval);

                $rootScope.guiStatus.isLinkSpecOpen = true;
                $rootScope.guiStatus.isLinkSpecDisabled = false;
                $rootScope.guiStatus.isLinkSpecUneditable = false;


                $scope.getAllEval();		//load the user's eval data from remote store

                $rootScope.guiStatus.isLoading = false;
            }).error( function(data, status, headers, config) {
                console.log('fail on: ' + status);
                console.log('data: ' + data);
                $rootScope.guiStatus.isLoading = false;
            });
        }
    };

    //	SHOW DATA ON MAP
    $scope.showDataPoints = function () {
        $rootScope.currentLinkSpec = angular.copy($rootScope.linkspec);
    };

    //	SEND THE LINKSPEC
    $scope.sendLinkSpec = function () {
        $rootScope.guiStatus.isLoading = true;
        console.log('Send LinkSpec', $rootScope.linkspec);

        $rootScope.currentLinkSpec = angular.copy($rootScope.linkspec);

        $http({
            method:'POST',
            url:'api/linking/executeFromSpec',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            data: "spec=" + encodeURIComponent(JSON.stringify($rootScope.linkspec)) + "&" +
            "project=" + encodeURIComponent($rootScope.session.project) + "&" +
            "username=" + encodeURIComponent($rootScope.session.username)
        }).success( function (data, status, headers, config) {
            console.log(JSON.stringify(data));
            $rootScope.$broadcast("Link", data);

            $rootScope.graphLink.geomized = data.sparql + "?qtxt=select+*+%7B%3Fs+%3Fp+%3Fo%7D&default-graph-uri=" + data.graph;
            $rootScope.guiStatus.isGeomizedLinkOpen = true;
            console.log($rootScope.graphLink.geomized);

            $rootScope.guiStatus.isSessionDisabled = true;
            $rootScope.guiStatus.isLinkSpecOpen = false;
            $rootScope.guiStatus.isLinkSpecDisabled = false;
            $rootScope.guiStatus.isLinkSpecUneditable = true;
            $rootScope.guiStatus.isEvaluationOpen = true;
            $rootScope.guiStatus.isEvaluationDisabled = false;
            $rootScope.page = 1;

            $rootScope.guiStatus.isLoading = false;
        }).error( function(data, status, headers, config) {
            console.log(data);
            $rootScope.guiStatus.isLoading = false;
        });
    };

    $rootScope.$on("Evaluation", function(event, data) {
        $rootScope.guiStatus.isLoading = true;
        console.log('Send Evaluation');
        console.log(data);
        $http({
            method:'POST',
            url:'api/linking/evaluation',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            data: "evaluation=" + encodeURIComponent(JSON.stringify(data)) + "&" +
            "project=" + encodeURIComponent($rootScope.session.project) + "&" +
            "username=" + encodeURIComponent($rootScope.session.username)
        }).success( function (data, status, headers, config) {
            $rootScope.guiStatus.isLoading = false;
            //$rootScope.guiStatus.isMappingDisabled = false;
        }).error( function(data, status, headers, config) {
            console.log('fail on: ' + status);
            console.log('data: ' + data);
            $rootScope.guiStatus.isLoading = false;
        });
    });

    $rootScope.$on("Mapping", function(event, data) {
        $rootScope.guiStatus.isLoading = true;
        console.log('Send Mapping');
        console.log(data);
        $http({
            method:'POST',
            url:'api/linking/learnFromMapping',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            data: "evaluation=" + encodeURIComponent(JSON.stringify(data)) + "&" +
            "spec=" + encodeURIComponent(JSON.stringify($rootScope.linkspec)) + "&" +
            "project=" + encodeURIComponent($rootScope.session.project) + "&" +
            "username=" + encodeURIComponent($rootScope.session.username)
        }).success( function (data, status, headers, config) {
            $rootScope.newLinkspec = angular.copy(data);

            $rootScope.guiStatus.isLoading = false;
            $rootScope.guiStatus.isLinkSpecOpen = true;
            $rootScope.guiStatus.isProposedSpecOpen = true;
        }).error( function(data, status, headers, config) {
            console.log('fail on: ' + status);
            console.log('data: ' + data);
            $rootScope.guiStatus.isLoading = false;
        });
    });
    
    $rootScope.acceptLinkSpec = function () {
    	$rootScope.linkspec = angular.copy($rootScope.newLinkspec);
    	$rootScope.guiStatus.isProposedSpecOpen = false;
        $rootScope.guiStatus.isLinkSpecUneditable = false;
    };
    $rootScope.rejectLinkSpec = function () {
    	$rootScope.guiStatus.isProposedSpecOpen = false;
        $rootScope.guiStatus.isLinkSpecUneditable = false;
    };

    $scope.closeSession = function () {
        $rootScope.guiStatus.isSessionOpen = true;
        $rootScope.guiStatus.isSessionDisabled = false;
        $rootScope.guiStatus.isLinkSpecOpen = false;
        $rootScope.guiStatus.isLinkSpecDisabled = true;
        $rootScope.guiStatus.isLinkSpecUneditable = true;
        $rootScope.guiStatus.isEvaluationOpen = false;
        $rootScope.guiStatus.isEvaluationDisabled = true;

        //$rootScope.evalDataRemote = {};	//not necessary by design
        //$rootScope.evalData = {};			//not necessary by design

        $rootScope.page = 0;

        delete $rootScope.sparqlServices[0];
        delete $rootScope.sparqlServices[1];
        delete $rootScope.sparqlServices[2];

        delete $rootScope.dataSources[0];
        delete $rootScope.dataSources[1];
        delete $rootScope.dataSources[2];
    };
}]);

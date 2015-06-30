app.controller('AppCtrl', ['$scope', '$q', '$rootScope', '$http', function ($scope, $q, $rootScope, $http) {

    var geoMapFactoryVirt = jassa.geo.GeoMapFactoryUtils.createWktMapFactory('http://www.w3.org/2003/01/geo/wgs84_pos#geometry', 'bif:st_intersects', 'bif:st_geomFromText');
    var geoMapFactoryAsWktVirt = jassa.geo.GeoMapFactoryUtils.createWktMapFactory('http://www.opengis.net/ont/geosparql#asWKT', 'bif:st_intersects', 'bif:st_geomFromText');
    var geoMapFactoryWgs = jassa.geo.GeoMapFactoryUtils.wgs84MapFactory;

    var createSparqlService = function (url, graphUris) {
        var result = jassa.service.SparqlServiceBuilder.http(url, graphUris, {type: 'POST'}).cache().virtFix().paginate(1000).create();
        return result;
    };
    
    $scope.langs = ['en', 'de'];

    // TODO: Whenever the facet selection changes, we need to recreate the map data source service for the modified concept
    var createMapDataSource = function(sparqlService, geoMapFactory, concept, fillColor) {

        // The 'core' service from which to retrieve the initial data
        var bboxListService = new jassa.geo.ListServiceBbox(sparqlService, geoMapFactory, concept);

        // Wrap this service for augmenting (enriching) it with labels
        // TODO Make dependent on scope.langs
        var lookupServiceLabels = jassa.sponate.LookupServiceUtils.createLookupServiceNodeLabels(sparqlService, new jassa.sparql.LiteralPreference($scope.langs));

        // Transform the labels
        bboxListService = new jassa.service.ListServiceTransformItems(bboxListService, function(entries) {
            var keys = _(entries).pluck('key');
            return lookupServiceLabels.lookup(keys).then(function(map) {
                entries.forEach(function(entry) {
                    var labelInfo = map.get(entry.key);
                    entry.val.shortLabel = labelInfo ? labelInfo.displayLabel : '(no label)';
                });

                return entries;
            });
        });

        // Add custom attributes
        bboxListService = new jassa.service.ListServiceTransformItem(bboxListService, function(entry) {

            var data = {
                fillColor: fillColor,
                fontColor: fillColor,
                strokeColor: fillColor,

                stroke: true,
                strokeLinecap: 'round',
                strokeWidth: 100,
                pointRadius: 12,
                labelAlign: 'cm'
            };

            _(entry.val).extend(data);

            return entry;
        });

        var result = new jassa.geo.DataServiceBboxCache(bboxListService, 500, 300, 2);

        return result;
    };

    var bounds = new jassa.geo.Bounds(7.0, 49.0, 9, 51.0);
    
    $scope.mapSources = [];
    $scope.dataSources = {};
    $scope.sparqlServices = {};

    $scope.selectGeom = function (data) {
        alert(JSON.stringify(data.id));
        console.log('Status', data.id);
    };

    $scope.mapConfig = {
        center: {lon: 12.37, lat: 51.34},
        zoom: 12
    };

    $scope.setLeipzig = function () {
        $scope.mapConfig.center = {lon: 12.236, lat: 51.4238};
        $scope.mapConfig.zoom = 17;
    };

    $scope.setDenver = function () {
        $scope.mapConfig.center = {lon: 255.46310301, lat: 39.7882984};
        $scope.mapConfig.zoom = 15;
    };

    $scope.logDatasources = function () {

        for (var key in $scope.mapSources) {
            var foo1 = $scope.mapSources[key].fetchData(bounds);
            foo1.then(function (entries) {
                console.log(entries);
            });
        }
    };

    $scope.$watch('mapConfig', function (v) {
        console.log('Config changed: ' + JSON.stringify(v));
    }, true);

    $scope.links = [];

    $scope.updateMapSources = function() {

        for(var i = 0; i < $scope.mapSources; i++) {
            delete $scope.mapSources[i];
        }
        $scope.mapSources = [];

        for(var key in $scope.dataSources) {
            $scope.mapSources.push($scope.dataSources[key]);
        }
        console.log($scope.mapSources);
        console.log($scope.sparqlServices);
    };

    $rootScope.$on("Source", function(event, data) {
        $scope.sparqlServices[0] = createSparqlService(data.sparql, data.graph);
        var conceptA = jassa.sparql.ConceptUtils.createTypeConcept('http://dbpedia.org/ontology/Airport');
        $scope.dataSources[0] = createMapDataSource($scope.sparqlServices[0], geoMapFactoryVirt, conceptA, '#2000CC');
        $scope.updateMapSources();
        console.log("add to source datasource");
    });

    $rootScope.$on("Target", function(event, data) {
        $scope.sparqlServices[1] = createSparqlService(data.sparql, data.graph);
        var conceptB = jassa.sparql.ConceptUtils.createTypeConcept('http://linkedgeodata.org/ontology/Airport');
        $scope.dataSources[1] = createMapDataSource($scope.sparqlServices[1], geoMapFactoryWgs, conceptB, '#CC0020');
        $scope.updateMapSources();
        console.log("add to target datasource");
    });

    $rootScope.$on("Link", function(event, data) {
        //geomized graph
        $scope.sparqlServices[2] = createSparqlService(data.sparql, data.graph);
        var conceptC = jassa.sparql.ConceptUtils.createTypeConcept('http://www.linklion.org/ontology#Link');
        $scope.dataSources[2] = createMapDataSource($scope.sparqlServices[2], geoMapFactoryAsWktVirt, conceptC, '#20CC20');
        $scope.updateMapSources();
        console.log("add to link datasource");

        // Link List
        linkStore = new jassa.sponate.StoreFacade($scope.sparqlServices[2], {
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'llo': 'http://www.linklion.org/ontology#'
        });

        linkStore.addTemplate({
            name: 'spo',
            template: [{
                id: '?s',
                displayLabel: { $ref: { target: mappedConcept, attr: 'displayLabel' }},
                predicates: [{
                    id: '?p',
                    displayLabel: { $ref: { target: mappedConcept, attr: 'displayLabel', on: '?p' }},
                    values: [{
                        id: '?o',
                        displayLabel: { $ref: { target: mappedConcept, attr: 'displayLabel', on: '?o' }}
                    }]
                }]
            }],
            from: '?s ?p ?o'
        });

        linkStore.addMap({
            name: 'source',
            template: 'spo',
            service: $scope.sparqlServices[0]
        });

        linkStore.addMap({
            name: 'target',
            template: 'spo',
            service: $scope.sparqlServices[1]
        });

        linkStore.addMap({
            name: 'links',
            template: [{
                id: '?l',
                source: { $ref: { target: 'source', on: '?s' } },
                target: { $ref: { target: 'target', on: '?t' } }
            }],
            from: '?l a llo:Link; rdf:subject ?s; rdf:object ?t'
        });
    });

    $rootScope.$on("Eval", function(event, data) {
        $scope.sparqlServices[3] = createSparqlService(data.sparql, data.graph);
        console.log("add to eval graph");
        console.log($scope.sparqlServices);
    });

    var bestLiteralConfig = new jassa.sparql.BestLabelConfig(); //['ja', 'ko', 'en', '']);
    var mappedConcept = jassa.sponate.MappedConceptUtils.createMappedConceptBestLabel(bestLiteralConfig);

    var orderBySource = function(map) {
        var result = Object.keys(map);
        _(result).orderBy(function(item) {
            var s = item.sources;
            var r = s.length + '-' + s.join('-');
            return r;
        });
        return result;
    };

    $scope.sourceOrderFn = function(item) {
        var s = item.sources;
        var r = s.length + '-' + s.join('-');
        //console.log('Item: ', item, r);
        return r;
    };

    $scope.$watch("page", function(newValue, oldValue) {
    	var offset = newValue - 1;
    	console.log("offset: " + offset + "\npage: " + $scope.page + "\nnew: " + newValue + "\nold: " + oldValue);
        if(typeof linkStore != "undefined") {
            $q.when(linkStore.links.getListService().fetchItems(null, 1, offset).then(function (entries) {
                return entries.map(function (entry) {
                    return entry.val;
                });
            })).then(function (links) {
                // Enrich links with a cluster for the predicates
                links.forEach(function (link) {	
                    var cluster = jassa.util.ClusterUtils.clusterLink(link);
                    // TODO Add the property display labels
//                     _(cluster).forEach(function(cluster) {
//                     })
                    link.cluster = cluster;
                    $scope.currentlink = link;
                    //console.log(link);
                });
                $scope.links = links;
                $scope.setEvalradio($scope.currentlink.id);
                console.log("current link (" + $scope.page + " of " + $scope.TotalItems + "): " + $scope.currentlink.$$hashKey + "\n" + $scope.currentlink.id + " : " + $scope.currentEval);
            })
            
            $q.when(linkStore.links.getListService().fetchCount()).then(function (countInfo) {
        		$scope.TotalItems =  countInfo.count;
                //console.log("linkStore count=" + countInfo.count);
            });
        }
    });

    //TODO: MOVE EVALUATION STUFF TO GUIController.js
    //EVALUATION STUFF BELOW
    $rootScope.page = 0;
    $scope.numItems = 1;
    $scope.currentlink;
    $scope.maxSize = 5;
    $scope.TotalItems = 42;

    $scope.currentEval = 'unknown';
    $scope.evalData = {};
    $scope.evalDataRemote = {};

    $scope.sendEval = function () {
    	if (_.isEmpty($scope.evalData)) {
        	console.log("No evaluation data to send!");
        	alert("No evaluation data to send!");
    	} else {
        	$rootScope.$broadcast("Evaluation",$scope.evalData);
    	}
    };

    $scope.learnFromMapping = function () {
    	if (_.isEmpty($scope.evalData)) {
        	console.log("No evaluation data to send!");
        	alert("No evaluation data to send!");
    	} else {
        	$rootScope.$broadcast("Mapping",$scope.evalData);
    	}
    };
    
    $scope.saveEval = function (evalLink, evalValue) {
    	if (evalLink == undefined || evalValue == undefined) {
        	console.log("an element is undefined!  " + evalLink + ":" + evalValue);
    	} else {
	    	console.log("evalLink:evalValue=\n" + evalLink + ":" + evalValue);
	    	$scope.evalData[evalLink] = evalValue;
    	}
    };
    
    $scope.setEvalradio = function (evalLink) {
    	if (evalLink == undefined) {
        	console.log("setEval - link undefined!:\n" + evalLink);
        	$scope.currentEval = undefined;
    	}     	
    	if ($scope.evalData[evalLink] == undefined) {
        	//console.log("setEval - evaluation of link undefined!\n" + evalLink + ":" + $scope.evalData[evalLink]);
			console.log("Link evaluation not found locally!");
        	//$scope.currentEval = "unknown"; //if a link has not been evaluated, is the evaluation of it "unknown"?
        	if ($rootScope.graphLink.eval == undefined) {
        		console.log("No evaluation graph found!");
            	$scope.currentEval = undefined;
        	} else {
        		//$scope.getEval($rootScope.graphLink.evalJSONshort, evalLink);
        		//$scope.currentEval = undefined;
        		if ($scope.evalDataRemote[evalLink] == undefined) {
        			console.log("Link not found in user's remote SPARQL store!");
        			$scope.currentEval = undefined;
        		} else {
        			console.log("Link evaluation found in evalDataRemote!");
            		$scope.currentEval = $scope.evalDataRemote[evalLink];
        		}
        	}
    	} else {
	    	$scope.currentEval = $scope.evalData[evalLink];
    	}
    };
    
    $scope.getEval = function (JSON, evalLink) {
		$rootScope.guiStatus.isLoading = true;
    	if (JSON == undefined || evalLink == undefined) {
    		console.log("getEval - JSON graph or link undefined!\n" + JSON + " " + evalLink);
    		$rootScope.guiStatus.isLoading = false;
    	} else {
			//http://fastreboot.de/kevin/BobJr/eval/
			//select * {?s <http://www.linklion.org/ontology#hasEvalStatus> ?o}
			//http://fastreboot.de:8890/sparql?qtxt=select+*+%7B%3Fs+%3Chttp%3A%2F%2Fwww.linklion.org%2Fontology%23hasEvalStatus%3E+%3Fo%7D&default-graph-uri=http://fastreboot.de/kevin/BobJr/eval/
			//http://fastreboot.de:8890/sparql?default-graph-uri=http://fastreboot.de/kevin/BobJr/eval/&query=select+*+%7B%3Fs+%3Chttp%3A%2F%2Fwww.linklion.org%2Fontology%23hasEvalStatus%3E+%3Fo%7D&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on
			console.log("getting eval from remote graph");
		    
			$http.get(JSON).
			success(function(data, status, headers, config) {
        		$rootScope.guiStatus.isLoading = false;
		    	//console.log(data);
		    	console.log("data got!");

		    	debug = evalLink;
		    	var link = evalLink.split("http://example.org/")[1];
		    	
		    	var userEval = $rootScope.graphLink.evalPrefix1 + $rootScope.graphLink.evalPrefix2 + link + $rootScope.graphLink.evalSuffix + $rootScope.session.username;
		    	
		    	console.log("looking for: " + userEval);
		    	for (var int = 0; int < data.results.bindings.length; int++) {
		    		if(data.results.bindings[int].s.value == userEval){
					    console.log("found eval:" + data.results.bindings[int].s.value + ":" + data.results.bindings[int].o.value);
					    //return data.results.bindings[int].o.value;
					    $scope.currentEval = data.results.bindings[int].o.value;
					} else {
					    console.log("link mismatch:" + data.results.bindings[int].s.value + ":" + data.results.bindings[int].o.value);
					}
				}
			}).
			error(function(data, status, headers, config) {
				console.log("ERROR: Cannot retrieve data from:" + JSON);
		    	console.log(status);
		    	$scope.currentEval = undefined;
        		$rootScope.guiStatus.isLoading = false;
		    });
    	}
    }
    
    $scope.getAllEval = function () {
		$rootScope.guiStatus.isLoading = true;
		
		//http://fastreboot.de/kevin/BobJr/eval/
		//select * {?s <http://www.linklion.org/ontology#hasEvalStatus> ?o}
		//http://fastreboot.de:8890/sparql?qtxt=select+*+%7B%3Fs+%3Chttp%3A%2F%2Fwww.linklion.org%2Fontology%23hasEvalStatus%3E+%3Fo%7D&default-graph-uri=http://fastreboot.de/kevin/BobJr/eval/
		//http://fastreboot.de:8890/sparql?default-graph-uri=http://fastreboot.de/kevin/BobJr/eval/&query=select+*+%7B%3Fs+%3Chttp%3A%2F%2Fwww.linklion.org%2Fontology%23hasEvalStatus%3E+%3Fo%7D&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on
		
		console.log("getting ALL eval from remote graph");
	    
		$http.get($rootScope.graphLink.evalJSONshort).
		success(function(data, status, headers, config) {
	    	//console.log(data);
	    	console.log("data got!");
	    	
	    	for (var int = 0; int < data.results.bindings.length; int++) {
	    		var link = data.results.bindings[int].s.value;
	    		debug = link;
	    		
	    		var evalLink = $rootScope.graphLink.evalPrefix1 + link.split($rootScope.graphLink.evalPrefix2)[1].split($rootScope.graphLink.evalSuffix)[0]
	    		var value = data.results.bindings[int].o.value;
	    		
	    		console.log("adding: " + evalLink + ":" + value);
    			$scope.evalDataRemote[evalLink] = value;
			}
	    	
    		$rootScope.guiStatus.isLoading = false;
		}).
		error(function(data, status, headers, config) {
			console.log("ERROR: Cannot retrieve data from:" + JSON);
	    	console.log(status);
    		$rootScope.guiStatus.isLoading = false;
	    });
    }
}]);

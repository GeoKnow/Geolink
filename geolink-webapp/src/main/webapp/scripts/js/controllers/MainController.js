app.controller('AppCtrl', ['$scope', '$q', '$rootScope', '$http', '$log', '$dddi', function ($scope, $q, $rootScope, $http, $log, $dddi) {

    var geoMapFactoryVirt = jassa.geo.GeoMapFactoryUtils.createWktMapFactory('http://www.w3.org/2003/01/geo/wgs84_pos#geometry', 'bif:st_intersects', 'bif:st_geomFromText');
    var geoMapFactoryAsWktVirt = jassa.geo.GeoMapFactoryUtils.createWktMapFactory('http://www.opengis.net/ont/geosparql#asWKT', 'bif:st_intersects', 'bif:st_geomFromText');
    var geoMapFactoryWgs = jassa.geo.GeoMapFactoryUtils.wgs84MapFactory;

    var createSparqlService = function (url, graphUris) {
        //var result = jassa.service.SparqlServiceBuilder.http(url, graphUris, {type: 'POST'}).cache().virtFix().paginate(1000).create();
        var result = jassa.service.SparqlServiceBuilder.http(url, graphUris, {type: 'POST'}).create();
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
    $rootScope.dataSources = {};
    $rootScope.sparqlServices = {};

    $rootScope.$watch('sparqlServices', function(sparqls) {
        console.log('Update MapSources', $rootScope.sparqlServices);
        $scope.updateMapSources();
    }, true);

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

    $scope.links = [];

    $scope.updateMapSources = function() {

        for(var i = 0; i < $scope.mapSources; i++) {
            delete $scope.mapSources[i];
        }
        $scope.mapSources = [];

        for(var key in $rootScope.dataSources) {
            $scope.mapSources.push($rootScope.dataSources[key]);
        }
    };

    var trimVar = function(varName) {
        var result = varName && varName.charAt(0) === '?'
            ? varName.substr(1)
            : varName;

        return result;
    };

    var createConceptFromKbInfo = function(kbInfo) {
        // TODO Properly treat arrays with more than 1 element
        var element = new jassa.sparql.ElementString.create(kbInfo.restrictions[0]);
        var v = jassa.rdf.NodeFactory.createVar(trimVar(kbInfo['var']));
        var result = new jassa.sparql.Concept(element, v);
        return result;
    };

    var validateLinkSpec = function(ls) {
        var result = ls != null && ls.endpoint && ls.graph; // TODO test for more stuff
        return result;
    };


    //var dddi = $dddi($scope);


    var updateMapDataSource = function(kbInfo, index, geoMapFactory, color) {
        var isValid = validateLinkSpec(kbInfo);
        if(isValid) {
            $log.log('Detected change in link spec - recreating index ' + index);
            $rootScope.sparqlServices[index] = createSparqlService(kbInfo.endpoint, [kbInfo.graph]);
            //var conceptA = jassa.sparql.ConceptUtils.createTypeConcept('http://dbpedia.org/ontology/Airport');
            var concept = createConceptFromKbInfo(kbInfo);
            $log.log('Concept: ' + concept);
            $rootScope.dataSources[index] = createMapDataSource($rootScope.sparqlServices[index], geoMapFactory, concept, color);
        }
    };

    $rootScope.$watch('currentLinkSpec.sourceInfo', function(kbInfo) {
        updateMapDataSource(kbInfo, 0, geoMapFactoryVirt, '#2000CC');
    });

    $rootScope.$watch('currentLinkSpec.targetInfo', function(kbInfo) {
        updateMapDataSource(kbInfo, 1, geoMapFactoryWgs, '#CC0020');
    });

    $rootScope.$on("Link", function(event, data) {
        //geomized graph
        $rootScope.sparqlServices[2] = createSparqlService(data.sparql, [data.graph]);
        var conceptC = jassa.sparql.ConceptUtils.createTypeConcept('http://www.linklion.org/ontology#Link');
        $rootScope.dataSources[2] = createMapDataSource($rootScope.sparqlServices[2], geoMapFactoryAsWktVirt, conceptC, '#20CC20');
        console.log("add to link datasource");

        // Link List
        linkStore = new jassa.sponate.StoreFacade($rootScope.sparqlServices[2], {
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
            service: $rootScope.sparqlServices[0]
        });

        linkStore.addMap({
            name: 'target',
            template: 'spo',
            service: $rootScope.sparqlServices[1]
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
        $rootScope.sparqlServices[3] = createSparqlService(data.sparql, [data.graph]);
        console.log("add to eval graph");
        console.log($rootScope.sparqlServices);
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

    $rootScope.readFromLinkStore = function (newValue) {
    	
    	if ($scope.page != newValue) {
    		//TODO: debug
    		console.log("funky stuff is happening. debug later");
    		$scope.page = newValue;
    	}
    	
    	var offset = newValue - 1;
    	if(typeof linkStore != "undefined") {
            //debug = linkStore;
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

                $scope.setMap($scope.currentlink);

                console.log("current link (" + $scope.page + " of " + $scope.TotalItems + "): " + $scope.currentlink.$$hashKey + "\n" + $scope.currentlink.id + " : " + $scope.currentEval);
            });
            
            $q.when(linkStore.links.getListService().fetchCount()).then(function (countInfo) {
                $scope.TotalItems =  countInfo.count;
                if (countInfo.count == 0) {
                	alert("No links returned from server!");
                	
                	$rootScope.guiStatus.isSessionDisabled = true;
                    $rootScope.guiStatus.isLinkSpecOpen = true;
                    $rootScope.guiStatus.isLinkSpecDisabled = false;
                    $rootScope.guiStatus.isLinkSpecUneditable = false;
                    $rootScope.guiStatus.isEvaluationOpen = false;
                    $rootScope.guiStatus.isEvaluationDisabled = true;
                    
                    //$scope.page = 0;
                }
                    //console.log("linkStore count=" + countInfo.count);
            	});
    	} else {
    		console.log("linkStore undefined!");
    	};

    };
    
    
    $scope.$watch("page", function(newValue, oldValue) {
    	console.log("watcher triggered");
    	$rootScope.readFromLinkStore(newValue);
    });

    $scope.setMap = function (link) {
        //debug = link;

        var sourcelong = undefined;
        var sourcelat = undefined;
        var targetlong = undefined;
        var targetlat = undefined;

        for (var int = 0; int < link.source.predicates.length; int++) {
            if (link.source.predicates[int].id.includes('wgs84_pos#lon')) {
                sourcelong = link.source.predicates[int].values[0].id;
            }
            if (link.source.predicates[int].id.includes('wgs84_pos#lat')) {
                sourcelat = link.source.predicates[int].values[0].id;
            }
        }
        for (var int = 0; int < link.target.predicates.length; int++) {
            if (link.target.predicates[int].id.includes('wgs84_pos#lon')) {
                targetlong = link.target.predicates[int].values[0].id;
            }
            if (link.target.predicates[int].id.includes('wgs84_pos#lat')) {
                targetlat = link.target.predicates[int].values[0].id;
            }
        }

        //console.log("source: long: " + sourcelong + " lat: " + sourcelat);
        //console.log("target: long: " + targetlong + " lat: " + targetlat);

        var diff = Math.sqrt(Math.pow((sourcelong - targetlong), 2) + Math.pow((sourcelat - targetlat), 2));
        debug = diff;

        var long = (sourcelong +  targetlong) / 2;
        var lat = (sourcelat + targetlat - 0.03) / 2;


        var zoom = 13;

        $scope.mapConfig.center = {lon: long, lat: lat};
        $scope.mapConfig.zoom = zoom;
    };

    //TODO: MOVE EVALUATION STUFF TO GUIController.js
    //EVALUATION STUFF BELOW
    $rootScope.page = 0;
    //$scope.numItems = 1;
    $scope.currentlink;
    $scope.maxSize = 5;
    $scope.TotalItems = 42;

    $scope.currentEval = 'unknown';
    $rootScope.evalData = {};
    $rootScope.evalDataRemote = {};

    $scope.sendEval = function () {
        if (_.isEmpty($rootScope.evalData)) {
            console.log("No evaluation data to send!");
            alert("No evaluation data to send!");
        } else {
            $rootScope.$broadcast("Evaluation",$rootScope.evalData);
        }
    };

    $scope.learnFromMapping = function () {
        if (_.isEmpty($rootScope.evalData)) {
            console.log("No evaluation data to send!");
            alert("No evaluation data to send!");
        } else {
            $rootScope.$broadcast("Mapping",$rootScope.evalData);
        }
    };

    $scope.saveEval = function (evalLink, evalValue) {
        if (evalLink == undefined || evalValue == undefined) {
            console.log("an element is undefined!  " + evalLink + ":" + evalValue);
        } else {
            console.log("evalLink:evalValue=\n" + evalLink + ":" + evalValue);
            $rootScope.evalData[evalLink] = evalValue;
        }
    };

    $scope.setEvalradio = function (evalLink) {
        if (evalLink == undefined) {
            console.log("setEval - link undefined!:\n" + evalLink);
            $scope.currentEval = undefined;
        }
        if ($rootScope.evalData[evalLink] == undefined) {	//check local eval store
            //console.log("setEval - evaluation of link undefined!\n" + evalLink + ":" + $rootScope.evalData[evalLink]);
            console.log("Link evaluation not found locally!");
            //$scope.currentEval = "unknown"; //if a link has not been evaluated, is the evaluation of it "unknown"?
            if ($rootScope.graphLink.eval == undefined) {
                console.log("No evaluation graph found!");
                $scope.currentEval = undefined;
            } else {
                //$scope.getEval($rootScope.graphLink.evalJSONshort, evalLink);
                //$scope.currentEval = undefined;
                if ($rootScope.evalDataRemote[evalLink] == undefined) {	//check remote eval store (remote store is loaded on session creation)
                    console.log("Link not found in user's remote SPARQL store!");
                    $scope.currentEval = undefined;
                } else {
                    console.log("Link evaluation found in evalDataRemote!");
                    $scope.currentEval = $rootScope.evalDataRemote[evalLink];
                }
            }
        } else {
            $scope.currentEval = $rootScope.evalData[evalLink];
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

                //debug = evalLink;
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
    };

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
                //debug = link;

                var evalLink = $rootScope.graphLink.evalPrefix1 + link.split($rootScope.graphLink.evalPrefix2)[1].split($rootScope.graphLink.evalSuffix)[0];
                var value = data.results.bindings[int].o.value;

                console.log("adding: " + evalLink + ":" + value);
                $rootScope.evalDataRemote[evalLink] = value;
            }

            $rootScope.guiStatus.isLoading = false;
        }).
        error(function(data, status, headers, config) {
            console.log("ERROR: Cannot retrieve data from:" + JSON);
            console.log(status);
            $rootScope.guiStatus.isLoading = false;
        });
    };
    
    $scope.loadTime = 0;
    $scope.loadTimes = [];
    $scope.startLoad = 0;
    $scope.endLoad = 0;
    
    var easterBunnies = [  "Sending LinkSpec",
                           "Generating InterLinks",
	                       "Linking...",
	                       "Generating Genome",
	                       "...",
	                       "Thinking...",
	                       "Thinking Harder",
	                       "Injecting T-Rex Genome",
	                       "Chasing Lost T-Rex",
	                       "Closing Jurassic Park",
	                       "undefined",
	                       "Fixing Bugs",
	                       "Running Garbage Collection",
	                       "Still Loading...",
	                       "Taking a Nap",
	                       "Loading...",
	                       ];
    
    $scope.loadingMessage = "Loading...";
    
    var easteregg;
    var messageNum = 0;
    
    $scope.$watch("guiStatus.isLoading", function(newValue, oldValue) {
    	if (newValue) {
    		$scope.startLoad = new Date().getTime();
    		
    		easteregg = setInterval(function () {
        		console.log("timer event: " + easterBunnies[messageNum]);
        		document.getElementById('progressbar').innerHTML = easterBunnies[messageNum];
        		if (messageNum < easterBunnies.length -1 && $scope.guiStatus.isLoading) {
        			messageNum = messageNum + 1; 
        		};
        	}, 3000);
    	} else {
    		$scope.endLoad = new Date().getTime();
            $scope.loadTime = $scope.endLoad - $scope.startLoad;
            console.log("loadtime: " + $scope.loadTime  + "ms");
            $scope.loadTimes.push($scope.loadTime);
            
            messageNum = 0;
            document.getElementById('progressbar').innerHTML = easterBunnies[messageNum];
            clearInterval(easteregg);
    	}
    });
}]);

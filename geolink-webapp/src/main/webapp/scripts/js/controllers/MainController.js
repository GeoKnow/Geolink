app.controller('AppCtrl', ['$scope', '$q', '$rootScope', function ($scope, $q, $rootScope) {

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
    
    $scope.dataSources = [];

    $scope.sparqlServices = [];

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

        for (var i = 0; i < $scope.dataSources.length; i++) {
            var foo1 = $scope.dataSources[i].fetchData(bounds);
            foo1.then(function (entries) {
                console.log(entries);
            });
        }
    };

    $scope.$watch('mapConfig', function (v) {
        console.log('Config changed: ' + JSON.stringify(v));
    }, true);

    $scope.links = ['test', 'foobar'];

    $rootScope.$on("Clear", function() {
        for(var i=0; i < $scope.dataSources.length; ++i) {
            delete $scope.dataSources[i];
        }
        for(var i=0; i < $scope.sparqlServices.length; ++i) {
            delete $scope.sparqlServices[i];
        }
    });

    $rootScope.$on("Source1", function(event, data) {
    	var sparqlService = createSparqlService(data.sparql, data.graph);
        $scope.sparqlServices.push(sparqlService);
        var conceptA = jassa.sparql.ConceptUtils.createTypeConcept('http://dbpedia.org/ontology/Airport');
    	var mapsource = createMapDataSource(sparqlService, geoMapFactoryVirt, conceptA, '#2000CC');
        console.log("add to datasource 1");
        console.log(mapsource);
        $scope.dataSources.push(mapsource);
    });

    $rootScope.$on("Source2", function(event, data) {
    	var sparqlService = createSparqlService(data.sparql, data.graph);
        $scope.sparqlServices.push(sparqlService);
        var conceptB = jassa.sparql.ConceptUtils.createTypeConcept('http://linkedgeodata.org/ontology/Airport');
    	var mapsource = createMapDataSource(sparqlService, geoMapFactoryWgs, conceptB, '#CC0020');
        console.log("add to datasource 2");
        console.log(mapsource);
        $scope.dataSources.push(mapsource);
    });

    $rootScope.$on("Source3", function(event, data) {
    	var sparqlService = createSparqlService(data.sparql, data.graph);
        $scope.sparqlServices.push(sparqlService);
        var conceptC = jassa.sparql.ConceptUtils.createTypeConcept('http://www.linklion.org/ontology#Link');
        var mapsource = createMapDataSource(sparqlService, geoMapFactoryAsWktVirt, conceptC, '#20CC20');
        console.log("add to datasource 3");
        console.log(mapsource);
        $scope.dataSources.push(mapsource);


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
            name: 'dbpedia-data',
            template: 'spo',
            service: $scope.sparqlServices[1]
        });

        linkStore.addMap({
            name: 'lgd-data',
            template: 'spo',
            service: $scope.sparqlServices[0]
        });

        linkStore.addMap({
            name: 'links',
            template: [{
                id: '?l',
                source: { $ref: { target: 'dbpedia-data', on: '?s' } },
                target: { $ref: { target: 'lgd-data', on: '?t' } }
            }],
            from: '?l a llo:Link; rdf:subject ?s; rdf:object ?t'
        });


    });

    var bestLiteralConfig = new jassa.sparql.BestLabelConfig(); //['ja', 'ko', 'en', '']);
    var mappedConcept = jassa.sponate.MappedConceptUtils.createMappedConceptBestLabel(bestLiteralConfig);

    $scope.offset = 0;

    $scope.numItems = 10;

    var orderBySource = function(map) {
        console.log("ORDER Source!!!!!");
        var result = Object.keys(map);
        _(result).orderBy(function(item) {
            var s = item.sources;
            var r = s.length + '-' + s.join('-');
            return r;
        });
        return result;
    };

    $scope.sourceOrderFn = function(item) {
        console.log("ORDER FN!!!!!");
        var s = item.sources;
        var r = s.length + '-' + s.join('-');
        //console.log('Item: ', item, r);
        return r;
    };

    $scope.$watchCollection('[offset, numItems]', function(newi, oldi) {
        console.log("HIIIIIIIEEEEERRRRRRRR");
        console.log(oldi);
        console.log(newi);
        if(typeof linkStore != "undefined") {
            console.log(linkStore);
            $q.when(linkStore.links.getListService().fetchItems(null, $scope.numItems, $scope.offset).then(function (entries) {
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
                });
                //console.log('Links: ', links);
                $scope.links = links;
                console.log("LINKS");
                console.log($scope.links);
            })
        }
    });
}]);
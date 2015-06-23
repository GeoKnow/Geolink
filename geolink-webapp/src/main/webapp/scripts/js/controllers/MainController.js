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


    // Move to GUIController to avoid broadcast
    $scope.is_evalbutton_disabled = true;

    // This one too
    $scope.sendEvaluation = function () {
        testdata = {
            "http://example.org/link-8e6fc3b7c321b1817504b50931e75ba7" : 0,
            "http://example.org/link-59561a9a0883af8df367c1c4476be3bb" : 1,
            "http://example.org/link-90e5df2f8ace81dd014d82e1795d3555" : 1,
            "http://example.org/link-fba73f9fd33fa990bd32d441716fe79e" : 2
        };
        $rootScope.$broadcast("Evaluation",testdata);
    };

    $scope.$watch('mapConfig', function (v) {
        console.log('Config changed: ' + JSON.stringify(v));
    }, true);

    $scope.links = ['test', 'foobar'];

    $scope.updateMapSources = function() {

        for(var i = 0; i < $scope.mapSources; i++) {
            delete $scope.mapSources[i];
        }
        $scope.mapSources = [];

        for(var key in $scope.dataSources) {
            $scope.mapSources.push($scope.dataSources[key]);
        }
        console.log($scope.mapSources);
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

        //Activate eval button
        $scope.is_evalbutton_disabled = false;



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

    var bestLiteralConfig = new jassa.sparql.BestLabelConfig(); //['ja', 'ko', 'en', '']);
    var mappedConcept = jassa.sponate.MappedConceptUtils.createMappedConceptBestLabel(bestLiteralConfig);

    $scope.offset = 0;

    $scope.numItems = 10;

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

    $scope.$watchCollection('[offset, numItems]', function(newi, oldi) {
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
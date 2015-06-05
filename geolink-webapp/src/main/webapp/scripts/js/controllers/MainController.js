app.controller('AppCtrl', ['$scope','$http', function ($scope, $http) {

    var geoMapFactoryVirt = jassa.geo.GeoMapFactoryUtils.createWktMapFactory('http://www.w3.org/2003/01/geo/wgs84_pos#geometry', 'bif:st_intersects', 'bif:st_geomFromText');
    var geoMapFactoryAsWktVirt = jassa.geo.GeoMapFactoryUtils.createWktMapFactory('http://www.opengis.net/ont/geosparql#asWKT', 'bif:st_intersects', 'bif:st_geomFromText');
    var geoMapFactoryWgs = jassa.geo.GeoMapFactoryUtils.wgs84MapFactory;

    var createSparqlService = function (url, graphUris) {
        var result = jassa.service.SparqlServiceBuilder.http(url, graphUris, {type: 'POST'}).cache().virtFix().paginate(1000).create();
        return result;
    };

    //var sparqlServiceA = createSparqlService('http://dbpedia.org/sparql', ['http://dbpedia.org']);
    //var sparqlServiceB = createSparqlService('http://linkedgeodata.org/sparql', ['http://linkedgeodata.org']);
    var sparqlServiceA = createSparqlService('http://fastreboot.de:8890/sparql', ['http://fastreboot.de/dbpediatest']);
    var sparqlServiceB = createSparqlService('http://fastreboot.de:8890/sparql', ['http://fastreboot.de/lgdtest']);
    var sparqlServiceC; // = createSparqlService('http://fastreboot.de:8890/sparql', ['http://fastreboot.de/geomizeddata']);
    //var sparqlServiceC = createSparqlService('http://fastreboot.de:8890/sparql', ['http://fastreboot.de/geomizeddata']);
    var conceptA = jassa.sparql.ConceptUtils.createTypeConcept('http://dbpedia.org/ontology/Airport');
    var conceptB = jassa.sparql.ConceptUtils.createTypeConcept('http://linkedgeodata.org/ontology/Airport');
    var conceptC = jassa.sparql.ConceptUtils.createTypeConcept('http://www.linklion.org/ontology#Link');

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

/*
    var createMapDataSource = function (sparqlService, geoMapFactory, concept, fillColor) {
        var attrs = {
            fillColor: fillColor,
            fontColor: fillColor,
            strokeColor: fillColor,

            stroke: true,
            strokeLinecap: 'round',
            strokeWidth: 100,
            pointRadius: 12,
            labelAlign: 'cm'
        };

        var result = jassa.geo.GeoDataSourceUtils.createGeoDataSourceLabels(sparqlService, geoMapFactory, concept, attrs);
        console.log(result);
        return result;
    };
*/
    var bounds = new jassa.geo.Bounds(7.0, 49.0, 9, 51.0);

    $scope.dataSources = [
        createMapDataSource(sparqlServiceA, geoMapFactoryVirt, conceptA, '#CC0020'),
        createMapDataSource(sparqlServiceB, geoMapFactoryWgs, conceptB, '#2000CC')
        //createMapDataSource(sparqlServiceC, geoMapFactoryAsWktVirt, conceptC, '#20CC20')
    ];

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

    $scope.prefixes = {
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
    };

    $scope.linkspec = {
        prefixes: $scope.prefixes,
        sourceInfo: {
            id: 'DBpedia',
            type: 'sparql',
            //endpoint: 'http://dbpedia.org/sparql',
            endpoint: 'http://fastreboot.de:8890/sparql',
            //graph: 'http://dbpedia.org',
            graph: 'http://fastreboot.de/dbpediatest',
            restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
            'var': '?x',
            properties: ['rdfs:label AS nolang->lowercase']
        },
        targetInfo: {
            id: 'LinkedGeoData',
            type: 'sparql',
            //endpoint: 'http://linkedgeodata.org/sparql',
            endpoint: 'http://fastreboot.de:8890/sparql',
            //graph: 'http://linkedgeodata.org',
            graph: 'http://fastreboot.de/lgdtest',
            restrictions: ['?y a <http://linkedgeodata.org/ontology/Airport>'],
            'var': '?y',
            properties: ['rdfs:label AS nolang->lowercase']
        },
        metricExpression: 'trigrams(x.rdfs:label, y.rdfs:label)',
        acceptanceThreshold: 0.9
    };

    $scope.addGraph = function(sparql, graph) {
        sparqlServiceC = createSparqlService(sparql, [graph]);
        var mapsource = createMapDataSource(sparqlServiceC, geoMapFactoryAsWktVirt, conceptC, '#20CC20');
        console.log("add to datasource geomized");
        $scope.dataSources.push(mapsource);
    };

    $scope.sendLinkSpec = function () {
        console.log('Send LinkSpec');
        $http({
            method:'POST',
            url:'api/linking/executeFromSpec',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            data: "spec=" + encodeURIComponent(JSON.stringify($scope.linkspec))
        }).success( function (data, status, headers, config) {
            console.log(JSON.stringify(data));
            $scope.addGraph(data.sparql, data.graph);
        }).error( function(data, status, headers, config) {
            console.log(data);
        });
    };

    $scope.$watch('mapConfig', function (v) {
        console.log('Config changed: ' + JSON.stringify(v));
    }, true);

    $scope.links = ['test', 'foobar'];

    $scope.diff = [{
        id: 'http://myfirstList',
        displayLabel: 'Link1',
        source: {
            id: 'http://foo',
            displayLabel: 'Foo'
        },
        target: {
            id: 'http://bar',
            displayLabel: 'Bar'
        },
        predicateGroups: [{
            id: 'http://my-label-group',
            displayLabel: 'LabelGroup',
            members: [{
                predicate: {
                    id: 'http://rdfs/label',
                    displayLabel: 'label'
                },
                value: {
                    id: 'http://foo/Anne',
                    displayLabel: 'Anne'
                },
                status: 'added'
            }, {
                predicate: {
                    id: 'http://skos/label',
                    displayLabel: 'skos-label'
                },
                value: {
                    id: 'http://foo/Anne',
                    displayLabel: 'Anne'
                },
                status: 'added'
            }]
        }, {
            id: 'http://my-label-group',
            displayLabel: 'TypeGroup',
            children: [{
                id: 'http://my-type-subgroup',
                displayLabel: 'TypeSubGroup',
                children: [{
                    id: 'http://subsub',
                    displayLabel: 'TypeSubSubGroup'
                }
                ]

            }
            ],
            members: [{
                predicate: {
                    id: 'http://rdfs/label',
                    displayLabel: 'label'
                },
                value: {
                    id: 'http://foo/Anne',
                    displayLabel: 'Anne'
                },
                status: 'added'
            }, {
                predicate: {
                    id: 'http://skos/label',
                    displayLabel: 'skos-label'
                },
                value: {
                    id: 'http://foo/Anne',
                    displayLabel: 'Anne'
                },
                status: 'added'
            }]
        }]
    }
    ]
}]);

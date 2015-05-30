app.controller('AppCtrl', ['$scope','$http', function ($scope, $http) {

    var geoMapFactoryAsWktVirt = jassa.geo.GeoMapFactoryUtils.createWktMapFactory('http://www.opengis.net/ont/geosparql#asWKT', 'bif:st_intersects', 'bif:st_geomFromText');
    var geoMapFactoryWgs = jassa.geo.GeoMapFactoryUtils.wgs84MapFactory;

    var createSparqlService = function (url, graphUris) {
        result = jassa.service.SparqlServiceBuilder.http(url, graphUris, {type: 'POST'}).cache().virtFix().paginate(1000).create();
        return result;
    };

    var sparqlServiceA = createSparqlService('http://dbpedia.org/sparql', ['http://dbpedia.org']);
    var sparqlServiceB = createSparqlService('http://linkedgeodata.org/sparql', ['http://linkedgeodata.org']);
    var sparqlServiceC;
    var conceptA = jassa.sparql.ConceptUtils.createTypeConcept('http://dbpedia.org/ontology/Airport');
    var conceptB = jassa.sparql.ConceptUtils.createTypeConcept('http://linkedgeodata.org/ontology/Airport');
    var conceptC = jassa.sparql.ConceptUtils.createTypeConcept('http://www.linklion.org/ontology#Link');


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

        result = jassa.geo.GeoDataSourceUtils.createGeoDataSourceLabels(sparqlService, geoMapFactory, concept, attrs);
        return result;
    };

    var bounds = new jassa.geo.Bounds(7.0, 49.0, 9, 51.0);

    $scope.dataSources = [
        createMapDataSource(sparqlServiceA, geoMapFactoryVirt, conceptA, '#CC0020'),
        createMapDataSource(sparqlServiceB, geoMapFactoryWgs, conceptB, '#2000CC')
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

    $scope.prefixes = {
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
    };

    $scope.linkspec = {
        prefixes: $scope.prefixes,
        sourceInfo: {
            id: 'DBpedia',
            type: 'sparql',
            endpoint: 'http://dbpedia.org/sparql',
            graph: 'http://dbpedia.org',
            restrictions: ['?x a <http://dbpedia.org/ontology/Airport>'],
            'var': '?x',
            properties: ['rdfs:label AS nolang->lowercase']
        },
        targetInfo: {
            id: 'LinkedGeoData',
            type: 'sparql',
            endpoint: 'http://linkedgeodata.org/sparql',
            graph: 'http://linkedgeodata.org',
            restrictions: ['?y a <http://linkedgeodata.org/ontology/Airport>'],
            'var': '?y',
            properties: ['rdfs:label AS nolang->lowercase']
        },
        metricExpression: 'trigrams(x.rdfs:label, y.rdfs:label)',
        acceptanceThreshold: 0.9
    };

    $scope.addGraph = function(sparql, graph) {
        sparqlServiceC = createSparqlService(sparql, graph);
        mapsource = createMapDataSource(sparqlServiceC, geoMapFactoryAsWktVirt, conceptC, '#2000CC');
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

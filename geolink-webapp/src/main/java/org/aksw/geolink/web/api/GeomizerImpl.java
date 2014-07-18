package org.aksw.geolink.web.api;

import java.util.Map;

import org.aksw.jena_sparql_api.geo.LinkGeomizer;
import org.aksw.jena_sparql_api.lookup.LookupService;

import com.hp.hpl.jena.graph.Node;
import com.hp.hpl.jena.graph.Triple;
import com.vividsolutions.jts.geom.Geometry;

public class GeomizerImpl
    implements Geomizer
{
    private LookupService<Node, Geometry> lookupServiceSubjects;
    private LookupService<Node, Geometry> lookupServiceObjects;
    
    public GeomizerImpl(LookupService<Node, Geometry> lookupServiceSubjects, LookupService<Node, Geometry> lookupServiceObjects) {
        this.lookupServiceSubjects = lookupServiceSubjects;
        this.lookupServiceObjects = lookupServiceObjects;
    }
    
    public Map<Triple, Geometry> geomize(Iterable<Triple> triples) {
        Map<Triple, Geometry> result = LinkGeomizer.geomize(triples, lookupServiceSubjects, lookupServiceObjects);
        return result;
    }
}
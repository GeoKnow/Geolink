package org.aksw.geolink.web.api;

import java.util.Map;

import com.hp.hpl.jena.graph.Triple;
import com.vividsolutions.jts.geom.Geometry;

public interface Geomizer {
    Map<Triple, Geometry> geomize(Iterable<Triple> triples);
}
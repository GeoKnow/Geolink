package org.aksw.geolink.web.api;

import com.hp.hpl.jena.sparql.graph.GraphFactory;
import com.hp.hpl.jena.graph.Graph;
import virtuoso.jena.driver.VirtGraph;

/**
 * Created by Martin Stoffers.
 */
public class GeoGraphFactory {

    private String virtuosographprefix;
    private String virtuososerver;
    private String virtuosouser;
    private String virtuosopassword;

    public GeoGraphFactory(String virtuosographprefix, String virtuososerver, String virtuosouser, String virtuosopassword) {
        this.virtuosographprefix = virtuosographprefix;
        this.virtuososerver = virtuososerver;
        this.virtuosouser = virtuosouser;
        this.virtuosopassword = virtuosopassword;
    }

    public Graph getGraph(String graphressource) {
        if(this.virtuososerver == null) {
            return GraphFactory.createDefaultGraph();
        } else {
            return new VirtGraph(virtuosographprefix+graphressource, virtuososerver, virtuosouser, virtuosopassword);
        }
    }
}

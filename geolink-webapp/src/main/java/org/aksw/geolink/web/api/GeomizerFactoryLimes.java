package org.aksw.geolink.web.api;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.aksw.jena_sparql_api.concepts.Concept;
import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.geo.GeoMapSupplierUtils;
import org.aksw.jena_sparql_api.http.QueryExecutionFactoryHttp;
import org.aksw.jena_sparql_api.lookup.LookupService;
import org.aksw.jena_sparql_api.lookup.LookupServiceUtils;
import org.aksw.jena_sparql_api.mapper.MappedConcept;

import com.hp.hpl.jena.graph.Node;
import com.hp.hpl.jena.graph.NodeFactory;
import com.hp.hpl.jena.graph.Triple;
import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;
import com.vividsolutions.jts.geom.Geometry;

import de.uni_leipzig.simba.data.Mapping;
import de.uni_leipzig.simba.io.ConfigReader;
import de.uni_leipzig.simba.io.KBInfo;

public class GeomizerFactoryLimes {

    @SuppressWarnings("unchecked")
    public static List<MappedConcept<Geometry>> candidates = Arrays.asList(GeoMapSupplierUtils.mcOgcGeometry, GeoMapSupplierUtils.mcWgsGeometry);

    public static QueryExecutionFactory createSparqlService(KBInfo kbInfo) {
        QueryExecutionFactoryHttp result = new QueryExecutionFactoryHttp(kbInfo.endpoint, kbInfo.graph);
        return result;
    }

    public static MappedConcept<Geometry> detectAvailableMappedConcepts(QueryExecutionFactory sparqlService, List<MappedConcept<Geometry>> mappedConcepts) {
        MappedConcept<Geometry> result = null;

        for(MappedConcept<Geometry> mc : mappedConcepts) {
            Concept c = mc.getConcept();

            Query query = c.asQuery();
            query.setQueryAskType();

            QueryExecution qe = sparqlService.createQueryExecution(query);
            boolean hasExtension = qe.execAsk();

            if(hasExtension) {
                result = mc;
                break;
            }
        }

        return result;
    }

//    public static MappedConcept detectAvailableConcepts(sparqlService, List<Concept> mappedConcepts) {
//
//    }


    public static LookupService<Node, Geometry> createLookupService(KBInfo kbInfo) {
        QueryExecutionFactory sparqlService = createSparqlService(kbInfo);

        //MappedConcept mappedConceptGeo = GeoMapSupplierUtils.mcOgcGeometry;
        MappedConcept<Geometry> mc = detectAvailableMappedConcepts(sparqlService, candidates);

        LookupService<Node, Geometry> result = LookupServiceUtils.createLookupService(sparqlService, mc);

        return result;
    }

    public static Geomizer createGeomizer(ConfigReader config) {
        LookupService<Node, Geometry> lookupServiceA = createLookupService(config.sourceInfo);
        LookupService<Node, Geometry> lookupServiceB = createLookupService(config.targetInfo);

        Geomizer result = new GeomizerImpl(lookupServiceA, lookupServiceB);

        return result;
    }


    public static Map<Triple, Double> mappingToTriples(Mapping mapping, Node p) {
        Map<Triple, Double> result = new HashMap<Triple, Double>();

        for(Entry<String, HashMap<String, Double>> a : mapping.map.entrySet()) {
            Node s = NodeFactory.createURI(a.getKey());

            for(Entry<String, Double> b : a.getValue().entrySet()) {
                Node o = NodeFactory.createURI(b.getKey());

                Triple t = new Triple(s, p, o);
                result.put(t, b.getValue());
            }
        }

        return result;
    }

}
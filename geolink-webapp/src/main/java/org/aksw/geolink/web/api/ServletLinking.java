package org.aksw.geolink.web.api;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.aksw.jena_sparql_api.geo.GeoMapSupplierUtils;
import org.aksw.jena_sparql_api.utils.TripleUtils;
import org.jgap.InvalidConfigurationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import virtuoso.jena.driver.VirtGraph;
import virtuoso.jena.driver.VirtuosoUpdateFactory;
import virtuoso.jena.driver.VirtuosoUpdateRequest;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.hp.hpl.jena.graph.Graph;
import com.hp.hpl.jena.graph.Node;
import com.hp.hpl.jena.graph.Triple;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.util.FileManager;
import com.hp.hpl.jena.vocabulary.OWL;
import com.vividsolutions.jts.geom.Geometry;

import de.uni_leipzig.simba.data.Mapping;
import de.uni_leipzig.simba.genetics.core.Metric;
import de.uni_leipzig.simba.genetics.learner.GeneticActiveLearner;
import de.uni_leipzig.simba.genetics.learner.LinkSpecificationLearner;
import de.uni_leipzig.simba.genetics.learner.SupervisedLearnerParameters;
import de.uni_leipzig.simba.genetics.learner.UnSupervisedLearnerParameters;
import de.uni_leipzig.simba.genetics.learner.UnsupervisedLearner;
import de.uni_leipzig.simba.genetics.learner.UnsupervisedLinkSpecificationLearner;
import de.uni_leipzig.simba.genetics.util.PropertyMapping;
import de.uni_leipzig.simba.io.ConfigReader;

@Service
@Path("/linking")
@Transactional
public class ServletLinking {

    @Autowired
    private Gson gson;


    @Resource(name="foo")
    String foo;


/*
    @Autowired
    VirtGraphFactory targetGraphFactory; // VirtGraph graph = targetGraphFactory.getGraph(REST-params);
*/

    @Context
    private HttpServletRequest req;

    public static PropertyMapping getPropertyMapping(ConfigReader config) {
        PropertyMapping result = new PropertyMapping();
        for (String sourceProperty : config.getSourceInfo().properties) {
            for (String targetProperty : config.getTargetInfo().properties) {
                result.addStringPropertyMatch(sourceProperty, targetProperty);
            }
        }

        return result;
    }

    public UnsupervisedLinkSpecificationLearner createAutoLearner(
            ConfigReader config) throws InvalidConfigurationException
    {
        PropertyMapping propertyMapping = getPropertyMapping(config);

        UnSupervisedLearnerParameters params = new UnSupervisedLearnerParameters(config, propertyMapping);
        params.setGenerations(10);
        params.setPopulationSize(10);

        UnsupervisedLinkSpecificationLearner result = new UnsupervisedLearner();
        result.init(params.getConfigReader().sourceInfo,
                params.getConfigReader().targetInfo, params);

        return result;
    }


    public LinkSpecificationLearner createFeedbackLearner(ConfigReader config)
            throws InvalidConfigurationException
    {
        PropertyMapping propertyMapping = getPropertyMapping(config);

        LinkSpecificationLearner learner = new GeneticActiveLearner();// LinkSpecificationLearnerFactory.getLinkSpecificationLearner(LinkSpecificationLearnerFactory.ACTIVE_LEARNER);
        // params for the learner
        SupervisedLearnerParameters params = new SupervisedLearnerParameters(
                config, propertyMapping);
        params.setPopulationSize(20);
        params.setGenerations(100);
        params.setMutationRate(0.5f);
        params.setPreserveFittestIndividual(true);
        params.setTrainingDataSize(10);
        params.setGranularity(2);

        learner.init(config.getSourceInfo(), config.getTargetInfo(), params);

        return learner;
    }

    // @GET
    // @Produces(MediaType.APPLICATION_JSON)
    // public String getSomething(@QueryParam("id") String) {

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/learnFromSpec")
    public String learnLinkSpec(@FormParam("spec") String spec)
            throws Exception {


        ConfigReader config = gson.fromJson(spec, ConfigReader.class);
        System.out.println(config);
        System.out.println("---");
//
//        config = new ConfigReader();
//        config.validateAndRead("/home/raven/Projects/Eclipse/LIMES/Examples/Paper/largescale/lgd-dbpedia.limes.xml");
//        System.out.println(config);
//        System.out.println("---");
        config.afterPropertiesSet();
        System.out.println(config);
//        System.out.println("---");


//        Cache cache = new MemoryCache();
//        SparqlQueryModule sqm = new SparqlQueryModule(config.getSourceInfo());
//        sqm.fillCache(cache);
//        sqm.

        {
            Model model = FileManager.get().loadModel("/home/raven/Projects/Eclipse/24-7-platform/link-specifications/dbpedia-linkedgeodata-airport/positive.nt");

            Graph graph = model.getGraph();
            Set<Triple> triples = graph.find(null, null, null).toSet();

            triples = TripleUtils.swap(triples);

            Mapping mapping = toMapping(triples);
            Geomizer geomizer = GeomizerFactoryLimes.createGeomizer(config);

            writeMapping(mapping, geomizer);
//            if(true) {
//                return "{}";
//            }
        }


        UnsupervisedLinkSpecificationLearner learner = createAutoLearner(config);
        Mapping mapping = learner.learn();

        System.out.println("Mapping SIZE: " + mapping.size());

        Metric metric = learner.terminate();
        config.metricExpression = metric.getExpression();
        config.acceptanceThreshold = metric.getThreshold();


//        Geomizer geomizer = GeomizerFactoryLimes.createGeomizer(config);
//        writeMapping(mapping, geomizer);


        String result = gson.toJson(config);
        return result;
    }

    public static String createSparqlUpdateInsertData(Iterable<Triple> triples, String graphName) {
        String result = "Insert ";

        if(graphName != null) {
            result += "Into <" + graphName + "> ";
        }


        result += "{\n";

        for(Triple t : triples) {
            result += "  " + TripleUtils.toNTripleString(t) + "\n";
        }

        result += "}";

        return result;
    }

    public static void writeMapping(Mapping mapping, Geomizer geomizer) {

        Map<Triple, Double> tripleToScore = GeomizerFactoryLimes.mappingToTriples(mapping, OWL.sameAs.asNode());

        Map<Triple, Geometry> geomized = geomizer.geomize(tripleToScore.keySet());

        Set<Triple> triples = GeoMapSupplierUtils.geomizedToRdf(geomized);

        triples = GeoMapSupplierUtils.convertOgcToVirt(triples);


        String url = "jdbc:virtuoso://localhost:1161";
        VirtGraph graph = new VirtGraph("http://geolink.aksw.org/", url, "dba", "dba");


        graph.clear ();

//        for(Triple t : triples) {
//            System.out.println(TripleUtils.toNTripleString(t));
//            graph.add(t);
//        }
        //String query = "Insert Into <http://geolink.aksw.org/> { <http://example.org/link-79a05b7bbacde12596c96ebc46e24c8a> <http://www.opengis.net/ont/geosparql#asWKT> \"LINESTRING (92.0797 49.9733, 92.0794 49.9733)\"^^<http://www.openlinksw.com/schemas/virtrdf#Geometry> . }";

        String queryString = createSparqlUpdateInsertData(triples, graph.getGraphName());
        VirtuosoUpdateRequest vur = VirtuosoUpdateFactory.create(queryString, graph);
        vur.exec();
        //GraphUtil.add(graph, triples.iterator());

        graph.close();
    }

    public static Mapping toMapping(Iterable<Triple> triples) {
        Mapping result = new Mapping();
        for(Triple t : triples) {
            Node s = t.getSubject();
            Node o = t.getObject();

            if(s.isURI() && o.isURI()) {
                result.add(s.getURI(), o.getURI(), 1.0);
            }
        }
        return result;
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/learnFromMapping")
    public String learnFromMapping(@FormParam("spec") String spec,
            @FormParam("mapping") String json) throws Exception
    {
        ConfigReader config = gson.fromJson(spec, ConfigReader.class);

        Type mappingType = new TypeToken<Map<String, HashMap<String, Double>>>() {}.getType();

        Map<String, HashMap<String, Double>> map = gson.fromJson(json,
                mappingType);


        Mapping mapping = new Mapping();
        mapping.map.putAll(map);

        LinkSpecificationLearner learner = createFeedbackLearner(config);
        Mapping next = learner.learn(mapping);

        String result = gson.toJson(next);
        return result;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/delete")
    public String deleteSomethingGet(@QueryParam("id") Long id) {
        System.out.println(foo);
        return "{}";
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/delete")
    public String deleteSomething(@FormParam("id") Long id) {
        return "{}";
    }
}

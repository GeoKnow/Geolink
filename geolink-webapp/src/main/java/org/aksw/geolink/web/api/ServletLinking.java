package org.aksw.geolink.web.api;

import java.lang.reflect.Type;
import java.text.SimpleDateFormat;
import java.util.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.hp.hpl.jena.graph.*;
import com.hp.hpl.jena.vocabulary.*;
import org.aksw.commons.util.strings.StringUtils;
import org.aksw.jena_sparql_api.geo.GeoMapSupplierUtils;
import org.aksw.jena_sparql_api.utils.TripleUtils;
import org.jgap.InvalidConfigurationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.hp.hpl.jena.sparql.vocabulary.FOAF;
import com.vividsolutions.jts.geom.Geometry;

import de.uni_leipzig.simba.data.Mapping;
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

    @Resource(name="virtuosotarget")
    private GeoGraphFactory virtuosotarget;

    @Resource(name="virtuosoclientobject")
    private VirtuosoClientObjectFactory virtuosoclientobject;

    @Context
    private HttpServletRequest req;

    @Context
    private HttpServletResponse res;

    public static PropertyMapping getPropertyMapping(ConfigReader config) {
        PropertyMapping result = new PropertyMapping();
        for (String sourceProperty : config.getSourceInfo().properties) {
            for (String targetProperty : config.getTargetInfo().properties) {
                result.addStringPropertyMatch(sourceProperty, targetProperty);
            }
        }

        return result;
    }

    public UnsupervisedLinkSpecificationLearner createAutoLearner(ConfigReader config) throws InvalidConfigurationException
    {
        PropertyMapping propertyMapping = getPropertyMapping(config);

        UnSupervisedLearnerParameters params = new UnSupervisedLearnerParameters(config, propertyMapping);
        //anpassen fuer demo
        params.setGenerations(50);
        params.setPopulationSize(100); //50-100
        //params.setMutationRate(0.5F);
        //params.setPreserveFittestIndividual(true);

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

    public void writeMapping(Mapping mapping, Geomizer geomizer, Graph g) {

        Map<Triple, Double> tripleToScore = GeomizerFactoryLimes.mappingToTriples(mapping, OWL.sameAs.asNode());

        Map<Triple, Geometry> geomized = geomizer.geomize(tripleToScore.keySet());

        Set<Triple> triples = GeoMapSupplierUtils.geomizedToRdf(geomized);

        triples = GeoMapSupplierUtils.convertOgcToVirt(triples);

        g.clear();

        System.out.println(triples);
        GraphUtil.add(g, triples.iterator());

        //close results in error. Same graph for all servlets???
        //targetgraph.close();
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
    @Path("/executeFromSpec")
    public String learnLinkSpec(@FormParam("spec") String spec, @FormParam("project") String project, @FormParam("username") String username) throws Exception {

        // Build ressource path for geomized graph
        StringBuilder geomized_graphressource = new StringBuilder();
        geomized_graphressource.append(StringUtils.urlEncode(project));
        geomized_graphressource.append("/");
        geomized_graphressource.append(StringUtils.urlEncode(username));
        geomized_graphressource.append("/geomized/");

        //Get geomized graph
        Graph geomized_graph = virtuosotarget.getGraph(geomized_graphressource.toString());

        //Get client object for sparql querys
        String retval = virtuosoclientobject.getJSON(geomized_graphressource.toString());

        ConfigReader config = gson.fromJson(spec, ConfigReader.class);
        config.afterPropertiesSet();

        System.out.println(config.toString());

        //real methods
        UnsupervisedLinkSpecificationLearner learner = createAutoLearner(config);
        Mapping mapping = learner.learn();

        //direct load over local file (for local tests)
        //System.out.println("Working Directory = " + System.getProperty("user.dir"));
        //Model model = FileManager.get().loadModel("../test-data/positive.nt");
        //Graph graph = model.getGraph();
        //Set<Triple> triples = graph.find(null, null, null).toSet();
        //triples = TripleUtils.swap(triples);
        //Mapping mapping = toMapping(triples);
        // end test methods

        Geomizer geomizer = GeomizerFactoryLimes.createGeomizer(config);
        writeMapping(mapping, geomizer, geomized_graph);

        return retval;
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/evaluation")
    public String evaluate(@FormParam("evaluation") String evaluation, @FormParam("project") String project, @FormParam("username") String username) throws Exception {
    	System.out.println("Contents of the evaluation: " + evaluation);
        Type type = new TypeToken<HashMap<String, String>>(){}.getType();
        HashMap<String, String> map = gson.fromJson(evaluation, type);
        //sanitze
        if(map.isEmpty()) {
            res.sendError(HttpServletResponse.SC_BAD_REQUEST,"Evaluation was empty.");
        }
        for(String key: map.keySet()) {
            String value = map.get(key);
            System.out.println("key:value  "  + key + ":" + value);
            System.out.println("!value.equals(positive) || !value.equals(negative)  || !value.equals(unknown)  "  + !value.equals("positive") + ":" + !value.equals("negative") + ":" + !value.equals("unknown"));
            if(!value.equals("positive") && !value.equals("negative")  && !value.equals("unknown")  ) {
                res.sendError(HttpServletResponse.SC_BAD_REQUEST,"Evaluation for key:" + key + " with value " + map.get(key) + " must be one of the following: positive, negative, or unknown");
            }
        }

        // Build ressource path for geomized graph
        StringBuilder geomized_graphressource = new StringBuilder();
        geomized_graphressource.append(StringUtils.urlEncode(project));
        geomized_graphressource.append("/");
        geomized_graphressource.append(StringUtils.urlEncode(username));
        geomized_graphressource.append("/geomized/");

        //Get geomized graph
        Graph geomized_graph = virtuosotarget.getGraph(geomized_graphressource.toString());

        // Build ressource path eval graph
        StringBuilder eval_graphressource = new StringBuilder();
        eval_graphressource.append(username);
        eval_graphressource.append("/eval/");

        //Get eval graph
        Graph eval_graph = virtuosotarget.getGraph(eval_graphressource.toString());

        //Get client object for sparql querys
        String retval = virtuosoclientobject.getJSON(eval_graphressource.toString());

        //Get current time
        Calendar cal = Calendar.getInstance();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy'-'MM'-'dd'T'HH:mm:ss");
        String xsdtimestamp = sdf.format(cal.getTime());

        //iterate over keys
        System.out.println("DEBUG: Evaluations");
        for(String key: map.keySet()) {

            //escape strings
            StringBuilder sb = new StringBuilder();
            sb.append("http://example.org/linkEvaluation-of-");
            sb.append(StringUtils.urlEncode(key.split("/")[3]));
            sb.append("-byuser-");
            sb.append(StringUtils.urlEncode(username));


            String linkof = sb.toString();
            System.out.println(linkof);

            //Set<Triple> eval_triples = eval_graph.find(NodeFactory.createURI(key), null, null).toSet();
            //Set<Triple> geomized_triples = geomized_graph.find(NodeFactory.createURI(key), null, null).toSet();
            Set<Triple> linkof_triples = eval_graph.find(NodeFactory.createURI(linkof), null, null).toSet();

            // valid values: unknown = undefined; positive = true; negative = false
            if (map.get(key).equals("positive")  || map.get(key).equals("negative")) {

                System.out.println("positive or negative");
                ArrayList<Triple> linktriples = new ArrayList<Triple>();

                //clear linkof and geomize
                GraphUtil.delete(eval_graph, linkof_triples.iterator());
                //GraphUtil.delete(eval_graph, eval_triples.iterator());

                Node usernode = NodeFactory.createURI("http://example.org/users/" + StringUtils.urlEncode(username));

                // Build new eval triples
                linktriples.add(Triple.create(NodeFactory.createURI(linkof), NodeFactory.createURI("http://www.linklion.org/ontology#storedAt"), NodeFactory.createURI(key)));
                linktriples.add(Triple.create(NodeFactory.createURI(linkof), DCTerms.creator.asNode(), usernode));
                linktriples.add(Triple.create(usernode, RDF.type.asNode(), FOAF.Agent.asNode()));
                linktriples.add(Triple.create(usernode, RDFS.label.asNode(), NodeFactory.createLiteral(username)));
                linktriples.add(Triple.create(NodeFactory.createURI(linkof), NodeFactory.createURI("http://purl.org/dc/terms/modified"), NodeFactory.createLiteral(xsdtimestamp)));
                //linktriples.add(Triple.create(NodeFactory.createURI(linkof), NodeFactory.createURI("http://purl.org/dc/terms/modified"), NodeFactory.createLiteral(xsdtimestamp, XSDDatatype.XSDdateTime)));
                linktriples.add(Triple.create(NodeFactory.createURI(linkof), NodeFactory.createURI("http://www.linklion.org/ontology#hasEvalStatus"), NodeFactory.createLiteral(map.get(key))));

                GraphUtil.add(eval_graph, linktriples.iterator());
                //GraphUtil.add(eval_graph, geomized_triples.iterator());

            } else {
                GraphUtil.delete(eval_graph, linkof_triples.iterator());
                //GraphUtil.delete(eval_graph, eval_triples.iterator());
            }
        }

        // clear geomized graph after evaluation
        //geomized_graph.clear();

        return gson.toJson(retval);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/learnFromMapping")
    public String learnFromMapping(@FormParam("spec") String spec, @FormParam("mapping") String json) throws Exception
    {
        // user methode

        // muss getrennt werden
        // spec raus
        // zusätzlich writeEvaluationData mit mapping
        //  * default auf aktuellen user
        //  * optional query auf bsp anderen user
        // lernen hier zusätzlich


        //????
        //config = new ConfigReader();
        //config.validateAndRead("/home/raven/Projects/Eclipse/LIMES/Examples/Paper/largescale/lgd-dbpedia.limes.xml");
        //System.out.println(config);
        //System.out.println("---");

        //Cache?
        //Cache cache = new MemoryCache();
        //SparqlQueryModule sqm = new SparqlQueryModule(config.getSourceInfo());
        //sqm.fillCache(cache);

        /* //das ist der learner muss in eigene Methode
        UnsupervisedLinkSpecificationLearner learner = createAutoLearner(config);
        Mapping mapping = learner.learn();
        System.out.println("Mapping SIZE: " + mapping.size());
        Metric metric = learner.terminate();
        config.metricExpression = metric.getExpression();
        config.acceptanceThreshold = metric.getThreshold();
        //String result = gson.toJson(config);
        */

        ConfigReader config = gson.fromJson(spec, ConfigReader.class);

        Type mappingType = new TypeToken<Map<String, HashMap<String, Double>>>() {}.getType();
        Map<String, HashMap<String, Double>> map = gson.fromJson(json, mappingType);

        Mapping mapping = new Mapping();
        mapping.map.putAll(map);

        LinkSpecificationLearner learner = createFeedbackLearner(config);
        Mapping next = learner.learn(mapping);

        String result = gson.toJson(next);
        return result;
    }
}

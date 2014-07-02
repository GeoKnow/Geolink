package org.aksw.geolink.playground;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;

import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.http.QueryExecutionFactoryHttp;
import org.aksw.jena_sparql_api.model.QueryExecutionFactoryModel;
import org.aksw.jena_sparql_api.pagination.core.QueryExecutionFactoryPaginated;
import org.jgap.InvalidConfigurationException;

import com.hp.hpl.jena.query.QueryExecution;
import com.hp.hpl.jena.query.ResultSet;
import com.hp.hpl.jena.query.ResultSetFormatter;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;

import de.uni_leipzig.simba.data.Mapping;
import de.uni_leipzig.simba.genetics.core.Metric;
import de.uni_leipzig.simba.genetics.evaluation.basics.DataSetChooser;
import de.uni_leipzig.simba.genetics.evaluation.basics.DataSetChooser.DataSets;
import de.uni_leipzig.simba.genetics.evaluation.basics.EvaluationData;
import de.uni_leipzig.simba.genetics.learner.GeneticActiveLearner;
import de.uni_leipzig.simba.genetics.learner.UnSupervisedLearnerParameters;
import de.uni_leipzig.simba.genetics.learner.UnsupervisedLearner;
import de.uni_leipzig.simba.genetics.learner.UnsupervisedLinkSpecificationLearner;
import de.uni_leipzig.simba.io.ConfigReader;
import de.uni_leipzig.simba.io.KBInfo;

public class MainLimes {
    
    /*
    public static void fetchDataset() {
        HashMap<MapKey, Object> param = new HashMap<MapKey, Object>();
        // folders & files
        param.put(MapKey.BASE_FOLDER, "Examples/GeneticEval/");
        param.put(MapKey.DATASET_FOLDER, "Datasets/DBLP-Scholar/");
        param.put(MapKey.CONFIG_FILE, "DBLP-Scholar.xml");
        param.put(MapKey.REFERENCE_FILE, "DBLP-Scholar_perfectMapping.csv");
        param.put(MapKey.SOURCE_FILE, "DBLP1.csv");
        param.put(MapKey.TARGET_FILE, "Scholar.csv");
        
        param.put(MapKey.EVALUATION_RESULTS_FOLDER, "resources/results/");
        param.put(MapKey.EVALUATION_FILENAME, "Pseudo_eval_DBLP-Scholar.csv");
        param.put(MapKey.NAME, "Abt-Buy");
        // data
        ConfigReader cR = new ConfigReader();
        cR.validateAndRead((String)param.get(MapKey.BASE_FOLDER)+param.get(MapKey.CONFIG_FILE));
        
        param.put(MapKey.CONFIG_READER, cR);
        param.put(MapKey.PROPERTY_MAPPING, PropMapper.getPropertyMappingFromFile((String)param.get(MapKey.BASE_FOLDER), (String)param.get(MapKey.CONFIG_FILE)));
        param.put(MapKey.SOURCE_CACHE, HybridCache.getData(cR.sourceInfo));
        param.put(MapKey.TARGET_CACHE, HybridCache.getData(cR.targetInfo));
        param.put(MapKey.REFERENCE_MAPPING, OracleFactory.getOracle((String)param.get(MapKey.BASE_FOLDER)+param.get(MapKey.DATASET_FOLDER)+param.get(MapKey.REFERENCE_FILE), "csv", "simple").getMapping());
        return param;        
    }
    */
    public static void main(String[] args) throws Exception {
      
        //Model model = ModelFactory.createDefaultModel();
        //Object o = ConfigReader.class.getResourceAsStream("/resources/limes.dtd");
        //System.out.println(o);
        
//        if(true) {
//            return;
//        }
        
        String configFile = "/home/raven/Projects/Eclipse/LIMES/Examples/Pubmed_LinkedCT_Diseases.xml";
        ConfigReader config = new ConfigReader();
        config.validateAndRead(configFile);
        System.out.println(config.getSourceInfo());
        System.out.println(config.getTargetInfo());
        //configReader.
        
        if(true) {
            return;
        }
        
        File cache = new File("/tmp/castles.nt");
        if(!cache.exists()) {
            
            // Source: https://github.com/AKSW/jena-sparql-api
            QueryExecutionFactory sparqlService = new QueryExecutionFactoryHttp("http://dbpedia.org/sparql", "http://dbpedia.org");
            sparqlService = new QueryExecutionFactoryPaginated(sparqlService, 50000); 
            //QueryExecution qe = sparqlService.createQueryExecution("Construct { ?s ?p ?o } { ?s a <http://dbpedia.org/ontology/Person> ; ?p ?o . Filter(?p = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>) } Limit 100000");
            QueryExecution qe = sparqlService.createQueryExecution("Construct { ?s ?p ?o } { { Select Distinct ?s { ?s a <http://dbpedia.org/ontology/Castle> } Limit 10 } . ?s ?p ?o . }");
            
            Model model = qe.execConstruct();
            model.write(new FileOutputStream(new File("/tmp/castles.nt")), "N-TRIPLES");
            //model.write(System.out, "N-TRIPLES");
        }

        Model model = ModelFactory.createDefaultModel();
        model.read(new FileInputStream(cache), null, "N-TRIPLES");
        model.write(System.out);
        
        QueryExecutionFactory sparqlService = new QueryExecutionFactoryModel(model);
        QueryExecution qe = sparqlService.createQueryExecution(
                "PREFIX spatial: <http://jena.apache.org/spatial#>\n" +  
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" + 

                "SELECT ?placeName {\n" +
                "?place spatial:query (18.089167 59.401390 1000 'km') .\n" +
                //Filter(spatial:query(?place, ))
                "?place rdfs:label ?placeName \n" +
                "}"
        );
        // 
        
        
        ResultSet rs = qe.execSelect();
        String str = ResultSetFormatter.asText(rs);
        System.out.println(str);
        
        if(true) {
            return;
        }
        
        // Jena Spatial
        //http://jena.apache.org/documentation/query/spatial-query.html
        
        // Sparql Endpoint + Concept / Class expression configuration
        // ({?s a :City ; geo:long ?x ; geo:lat ?y}, ?s) 
        // Identifies a set of resources in a SPARQL endpoint

        // Method to create a KBInfo object from a set of parameters (e.g. could be a JSON object)
        //https://github.com/KLyko/LimesWebService/blob/master/src/de/uni_leipzig/simba/limeswebservice/server/LimesUser.java#L277
               
        KBInfo kbinfo;
        
       
        ConfigReader configReader;
        //configReader.
        
        
        UnsupervisedLearner foo;
        GeneticActiveLearner bar;

        
        
        // Links + Similarity score are stored in a mapping object
        Mapping mapping;
        //mapping.
        
        
        
        EvaluationData data = DataSetChooser.getData(DataSets.DBLPSCHOLAR);
        //EvaluationData data = new EvaluationData();

        UnSupervisedLearnerParameters params = new UnSupervisedLearnerParameters(data.getConfigReader(), data.getPropertyMapping());
        params.setGenerations(10);
        params.setPopulationSize(10);
        
        UnsupervisedLinkSpecificationLearner learner = new UnsupervisedLearner();
        try {
            learner.init(params.getConfigReader().sourceInfo, params.getConfigReader().targetInfo, params);
        } catch (InvalidConfigurationException e) {
            e.printStackTrace();
        }
        Mapping m = learner.learn();
        Metric result = learner.terminate();
        System.out.println("Finished learning. Best Mapping has size :"+m.size());
        System.out.println("Best Metric: "+result);
        
    }
}

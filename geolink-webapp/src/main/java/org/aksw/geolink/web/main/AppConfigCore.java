package org.aksw.geolink.web.main;

import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.http.QueryExecutionFactoryHttp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import com.google.gson.Gson;

@Configuration
@ComponentScan({"org.aksw.geolink.web"})
public class AppConfigCore {
    
    private static final Logger logger = LoggerFactory.getLogger(AppConfigCore.class);

//    @javax.annotation.Resource
//    private Environment env;
    
    /*
     * Methods annotated with @Bean will be invoked by the Spring framework
     * and can be referenced in the servlets (or in other places of the app).
     * Spring will take care
     * of injecting the resources upon serving (HTTP) requests.
     */
    
    @Bean
    public QueryExecutionFactory sparqlService() {
        QueryExecutionFactory result = new QueryExecutionFactoryHttp("http://dbpedia.org/sparql", "http://dbpedia.org");
        return result;
    }
    
    /**
     * Google's Json serializer.
     * Note that it supports several configuration options (such as exclusion filters).
     * For this reason, Gson there is one global gson instance, rather having
     * each component instanciate its own version of it.
     * 
     * @return
     */
    @Bean
    public Gson gson() {
        Gson result = new Gson();
        
        // Configure gson as needed here
        
        return result;
    }
}

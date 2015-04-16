package org.aksw.geolink.web.main;

import java.lang.reflect.Modifier;
import java.util.Arrays;

import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.gson.ExclusionStrategyClassAndFields;
import org.aksw.jena_sparql_api.gson.TypeAdapterNoop;
import org.aksw.jena_sparql_api.http.QueryExecutionFactoryHttp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import com.google.common.collect.HashMultimap;
import com.google.common.collect.Multimap;
import com.google.gson.ExclusionStrategy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import de.uni_leipzig.simba.io.ConfigReader;



@Configuration
@ComponentScan({"org.aksw.geolink.web"})
public class AppConfig {

    private static final Logger logger = LoggerFactory.getLogger(AppConfig.class);

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
        Multimap<Class<?>, String> classToFieldName = HashMultimap.create();
        classToFieldName.putAll(ConfigReader.class, Arrays.asList(new String[]{ "logger" }));

        ExclusionStrategy strategy = new ExclusionStrategyClassAndFields(classToFieldName);

        GsonBuilder builder = new GsonBuilder();
        builder.addSerializationExclusionStrategy(strategy);

        builder.disableInnerClassSerialization();
        builder.excludeFieldsWithModifiers(Modifier.STATIC, Modifier.TRANSIENT, Modifier.FINAL);
        builder.disableHtmlEscaping();
        builder.enableComplexMapKeySerialization();
        builder.serializeNulls();

        builder.registerTypeHierarchyAdapter(org.apache.log4j.Logger.class, new TypeAdapterNoop<Logger>());

        //builder.registerTypeAdapter(Logger.class, new TypeAdapterNoop<Logger>());
        //builder.registerTypeHierarchyAdapter(KBInfo.class, new TypeAdapterNoop<KBInfo>());
        //builder.registerTypeHierarchyAdapter(ConfigReader.class, new TypeAdapterNoop<ConfigReader>());

        Gson result = builder.create();


//        String json = "{\"sourceInfo\":{\"id\":\"DBpedia\",\"endpoint\":\"http://dbpedia.org/sparql\",\"graph\":\"http://dbpedia.org\",\"restrictions\":[\"?s a <http://dbpedia.org/ontology/Airport>\"],\"var\":\"s\",\"type\":\"sparql\"},\"targetInfo\":{\"id\":\"LinkedGeoData\",\"endpoint\":\"http://linkedgeodata.org/sparql\",\"graph\":\"http://linkedgeodata.org\",\"restrictions\":[\"?s a <http://linkedgeodata.org/ontology/Airport>\"],\"var\":\"s\",\"type\":\"sparql\"}}";
//        System.out.println("sigh: " + json);
//        ConfigReader foo = result.fromJson(json, ConfigReader.class);
//        System.out.println("Foo: " + foo);

        return result;
    }

}

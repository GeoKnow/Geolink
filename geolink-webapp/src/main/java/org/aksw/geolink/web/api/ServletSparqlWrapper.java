package org.aksw.geolink.web.api;

import java.io.InputStream;

import javax.annotation.Resource;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.web.SparqlEndpointBase;
import org.springframework.stereotype.Service;

import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;


@Service
@Path("/sparql/")
public class ServletSparqlWrapper
	extends SparqlEndpointBase
{
	@Resource(name="sparqlService")
	private QueryExecutionFactory qef;
	
	@Context
	private ServletContext servletContext;

	@Context
	HttpServletRequest req;
	
	@Override
	public QueryExecution createQueryExecution(Query query) {
		QueryExecution result = qef.createQueryExecution(query);
		return result;
	}

	@GET
    @Produces(MediaType.TEXT_HTML)
    public Response executeQueryXml()
            throws Exception {
                
        InputStream r = servletContext.getResourceAsStream("/resources/snorql/index.html");
        return Response.ok(r, MediaType.TEXT_HTML).build();
    }	
}

package org.aksw.geolink.web.api;

import java.util.HashMap;
import java.util.Map;

import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.gson.Gson;


@Service
@Path("/someApi")
@Transactional
public class ExampleServlet
{    
    @Autowired
    private Gson gson;
	
	
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/get")
    public String getSomething(@QueryParam("id") String uri)
    {
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("success", true);
        String result = gson.toJson(data);
        return result;
    }


	@POST
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/put")
	public String createSomething(@FormParam("data") String json)
	{	    
		return "{}";
	}

	
	@POST
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/delete")
	public String deleteSomething(@FormParam("id") Long id) {
		return "{}";
	}
}

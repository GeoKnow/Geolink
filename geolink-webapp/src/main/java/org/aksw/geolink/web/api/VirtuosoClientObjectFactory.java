package org.aksw.geolink.web.api;

import com.google.gson.Gson;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by Martin Stoffers.
 */
public class VirtuosoClientObjectFactory {

    private String virtuososparql;
    private String virtuosographprefix;

    public VirtuosoClientObjectFactory(String virtuososparql, String virtuosographprefix) {
        this.virtuososparql = virtuososparql;
        this.virtuosographprefix = virtuosographprefix;
    }

    public String getJSON(String graphressource) {
        Map<String, String> map = new HashMap<String, String>();
        map.put("sparql",this.virtuososparql);
        map.put("graph",virtuosographprefix+graphressource);
        Gson gson = new Gson();
        return gson.toJson(map);
    }
}

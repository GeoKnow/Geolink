package org.aksw.geolink.web.main;

import java.io.File;
import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import de.uni_leipzig.simba.controller.PPJoinController;

public class MainTestLimes {
    private static final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(); //TestBundleReader.class.getClass().getClassLoader());

    public static void main(String[] args) throws IOException {
        Resource r = resolver.getResource("lgd-dbpedia.fastreboot.limes.xml");
        File file = r.getFile();

        String[] as = new String[]{file.getAbsolutePath()};
        PPJoinController.main(as);
    }
}

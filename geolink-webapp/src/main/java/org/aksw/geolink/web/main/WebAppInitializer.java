package org.aksw.geolink.web.main;

import javax.servlet.FilterRegistration;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRegistration;

import org.aksw.jena_sparql_api.web.filters.CorsFilter;
import org.springframework.web.WebApplicationInitializer;
import org.springframework.web.context.ContextLoaderListener;
import org.springframework.web.context.request.RequestContextListener;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;
import org.tuckey.web.filters.urlrewrite.UrlRewriteFilter;

import com.sun.jersey.spi.spring.container.servlet.SpringServlet;


public class WebAppInitializer
	implements WebApplicationInitializer
{
	//@Override
	public void onStartup(ServletContext servletContext)
		throws ServletException
	{		
		// Create the 'root' Spring application context
		AnnotationConfigWebApplicationContext rootContext = new AnnotationConfigWebApplicationContext();
		rootContext.register(AppConfigCore.class);
		
		// Manage the lifecycle of the root application context
		servletContext.addListener(new ContextLoaderListener(rootContext));
		servletContext.addListener(new RequestContextListener());

		{
		    FilterRegistration.Dynamic fr = servletContext.addFilter("CorsFilter", new CorsFilter());
		    fr.addMappingForUrlPatterns(null, true, "/*");
        //  fr.setInitParameter("dispatcher", "REQUEST");
		}

        {
            FilterRegistration.Dynamic fr = servletContext.addFilter("UrlRewriteFilter", new UrlRewriteFilter());
            fr.setInitParameter("dispatcher", "REQUEST");
            fr.setInitParameter("dispatcher", "FORWARD");
            fr.addMappingForUrlPatterns(null, true, "/*");
        }
	    
		
		ServletRegistration.Dynamic datastoreServlet = servletContext.addServlet("api-servlet", new SpringServlet());
		datastoreServlet.setInitParameter("com.sun.jersey.config.property.packages", "org.aksw.geolink.web.api");
		datastoreServlet.addMapping("/api/*");
		datastoreServlet.setLoadOnStartup(1);
        
        // Create the dispatcher servlet's Spring application context
        AnnotationConfigWebApplicationContext dispatcherContext = new AnnotationConfigWebApplicationContext();
        dispatcherContext.register(WebMvcConfig.class);
		
        ServletRegistration.Dynamic defaultServlet = servletContext.addServlet("default-servlet", new DispatcherServlet(dispatcherContext));
        defaultServlet.addMapping("*.do");
        defaultServlet.setLoadOnStartup(1);
	}
}

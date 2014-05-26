package org.aksw.geolink.web.main;

import javax.annotation.Resource;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import com.jolbox.bonecp.BoneCPConfig;
import com.jolbox.bonecp.BoneCPDataSource;


@Configuration
public class AppConfigDataSource {

    private static final Logger logger = LoggerFactory
            .getLogger(AppConfigDataSource.class);
    
    private static final String JDBC_DRIVER = "jdbc.driver";
    private static final String JDBC_PASSWORD = "jdbc.password";
    private static final String JDBC_URL = "jdbc.url";
    private static final String JDBC_USERNAME = "jdbc.username";

    @Resource
    private Environment env;

    /**
     * When starting the server from the command line, this attribute can be set
     * to override any other means of creating a data source
     */
    public static DataSource cliDataSource = null;

    // Uncomment the @Bean annotation to use a datasource
    //@Bean
    public DataSource dataSource() throws IllegalArgumentException,
            ClassNotFoundException {

        // TODO Somehow allow loading drivers dynamically
        Class.forName("org.postgresql.Driver");

        DataSource dsBean = null;

        String jndiName = "java:comp/env/jdbc/datacat/dataSource";
        try {
            Context ctx = new InitialContext();
            dsBean = (DataSource) ctx.lookup(jndiName);
            
        } catch (NamingException e) {
            logger.info("No JNDI entry for [" + jndiName + "] - trying a different method");
        }

        if(dsBean == null) {
            DriverManagerDataSource dataSource = new DriverManagerDataSource();

            dataSource.setDriverClassName(env.getRequiredProperty(JDBC_DRIVER));
            dataSource.setUrl(env.getRequiredProperty(JDBC_URL));
            dataSource.setUsername(env.getRequiredProperty(JDBC_USERNAME));
            dataSource.setPassword(env.getRequiredProperty(JDBC_PASSWORD));

            dsBean = dataSource;            
        }
        
        //DataSource result = dsBean;

        BoneCPConfig cpConfig = new BoneCPConfig();
        cpConfig.setDatasourceBean(dsBean);

        cpConfig.setMinConnectionsPerPartition(1);
        cpConfig.setMaxConnectionsPerPartition(10);
        cpConfig.setPartitionCount(2);
        //cpConfig.setCloseConnectionWatch(true);
        
        DataSource result = new BoneCPDataSource(cpConfig);

        return result;
    }
}

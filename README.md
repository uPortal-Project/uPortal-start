# uPortal-start

## User Guide

### Gradle Tasks

- **hsqlStart**:  Starts the embedded HSQLDB uPortal database, which is used in _local development
environments_
- **hsqlStop**:  Stops the embedded HSQLDB uPortal database
- **tomcatInstall**:  Downloads the Apache Tomcat servlet container and performs the necessary
configuration steps, cleaning up the previous installation if necessary
- **tomcatStart**:  Starts the embedded Tomcat servlet container
- **tomcatStop**:  Stops the embedded Tomcat servlet container
- **tomcatClearLogs**:  Deletes all files and sub folders in the Tomcat logs directory (not
recommended for server deployments)
- **portalClean**:  Deletes the deployed `/uPortal` webapp in Tomcat

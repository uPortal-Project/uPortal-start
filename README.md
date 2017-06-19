# uPortal-start

## User Guide

### Gradle Tasks

- **startHsql**:  Starts the embedded HSQLDB uPortal database, which is used in _local development
environments_
- **stopHsql**:  Stops the embedded HSQLDB uPortal database
- **cleanShared**:  Deletes the contents of the `shared/lib` directory in Tomcat, where dependencies
that are shared between webapps are placed
- **cleanPortal**:  Deletes the deployed `/uPortal` webapp in Tomcat

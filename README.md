# uPortal-start

## User Guide

### Using Gradle

`uPortal-start` provides a build system and several CLI tools through Gradle, and it comes with a
_Gradle Wrapper_ so you don't have to install Gradle to use it.

Invoking the Gradle Wrapper on *nix:

```
    $ ./gradlew {taskname} [{taskname}...]
```

Invoking the Gradle Wrapper on Windows:

```
    > gradlew.bat {taskname} [{taskname}...]
```

#### HSQL (Database) Tasks

- **hsqlStart**:  Starts the embedded HSQLDB uPortal database, which is used in _local development
environments_
- **hsqlStop**:  Stops the embedded HSQLDB uPortal database

#### Tomcat (Web Server) Tasks

- **tomcatInstall**:  Downloads the Apache Tomcat servlet container and performs the necessary
configuration steps, cleaning up the previous installation if necessary
- **tomcatStart**:  Starts the embedded Tomcat servlet container
- **tomcatStop**:  Stops the embedded Tomcat servlet container
- **tomcatClearLogs**:  Deletes all files and sub folders in the Tomcat logs directory (not
recommended for server deployments)

#### Data (Import/Export) Tasks

- **dataInit**:  Drops and recreates the schema in the embedded HSQLDB uPortal database, then loads
both the Base Data Set and the Implementation Data Set

#### Miscellaneous Tasks

- **portalClean**:  Deletes the deployed `/uPortal` webapp in Tomcat

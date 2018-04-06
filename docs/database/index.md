# Configure the database

uPortal is configured to use a file-based HSQL database by default.

**This database configuration is not suitable for production deployments and best used for testing purposes.**

uPortal does support a number of popular production-class databases and you can configure the database by following the examples posted under Production Database Configuration.

## Step 1: Capture the database driver version

After determining the driver's Maven coordinates, open `gradle.properties` file, and add the driver version coordinate
as a property value.

For example, the MS SQL Server driver version is captured in `mssqlJdbcVersion` below:

```groovy
jasyptVersion=1.9.2
mssqlJdbcVersion=6.2.1.jre8
personDirectoryVersion=1.8.5
```

## Step 2: Add the database driver dependency

Open `overlays/build.gradle` file, and add the driver coordinates below
the hsqldb coordinates around line 46. Make sure to use the version property defined in the first step.

As an example, a driver for SQL Server is added:

```groovy
    dependencies {
        /*
         * Add additional JDBC driver jars to the 'jdbc' configuration below;
         * do not remove the hsqldb driver jar that is already listed.
         */
        jdbc "org.hsqldb:hsqldb:${hsqldbVersion}"
        jdbc "com.microsoft.sqlserver:mssql-jdbc:${mssqlJdbcVersion}"
 
        ...
    }
```

## Step 3: Capture generic details

While credentials and database URL should not be saved to your repo, driver class, dialect and validation query
can usually be persisted without security concerns.

In `etc/portal/global.properties`, save database details that are consistent across environments:

```groovy
environment.build.hibernate.connection.driver_class=com.microsoft.sqlserver.jdbc.SQLServerDriver
environment.build.hibernate.connection.url=jdbc:sqlserver://localhost:1433;
environment.build.hibernate.connection.username=sa
environment.build.hibernate.connection.password=
environment.build.hibernate.dialect=org.hibernate.dialect.SQLServerDialect
environment.build.hibernate.connection.validationQuery=select 1
```

## Step 4: Copy `global.properties` to local environment location and add credentials and URL

In uPortal 5, deployers are strongly encouraged to configure a local `portal.home` directory to keep configuration
that is specific to the environment but should not be captured in a repo. In particular, database and other service
credentials should not be captured. If `portal.home` is not configured, the default is the portal/ directory in Tomcat.

During `./gradlew portalInit` or `./gradlew tomcatInstall`, the files from the repo's `etc/portal/` directory are
copied to `portal.home`. One of those two tasks is a pre-requisite to this step.

In `global.properties` in the `portal.home` directory, edit the connection details:

```groovy
environment.build.hibernate.connection.driver_class=com.microsoft.sqlserver.jdbc.SQLServerDriver
environment.build.hibernate.connection.url=[actual URL for this server]
environment.build.hibernate.connection.username=[actual user for this db]
environment.build.hibernate.connection.password=[actual password for this db]
environment.build.hibernate.dialect=org.hibernate.dialect.SQLServerDialect
environment.build.hibernate.connection.validationQuery=select 1
```

## uPortal Production Database Configuration 

Select the database below for notes and examples of configuration.

+ [DB2](db2.md)
+ [Hypersonic](hypersonic.md)
+ [Microsoft SQL Server](ms-sqlserver.md)
+ [MySQL](mysql.md)
+ [MariaDB] (mariadb.md)
+ [Oracle RDBMS](oracle.md)
+ [PostgreSQL](postgresql.md)
+ [Sybase](sybase.md)

# Using uPortal with Oracle

## Step 1: Obtain the Driver

Since the Oracle JDBC driver is not available in the central Maven repository, it must be placed into the local repository of each machine on which you wish to build uPortal.

As an alternative to this, you could set up a maven repository for use by multiple machines.

[Download](http://www.oracle.com/technetwork/database/features/jdbc/index-091264.html) the correct Oracle JDBC driver for your server. Once you have the jar, it needs to be installed into the local Maven repository using the following command

```shell
mvn install:install-file -DgroupId=com.oracle -DartifactId=ojdbc -Dversion=<version> -Dpackaging=jar -DgeneratePom=true -Dfile=ojdbc.jar
```

The `groupId`, `artifactId` and `version` specified in this command are up to you, but they should match the JAR vendor, name and version to avoid confusion down the road.

## Step 2: Configure the Database Connection Properties

Configure the Database Connection in `etc/portal/global.properties`

```properties
hibernate.connection.driver_class=oracle.jdbc.OracleDriver
hibernate.connection.url=jdbc:oracle:thin:@//oracle.example.edu:1521/instance
hibernate.connection.username=
hibernate.connection.password=
hibernate.connection.validationQuery=select 1 from dual
hibernate.dialect=org.hibernate.dialect.Oracle10gDialect
```

## Step 3: Add the database driver

In `overlays/build.gradle` add the following line below the line for hsqldb
```gradle
jdbc "com.oracle:ojdbc:${oracleJdbcVersion}"
```

`${oracleJdbcVersion}` can be defined `gradle.properties`. Otherwise, substitute `${oracleJdbcVersion}` with the version number used in step 1.

## Step 4: Build and Deploy

You can execute the command below to build the database tables and copy files to your servlet container.

Executing the command `./gradlew portalInit` :warning: **will drop and recreate the database tables and all existing data will be lost** :warning:. This will result in a clean uPortal database structure. If you want to keep the contents of your existing database, use `./gradlew tomcatDeploy` .

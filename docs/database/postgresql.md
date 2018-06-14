# Using uPortal with PostgreSQL

## Step 1: Identify the driver version

The PostgreSQL driver is available in [The Central Repository.](https://search.maven.org)

Search for package `org.postgresql.postgresql` and note the latest available version.

## Step 2: Configure the database connection properties

Modify `etc/portal/global.properties` to connect to an existing Postgres database.

For example, connect to a database named `uportal5` owned by user `admin` with password `secret` as follows:

```properties
hibernate.connection.driver_class=org.postgresql.Driver
hibernate.connection.url=jdbc:postgresql://localhost:5432/uportal5
hibernate.connection.username=admin
hibernate.connection.password=secret
hibernate.connection.validationQuery=select version();
hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

## Step 3: Add the database driver

In `overlays/build.gradle` add the following line below the line for hsqldb
```gradle
jdbc "org.postgresql:postgresql:${postgresqlDriverVersion}"
```

`${postgresqlDriverVersion}` can be defined in `gradle.properties`. Otherwise, substitute `${postgresqlDriverVersion}` with the version number found in step 1.

## Step 4: Build and Deploy

You can execute the command below to build the database tables and copy files to your servlet container.

Executing the command `./gradlew portalInit` :warning: **will drop and recreate the database tables and all existing data will be lost** :warning:. This will result in a clean uPortal database structure. If you want to keep the contents of your existing database, use `./gradlew tomcatDeploy` .

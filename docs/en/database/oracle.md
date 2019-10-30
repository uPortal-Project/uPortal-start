# Using uPortal with Oracle

## Step 1: Identify the Driver Version

The Oracle drivers have been available in Maven Central since mid-2019.
There are several un-official packages. Make sure to use the
[official group](https://mvnrepository.com/artifact/com.oracle.ojdbc).

There are also variants of OJDBC drivers. uPortal requires Java 8, so the Ojdbc8 variants are required.

As of this writing, the current version of Ojdbc8 is `19.3.0.0`.

## Step 2: Configure the Database Connection Properties

Configure the Database Connection in `etc/portal/global.properties`. For example:

```properties
hibernate.connection.driver_class=oracle.jdbc.OracleDriver
hibernate.connection.url=jdbc:oracle:thin:@//oracle.example.edu:1521/instance
hibernate.connection.username=
hibernate.connection.password=
hibernate.connection.validationQuery=select 1 from dual
hibernate.dialect=org.hibernate.dialect.Oracle10gDialect
```

## Step 3: Add the Database Driver

In `gradle.properties` add a variable to manage the driver version:

```gradle
oracleDriverVersion=19.3.0.0
```

In `overlays/build.gradle` add the following line below the line for hsqldb:

```gradle
jdbc group: 'com.oracle.ojdbc', name: 'ojdbc8', version: "${oracleDriverVersion}"
```

## Step 4: Build and Deploy

You can execute the command below to build the database tables and copy files to your servlet container.

Executing the command `./gradlew portalInit` :warning: **will drop and recreate the database tables and all existing data will be lost** :warning:. This will result in a clean uPortal database structure. If you want to keep the contents of your existing database, use `./gradlew tomcatDeploy` .

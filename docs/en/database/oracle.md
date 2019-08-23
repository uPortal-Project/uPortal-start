# Using uPortal with Oracle

## Step 1: Capture the Driver

Since the Oracle JDBC driver is not available in the central Maven repository, it must be manually added to your uPortal-start repository.

[Download](http://www.oracle.com/technetwork/database/features/jdbc/index-091264.html) the correct Oracle JDBC driver for your server.

Once you have the jar, create a `lib/` directory inside your uPortal-start repo and place the jar inside this new directory.

In this example, we assume the driver filename is `ojdbc8.jar`.

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

## Step 3: Add the Database Driver to the Project

In `overlays/build.gradle` add the following line below the line for hsqldb

```gradle
jdbc files("${rootProject.projectDir}/lib/ojdbc8.jar")
```

## Step 4: Build and Deploy

You can execute the command below to build the database tables and copy files to your servlet container.

Executing the command `./gradlew portalInit` :warning: **will drop and recreate the database tables and all existing data will be lost** :warning:. This will result in a clean uPortal database structure. If you want to keep the contents of your existing database, use `./gradlew tomcatDeploy` .

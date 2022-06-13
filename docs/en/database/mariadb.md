# Configuration with MariaDB Database

As working example you can watch on travis configuration test in `uPortal-start/.travis/conf/database/mariadb/`

## Step 1: MariaDB server setup
Edit the file /etc/mysql/mariadb.conf.d/60-server.cnf. (Debian 9)
In the `[mysqld]` part add the following items :

```properties
default-storage-engine=INNODB
lower_case_table_names=1
innodb-large-prefix=1
innodb_file_format=Barracuda
innodb_file_format_check=1
innodb_file_format_max=Barracuda
innodb_file_per_table=1
innodb_strict_mode=ON

innodb_buffer_pool_size=2G
innodb_data_home_dir=/var/lib/mysql/
innodb_data_file_path=ibdata1:100M:autoextend
innodb_flush_log_at_trx_commit=1
innodb_log_file_size=256M
innodb_log_buffer_size=64M
```

**NOTE:** From mariaDB 10.1.35 add this configuration:
```properties
innodb_default_row_format=dynamic
```
This permit to create by default all tables with the `row_format=dynamic` if not provided.

In addition you can indicate these properties to define UTF-8 as default, this is optional if you create your your database with the character set `uft8mb4` and the associated collation (see below).
```properties
character-set-server  = utf8mb4
collation-server      = utf8mb4_unicode_520_ci
```

## Step 2: Configure the user and database

Connect to the database server.
```SQL
CREATE USER 'uportal'@'localhost' IDENTIFIED BY 'uportal';
create database uportal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;
GRANT ALL PRIVILEGES ON uportal.* TO 'portail'@'localhost';
# If you want to install portlets on a specific database
# create database portlet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;
# GRANT ALL PRIVILEGES ON portlets.* TO 'portail'@'localhost';
```

With MariaDb and Mysql the default character set should be set to `utf8mb4` instead of `utf8` as the mysql UTF-8 encoding is only a support of 3-bytes UTF-8 unicode encoding.
The 3-bytes part is not a full UTF-8 support, this won't support Asian characters and emoticones files. [See here for more details](https://dev.mysql.com/doc/refman/5.5/en/charset-unicode.html)

Also the collation `utf8mb4_unicode_520_ci` is a new best algorithm for ordering UTF-8 values, but you can stay on 'utf8_unicode_ci' [see the mysql documentation for details](https://dev.mysql.com/doc/refman/5.6/en/charset-collation-names.html)

## Step 3: Configure Uportal 

### Edit uPortal-start/gradle.properties 
```properties
mysqldbVersion=5.1.45
```
### Edit uPortal-start/overlays/build.gradle
```gradle
dependencies {
        /*
         * Add additional JDBC driver jars to the 'jdbc' configuration below;
         * do not remove the hsqldb driver jar that is already listed.
         */
        jdbc "org.hsqldb:hsqldb:${hsqldbVersion}"
        jdbc "mysql:mysql-connector-java:${mysqldbVersion}"
        
```

### Edit uPortal-start/etc/portal/global.properties 

In the Database Connection section
```properties
hibernate.connection.driver_class=com.mysql.jdbc.Driver
hibernate.connection.url=jdbc:mysql://localhost/portlets
hibernate.connection.username=uportal
hibernate.connection.password=uportal
hibernate.connection.validationQuery=select 1
hibernate.dialect = org.hibernate.dialect.MySQL5InnoDBDialect
```
You should copy/paste this configuration for each customized database portlet/uPortal context [see global datasource documentation](README.md#step-5-specific-portlet--uportal-database-configuration-optional)

**NOTE:** Before mariaDB 10.1.35 using the Dialect `org.apereo.portal.utils.MySQL5InnoDBCompressedDialect` was needed if you didn't configured your mariaDB server with the [default row_format or equivalent](mariadb.md#step-1-mariadb-server-setup)

**NOTE:** Depending on the version of hibernate used and the version of the database server it may be necessary to select an appropriate Dialect [see here](https://github.com/hibernate/hibernate-orm/tree/main/hibernate-core/src/main/java/org/hibernate/dialect) (Be careful to select the correct version according to the tag)


## Step 4 : Initialization of the Database
```shell
./gradlew dataInit
```
## Step 5 : Deployment of uPortal
```shell
./gradlew tomcatDeploy
```

# MySql 5.7 Database Configuration

uPortal is configured to use a default HSQL database.

**This database configuration is not suitable for production deployments but is better suited for testing purposes.**

uPortal supports a number of production databases and you can configure the MySql 5.7 database.

## Step 1: MySql server setup
Creat/Edit the file /etc/mysql/mysql.conf.d/60-server.cnf. (Debian 9)
In the [mysqld] part add the following items :

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

## Step 2: Configure the user and database
```open Command Prompt with MySql path C:\Program Files\MySQL\MySQL Server 5.7\bin, and run mysql as below
```from Linux you can run Terminal and go to MySQL server directory and run the same as below
mysql -uroot -p

mysql> create database uportal CHARACTER SET utf8 COLLATE utf8_general_ci;
mysql> CREATE USER 'uportal'@'localhost' IDENTIFIED BY 'uportal';
mysql> GRANT ALL PRIVILEGES ON uportal.* TO 'uportal'@'localhost';

```
## Step 3: Configure Uportal 

### Edit uPortal-start/gradle.properties 
```properties
mysqldbVersion=5.1.13
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
        /*
         * NOTE: If jdbc "mysql:mysql-connector-java:${mysqldbVersion}" does not work then you can 
         * use the following
         *
         * compile group: 'mysql', name: 'mysql-connector-java', version: '5.1.13'
         */
        /*
         * These are nearly the same uPortal dependencies declared by uPortal-webapp;
         * perhaps we should create a uPortal-all module to bundle them all as transitives.
         */

```

### Edit uPortal-start/etc/portal/global.properties 

In the Database Connection section
```properties
hibernate.connection.driver_class=com.mysql.jdbc.Driver
hibernate.connection.url=jdbc:mysql://localhost:3306/uportal?useSSL=false
hibernate.connection.username=uportal
hibernate.connection.password=uportal
hibernate.connection.validationQuery=select 1
hibernate.dialect = org.hibernate.dialect.MySQL5InnoDBDialect
```
### Edit uPortal-start/etc/portal/uPortal.properties

```properties
hibernate.connection.driver_class=com.mysql.jdbc.Driver
hibernate.connection.url=jdbc:mysql://localhost:3306/uportal?useSSL=false
hibernate.connection.username=uportal
hibernate.connection.password=uportal
hibernate.connection.validationQuery=select 1
hibernate.dialect = org.hibernate.dialect.MySQL5InnoDBDialect
```

## Step 4 : Initialization of the Database
```shell
./gradlew dataInit
```
## Step 5 : Deployment of uPortal
```shell
./gradlew tomcatDeploy
```

# Configuration de la Base de Données MariaDB

uPortal est configuré pour utiliser une base de données HSQL par défaut.

**Cette configuration de base de données ne convient pas aux déploiements de production mais est mieux adaptée à des fins de test.**

uPortal prend en charge un certain nombre de bases de données de production et vous pouvez configurer la base de données MariaDB.

## Étape 1 : Paramétrage du server MariaDB
Editer le fichier /etc/mysql/mariadb.conf.d/50-server.cnf. (ici pour Debian 9)
Dans la partie mysqld ajouter les éléements suivant :

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

## Étape 2 : Configurer l'utilisateur et la base de donnée
```properties
mysql -uroot -p

MariaDB [(none)]> create database uportal CHARACTER SET utf8 COLLATE utf8_general_ci;
MariaDB [(none)]> create database portlets CHARACTER SET utf8 COLLATE utf8_general_ci;
CREATE USER 'uportal'@'localhost' IDENTIFIED BY 'uportal';
GRANT ALL PRIVILEGES ON uportal.* TO 'portail'@'localhost';
GRANT ALL PRIVILEGES ON portlets.* TO 'portail'@'localhost';
```
## Étape 3 : Configurer Uportal 

# Editer uPortal-start/gradle.properties 
```properties
mysqldbVersion=5.1.45
```
# Editer uPortal-start/overlays/build.gradle
```gradle
dependencies {
        /*
         * Add additional JDBC driver jars to the 'jdbc' configuration below;
         * do not remove the hsqldb driver jar that is already listed.
         *
        jdbc "org.hsqldb:hsqldb:${hsqldbVersion}"
        */
        jdbc "mysql:mysql-connector-java:${mysqldbVersion}"
        
        /*
         * These are nearly the same uPortal dependencies declared by uPortal-webapp;
         * perhaps we should create a uPortal-all module to bundle them all as transitives.
         */

```

# Editer uPortal-start/etc/portal/global.properties 

Dans la partie Database Connection
```properties
hibernate.connection.driver_class=com.mysql.jdbc.Driver
hibernate.connection.url=jdbc:mysql://localhost/portlets
hibernate.connection.username=uportal
hibernate.connection.password=uportal
hibernate.connection.validationQuery=select 1
hibernate.dialect = org.hibernate.dialect.MySQL5InnoDBDialect
```
# Editer uPortal-start/etc/portal/uPortal.properties

```properties
hibernate.connection.driver_class=com.mysql.jdbc.Driver
hibernate.connection.url=jdbc:mysql://localhost/uportal
hibernate.connection.username=uportal
hibernate.connection.password=uportal
hibernate.connection.validationQuery=select 1
hibernate.dialect = org.hibernate.dialect.MySQL5InnoDBDialect
```

## Étape 4 : Initialisation de la Base de Donnée
```shell
./gradlew dataInit
```
## Étape 5 : Déploiement de uPortal
```shell
./gradlew tomcatDeploy
```

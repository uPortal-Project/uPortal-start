# Configuration de la Base de Données

uPortal est configuré pour utiliser une base de données HSQL par défaut.

**Cette configuration de base de données ne convient pas aux déploiements de production mais est mieux adaptée à des fins de test.**

uPortal prend en charge un certain nombre de bases de données de production populaires et vous pouvez configurer la base de données en suivant les exemples publiés sous Configuration de la base de données de production.

## Étape 1 : Configurer le filtre de base de données      

Dans le dossier `filters`, localiser le fichier `local.properties` (par défaut `uPortal-4.1/filters/local.properties`) et configurer les paramètres de connexion à la base de données

```shell
# HSQL Configuration
environment.build.hsql.port=8887

# Database Connection Settings (Uncomment the Maven Filters section in rdbm.properties)
environment.build.hibernate.connection.driver_class=org.hsqldb.jdbc.JDBCDriver
environment.build.hibernate.connection.url=jdbc:hsqldb:hsql://localhost:${environment.build.hsql.port}/uPortal
environment.build.hibernate.connection.username=sa
environment.build.hibernate.connection.password=
environment.build.hibernate.dialect=org.hibernate.dialect.HSQLDialect
environment.build.hibernate.connection.validationQuery=select 1 from INFORMATION_SCHEMA.SYSTEM_USERS
```

## Étape 2 : Ajouter le pilote de base de données 

Ouvrir le fichier `uportal-db/pom.xml`, décommenter et/ou modifier au besoin le(s) pilote(s) de votre choix.

Ajouter les propriétés de version appropriées au fichier racine `pom.xml` ou entrer la version appropriée ci-dessous

```xml
<dependencies>
        <!-- Add any db drivers that are applicable to *any* of your environments -->
	    <dependency>
	        <groupId>org.hsqldb</groupId>
	        <artifactId>hsqldb</artifactId>
	        <version>${hsqldb.version}</version>
	        <scope>compile</scope>
	    </dependency>
        <!--
         | The following db drivers should be uncommented and/or modified as needed for server 
         | deployments.  (Add all thaat are needed.)  Don't forget to add appropriate  .version 
         | properties to the root pom.xml, or simply enter the appropriate version below.
         +-->
		<!--
	    <dependency>
            <groupId>postgresql</groupId>
	        <artifactId>postgresql</artifactId>
	        <version>${postgres.version}</version>
	        <scope>compile</scope>
	    </dependency>
	    <dependency>
	        <groupId>com.ibm.db2</groupId>
	        <artifactId>db2-jdbc</artifactId>
	        <version>${db2.version}</version>
	        <scope>compile</scope>
	    </dependency>
        <dependency>
            <groupId>com.microsoft.sqlserver</groupId>
            <artifactId>sqljdbc4</artifactId>
            <version>${mssql.version}</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql.version}</version>
        </dependency>
        <dependency>
            <groupId>com.oracle</groupId>
            <artifactId>ojdbc6_g</artifactId>
            <version>${oracle.version}</version>
        </dependency>
        <dependency>
            <groupId>org.sybase</groupId>
            <artifactId>sybase-jconnect</artifactId>
            <version>${sybase.version}</version>
        </dependency>
	    -->
    </dependencies>
```

## Step 3: Test de la configuration de la base de données

Pour tester la configuration de votre base de données à partir de la ligne de commande :

```shell_session
ant dbtest
```

## Configuration de la base de données de production uPortal 

Sélectionner la base de données ci-dessous pour des notes et des exemples de configuration.

+ [DB2](db2.md)
+ [Hypersonic](hypersonic.md)
+ [Microsoft SQL Server](ms-sqlserver.md)
+ [MySQL/MariaDB](mysql.md)
+ [Oracle RDBMS](oracle.md)
+ [PostgreSQL](postgresql.md)
+ [Sybase](sybase.md)

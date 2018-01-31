# Utiliser uPortal avec DB2

## Étape 1 : Obtenir le pilote

Comme le pilote DB2 JDBC n'est pas disponible dans le référentiel Maven central, il doit être placé dans le référentiel local de chaque machine sur laquelle vous souhaitez construire uPortal.

Comme alternative à cela, vous pouvez configurer un référentiel maven pour une utilisation par plusieurs machines.

Un pilote JDBC DB2 est inclus dans le logiciel DB2 dans le sous-répertoire `java` après l'installation de DB2. Pour installer le fichier JAR dans votre référentiel maven local, utilisez la commande suivante:

```
mvn install:install-file -DgroupId=com.ibm.db2 -DartifactId=db2-jdbc -Dversion=<version> -Dpackaging=jar -DgeneratePom=true -Dfile=db2java.zip.jar
```

Les options `groupId`, `artefactId` et `version` spécifiées dans cette commande dépendent de vous, mais elles doivent correspondre au fournisseur, au nom et à la version du fichier JAR pour éviter toute confusion ultérieure.

## Étape 2 : Configurer le filtre de base de données

Dans le dossier filters, localiser le fichier `local.properties` (par défaut dans `uPortal-4.1.x/filters/local.properties`) et configurer les paramètres de connexion à la base de données

```shell
# HSQL Configuration
environment.build.hsql.port=8887

# Database Connection Settings 
environment.build.hibernate.connection.driver_class=COM.ibm.db2.jdbc.app.DB2Driver
environment.build.hibernate.connection.url=jdbc:db2:uPortal3Db
environment.build.hibernate.connection.username=sa
environment.build.hibernate.connection.password=
environment.build.hibernate.dialect=org.hibernate.dialect.DB2Dialect
```

## Étape 3 : Ajouter le pilote de base de données 

Ouvrir le fichier `uportal-db/pom.xml`, décommenter le pilote db2 ci-dessous et modifier le si nécessaire.

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
  -->

	    <dependency>
	        <groupId>com.ibm.db2</groupId>
	        <artifactId>db2-jdbc</artifactId>
	        <version>${db2.version}</version>
	        <scope>compile</scope>
	    </dependency>
 
		<!--
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

## Étape 4 : Test de la configuration

L'exécution de `ant dbtest` vous indiquera si vous avez correctement configuré la connexion à la base de données.

```shell
ant dbtest
```

## Étape 5 : Build et Deploiement 

Après un test réussi, vous pouvez exécuter la commande ci-dessous pour créer les tables de la base de données et copier les fichiers dans votre conteneur de servlet.

L'exécution de la commande `ant clean initportal` **supprimera et recréera les tables de la base de données et toutes les données existantes seront perdues**. Cela se traduira par une structure de base de données uPortal propre. Si vous souhaitez conserver le contenu de votre base de données existante, utilisez `ant clean deploy-war`.

```shell
ant clean initportal
```

## Étape 6 : Redémarrer Tomcat


 

##  Problèmes et bogues connus

Certaines personnes ont rencontré des problèmes avec les pilotes de base de données avec certains environnements d'application Web si le fichier zip des classes est utilisé tel quel avec l'extension de fichier `.zip`. Le simple fait de renommer le fichier dans un fichier `.jar` semble résoudre le problème. Alternativement, décompresser le fichier de classes dans une structure de répertoire, puis utiliser la commande jar pour reconditionner les classes dans un fichier jar fonctionne également.

# Utilisation d'uPortal avec Oracle

## Étape 1 : Obtenir le pilote

Comme le pilote Oracle JDBC n'est pas disponible dans le référentiel central Maven, il doit être placé dans le référentiel local de chaque machine sur laquelle vous souhaitez construire uPortal.

Comme alternative à cela, vous pouvez configurer un référentiel maven pour une utilisation par plusieurs machines.

[Télécharger](http://www.oracle.com/technetwork/database/features/jdbc/index-091264.html) le pilote Oracle JDBC correct pour votre serveur. Une fois que vous avez le jar, il doit être installé dans le référentiel Maven local en utilisant la commande suivante

```shell
mvn install:install-file -DgroupId=com.oracle -DartifactId=ojdbc -Dversion=<version> -Dpackaging=jar -DgeneratePom=true -Dfile=ojdbc.jar
```

Les options `groupId`,` artefactId` et `version` spécifiées dans cette commande dépendent de vous, mais elles doivent correspondre au fournisseur, au nom et à la version du fichier JAR pour éviter toute confusion ultérieure.

## Étape 2 : Configurer les propriétés de connexion de base de données

Configurer les propriétés de connexion de base de données dans `etc/portal/global.properties`

```properties
hibernate.connection.driver_class=oracle.jdbc.OracleDriver
hibernate.connection.url=jdbc:oracle:thin:@//oracle.example.edu:1521/instance
hibernate.connection.username=
hibernate.connection.password=
hibernate.connection.validationQuery=select 1 from dual
hibernate.dialect=org.hibernate.dialect.Oracle10gDialect
```

## Étape 3 : Ajouter le pilote de base de données

Dans `overlays/build.gradle` ajouter la ligne suivante sous la ligne pour hsqldb

```gradle
jdbc "com.oracle:ojdbc:${oracleJdbcVersion}"
```

`${oracleJdbcVersion}` peut être défini dans `gradle.properties`. Sinon, remplacez `${oracleJdbcVersion}` par le numéro de version utilisé à l'étape 1.

## Étape 4 : Build et déploiement

Vous pouvez exécuter la commande ci-dessous pour créer les tables de base de données et copier les fichiers dans votre conteneur de servlet.

L'exécution de la commande `./gradlew portalInit` :warning: va **supprimer et recréer les tables de la base de données et toutes les données existantes seront perdues** :warning:. Cela se traduira par une structure de base de données uPortal propre. Si vous souhaitez conserver le contenu de votre base de données existante, utilisez `./gradlew tomcatDeploy`.

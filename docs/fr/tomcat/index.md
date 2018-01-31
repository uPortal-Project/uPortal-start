# Installation de Tomcat

Apache Tomcat est le conteneur de servlet recommandé à utiliser avec uPortal. Alors que uPortal requiert 
un conteneur de servlet compatible avec Servlet 3.0, aussi un autre conteneur servlet peut être utilisé, 
mais la plupart des implémenteurs d'uPortal le déploient sur Apache Tomcat. Choisir Tomcat 8.x permettra probablement 
aux utilisateurs d'obtenir les meilleurs conseils de la communauté.

Voir aussi

+ [Mettre Httpd en front de Tomcat](fronting-with-httpd.md)
+ [Utiliser SSL](ssl-configuration.md)

## Installation Linux/Unix 

### 1. Téléchargement

[Télécharger](http://tomcat.apache.org/download-80.cgi) Apache Tomcat 8.x.

### 2. Extraction

Détarer le package comme suit :

```shell_session
tar -zxvf apache-tomcat-8.0.33.tar.gz
```

### 3. Renommer

*Optionnellement* renommer votre installation en quelquechose de plus signifiant :

```shell_session
mv apache-tomcat-8.0.33 uportal-tomcat
```

### 4. Modifier vos variables d'environnement 

Modifier vos variables d'environnement :

```shell
export JAVA_HOME=/path/to/your/java
export TOMCAT_HOME=/path/to/your/tomcat
```

### 5.Tester votre installation de Tomcat 

#### a. Démarrer Tomcat

Premièrement, démarrer Tomcat

```shell_session
$TOMCAT_HOME/bin/startup.sh
```

#### b. Vérifier dans un navigateur

Aller sur http://localhost:8080/

Vous devriez voir la page d'accueil de Apache Tomcat.

#### c. Fermer Tomcat

```shell_session
TOMCAT_HOME/bin/shutdown.sh
```

## Installation sur Windows

### 1. Téléchargement

Télécharger [Apache Tomcat 8.x](http://tomcat.apache.org/download-80.cgi) pour Windows.

### 2. Dézipper

Dézipper le téléchargement dans un répertoire adéquat. Par exemple, vous pouvez dézipper le fichier dans le répertoire `C:\`. Ceci va créer un répertoire comme ceci `C:\apache-tomcat-8.x` contenant tous les fichiers de Tomcat.

### 3. Modifier vos variables d'environnement

Vous devez définir une variable d'environnement `JAVA_HOME`.

```shell
JAVA_HOME : C:\Program Files\Java\jdk1.x
```
Pour Windows (cela peut varier selon les versions), vous pouvez créer ces variables d'environnement en procédant comme suit: 
cliquer avec le bouton droit sur 'Poste de travail', sélectionnez dans propriétés l'onglet Avancé. 
Puis cliquer sur Variables d'environnement et sous Variables système, cliquer sur Nouveau. 
De là, entrer le nom et la valeur de `JAVA_HOME` s'il n'est pas déjà créé.

### 4. Démarrer Tomcat

Essayez de démarrer Tomcat en exécutant le fichier de commandes `C:\apache-tomcat-8.x\bin\startup.bat`. 

### 5. Vérifier dans un navigateur

Aller dans votre navigateur sur http://localhost:8080 et vous devriez voir la page d'accueil Tomcat par défaut.

### 6. Fermer Tomcat

Pour arrêter le serveur, exécutez le fichier de commandes `C:\apache-tomcat-8.x\bin\shutdown.bat`.

## Configuration de Tomcat pour uPortal

### Bibliothèques partagées

uPortal place les bibliothèques dans `CATALINA_BASE/shared/lib`. Par défaut, Tomcat 7 ou 8 n'autorise pas le chargement des bibliothèques à partir de ce répertoire.

Pour résoudre ce problème, vous devez éditer `CATALINA_BASE/conf/catalina.properties` et changer la ligne commençant par `shared.loader=`par ce qui suit :

```properties
shared.loader=${catalina.base}/shared/lib/*.jar
```

Soyez **absolument certain** que la propriété `shared.loader` est configurée exactement comme indiqué. Un caractère espace supplémentaire à la fin de la ligne peut l'empêcher de fonctionner comme prévu, ce qui est très difficile à résoudre.

### Sessions partagées

Les portlets Jasig, ainsi que de nombreux autres portlets JSR-168 et JSR-286, reposent sur la possibilité de partager des données de session utilisateur entre l'application Web du portail et les applications de portlet.

Pour activer cette fonctionnalité pour Tomcat 7 ou 8, ajoutez `sessionCookiePath="/"` à `CATALINA_BASE/conf/context.xml`.

```xml
<Context sessionCookiePath="/">
```

### Augmenter la taille du cache de ressources

uPortal et la collection typique de ses portlets prennent beaucoup de place. Tomcat 8.5 émet des avertissements sur l'épuisement de l'espace de cache des ressources. Ajoutez la configuration de cache suivante juste avant la _fermeture_ du noeud `Context`.

```xml
<Resources cachingAllowed="true" cacheMaxSize="100000" />
</Context>
```

### Configuration Heap JVM 

uPortal requiert un espace `PermGen` plus grand que la norme (Java 7 uniquement) et plus de segments de mémoire que ceux alloués par défaut. Un bon ensemble de paramètres de Heap est

```
-XX:MaxPermSize=384m (Java 7 only) -Xmx2048m
```

Pour les ajouter, créer un fichier appelé `setenv.sh` (Linux / Mac) ou `setenv.bat` (Windows) dans votre répertoire `bin` de Tomcat et ajouter la configuration suivante. Note pour les paramètres de production, vous avez besoin généralement de plus d'espace de mémoire, au moins 4 Go. Voir la configuration Tomcat additionnelle ci-dessous.

```
JAVA_OPTS="$JAVA_OPTS -XX:+PrintCommandLineFlags -XX:MaxPermSize=384m -Xms1024m -Xmx2048m -Djsse.enableSNIExtension=false"
```

### Autorisations requises de fichier 

Plusieurs applications web d'uPortal écrivent dans leur dossier webapps -déployé- pour ajouter un contenu dynamique au portail (la modification de la Skin dynamique Respondr et la gestion des pièces jointes téléchargées sur uPortal sont deux cas d'utilisation). Assurez-vous que le processus Tomcat est en cours d'exécution tout comme l'accès en écriture aux répertoires `CATALINA_BASE/webapps/*`. Généralement, cela se fait en ayant le même compte tomcat en cours d'exécution que le compte que vous utilisez pour construire et déployer uPortal.


### HTML GZip-ping 

(Facultatif mais FORTEMENT SUGGÉRÉ à moins de le faire avec Apache httpd ou un appareil externe).

Les performances côté navigateur peuvent être améliorées par GZip-ping du contenu téléchargé le cas échéant. uPortal 4 "GZippe" déjà quelques CSS et JavaScript. uPortal ne fait cependant pas le GZip-ping de la page HTML d'uPortal en elle-même.

Le GZipping du contenu HTML peut être effectué via Tomcat. Pour activer cette fonctionnalité, définissez `compression="on"` dans le connecteur Tomcat utilisé, et définissez éventuellement la liste des types MIME compressibles. Vous trouverez plus d'informations sur cette fonctionnalité dans la [page de configuration Tomcat][].

```xml
<Connector port="8080" protocol="HTTP/1.1"
  connectionTimeout="20000" redirectPort="8443"
  compression="on" 
  compressableMimeType="text/html,text/xml,text/plain,text/css,text/javascript,application/javascript"/>
```

Vous pouvez éventuellement spécifier `compressionMinSize` ou le laisser à sa valeur par défaut de 2048 octets.

Si vous avez [Apache httpd en front de Tomcat](fronting-with-httpd.md) ou d'autres systèmes matériels, vous pouvez effectuer la compression dans Apache ou dans ces systèmes à la place.

### Démarrage parallèle de Tomcat 7/8

(Facultatif.)

Tomcat 7.0.23+ peut être [configuré pour démarrer en parallèle plusieurs webapps au démarrage][faster Tomcat startup wiki page], reduisant ainsi le temp de démarrage du serveur. Modifier l'attribut `startStopThreads` d'un `Host` avec une valeur supérieur à 1.

### Délai de session HTTP

Pour définir la durée des sessions HTTP, modifier `CATALINA_BASE/conf/web.xml` et remplacer l'élément session-timeout par le nombre de minutes souhaité.

La valeur par défaut de Tomcat est de 30 minutes.

```xml
<session-config>
  <session-timeout>30</session-timeout>
</session-config>
```

### Autres configurations de Tomcat

#### paramétrages JVM

+ [Exemple de paramètrage JVM](https://wiki.jasig.org/display/UPC/JVM+Configurations)
+ [Heap tuning](https://wiki.jasig.org/display/UPC/uPortal+Heap+Tuning)

#### Désactiver SSLv3

(Ceci est un peu à propos du SSL sortant. La [Documentation sur la configuration SSL entrante](ssl-configuration.md) est sur une autre page.)

Certains sites ont choisi de désactiver SSLv3 sur leur serveur CAS en raison de diverses vulnérabilités. Cela peut provoquer des problèmes avec le client CAS utilisé dans uPortal, celui-ci n'étant pas en mesure d'établir une connexion HTTPS avec le serveur CAS pour valider le ticket de service et lance donc une exception.

```
javax.net.ssl.SSLHandshakeException: Received fatal alert: handshake_failure
```
Une solution consiste à définir les protocoles utilisés par Java lors de la création de connexions SSL. Vous pouvez le faire en ajoutant la propriété suivante à `JAVA_OPTS` (ou `CATALINA_OPTS` si vous l'utilisez) :

Oracle Java7: `-Dhttps.protocols="TLSv1,TLSv1.1,TLSv1.2"` 

Votre serveur CAS doit être configuré pour utiliser l'un des protocoles mentionnés ou l'établissement de liaison (handshake) échouera. Si votre serveur CAS de test est accessible au public, vous pouvez voir les protocoles qu'il prend en charge en [testant son nom de domaine via SSL Labs](https://www.ssllabs.com/ssltest/). 

Si vous rencontrez des problèmes :

+ [Diagnostiquer TLS, SSL, et HTTPS](https://blogs.oracle.com/java-platform-group/entry/diagnosing_tls_ssl_and_https)

[page de configuration Tomcat]: http://tomcat.apache.org/tomcat-7.0-doc/config/http.html
[faster Tomcat startup wiki page]: http://wiki.apache.org/tomcat/HowTo/FasterStartUp

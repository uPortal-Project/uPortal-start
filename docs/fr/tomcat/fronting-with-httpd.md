# Mettre Httpd en front de Tomcat

Optionnel.

Il y a pléthore de raisons pour lesquelles vous pourriez avoir besoin ou envie d'exécuter Apache HTTP Server en front de uPortal.

+ Votre implémentation de Single Sign On nécessite l'utilisation d'un module Apache (par exemple Shibboleth)
+ Vous souhaitez équilibrer la charge de plusieurs instances de Tomcat et n'avez pas de technologie d'équilibrage de charge existante
+ Vous préférez décharger le SSL sur le serveur HTTP Apache

## Étape 1: Configuration d'Apache Tomcat

Dans `/path/to/your/apache-tomcat/conf/server.xml`

### Désactiver le connecteur par défaut

Commentez le connecteur par défaut.

```xml
<!-- Define a non-SSL HTTP/1.1 Connector on port 8080
<Connector port="8080" maxHttpHeaderSize="8192"
  maxThreads="150" minSpareThreads="25" maxSpareThreads="75"
  enableLookups="false" redirectPort="8443" acceptCount="100"
  connectionTimeout="20000" disableUploadTimeout="true" URIEncoding="UTF-8"/>
-->
```

### Activer le connecteur AJP

Décommentez le bloc de connecteur suivant (vous pouvez ajuster le port si vous le souhaitez).

```xml
<!-- Define an AJP 1.3 Connector on port 8009 -->
<Connector port="8009" address="127.0.0.1"
  enableLookups="false" redirectPort="8443" protocol="AJP/1.3" />
```

Il est important de considérer une valeur correcte pour l'attribut `address` dans le connecteur AJP décrit ci-dessus. Si vous ne spécifiez pas l'attribut `address` sur un connecteur, Tomcat se reliera à la valeur par défaut `0.0.0.0`, qui est une adresse spéciale qui se translate à TOUTES les adresses IP liées de l'hôte. Il n'est pas rare d'avoir plusieurs adresses IP liées à l'hôte s'exécutant sur votre instance uPortal/Tomcat, et si vous ne spécifiez pas l'adresse IP spécifique à écouter, vous pouvez ouvrir involontairement le connecteur AJP sur l'une de ces adresses.

Un bon choix à utiliser pour le connecteur AJP est localhost, 127.0.0.1 tant que vous exécutez Apache sur le même hôte que Tomcat. Si vous exécutez Apache et Tomcat sur des hôtes distincts, une adresse IP idéale pour relier votre connecteur AJP est celle qui se trouve sur un réseau privé ou derrière un pare-feu qui permettrait uniquement à l'hôte exécutant Apache de se connecter et d'interdire toutes les autres.

## Étape 2: Configuration du serveur Apache Http

Vous devrez configurer Apache pour router les demandes vers le connecteur AJP que vous avez configuré dans la partie précédente. Vous avez deux options, `mod_jk` et `mod_proxy_ajp`.

`mod_proxy_ajp` est une extension d'Apache mod_proxy qui implémente le protocole AJP. Il est livré avec Apache httpd Server 2.2 et ses versions ultérieures et peut être ajouté à votre instance de serveur en ajoutant les options suivantes à votre invocation `configure`:

```
--enable-proxy --enable-proxy-ajp
```

mod_proxy_ajp offre une configuration simple, en particulier, si vous êtes familier avec mod_proxy.

mod_jk est officiellement connu sous le nom de Apache Tomcat Connector et est un module Apache qui doit être [téléchargé séparément](http://tomcat.apache.org/connectors-doc/) et compilé avec votre source Apache Serveur HTTP. mod_jk a une configuration légèrement plus complexe, mais un ensemble différent de fonctionnalités de mod_proxy_ajp.

### Option \#1 mod_jk

**Note:** Pour une configuration avec IIS, utiliser ce lien... <a href="http://tomcat.apache.org/connectors-doc/reference/iis.html">http://tomcat.apache.org/connectors-doc/reference/iis.html</a>

#### Téléchargement

Télécharger [Apache Tomcat connector](http://tomcat.apache.org/connectors-doc/).

#### httpd.conf

Éditer `/path/to/apache/config/httpd.conf`.

##### LoadModule

Rechercher la section `LoadModule` et assurez-vous que le chemin `mod_jk` est défini (le chemin peut varier).

```
LoadModule jk_module "/usr/lib/httpd/modules/mod_jk.so"
```

#### IfModule

Définir la directive `IfModule`

```apache
<IfModule mod_jk.c>
  JkWorkersFile "/path/to/apache/config/workers.properties"
  JkLogFile "/path/to/apache/logs/mod_jk.log"
  JkLogLevel debug
  JkMount /*.jsp worker1
  JkMount /path/to/portal/* worker1
</IfModule>
JkMountCopy All
```

#### workers.properties

Configurer le fichier `workers.properties` (Vous pouvez inclure le fichier `workers.properties` dans le répertoire de configuration Apache, mais le chemin doit correspondre au fichier `httpd.conf` où vous avez défini le chemin de `JkWorkersFile`, voir ci-dessus.)

```
#Below is an example of a workers.properties file.
# Define 1 real worker using ajp13
worker.list=worker1

# Set properties for worker1 (ajp13)
worker.worker1.type=ajp13
# Set host to match the same value you used above for the 'address' attribute for your AJP Connector
worker.worker1.host=127.0.0.1
# Set the port to match the same value you used above for the 'port' attribute for your AJP Connector
worker.worker1.port=8009

# Below may vary as these are just examples of what can be included.
worker.worker1.lbfactor=50
worker.worker1.cachesize=10
worker.worker1.cache_timeout=600
worker.worker1.socket_keepalive=1
worker.worker1.socket_timeout=300

#Below is an example of a workers.properties file.
# Define 1 real worker using ajp13
worker.list=worker1

# Set properties for worker1 (ajp13)
```


### Option \#2 mod_proxy/mod_proxy_ajp

Après avoir configuré Tomcat à l'étape 1, vous devez maintenant aller dans votre répertoire de configuration Apache pour installer mod_proxy.

```shell
cd /path/to/apache/config
```

Ouvrir httpd.conf pour éditer et décommenter les modules suivants.

```shell
LoadModule proxy_module       /usr/lib/apache2-prefork/mod_proxy.so
LoadModule proxy_ajp_module   /usr/lib/apache2-prefork/mod_proxy_ajp.so
```

(le chemin des fichier `mod_proxy.so` et `mod_proxy_ajp.so` peuvent varier).

Vous pouvez choisir de séparer les configurations de `mod_proxy_ajp` en créant un nouveau fichier (par exemple, `mod_proxy_ajp.conf`), mais vous devrez mapper ce chemin dans votre fichier `httpd.conf`.

```apache
Include /path/to/apache/stuff/mod_proxy_ajp.conf
```

Si vous placez vos configurations `mod_proxy_ajp` dans un fichier séparé ou dans le `httpd.conf`, cela dépend entièrement de vous, mais vous devrez inclure les informations suivantes.

```shell
ProxyRequests Off
<Proxy *>
        Order deny,allow
        Deny from all
        Allow from localhost
</Proxy>
ProxyPass 		/ ajp://127.0.0.1:8009/ retry=0
ProxyPassReverse 	/ ajp://127.0.0.1:8009/ retry=0
```

L'adresse IP et le numéro de port dans le ProxyPass doivent correspondre au port que vous avez défini dans le Connecteur Tomcat AJP 1.3 (Étape 1).

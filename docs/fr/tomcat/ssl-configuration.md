# Configuration SSL

Le document suivant suppose que votre machine virtuelle Java a déjà été installée avec succès.

Les commandes concernant la création du fichier de clés de certificat font référence à l'utilitaire `keytool` fourni avec Oracle JDK.

+ [Keytool documentation for Windows](http://download.oracle.com/javase/6/docs/technotes/tools/windows/keytool.html)
+ [Keytool documentation for Solaris/Linux](http://download.oracle.com/javase/6/docs/technotes/tools/solaris/keytool.html)

## Étape 1: Créer un fichier de clés de certificat

Un fichier de clés de certificat est un fichier unique contenant des clés privées et des certificats SSL. Avant de pouvoir configurer Apache Tomcat pour qu'il écoute sur https, vous devez créer un fichier de clés de certificat contenant une clé privée et un certificat public. Exécuter la commande suivante:

```shell
$JAVA_HOME/bin/keytool -genkey -alias tomcat -keyalg RSA
```

+ Vous serez invité à entrer le "mot de passe du keystore" qui a la valeur par défaut `changeit`.
+ Les prochaines invites de commandes seront utilisées pour générer un certificat auto-signé pour votre nouvelle clé privée. Si vous êtes familier avec openssl, les champs vous sont présentés dans l'ordre inverse:
+ Quel est votre nom et prénom? (Cela correspond à CN et doit correspondre au nom de domaine que vos clients utiliseront pour accéder à votre instance uPortal. Exemple : <strong>yourhost.university.edu</strong>)
+ Quel est le nom de votre unité organisationnelle? (OU, Exemple : <strong>Direction des systèmes d'information </ strong>)
+ Quel est le nom de votre organisation? (O, Exemple : <strong>Université de quelquepart </ strong>)
+ Quel est le nom de votre ville ou localité? (L, Exemple : <strong>Quelque part</ strong>)
+ Quel est le nom de votre état ou province? (ST, exemple : <strong>Toulouse</ strong>)
+ Quel est le code de pays à deux lettres pour cette unité? (C, Exemple : <strong>FR</ strong>)
+ Il vous sera demandé de confirmer vos choix, tapez `yes` et appuyez sur Entrée pour accepter.
+ `Entrer le mot de passe pour &lt;tomcat &gt;` est la question suivante, NE taper PAS un mot de passe différent de celui de votre keystore. Tomcat ne prend pas en charge les clés dans les fichiers de clés qui ont des valeurs de mot de passe différentes de celles du fichier de clés lui-même. Appuyez simplement sur Entrée pour continuer.

Votre fichier de clés `cacerts` contient maintenant une clé privée et un certificat auto-signé. Les fichiers `cacerts` peuvent être trouvés dans votre installation JVM sur le chemin:

```
$JAVA_HOME/jre/lib/security/cacerts
```
Avant de publier cette instance uPortal auprès de vos clients, il est fortement recommandé de faire signer votre certificat par une autorité reconnue par les `navigateurs Web` de vos clients.

Pour que votre certificat soit signé, vous devez générer une demande de signature de certificat (CSR) pour votre nouvelle clé privée dans le fichier `cacerts`. Cela peut être fait avec la commande suivante:

```
$JAVA_HOME/bin/keytool -certreq -alias tomcat -keyalg RSA -file tomcat.csr
```

Le mot de passe du keystore vous sera à nouveau demandé (par défaut `changeit`). Vous trouverez le CSR dans le répertoire de travail actuel avec le nom de fichier `tomcat.csr`.

Vous êtes maintenant prêt à soumettre votre demande de signature de certificat à votre autorité de certification (AC) préférée. L'AC peut mettre du temps à répondre, vous pouvez donc passer à l'étape 2. Lorsque l'AC répond, suivez les instructions au bas de la page.

## Étape 2: Configuration de Tomcat pour utiliser SSL

Ouvrir le fichier `server.xml` et éditer le. Ce fichier doit se trouver dans `/path/to/tomcat/conf/server.xml`.

```shell
cd /path/to/tomcat/conf
```

Commenter le bloc de code suivant pour le port `8080` pour désactiver le plain text HTTP:

```xml
<!-- Define a non-SSL HTTP/1.1 Connector on port 8080
<Connector port="8080" maxHttpHeaderSize="8192"
  maxThreads="150" minSpareThreads="25" maxSpareThreads="75"
  enableLookups="false" redirectPort="8443" acceptCount="100"
  connectionTimeout="20000" disableUploadTimeout="true" /> -->
```

Décommenter le bloc de code suivant pour activer le connecteur HTTPS sur le port `8443` :

```xml
<!-- Define a SSL HTTP/1.1 Connector on port 8443 -->
<Connector port="8443" maxHttpHeaderSize="8192"
  maxThreads="150" minSpareThreads="25" maxSpareThreads="75"
  enableLookups="false" disableUploadTimeout="true"
  acceptCount="100" scheme="https" secure="true"
  clientAuth="false" sslProtocol="TLS" />
```

Ajouter l'attribut `address` au connecteur HTTPS:

```xml
<Connector port="8443" maxHttpHeaderSize="8192" address="192.168.1.1"
           maxThreads="150" minSpareThreads="25" maxSpareThreads="75"
           enableLookups="false" disableUploadTimeout="true"
           acceptCount="100" scheme="https" secure="true"
           clientAuth="false" sslProtocol="TLS" />
```

Il est important de considérer une valeur correcte pour l'attribut `address` dans le connecteur HTTPS décrit ci-dessus. Si vous ne spécifiez pas l'attribut `address` sur un` Connector`, Tomcat se reliera à la valeur par défaut `0.0.0.0`, qui est une adresse spéciale qui se transforme en TOUTES les adresses IP liées à l'hôte. Il n'est pas rare d'avoir plusieurs adresses IP liées à l'hôte exécutant votre instance uPortal/Tomcat, et si vous ne spécifiez pas l'adresse IP spécifique à écouter, vous pouvez ouvrir involontairement le connecteur HTTPS sur l'une de ces adresses.

Une fois que vous avez sauvegardé vos modifications dans `server.xml`, redémarrer simplement Tomcat :

```shell
$TOMCAT_HOME/bin/shutdown.sh
$TOMCAT_HOME/bin/startup.sh
```

## Addendum: Importation du certificat signé

Votre autorité de certification a finalement signé votre certificat. Stocker le fichier de certificat quelque part sur le système de fichiers et exécuter la commande suivante :

```shell
$JAVA_HOME/bin/keytool -import -alias tomcat -keyalg RSA -file /path/to/your/certificate_reply.crt
```

Le mot de passe du keystore vous sera demandé (par défaut `changeit`).

Vous pouvez vérifier que votre certificat est signé en regardant la sortie de :

```
$JAVA_HOME/bin/keytool -list -alias tomcat -v
```

Vous devriez voir l'autorité de certification dans la chaîne de certificats.

## Références supplémentaires

+ [Tomcat SSL Howto](http://tomcat.apache.org/tomcat-7.0-doc/ssl-howto.html)
+ [Apache httpd SSL documentation](http://httpd.apache.org/docs/2.2/ssl/)
+ [Apache httpd SSL FAQ](http://httpd.apache.org/docs/2.2/ssl/ssl_faq.html)

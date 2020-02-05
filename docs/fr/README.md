![uPortal logo](../en/images/uPortal-logo.jpg)

[![Linux Build Status](https://travis-ci.org/Jasig/uPortal-start.svg?branch=master)](https://travis-ci.org/Jasig/uPortal-start)

## À propos d'uPortal-start

uPortal-start est le mécanisme grâce auquel des individus ou des institutions adoptent et installent [Apereo uPortal][],
le framework open-source et leader en solution de portail d'entreprise, developpé par et pour l'enseignement supérieur, 
les lycées et collèges et les communautés de Recherche. **uPortal-start est une nouveauté d'uPortal 5.0**

uPortal-start va vous aider à gérer:

  - votre configuration d'uPortal
  - votre Skin uPortal
  - vos données dans uPortal
  - et vos déploiements d'uPortal au travers d'outils en interface en ligne de commande (CLI)

## Sujets supplémentaires

* [Configuration de Base de Données](database/README.md)
* [Configuration de Tomcat](tomcat/README.md)
* [Intégrations](integrations/README.md)
* [Fichiers de données (en)](../en/data/README.md)
* [Ajouter un contenu dans uPortal-start (en)](../en/content/README.md)

### Prérequis

Les logiciels suivants sont requis pour travailler avec uPortal-start :

  - un [Java Development Kit][] (JDK)
  - un [Client Git][] approprié à votre OS

Télécharger et installer la **dernière release JDK 8**.  Assurez-vous que ce soit le JDK ; _un JRE n'est pas suffisant !_

:warning: _Utiliser toujours Git_ pour obtenir une copie d'uPortal-start. (Ignorez _svp_ l'option _Download ZIP_
proposée par GitHub.)  La communauté de développeurs d'uPortal font des améliorations à uPortal-start
chaque semaine :  des nouvelles fonctionnalités, des fixes de bug, des améliorations de performance, des ajouts de documentation, _& cie_
Il est extrêmement important de pouvoir mettre à jour votre copie locale de uPortal-start et (par conséquent)
de bénéficier de ces contributions.

### Manuel uPortal 5.x

Ce `README` fournit des informations de haut niveau sur le composant uPortal-start, ainsi que des exemples 
d'exécution de nombreuses tâches courantes. Le manuel complet d'uPortal 5.x est hébergé dans les pages GitHUb.

  - [uPortal 5.x Manual (en)][]
  - [Manuel uPortal 5.x (fr)][]

autant que possible, **les exemples de ce `LISEZMOI` sont présentés dans l'ordre dans lequel vous allez
les exécuter** pour configurer un environnement de développement uPortal en local.

## Utiliser uPortal-start

uPortal-start fournit un système de build et plusieurs outils CLI via Gradle, et il est même livré 
avec un _Wrapper Gradle_, donc vous n'avez pas besoin d'installer Gradle pour l'utiliser.

Pour invoquer le Wrapper Gradle sur \*nix :

```console
    $ ./gradlew {taskname} [{taskname}...]
```

Pour invoquer le Wrapper Gradle sur Windows :

```console
    > gradlew.bat {taskname} [{taskname}...]
```

_NOTE :  Pour des raison de simplicité, les exemples restants de ce document sont sur \*nix._

Vous pouvez afficher une liste complète des tâches Gradle - avec une brève description de ce qu'elles font - 
en exécutant la commande suivante :

```console
    $ ./gradlew tasks
```

### Liste des Exemples :

  - [Comment tout configurer pour la première fois](#comment-tout-configurer-pour-la-première-fois)
  - [Comment installer Tomcat](#comment-installer-tomcat)
  - [Comment démarrer la base de données intégrée](#comment-démarrer-la-base-de-données-intégrée)
  - [Comment déployer la technologie uPortal sur Tomcat](#comment-déployer-la-technologie-uportal-sur-tomcat)
  - [Comment créer et initialiser le schéma de base de données](#comment-créer-et-initialiser-le-schéma-de-base-de-données)
  - [Comment démarrer Tomcat](#comment-démarrer-tomcat)
  - [Comment créer une Skin personnalisée](#comment-créer-une-skin-personnalisée)
  - [Comment configurer votre déploiement](#comment-configurer-votre-déploiement)

### Comment tout configurer pour la première fois

Les exemples restants (ci-dessous) illustrent comment effectuer les tâches uPortal les plus courantes 
individuellement; mais il y a un moyen facile de toutes les faire à la fois quand vous débutez.

Utilisez la commande suivante pour configurer votre portail la première fois :

```console
    $ ./gradlew portalInit
```

Cette commande effectue les étapes suivantes :

  - Démarre l'instance HSQLDB intégrée (`hsqlStart`)
  - Télécharge, installe et configure le conteneur de servlet Tomcat intégré (`tomcatInstall`)
  - Déploie toutes les applications Web d'uPortal sur Tomcat (`tomcatDeploy`)
  - Créé le schéma de base de données et importe à la fois les données basiques et personnalisées par implémentation (`dataInit`)

:warning:  Après cette commande, votre instance HSQLDB sera en cours d'exécution. C'est normalement une bonne chose,
mais n'oubliez pas de l'arrêter si vous en avez besoin.

:notebook: D'autre part, votre serveur Tomcat _ne sera pas exécuté_ lorsque cette commande aura été 
faite. N'oubliez pas de [suivre ces instructions](#comment-démarrer-tomcat) pour le démarrer.

:notebook: Vous pouvez réexécuter cette commande plus tard si vous voulez "réinitialiser" votre environnement à un état propre. 
C'est une bonne idée de **s'assurer que le conteneur Tomcat et l'instance HSQLDB ne fonctionnent pas** lorsque vous la lancez.

### Comment installer Tomcat

uPortal-start est pré-intégré avec le [conteneur de servlet Apache Tomcat][], qui est 
un prérequis pour l'exécution de uPortal. De plus, plusieurs étapes de configuration de Tomcat doivent être effectuées 
avant que l'application uPortal ne fonctionne correctement à l'intérieur de ce dernier. uPortal-start gère ces tâches 
de configuration pour vous.

Vous pouvez télécharger (depuis [Maven Central][]), installer, et configurer correctement un conteneur 
Tomcat approprié en exécutant la commande suivante :

```console
    $ ./gradlew tomcatInstall
```

Vous pouvez réexécuter cette commande à tout moment pour réinitialiser votre conteneur Tomcat aux valeurs par défaut définies 
par uPortal-start.

### Comment démarrer la base de données intégrée

uPortal-start est également pré-intégré avec un système de gestion de base de données relationnelle (SGBDR) appelé 
[HSQLDB][]. Une instance de SGBDR prise en charge est une autre exigence de uPortal. Pour les déploiements d'uPortal sur serveurs, 
vous pourrez choisir une plateforme de SGBDR différente: Oracle, MS SQL Server, 
MySQL ou PostgreSQL. L'instance HSQLDB intégrée, cependant, est recommandée pour les environnements 
de développement locaux de uPortal.

Utilisez la commande suivante pour démarrer l'instance HSQLDB intégrée :

```console
    $ ./gradlew hsqlStart
```

:notebook: la base de données doit être en cours d'exécution à tout moment lorsque uPortal est en cours d'exécution et doit également être 
exécutée chaque fois que plusieurs outils d'importation/exportation sont appelés. (Voir les exemples ci-dessous.) Il est 
d'usage de laisser HSQLDB fonctionner toute la journée, ou tant que vous travaillez activement sur uPortal.

Vous pouvez arrêter l'instance HSQLDB avec la commande suivante :

```console
    $ ./gradlew hsqlStop
```

Vous pouvez lancer l'application HSQLDB Manager avec la commande suivante :

```console
    $ ./gradlew hsqlOpen
```

### Comment déployer la technologie uPortal sur Tomcat

Quand (Chaque fois que) vous exécutez la tâche `tomcatInstall`, le conteneur tomcat sera vidé. Vous devez 
"builder" votre application uPortal et la déployer sur Tomcat avant de pouvoir la voir 
fonctionner.

Vous pouvez le faire avec la commande suivante :

```console
    $ ./gradlew tomcatDeploy
```

:notebook:  vous devrez _exécuter cette commande_ à chaque fois que vous apportez des modifications 
à tout ce qui se trouve dans le dossier `overlays`.

Vous pouvez également exécuter cette commande pour un projet à la fois, par exemple ...

```console
    $ ./gradlew :overlays:Announcements:tomcatDeploy
```

C'est un excellent moyen de gagner du temps lorsque vous travaillez sur un sous-projet spécifique.

### Comment créer et initialiser le schéma de base de données

uPortal-start fournit plusieurs outils CLI (Interface en ligne de commande) qui vous permettent de gérer 
la base de données du portail. La plus importante d'entre elles est la tâche `dataInit`.

Utiliser la commande suivante pour créer le schéma de base de données et alimenter la avec les 
_données de base du portail_ ainsi que le _jeu de données de votre propre implémentation_ :

```console
    $ ./gradlew dataInit
```

:warning: Cette commande permet également de supprimer si nécessaire le schéma de base de données existant (créé au préalable).
Probablement vous effectuerez cette tâche en production une seule fois (au début). 
Dans le cas de déploiements hors production, toutefois, l'utilisation de `dataInit` pour une « réinitialisation 
complète de la base de données » est assez courante. 

### Comment démarrer Tomcat

Une fois que vous avez déployé la technologie uPortal, vous devez démarrer le serveur Tomcat avant de pouvoir 
voir votre portail fonctionner. Vous pouvez le faire avec la commande suivante:

```console
    $ ./gradlew tomcatStart
```

:warning: Il est plus sûr d'exécuter les tâches Gradle dans uPortal-start _uniquement lorsque Tomcat n'est pas en cours d'exécution_.
Cette disposition s'applique aux tâches qui génèrent et déploient uPortal, ainsi qu'aux tâches qui 
manipulent la base de données du portail.

Vous pouvez arrêter le serveur Tomcat en utilisant cette commande :

```console
    $ ./gradlew tomcatStop
```
### Premier lancement d'uPortal via uPortal-start

En assumant que tous les paramètres par défaut sont conservés :
* L'URL d'accès à uPortal est :  <http://localhost:8080/uPortal/>
* En utilisant les crédentials en exemple, vous pouvez bypasser CAS en test local. les logins / URL sont :
  * admin: <http://localhost:8080/uPortal/Login?userName=admin&password=admin>
  * faculty: <http://localhost:8080/uPortal/Login?userName=faculty&password=faculty>
  * staff <http://localhost:8080/uPortal/Login?userName=staff&password=staff>
  * student <http://localhost:8080/uPortal/Login?userName=student&password=student>
  * guest <http://localhost:8080/uPortal/render.userLayoutRootNode.uP>
* L'installation par défaut de tomcat est :  _uPortal-start/.gradle/tomcat_
* Les logs pour debugger sont localisés dans :  _uPortal-start/.gradle/tomcat/logs_

### Comment créer une Skin personnalisée

uPortal-start fournit une tâche Gradle qui vous permet de démarrer correctement lorsque vous êtes prêt à 
créer une Skin personnalisée. Utilisez cette commande pour générer une nouvelle Skin pour uPortal Respondr :

```console
    $ ./gradlew skinGenerate -DskinName={name}
```
Vous _devez_ spécifier un nom pour votre Skin. Un nom de Skin valide contient entre 3 et 20 caractères alphanumériques.

Vos fichiers de Skin seront placés dans `overlays/uPortal/src/main/webapp/media/skins/respondr`. Vous 
pouvez ajuster de nombreux paramètres communs dans `variables.less`; utilisez `skin.less` pour définir les règles CSS (en
syntaxe LESS) qui surchargeront la CSS par défaut d'uPortal/Respondr.

### Comment configurer votre déploiement

uPortal contient de nombreux paramètres de configuration. (Reportez-vous au [Manuel uPortal 5.x (fr)][] pour un
guide complet de configuration.) Tous les paramètres ont des valeurs par défaut qui, pour la plupart, 
ont été sélectionnées pour répondre aux besoins d'un environnement de développement local (comme le ceux 
de ce `LISEZMOI` vous guide dans cette création).

Vous pouvez _surcharger_ la valeur de la plupart des paramètres de configuration en utilisant un ou les deux fichiers de 
configuration locaux suivants:

  - `uPortal.properties`
  - `global.properties`

Les deux fichiers sont facultatifs. `uPortal.properties` est pour les paramètres _uPortal seulement_, alors que 
`global.properties` est pour les paramètres qui peuvent aussi être lus et utilisés par les _Modules d'uPortal_ (comme 
les portlets). Les deux fichiers prennent en charge tous les mêmes paramètres. Si le même paramètre est défini dans 
les deux fichiers, la valeur dans `uPortal.properties` "gagnera".

Les deux fichiers (si vous les utilisez) doivent être placés dans le répertoire `portal.home`. L'emplacement par 
défaut de `portal.home` est '`${catalina.base}`/portal', mais vous pouvez spécifier votre propre emplacement 
en définissant une variable d'environnement `PORTAL_HOME`.

Un exemple de fichier `uPortal.properties` - avec plusieurs paramètres couramment définis et 
documentés - est disponible dans le répertoire `etc/portal` de ce projet. N'hésitez pas à personnaliser 
cet exemple avec des valeurs spécifiques à votre institution dans votre fork de uPortal-start.

### Création d'une image Docker

:warning: Le support de Docker pour uPortal-start requiert Docker version 17.05 ou supérieur.

uPortal-start fournit une prise en charge intégrée pour la création d'images Docker via son interface de ligne de commande (CLI). 
Il sait comment créer trois images différentes (à trois fins différentes) :

  - `apereo/uportal` est la base, une image du serveur web seulement
  - `apereo/uportal-cli` est l'image pour exécuter des commandes CLI à partir d'un conteneur (ex. : Import/Export)
  - `apereo/uportal-demo` est une image qui inclut la base de données HSQL intégrée et convient pour évaluer uPortal

Utiliser l'une des tâches Gradle suivantes pour créer l'image dont vous avez besoin :

```console
./gradlew dockerBuildImageWeb         // builds apereo/uportal
./gradlew dockerBuildImageCli         // builds apereo/uportal-cli
./gradlew dockerBuildImageDemo        // builds apereo/uportal-demo
./gradlew dockerBuildImages           // builds all three images
```

Assurez-vous toujours que `tomcatInstall` et `tomcatDeploy` ont bien été exécutés et que leur sortie est 
intacte avant d'appeler l'une des tâches `dockerBuildImage <type>`.

[Apereo uPortal]: https://www.apereo.org/projects/uportal
[uPortal 5.x Manual (en)]: https://jasig.github.io/uPortal
[Manuel uPortal 5.x (fr)]: https://jasig.github.io/uPortal/fr
[Java Development Kit]: http://www.oracle.com/technetwork/java/javase/downloads/index.html
[Client Git]: https://git-scm.com/downloads
[conteneur de servlet Apache Tomcat]: https://tomcat.apache.org/
[Maven Central]: https://search.maven.org/
[HSQLDB]: http://hsqldb.org/
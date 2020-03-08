![uPortal logo](docs/en/images/uPortal-logo.jpg)

[![Linux Build Status](https://travis-ci.org/Jasig/uPortal-start.svg?branch=master)](https://travis-ci.org/Jasig/uPortal-start)

[:fr: Français](docs/fr)

## About uPortal-start

uPortal-start is the mechanism through which individuals and institutions adopt [Apereo uPortal][],
the leading open source enterprise portal framework built by and for higher education institutions,
K-12 schools, and research communities.  **uPortal-start is new for uPortal 5.0**

uPortal-start help you manage:

  - Your uPortal configuration
  - Your uPortal skin
  - Your uPortal data
  - And your uPortal deployments through an integrated suite of CLI tools

### Prerequisites

The following software packages are required for working with uPortal-start:

  - A Java Development Kit (JDK), version 8 ([Oracle JDK 8][], [Corretto JDK 8][], [Adopt OpenJDK 8][], or [Zulu JDK 8][])
  - A suitable [Git Client][] for your OS

Download and install the **latest JDK 8 release**.  Make sure you select the full JDK;  _a JRE is
not sufficient!_

:warning: _Always use Git_ to obtain a copy of uPortal-start.  (Please ignore the _Download ZIP_
option provided by GitHub.)  The uPortal Developer Community makes improvements to uPortal-start
every week:  new features, bug fixes, performance enhancements, additions to documentation, _&c._
It is extremely important to be able to update your local copy of uPortal-start and (thereby)
benefit from these contributions.

### uPortal 5.0 Manual

This `README` provides some high-level information on the uPortal-start component, plus some how-to
examples of performing many of the most common tasks.  The complete uPortal 5.0 Manual is hosted in
GitHUb Pages.

  - [uPortal 5.0 Manual][]

As far as possible, **the examples in this `README` are presented in the order in which you will
want to perform them** when you set up a local uPortal dev environment.

## Using uPortal-start

uPortal-start provides a build system and several CLI tools through Gradle, and it even comes with a
_Gradle Wrapper_ so you don't have to install Gradle to use it.

Invoking the Gradle Wrapper on \*nix:

```console
    $ ./gradlew {taskname} [{taskname}...]
```

Invoking the Gradle Wrapper on Windows:

```console
    > gradlew.bat {taskname} [{taskname}...]
```

_NOTE:  For the sake of brevity, the remaining examples in this document are \*nix-only._

You can view a comprehensive list of Gradle tasks -- with short descriptions of what they do -- by
running the following command:

```console
    $ ./gradlew tasks
```

### List of Examples:

  - [How To Set Up Everything the First Time](#how-to-set-up-everything-the-first-time)
  - [How To Install Tomcat](#how-to-install-tomcat)
  - [How To Start the Embedded Database](#how-to-start-the-embedded-database)
  - [How To Deploy uPortal Technology to Tomcat](#how-to-deploy-uportal-technology-to-tomcat)
  - [How To Create and Initialize the Database Schema](#how-to-create-and-initialize-the-database-schema)
  - [How To Start Tomcat](#how-to-start-tomcat)
  - [How To Create a Custom Skin](#how-to-create-a-custom-skin)
  - [How To Configure Your Deployment](#how-to-configure-your-deployment)
  - [How To Customize Text](#how-to-customize-text)

### How To Set Up Everything the First Time

The remaining examples (below) illustrate how to perform the most common uPortal tasks
individually;  but there's an easy way to do all of them at once when you're just starting out.

Use the following command to set up your portal the first time:

```console
    $ ./gradlew portalInit
```

This command performs the following steps:

  - Starts the integrated HSQLDB instance (`hsqlStart`)
  - Downloads, installs, and configures the integrated Tomcat servlet container (`tomcatInstall`)
  - Deploys all uPortal web applications to Tomcat (`tomcatDeploy`)
  - Creates the database schema, and imports both the Base & Implementation data sets (`dataInit`)

:warning:  After this command, your HSQLDB instance will be running.  That's normally a good thing,
but don't forget to stop it if you need to.

:notebook:  Your Tomcat server, on the other hand, _will not be running_ when this command
finishes.  Don't forget to [follow these instructions](#how-to-start-tomcat) to start it.

:notebook:  You can run this command again later if you want to "reset" your environment to a clean
state.  It's a good idea to **make sure both the Tomcat container and the HSQLDB instance are not
running** when you do.

### How To Install Tomcat

uPortal-start comes pre-integrated with the [Apache Tomcat Servlet Container][], which is a
requirement for running uPortal.  Several Tomcat configuration steps must be performed, moreover,
before the uPortal application software will function properly within it.  uPortal-start handles
these configuration tasks for you.

You can download (from [Maven Central][]), install, and properly configure an appropriate Tomcat
container by running the following command:

```console
    $ ./gradlew tomcatInstall
```

You can run this command again at any time to reset your Tomcat container to the defaults defined
by uPortal-start.

### How To Start the Embedded Database

uPortal-start also comes pre-integrated with a Relational Database Management System (RDBMS) called
[HSQLDB][].  A supported RDBMS instance is another uPortal requirement.  For uPortal server
deployments, you will want to choose a different RDBMS platform:  most likely Oracle, MS SQL
Server, MySQL, or PostgreSQL.  The integrated HSQLDB instance, however, is recommended for local
dev environments of uPortal.

Use the following command to start the embedded HSQLDB instance:

```console
    $ ./gradlew hsqlStart
```

:notebook:  the database must be running at all times when uPortal is running, and it also must be
running whenever several of the Import/Export tools are invoked.  (See examples below.)  It is
customary to leave HSQLDB running all day, or as long as you're actively working on uPortal.

You can stop the HSQLDB instance with the following command:

```console
    $ ./gradlew hsqlStop
```

You can launch the HSQL DB Manager application with the following command:

```console
    $ ./gradlew hsqlOpen
```

### How To Deploy uPortal Technology to Tomcat

When(ever) you perform the `tomcatInstall` task, the Tomcat container will be empty.  You need to
build your uPortal application software and deploy it to Tomcat before you will be able to see it
working.

You can do that with the following command:

```console
    $ ./gradlew tomcatDeploy
```

:notebook:  you will need to _run this command again_ any time you make changes to anything inside
the `overlays` folder.

You can also run this command for one project at a time, for example...

```console
    $ ./gradlew :overlays:Announcements:tomcatDeploy
```

This is a great way to save time when you're working on a specific subproject.

### How To Create and Initialize the Database Schema

uPortal-start provides several Command Line Interface (CLI) tools that allow you to manage the
portal database.  The most important of these is the `dataInit` task.

Use the following command to create the database schema and fill it with _base portal data_ as well
as your _implementation data set_:

```console
    $ ./gradlew dataInit
```

:warning:  This command also _drops the existing database schema_ (beforehand) if necessary.
You probably want to perform this task against the production portal database exactly one time (in
the beginning).  In the case of non-production deployments, however, using `dataInit` for a full
"database reset" is fairly common.

### How To Start Tomcat

Once you have deployed uPortal technology, you will need to start the Tomcat server before you can
see your portal working.  You can do that with the following command:

```console
    $ ./gradlew tomcatStart
```

:warning:  It is safest to run Gradle tasks in uPortal-start _only when Tomcat is not running_.
This provision applies to tasks that build and deploy uPortal technology, as well as tasks that
manipulate the portal database.

You can stop the Tomcat server using with this command:

```console
    $ ./gradlew tomcatStop
```
### First Time Running uPortal via uPortal-start

Assuming all the defaults were left untouched:
* The URL to access uPortal is:  <http://localhost:8080/uPortal/>
* Using the example credentials, you can bypass CAS when testing locally.  Available default logins / URLs:
  * admin: <http://localhost:8080/uPortal/Login?userName=admin&password=admin>
  * faculty: <http://localhost:8080/uPortal/Login?userName=faculty&password=faculty>
  * staff <http://localhost:8080/uPortal/Login?userName=staff&password=staff>
  * student <http://localhost:8080/uPortal/Login?userName=student&password=student>
  * guest <http://localhost:8080/uPortal/render.userLayoutRootNode.uP>
* The default tomcat install is:  _uPortal-start/.gradle/tomcat_
* The logs to watch for issues are located in:  _uPortal-start/.gradle/tomcat/logs_

### How To Create a Custom Skin

uPortal-start provides a Gradle task that can get you started on the right foot when you're ready to
create a custom skin.  Use this command to generate a new skin for uPortal Respondr:

```console
    $ ./gradlew skinGenerate -DskinName={name}
```

You _must_ specify a name for your skin.  A valid skin name contains between 3 and 20 alphanumeric
characters.

Your skin files will be placed inside `overlays/uPortal/src/main/webapp/media/skins/respondr`.  You
can adjust many common settings in `variables.less`;  use `skin.less` to define CSS rules (in LESS
syntax) that override the default uPortal/Respondr CSS.

### How To Configure Your Deployment

uPortal contains many configuration settings.  (Please refer to the [uPortal 5.0 Manual][] for a
comprehensive guide to configuration.)  All settings have default values, which  -- for the most
part -- have been selected to suit the needs of a local development environment (like the one this
`README` guides you through creating).

You can _override_ the value of most configuration settings using one or both of the following local
configuration files:

  - `uPortal.properties`
  - `global.properties`

Both files are optional.  `uPortal.properties` is for _uPortal-only_ settings, whereas
`global.properties` is for settings that may also be read and used by _uPortal Modules_ (such as
portlets).  Both files support all the same settings.  If the same setting is defined in both
files, the value in `uPortal.properties` "wins."

Both files (if you're using them) must be placed in the `portal.home` directory.  The default
location of `portal.home` is '`${catalina.base}`/portal', but you can specify your own location by
defining a `PORTAL_HOME` environment variable.

A sample `uPortal.properties` file -- with several commonly-adjusted settings defined and
documented -- is available in the `etc/portal` directory of this project.  Feel free to customize
that sample with institution-specific defaults in your fork of uPortal-start.

### How To Customize Text

Most of the text strings displayed in the portal are in the
[uPortal](https://github.com/Jasig/uPortal) project, defined in
`Messages.properties` in the directory
`uPortal-webapp/src/main/resources/properties/i18n`.

You can override this
file by **_copying the entire file_** to the **uPortal-start** project and putting it in a
directory named `i18n` under `overlays/uPortal/src/main/resources/properties`.
The full filepath should be
`overlays/uPortal/src/main/resources/properties/i18n/Messages.properties`.

You can make changes to text and rebuild the uPortal-start project without
having to modify the uPortal project.

### Creating a Docker Image

:warning: Support for Docker in uPortal-start requires Docker version 17.05 or above.

uPortal-start provides baked-in support for building Docker images through its CLI.  It knows how
to create three different images (for three different purposes):

  - `apereo/uportal` is the basic, web server-only image
  - `apereo/uportal-cli` is the image for running CLI commands from within a container (e.g. Import/Export)
  - `apereo/uportal-demo` is an image that includes the embedded HSQL database and is suitable for evaluating uPortal

Use one of the following Gradle tasks to build the image(s) you need:

```console
./gradlew dockerBuildImageWeb         // builds apereo/uportal
./gradlew dockerBuildImageCli         // builds apereo/uportal-cli
./gradlew dockerBuildImageDemo        // builds apereo/uportal-demo
./gradlew dockerBuildImages           // builds all three images
```

:warning: Always make sure both `tomcatInstall` and `tomcatDeploy` have run and their output is
intact before invoking any of the `dockerBuildImage<type>` tasks.

[Apereo uPortal]: https://www.apereo.org/projects/uportal
[uPortal 5.0 Manual]: https://jasig.github.io/uPortal
[Oracle JDK 8]: https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html
[Corretto JDK 8]: https://docs.aws.amazon.com/corretto/latest/corretto-8-ug/downloads-list.html
[Adopt OpenJDK 8]: https://adoptopenjdk.net/?variant=openjdk8
[Zulu JDK 8]: https://www.azul.com/downloads/zulu-community/?&version=java-8-lts
[Git Client]: https://git-scm.com/downloads
[Apache Tomcat Servlet Container]: https://tomcat.apache.org/
[Maven Central]: https://search.maven.org/
[HSQLDB]: http://hsqldb.org/

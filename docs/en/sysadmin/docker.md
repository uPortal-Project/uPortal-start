# Docker

## Benefits of Docker with uPortal

  - Includes all dependencies and tooling out of the box
  - Capture known OS flavor and version
  - JDK version explicitly rolled into image
  - Transient dependencies locked
  - Images are files that can be managed by Ops for updates/rollbacks
    - Images are only about 1Gb
  - Images are portable!!

## uPortal Docker Tasks

  - dockerBuildImageCli
    - Builds the Docker image used to invoke Import/Export tasks from within a container
    - Copies in several files / directories from uPortal-start
  - dockerBuildImageDemo
    - Builds the uPortal Demo Docker image
    - Runs hsqlStart and dataInit on startup
  - dockerBuildImageWeb
    - Builds the basic web server-only Docker image
    - Only captures Tomcat, uPortal and portlet webapps
  - dockerBuildImages
    - All-in-one Gradle task for building all the Docker image
    - Takes about 20 minutes on my laptop to build all 3 images

## Building and Running uPortal Demo

Here are the steps to setup uPortal Demo as a Docker image and then run it as a container.

### Prerequisites

  - Docker installed for non-admin users
  - Java 8 JDK installed and configured (e.g. JAVA_HOME set)
  - uPortal-start repository present

### Steps

  - Build and run uPortal to confirm it works as expected
  - Stop HSQL and Tomcat, if they are running
  - Create the Docker images from the repo
    - `$ ./gradlew dockerBuildImageCli dockerBuildImageDemo`
  - Confirm that the images were created in Docker
    - `$ docker images`
  - Run the image as a container with shell access
    - `$ docker run -it -p 8080:8080 apereo/uportal-demo`
  - Wait for the container to finish starting up Tomcat
  - Point your browser at `http://localhost:8080/uPortal`

## Using Docker in Deployments

### Prerequisites for Servers

  - Docker installed for non-admin users
  - Java 8 JDK installed and configured (e.g. JAVA_HOME set)
  - uPortal user (e.g. `portal` and home directory (e.g. `/opt/uportal`) set up
  - Have a naming convention for uPortal images
    - Example uses "uportal" - "uPortal version" - "local revision"
    - Developers should tag commits to mark deployments

### Build uPortal Images

  - Build server set up to build uPortal
    - Does not have to be a dedicated server
  - Repository to capture versions of your local docker images
    - This is often an Ops system rather than Git
  - Build uPortal Web image
    - `$ ./gradlew dockerBuildImageWeb`
  - Export uPortal Web image
    - `$ docker save -o uportal-v5.7.0-01.image apereo/uportal`
  - Save image file to repository
  - Copy image to servers, preferrable to uPortal user home directory

### Setup on Servers

  - Create a log directory
    - `$ sudo mkdir /opt/uportal/logs`
    - `$ sudo chown portal /opt/uportal/logs`
  - Create a configuration directory
    - `$ sudo mkdir /opt/uportal/portal`
    - `$ sudo chown portal /opt/uportal/portal`
  - Copy/update configuration files for local server
    - This is usually also managed with an Ops system
    - At miminum, should have:
      - `/opt/uportal/portal/global.properties`
      - `/opt/uportal/portal/uPortal.properties`

### Run uPortal Image on Servers

  - Import Docker Image
    - `$ docker load -i uportal-v5.7.0-01.image`
  - Run uPortal Docker Image
    - `$ docker run --name uportal-v5.7.0-01 -d -v /opt/uportal/logs:/tomcat/logs -v /opt/uportal/portal:/tomcat/portal -p 8080:8080 apereo/uportal`
  - Confirm that logs are updating
    - `$ ls -rtl /opt/uportal/logs`

## Known Issues

  - Demo image is broken when using a custom skin
    - This does not affect Web images as they already contain binaries, rather than build from source
  - Running the docker tasks to create images while HSQL is running breaks HSQL in container
    - The lock files are copied when HSQL is running, causing a lock issue in the container
  - On Linux, using Docker with pipes does not work
    - Reconfigure Docker to use ports

## Docker Intro

[Docker Getting Started](https://docs.docker.com/get-started/)



## Alternatives to Docker

If Docker is not a technology of interest, there are alternatives that uPortal-start supports. uPortal-start has two gradle tasks that archive and compress Tomcat with all the uPortal and portlets apps deployed.

  - `./gradlew tomcatTar`
    - Creates `tomcat-uportal.tgz`
  - `./gradlew tomcatZip`
    - Creates `tomcat-uportal.zip`

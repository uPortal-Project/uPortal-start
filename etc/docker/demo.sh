#!/bin/sh

# Start the embedded HSQL database, create the schema, import all the data
gradle --no-daemon hsqlStart dataInit

# Start the Tomcat container
.gradle/tomcat/bin/catalina.sh run

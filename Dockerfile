# build uPortal's custom Tomcat
FROM openjdk:8-jdk-alpine as build
COPY . .
RUN ./gradlew tomcatInstall tomcatDeploy --no-daemon

# copy custom Tomcat runtime into minimal Java container
FROM openjdk:8-jdk-alpine as server
COPY --from=build .gradle/tomcat .
CMD ./bin/catalina.sh run
EXPOSE 8080:8080

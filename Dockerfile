# build uPortal's custom Tomcat
FROM openjdk:8
ADD . .
RUN ./gradlew portalInit

# copy custom Tomcat runtime into minimal JRE container
FROM openjdk:8-jre-alpine
COPY --from=0 .gradle/tomcat .
CMD ./bin/catalina.sh run
EXPOSE 8080:8080

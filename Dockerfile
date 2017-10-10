FROM openjdk:8
ADD . .
RUN ./gradlew portalInit
CMD ./gradlew hsqlStart && sleep 15 && ./gradlew tomcatStart
EXPOSE 8080

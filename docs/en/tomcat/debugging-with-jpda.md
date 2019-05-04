# Debugging with JPDA

Tomcat has support for step through debugging through the Java Platform Debugger Architecture (JPDA).
To enable JPDA add a flag when starting tomcat.

```sh
./gradlew tomcatStart --with-jpda
```

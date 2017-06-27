rem Display settings at startup
set CATALINA_OPTS=%CATALINA_OPTS% -XX:+PrintCommandLineFlags

rem Discourage address map swapping by setting Xms and Xmx to the same value
rem http://confluence.atlassian.com/display/DOC/Garbage+Collector+Performance+Issues
set CATALINA_OPTS=%CATALINA_OPTS% -Xms64m
set CATALINA_OPTS=%CATALINA_OPTS% -Xmx512m

rem Prevent "Unrecognized Name" SSL warning
set CATALINA_OPTS=%CATALINA_OPTS% -Djsse.enableSNIExtension=false

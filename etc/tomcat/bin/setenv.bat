rem Display settings at startup
set CATALINA_OPTS=%CATALINA_OPTS% -XX:+PrintCommandLineFlags

rem Discourage address map swapping by setting Xms and Xmx to the same value
rem http://confluence.atlassian.com/display/DOC/Garbage+Collector+Performance+Issues
set CATALINA_OPTS=%CATALINA_OPTS% -Xms64m
set CATALINA_OPTS=%CATALINA_OPTS% -Xmx512m

rem Prevent "Unrecognized Name" SSL warning
set CATALINA_OPTS=%CATALINA_OPTS% -Djsse.enableSNIExtension=false

rem We need to send a 'portal.home' system property to the JVM;  use the value of PORTAL_HOME, if
rem present, or fall back to a value calculated from %CATALINA_BASE%
if not "%PORTAL_HOME%" == "" goto gotPortalHome
set "PORTAL_HOME=%CATALINA_BASE%\portal"
:gotPortalHome
set CATALINA_OPTS=%CATALINA_OPTS% -Dportal.home=%PORTAL_HOME%

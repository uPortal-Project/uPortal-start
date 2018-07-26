rem Display settings at startup
set CATALINA_OPTS=%CATALINA_OPTS% -XX:+PrintCommandLineFlags

rem Discourage address map swapping by setting Xms and Xmx to the same value
rem http://confluence.atlassian.com/display/DOC/Garbage+Collector+Performance+Issues

rem Prevent "Unrecognized Name" SSL warning
set CATALINA_OPTS=%CATALINA_OPTS% -Djsse.enableSNIExtension=false

rem Checking if anyother garbage collectors have been defined. If no other garbage
rem collector is present, default to G1GC
rem List of options taken from:
rem http://www.oracle.com/webfolder/technetwork/tutorials/obe/java/gc01/index.html
rem Help with findstr and envir vars:
rem https://stackoverflow.com/questions/5491383/find-out-whether-an-environment-variable-contains-a-substring
echo.%CATALINA_OPTS%|findstr /C:"-XX:+UseSerialGC" /C:"-XX:+UseParallelGC" /C:"-XX:ParallelGCThreads" /C:"-XX:+UseParallelOldGC" /C:"-XX:+UseConcMarkSweepGC" /C:"-XX:+UseParNewGC" /C:"-XX:+CMSParallelRemarkEnabled" /C:"-XX:CMSInitiatingOccupancyFraction" /C:"-XX:+UseCMSInitiatingOccupancyOnly" /C:"-XX:+UseG1GC" >nul 2>&1
if not errorlevel 1 (
    echo Already declared a garbage collector
) else (
    set CATALINA_OPTS=%CATALINA_OPTS% -XX:+UseG1GC
)

rem Check if heap space allocation is already set
rem If it is, leave it be
echo.%CATALINA_OPTS%|findstr /C:"-Xms"
if not errorlevel 1 (
    echo Already declared a minimum value for heap space
) else (
    set CATALINA_OPTS=%CATALINA_OPTS% -Xms64m
)

echo.%CATALINA_OPTS%|findstr /C:"-Xmx"
if not errorlevel 1 (
    echo Already declared a maximum value for heap space
) else (
    set CATALINA_OPTS=%CATALINA_OPTS% -Xmx512m
)

rem We need to send a 'portal.home' system property to the JVM;  use the value of PORTAL_HOME, if
rem present, or fall back to a value calculated from %CATALINA_BASE%
if not "%PORTAL_HOME%" == "" goto gotPortalHome
set "PORTAL_HOME=%CATALINA_BASE%\portal"
:gotPortalHome
set CATALINA_OPTS=%CATALINA_OPTS% -Dportal.home=%PORTAL_HOME%

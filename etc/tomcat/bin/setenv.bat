# Display settings at startup
set CATALINA_OPTS=%CATALINA_OPTS% -XX:+PrintCommandLineFlags

# Discourage address map swapping by setting Xms and Xmx to the same value
# http://confluence.atlassian.com/display/DOC/Garbage+Collector+Performance+Issues
set CATALINA_OPTS=%CATALINA_OPTS% -Xms64m
set CATALINA_OPTS=%CATALINA_OPTS% -Xmx512m

# Prevent "Unrecognized Name" SSL warning
set CATALINA_OPTS=%CATALINA_OPTS% -Djsse.enableSNIExtension=false

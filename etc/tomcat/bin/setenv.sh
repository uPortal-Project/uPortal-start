# Display settings at startup
CATALINA_OPTS="$CATALINA_OPTS -XX:+PrintCommandLineFlags"

# SNI must stay enabled. Do NOT add `-Djsse.enableSNIExtension=false` here:
# every modern HTTPS endpoint (Google, every CDN-fronted host) requires SNI
# to choose the right cert, and disabling it makes the server hand back a
# default cert that fails JVM chain validation with "PKIX path building
# failed". The JDK 7-era "Unrecognized Name" SSL warning that prompted the
# historical disable is obsolete on JDK 8+. See docs/tls-troubleshooting.md
# for diagnosis guidance if cert errors do show up.

# CVE-2021-44228 Log4j2
CATALINA_OPTS="$CATALINA_OPTS -Dcom.sun.jndi.ldap.object.trustURLCodebase=false"
CATALINA_OPTS="$CATALINA_OPTS -Dlog4j2.formatMsgNoLookups=true"

# We need to send a 'portal.home' system property to the JVM;  use the value of PORTAL_HOME, if
# present, or fall back to a value calculated from $CATALINA_BASE
[ -z "$PORTAL_HOME" ] && PORTAL_HOME="$CATALINA_BASE/portal"
echo "PORTAL_HOME=$PORTAL_HOME"
CATALINA_OPTS="$CATALINA_OPTS -Dportal.home=$PORTAL_HOME"

CATALINA_OPTS="$CATALINA_OPTS  -Djava.net.preferIPv4Stack=true -Djava.net.preferIPv4Addresses -Djava.net.preferIPv6Addresses=false"

# Checking if anyother garbage collectors have been defined. If no other garbage
# collector is present, default to G1GC
# List of options taken from:
# http://www.oracle.com/webfolder/technetwork/tutorials/obe/java/gc01/index.html
echo $CATALINA_OPTS | grep -e '-XX:+UseSerialGC' -e '-XX:+UseParallelGC' -e '-XX:ParallelGCThreads' -e '-XX:+UseParallelOldGC' -e '-XX:+UseConcMarkSweepGC' -e '-XX:+UseParNewGC' -e '-XX:+CMSParallelRemarkEnabled' -e '-XX:CMSInitiatingOccupancyFraction' -e '-XX:+UseCMSInitiatingOccupancyOnly' -e '-XX:+UseG1GC'
if [ $? -eq 1 ]
then
    CATALINA_OPTS="$CATALINA_OPTS -XX:+UseG1GC"
fi

# Check to see if heap space allocation has been set
# If there are already set values, leave them be
echo $CATALINA_OPTS | grep -e '-Xms'
if [ $? -eq 1 ]
then
    CATALINA_OPTS="$CATALINA_OPTS -Xms64m"
fi
 
echo $CATALINA_OPTS | grep -e '-Xmx'
if [ $? -eq 1 ]
then
    CATALINA_OPTS="$CATALINA_OPTS -Xmx512m"
fi

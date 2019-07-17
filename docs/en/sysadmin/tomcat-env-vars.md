# Tomcat Configuration through Environment Variables

uPortal supports loading external properties files to facilitate configuration
differences between _dev_, _test_, _production_, etc. This allows a single
Docker image or Tomcat zip to be used in all environments / clusters.

Sometimes Tomcat configuration also needs to vary between evironments.
Examples are port numbers, SSL values, and load balancer IPs.

In the following examples, we will make the HTTP port an external variable.

## Update `setenv.sh`/`setenv.bat` to Load Config File

First step is to update the `setenv` files to load the external configuration
file we will define, if it exists.

The configuration file name is arbitrary, but we will likely use this name
in the future as support is included in `uPortal-start`.

### `setenv.sh` Changes

After `portal.home` is defined, include `catalina-opts.sh`:

```sh
CATALINA_OPTS="$CATALINA_OPTS -Dportal.home=$PORTAL_HOME"

# Source catalina.opts if it exists
[ -f "$PORTAL_HOME/catalina.opts" ] && . "$PORTAL_HOME/catalina.opts"

```

### `setenv.bat` Changes

After `portal.home` is defined, include `catalina-opts.bat`:

```sh
:gotPortalHome
set CATALINA_OPTS=%CATALINA_OPTS% -Dportal.home=%PORTAL_HOME%

if EXIST "%PORTAL_HOME%\catalina-opts.bat" call "%PORTAL_HOME%\catalina-opts.bat"
```

With these changes, an external script will be run from the `PORTAL_HOME` directory.
We leverage this to add variables to `CATALINA_OPTS` with `-D`.

## Populate `catalina-opts` Files

Next, we add variables to the external file that will be used in Tomcat
configuration files. In our example, we will define `http.port`.

### `$PORTAL_HOME/catalina-opts.sh`

```sh
CATALINA_OPTS="$CATALINA_OPTS -Dhttp.port=8081"
```

### `%PORTAL_HOME%\catalina-opts.bat`

```sh
set CATALINA_OPTS="%CATALINA_OPTS% -Dhttp.port=8081"
```

## Use Variable in Tomcat Configuration

Variables defined in `CATALINA_OPTS` with `-D` are now available in the Tomcat configuration files.
The notation is to use `${` + variable + `}`.

### Example Setting HTTP Port Number

Continuing with our examples, we can now set the HTTP port in `conf/server.xml`:

```xml
    <Connector port="${http.port}" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443"
               maxThreads="1200"
               compression="on" 
               compressionMinSize="1024" 
               compressableMimeType="text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json"
    />
```

## Conclusion

With this approach, there is still the issue of how to handle variables that are
expected in the external file but are missing. One approach is to add defaults
similar to how `PORTAL_HOME` is handled in the `setenv` files. Another approach
is to leave out defaults and have the system fail until they are added.

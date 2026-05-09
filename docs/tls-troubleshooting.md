# TLS / Certificate Troubleshooting

When a portlet that fetches an external HTTPS feed (CalendarPortlet, NewsReaderPortlet, anything using `ConfigurableHttpCalendarAdapter` or similar) silently shows no content, the most common culprit is a JVM-level TLS or certificate problem rather than a portlet bug. The portlet swallows the fetch exception and renders the empty state.

Server-side, the failure shows up in the per-portlet log under `.gradle/tomcat/logs/<portlet>.log`.

## Symptoms

```
javax.net.ssl.SSLHandshakeException: PKIX path building failed
sun.security.provider.certpath.SunCertPathBuilderException:
unable to find valid certification path to requested target
```

## First check: SNI must be enabled

Look in `etc/tomcat/bin/setenv.sh` (the template) and `.gradle/tomcat/bin/setenv.sh` (the deployed copy) for:

```bash
-Djsse.enableSNIExtension=false
```

**Remove it if present.** SNI is required by Google, every Cloudflare-fronted host, and most modern CDN endpoints. With SNI disabled, the server hands back a default cert that fails JVM chain validation, producing the PKIX error above even when the cert chain is otherwise valid.

The flag was originally added as a JDK 7-era workaround for "Unrecognized Name" warnings. Modern JDKs (8+) don't have that issue, and removing the flag resolves the vast majority of cert errors deployers hit.

Tomcat restart required — JSSE reads `jsse.enableSNIExtension` at init, not per-connection.

## If SNI is enabled and you still hit PKIX errors

### Verify the server's chain externally

```bash
openssl s_client -connect HOST:443 -servername HOST < /dev/null 2>&1 | grep "Verify return code"
```

Expected: `Verify return code: 0 (ok)`. A non-zero return points to a server-side problem (rare for major hosts).

### Add a custom truststore for self-signed or corporate-signed certs

Build the truststore from a copy of the JDK default so you keep public CAs:

```bash
cp $JAVA_HOME/lib/security/cacerts /path/to/custom-truststore.jks
keytool -import -alias <name> \
    -keystore /path/to/custom-truststore.jks \
    -storepass changeit \
    -file <cert>.crt
```

Reference it from `setenv.sh`:

```bash
CATALINA_OPTS="$CATALINA_OPTS -Djavax.net.ssl.trustStore=/path/to/custom-truststore.jks"
CATALINA_OPTS="$CATALINA_OPTS -Djavax.net.ssl.trustStorePassword=changeit"
```

Use this when a portlet needs to talk to:
- An internal HTTPS endpoint with a self-signed cert
- An external host through a corporate SSL-inspecting proxy (the proxy re-signs traffic with a private CA)

`-Djavax.net.ssl.trustStore` **replaces** the JDK default. Always start from a copy of `cacerts`, not an empty keystore — otherwise you lose every public CA in the process.

### Verbose JSSE logging for diagnosis

```bash
CATALINA_OPTS="$CATALINA_OPTS -Djavax.net.debug=ssl,handshake,trustmanager"
```

Restart Tomcat, reproduce the error, then read the relevant section of the log. The `trustmanager` keyword surfaces exactly which cert in the chain failed validation. **Disable this once diagnosis is done** — it's noisy and incurs runtime cost.

## CalendarPortlet specifics

The portlet's `ConfigurableHttpCalendarAdapter` does not override SSL; it uses the JVM default. Once the JVM-level truststore is right, the portlet works without per-feed configuration. The "Configurable" in the adapter name refers to URL templating and content processors, not SSL.

## Anti-patterns

- **Don't disable cert validation globally** (custom TrustAll TrustManager in code, or environment flags claiming to do that). Modern JDKs validate every major CA out of the box; if validation fails after the steps above, the underlying issue is real and bypassing it leaves the deploy vulnerable to MITM.
- **Don't chase non-existent flags** like `-Dtrust_all_cert=true`. They aren't part of JSSE; Stack Overflow answers suggesting them are wrong.
- **Don't replace `cacerts` with a custom keystore that lacks public CAs.** Build the custom truststore from a copy of `cacerts` and add to it.

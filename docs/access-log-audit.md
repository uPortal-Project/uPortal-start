# Auditing Tomcat access logs

Every HTTP request Tomcat answers is captured in
`${CATALINA_BASE}/logs/localhost_access_log.<date>.txt`. For dev clones built
via `./gradlew portalInit`, that resolves to
`uPortal-start/.gradle/tomcat/logs/localhost_access_log.<date>.txt`.

uPortal-start ships an `AccessLogValve` configured with the "combined" pattern
(Apache httpd's standard extended log format). Each line looks like:

```
127.0.0.1 - - [13/May/2026:23:14:02 -0700] "GET /uPortal/render.uP HTTP/1.1" 200 8123 "https://portal.example.edu/uPortal/Login" "Mozilla/5.0 …"
```

The fields are: client IP, remote logname, remote user, timestamp, request
line, status, bytes sent, **Referer**, **User-Agent**.

The two extra fields are what makes the log useful for audits: when you see a
suspicious URL being requested, the Referer tells you which page emitted the
link, and the User-Agent disambiguates browsers from monitoring agents.

## Auditing during the `ResourceServingWebapp` retirement

uPortal-Project is consolidating its frontend asset paths from
`/ResourceServingWebapp/...` onto `/resource-server/...`. As of uPortal v5.17.8,
SimpleContentPortlet 3.4.3, FeedbackPortlet 1.3.2, and NewsReaderPortlet 5.1.5,
nothing in the community fleet should request the legacy path. To confirm the
same on your portal:

```sh
$ cd ${CATALINA_BASE}/logs
$ grep "ResourceServingWebapp" localhost_access_log.*.txt | wc -l
0
```

A non-zero count means something still references the legacy path. The Referer
tells you which page to fix:

```sh
$ grep "ResourceServingWebapp" localhost_access_log.*.txt | head -5
127.0.0.1 - admin [14/May/2026:08:11:42 -0700] "GET /ResourceServingWebapp/rs/lodash/4.17.4/lodash.min.js HTTP/1.1" 200 73450 "http://localhost:8080/uPortal/p/some-custom-portlet/max/render.uP" "Mozilla/5.0 …"
```

In the example above, `/p/some-custom-portlet/max/render.uP` is the page still
emitting the legacy URL — likely a deployer-customized portlet whose JSP or
skin overlay needs updating.

## General audit recipes

Same `grep` shape works for any audit you need to run against requests reaching
Tomcat:

```sh
# All 404s grouped by URL — find broken links and dead overlays
awk -F'"' '{print $2, $3}' localhost_access_log.*.txt | grep ' 404 ' | sort | uniq -c | sort -rn | head -20

# Requests from a specific bot, by URL — sanity-check what crawlers see
grep 'Googlebot' localhost_access_log.*.txt | awk -F'"' '{print $2}' | sort -u

# 5xx errors with their referring pages — surface server-side breakages and
# the page that triggered them
grep -E ' (5[0-9][0-9]) [0-9]+ ' localhost_access_log.*.txt | head -20
```

## When the log seems unhelpful

If `grep "ResourceServingWebapp"` returns hits but the Referer field is `-`,
that means either:

- The request came from JavaScript (`fetch`, `XMLHttpRequest`) where the
  browser deliberately omits the Referer header for some configurations, or
- The request came from a non-browser client (a server-to-server call, a
  Tomcat-internal forward, or a monitoring probe).

In that case fall back to inspecting the source: `grep -r 'ResourceServingWebapp' overlays/` (or the equivalent path in your customizations repo) usually finds the literal string in a JSP, skin XML, or Spring config.

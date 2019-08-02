# Performance Testing

Earlier uPortal performance testing [lessons learned](https://apereo.atlassian.net/wiki/spaces/UPM43/pages/103948792/uPortal+Load+Testing+Tips)

The set of performance testing scripts provided in uPortal-start is meant to provide a baseline against the Quickstart data set (plus extra users).  It is not intended to be an exhaustive coverage of functionality, and as with any test of this type, it is strongly recommended to NOT run this against your production install.

One of the goals is to run this pre-release of a component (`uPortal`, `Announcements Portlet`, etc) and compare against the previous runs

## Prepare

1. Clone uPortal and setup the jwt signatures in `etc/portal/uPortal.properties` and `etc/portal/notifications.properties`.  This allows the notifications API to be called.
2. Run: `{uP-start}$ ./gradlew clean portalInit`.
3. Configure test user generation with the `data.test.perf.*` configs in `build.properties`.
4. Generate test users: `{uP-start}$ ./gradlew perfGenTestData`.
5. Import the test users (Assuming you placed your perf user xml files in `data/perf`): `{uP-start}$ ./gradlew dataImport -Ddir="{uP-start}/data/perf"`.
6. Start the portal: `{uP-start}$ ./gradlew tomcatStart`.
7. Test a login from the generated population csv file.

## Execute

Various configurations for the have been exposed - see `baseline.properties.sample` for details.

Current method is to run via a standalone JMeter:

```sh
$ sh {jmeter-install}/bin/jmeter.sh -p buildSrc/src/test/perf/{myconfig}.properties -t buildSrc/src/test/perf/baseline.jmx
```

As a proof-of-concept, you can execute the baseline scripts via Gradle.  The Gradle process is noted here as a possible CI hook for running perf tests at each commit / PR in the future.
```sh
$ ./gradlew jmRun
```

## Baseline Script

Test are run with a cache manager, but will clear the cache each iteration.

1. Ramp up from 1 to `load.num.of.threads` users in `load.ramp.up` seconds
2. All users perform the list of modules / actions below
3. Between module requests, users will take a random length break (`delay.think.time.*`)
4. At the end of the loop, users will take a random length break (`delay.final.think.time.*`)
4. Test will run for each `load.loop.count` iterations or a duration of `scheduler.duration.seconds`

### List of Baseline Modules
* UI - Login
* API - Gather AuthToken
* API - People search
* API - GET notifications
* API - GET layout
* UI - View Announcements
* UI - View ESUP FM - Maximized
  * UI - View ESUP FM - htmlFileTreeURL
  * UI - View ESUP FM - fileChildrenURL


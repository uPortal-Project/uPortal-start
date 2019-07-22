# Performance / Load / Stress Testing

Earlier uPortal performance testing [lessons learned](https://apereo.atlassian.net/wiki/spaces/UPM43/pages/103948792/uPortal+Load+Testing+Tips)

The set of performance / load testing scripts provided in uPortal-start is meant to provide a baseline against the Quickstart data set (plus extra users).  It is not intended to be an exhaustive coverage of functionality, and as with any test of this type, it is strongly recommended to NOT run this against your production install.

One of the goals is to run this pre-release of a component (`uPortal`, `Announcements Portlet`, etc) and compare against the previous runs

## Execute
To execute the baseline scripts via Gradle:
```sh
$ ./gradlew jmRun
```

You can also execute the scripts via a standalone JMeter.  Via Gradle just saves you the extra step of downloading JMeter, however, the Gradle process is not always the latest JMeter version.

## Scripts
Both scripts share the same configuration file.  The `Smoke` test script is not meant as a performance script.

General configuration:
```properties
uportal.protocol=http
uportal.domain=localhost
uportal.port=8080
uportal.context=uPortal
```

Test are run with a cache manager, but will clear the cache each iteration.

### Smoke
* Login - as the default `admin` user
* Hit an API

### Baseline

#### General

1. Ramp up from 1 to `max.users` users in `ramp.up.seconds`
2. All users `Login`, and then randomly will perform a module - `Switch tab`, `Notification API flow`, `Maximize announcement portlet`, etc
3. Between module requests, users will take a random length break 
4. Users are not 'reused', assuming a short overall duration on the portal site
4. Baseline runs for `max.runtime` and then quits

#### List of Baseline Modules
* Login
  * Retrieve all embedded resources
* Switch tabs
  * Retrieve all embedded resources
* REST APIs
  * Mimic web component calls (ie the Notification flow)
* Access a maximized portlet - retrieves all embedded resources
  * Announcements
  * Bookmarks
  * Weather


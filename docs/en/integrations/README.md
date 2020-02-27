# Integrations

uPortal, like so many web applications that aggregate services,
faces challenges with integration. Here, we collect solutions
to share with integrators.

## Creating Custom Modules

The below steps detail how to add custom code to your uPortal-start
project. We highly recommend contributing enhancements and fixes
to existing code back to the community. This encourages your changes
to be supported and maintained by the community.

There are good reasons for custom modules. Some features are so
specific to your institution that no one else will benefit. Other 
times the changes are in conflict with the community code.

### Steps to Create a Custom Module

1. Create a `custom` directory in your repo, if it does not exist
2. Create a subdirectory that will also represent the name of your
custom module. If this code is associated with a portlet or uPortal
module, prefix your shortname. For example, to customize a class in
`uPortal-persondir`, rename it to `<shortname>-persondir`. Another
example is to customize CalendarPortlet, name it `<shortname>-calendar`.
3. Create a `src` directory in the subdirectory
4. Copy source files in this directory as appropriate
5. Create a `build.gradle` file in the subdirectory, following the
below pattern:

```gradle
description = "<institution> Custom Components for <target module or portlet>"

apply plugin: 'java'
apply plugin: 'eclipse'

repositories {
    mavenLocal()
    mavenCentral()
}

dependencies {
    compile "<target module or portlet>"
    compileOnly "${portletApiDependency}"
    compileOnly "${servletApiDependency}"
    <additional dependencies as needed>
}
```

Here is an example for customizing uPortal Groups:

```gradle
description = "MyUniversity Custom Components for uPortal Security"

apply plugin: 'java'
apply plugin: 'eclipse'

repositories {
    mavenLocal()
    mavenCentral()
}

dependencies {
    compile "org.jasig.portal:uPortal-groups-core:${uPortalVersion}"
    compileOnly "${portletApiDependency}"
    compileOnly "${servletApiDependency}"
}
```
6. Add module to `settings.gradle` in root of repo. The entry will
be `include 'custom:<subdirectory>'` similar to the other modules.
7. Add the module to `overlays/uPortal/build.gradle` or the appropriate
portlet, as needed. The entry will be a compile dependency like 
`compile project(':custom:<subdirectory>')` in a `dependencies` block.

## CORS Security Whitelisting

CORS (Cross-Origin Resource Sharing) Filter in uPortal restricts
POSTs from code originating from other servers. This restriction
can interfere with front-end services, such as CAS and Shibboleth.

This can be mitigating by whitelisting services for the CORS Filter.
In uPortal.properties, add the services that can redirect to uPortal
in the following property:

```properties
cors.allowed.origins=https://idp.myschool.edu, https://cas.myschool.edu
```

In the above example, two services are whitelisted. In an actual case,
only one of CAS or Shib would be in use. Also note that the protocol
must be specified.

In the above example, two services are whitelisted. In an actual case,
only one of CAS or Shib would be in use. Also note that the protocol
must be specified.

In the above example, two services are whitelisted. In an actual case,
only one of CAS or Shib would be in use. Also note that the protocol
must be specified.

See: [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

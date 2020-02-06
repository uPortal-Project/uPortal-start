# Data Files

This section of the documentation covers details of the data files
used to configure uPortal.

* [Lock Down User Layouts](lockdown-layouts.md)
* [Session Timeout by Group](timeout.md)

:warning: Please don't consider files under `data/quickstart` as production ready,
these files provides a quickstart ready only and are only for a demo use.

As example if you enable the uPortal local authentication with the
property `org.apereo.portal.security.provider.SimpleSecurityContextFactory.enabled=true`
and that you import the files under `data/quickstart/user` anyone will be able to connect 
to the portal with the link `https://my.university.edu/uPortal/Login?userName=admin&password=admin`.

To avoid problems set that property `org.apereo.portal.security.provider.SimpleSecurityContextFactory.enabled` to `false`
into `etc/portal/uPortal.properties` and check that property isn't enabled and overriding it anywhere (uPortal set it as `false` by default,
 but uPortal-start enable it). And test access.
On an other way if you need to keep these users and a such auth system consider to change default password !


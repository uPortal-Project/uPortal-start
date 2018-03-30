# Integrations

uPortal, like so many web applications that aggregate services,
faces challenges with integration. Here, we collect solutions
to share with integrators.

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
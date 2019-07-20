# Adding WebJars to uPortal-start

WebJars are a relatively recent addition to the web application development landscape.  They are
client-side web libraries (typically JavaScript and/or CSS) packaged into JAR (Java Archive) files.

## Introducing the `resource-server`

The `resource-server` is a bundled module in uPortal-start.  You can easily deploy WebJars with
uPortal and use their contents to build a compelling portal experience by declaring them as
dependencies of the `overlays:resource-server` sub-project.

Edit the `dependencies` section of the `overlays/resource-server/build.gradle` file to add WebJars
from Maven Central.

An alternative to WebJars is to manually add static files to resource server. WebJars are the
preferred approach; however, this method is detailed [here](resource-server.md) for cases where
WebJar implementations are not available.

### WebJar Dependency Example

```gradle

  runtime 'org.webjars.npm:uportal__content-carousel:1.6.0@jar'
```

**NOTE:** In most cases, you should include the `@jar` classifier with your WebJar dependency.  This
classifier tells Gralde not to pull transitive dependencies of your WebJar.  (Transitive
dependencies may be needed if you were extending the component in Node.js, but typically aren't
required for using the component in a browser.)

## Using Files Within WebJars

Once your WebJar is available within the `resource-server`, you can access the files they contain in
your browser by using URLs like the following:
`/resource-server/webjars/uportal__content-carousel/1.6.0/dist/content-carousel.js`.

In this exable, `/uportal__content-carousel/1.6.0/dist/content-carousel.js` is the complete path to
the `content-carousel.js` file within the webjar.
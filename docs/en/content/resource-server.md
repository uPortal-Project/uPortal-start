# Adding Resources to Resource Server

uPortal supports the caching of static files in the Resource Server module.
While several JavaScript packages are included, you can add your own.

Note: that the [webjars](webjars.md) document covers how to add webjars
to Resource Server via Gradle configuration over this manual approach.

The following manual approach captures the actual static files in your repo.

## Check Existing Resources

To see what is currently including in `resource-server`, you can visit [https://github.com/Jasig/resource-server/tree/master/resource-server-content/src/main/webapp/rs](https://github.com/Jasig/resource-server/tree/master/resource-server-content/src/main/webapp/rs).

Alternately, you can simply look at the deployed `resource-server`'s `rs/` directory
in Tomcat's `webapps` directory.

There is also another version of Resource Server currently deployed with
`uPortal-start`. `ResourceServingWebapp` contains out-dated packages that
some uPortal components require. Again, look at your Tomcat deployment
to see what is actually available. ***Use of this module is discouraged.***

## Create `rs/` Directory

First step is to create an `rs/` directory in the Resource Server
overlay for your static content.

```sh
$ mkdir -p overlays/resource-server/src/main/webapp/rs
```

## Understand Naming Convention

Before adding static files, there is a naming convention that should be
followed.

Under `rs/`, the first level of directories are the names of the
packages. Some examples are `jquery`, `fontawesome`, `fetch`, `bootstrap`.

Under each package directory, directories matching versions follow.
For example, under `bootstrap`, you might find `2.3.2`, `3.0.0`, `3.1.1`, `3.3.5`.

Beyond the version directories, the file layout depends on the package.
Several packages will simply have the static files. Other packages may
have subdirectories like `css`, `img` and `js`.

## Add Static Files

Following the naming convention create appropriate directories and files.
As an example, here is how to add Backbone, version 1.3.3:

```sh
$ mkdir -p  overlays/resource-server/src/main/webapp/rs/backbone/1.3.3
$ cd overlays/resource-server/src/main/webapp/rs/backbone/1.3.3
$ unzip ~/Downloads/backbone-1.3.3.zip
$ ls -1
backbone-1.3.3.js
backbone-1.3.3.min.js
```

Our hypothetical `backbone-1.3.3.zip` has only these 2 files.

## Reference Static Files

These files will be available after the next deployment. These can be referenced
in JSPs, the most likely scenario.

For example:

```
   <script src="/resource-server/rs/backbone/1.3.3/backbone-1.3.3.min.js" type="text/javascript"> </script>
```

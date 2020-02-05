# Adding Portlet to uPortal-start

uPortal-start support the deployment of several web applications context like an overlay system.
In that way you will be able to deploy every application packaged as WAR, like portlet.

## Create `my-portlet` Directory

First step is to create a `my-portlet/` directory in the overlay forlder for your portlet to deploy.

```sh
$ mkdir -p overlays/my-portlet
```

## Define the project to deploy

Create the `build.gradle` file into `overlays/my-portlet` directory to describe the dependency to deploy as follow (more scripting can be needed to init database as example)

```gradle
import org.apereo.portal.start.gradle.plugins.GradlePlutoPlugin

apply plugin: GradlePlutoPlugin

dependencies {
    runtime "artifact-id:artifact-group:${MyPortletVersion}@war"
}

war {
    archiveName 'my-portlet.war'
}
```

Add the overlay module to the global project at the end of the `setting.gradle` file
```gradle
include 'overlays:my-portlet'
```

Add the property to define the `my-portlet` version war to deploy in the `gradle.properties`
```properties
MyPortletVersion=X.Y
```

## Customize the deployment

You can customize the packages properties with the overlay system by providing a customized version of war files following the same path deployed file.
As example you can cutomize log configurations, for that copy from the deployed path the logback.xml file and customize it !
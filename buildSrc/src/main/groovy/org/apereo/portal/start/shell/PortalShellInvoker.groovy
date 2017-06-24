package org.apereo.portal.start.shell

import org.gradle.api.Project

/**
 * This class knows how to invoke org.apereo.portal.shell.PortalShell within the overlays:uPortal
 * project.  (It can't do anything in any other project.)
 */
class PortalShellInvoker {

    void invoke(Project project, String scriptLocation, String... args) {

        project.ant.setLifecycleLogLevel('INFO')
        project.ant.java(fork: true, failonerror: true, dir: project.projectDir, classname: 'org.apereo.portal.shell.PortalShell') {
            classpath {
                pathelement(location: "${project.buildDir}/${project.name}/WEB-INF/classes")
                fileset(dir: "${project.buildDir}/${project.name}/WEB-INF/lib", includes: '*.jar')
                project.configurations.shell.files.each {
                    pathelement(location: it.absolutePath)
                }
            }
            sysproperty(key: 'logback.configurationFile', value: 'command-line.logback.xml')
            sysproperty(key: 'java.awt.headless', value: 'true')
            arg(value: '-s')
            arg(value: scriptLocation)
            args.each {
                arg(value: it)
            }
        }
    }

}

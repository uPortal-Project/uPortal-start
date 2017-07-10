package org.apereo.portal.start.gradle.plugins

import org.gradle.api.tasks.JavaExec
import org.gradle.api.tasks.TaskAction

/**
 * Run a groovy script inside the PortalShell.
 *
 * Usage:
 * someTask(type: PortalShellExec) {
 *     script = 'portalShellBuildHelper.dataImport(...)'
 * }
 */
class PortalShellExec extends JavaExec {
    public PortalShellExec () {
        dependsOn = [
            'expandedWar'
        ]
        main = 'org.apereo.portal.shell.PortalShell'
        classpath = project.fileTree(dir: "${project.buildDir}/${project.name}/WEB-INF/classes") +
                    project.fileTree(dir: "${project.buildDir}/${project.name}/WEB-INF/lib") +
                    project.configurations.shell
        systemProperties = [
            'logback.configurationFile': 'command-line.logback.xml',
            'java.awt.headless': 'true'
        ]
    }
}

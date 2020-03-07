package org.apereo.portal.start.gradle.plugins

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.tasks.Delete

class GradleTomcatDeployPlugin implements Plugin<Project> {
    @Override
    void apply(Project project) {
        project.task('tomcatClean', type: Delete) {
            group 'Tomcat'
            description 'Removes this project from the integrated Tomcat servlet container'
            dependsOn project.rootProject.tasks.portalProperties
            mustRunAfter project.rootProject.tasks.tomcatInstall

            doFirst {
                File serverWebapps = project.rootProject.file(project.rootProject.ext['buildProperties'].getProperty('server.webapps'))
                File deployDir = new File (serverWebapps, "${project.name}")
                logger.lifecycle("Removing deployed application from servlet container at location:  ${deployDir}")
                delete deployDir
            }
        }
        project.task('tomcatDeploy') {
            group 'Tomcat'
            description 'Deploys this project to the integrated Tomcat servlet container'
            dependsOn 'tomcatClean'
            dependsOn 'assemble'

            doFirst {
                File serverWebapps = project.rootProject.file(project.rootProject.ext['buildProperties'].getProperty('server.webapps'))
                File deployDir = new File (serverWebapps, "${project.name}")
                logger.lifecycle("Deploying assembled application to servlet container at location:  ${deployDir}")

                String artifactDir = project.plugins.hasPlugin(GradlePlutoPlugin) ? 'pluto' : 'libs'
                File warFile = new File("${project.buildDir}/${artifactDir}/${project.name}.war")

                project.copy {
                    with project.copySpec {
                        from project.zipTree(warFile)
                    }
                    into deployDir
                }
            }
        }
    }
}

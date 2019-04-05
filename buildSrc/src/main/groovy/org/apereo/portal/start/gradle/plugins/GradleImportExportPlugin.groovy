package org.apereo.portal.start.gradle.plugins

import org.gradle.api.Plugin
import org.gradle.api.Project

class GradleImportExportPlugin implements Plugin<Project> {
    @Override
    void apply(Project project) {
        project.task('dataInit') {
            group 'Data'
            dependsOn project.rootProject.tasks.portalProperties, project.tasks.tomcatDeploy
            doFirst {
                if (project.tasks.dataInit.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
        project.task('dataImport') {
            group 'Data'
            dependsOn project.rootProject.tasks.portalProperties
            mustRunAfter project.tasks.tomcatDeploy
            doFirst {
                if (project.tasks.dataImport.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
        project.task('dataExport') {
            group 'Data'
            dependsOn project.rootProject.tasks.portalProperties
            mustRunAfter project.tasks.tomcatDeploy
            doFirst {
                if (project.tasks.dataExport.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
        project.task('dataDelete') {
            group 'Data'
            dependsOn project.rootProject.tasks.portalProperties
            mustRunAfter project.tasks.tomcatDeploy
            doFirst {
                if (project.tasks.dataDelete.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
        project.task('dataList') {
            group 'Data'
            dependsOn project.rootProject.tasks.portalProperties
            mustRunAfter project.tasks.tomcatDeploy
            doFirst {
                if (project.tasks.dataList.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
    }
}

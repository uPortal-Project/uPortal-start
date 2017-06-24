package org.apereo.portal.start.gradle.plugins

import org.gradle.api.Plugin
import org.gradle.api.Project

class GradleImportExportPlugin implements Plugin<Project> {
    @Override
    void apply(Project project) {
        project.task('dataInit') {
            dependsOn project.tasks.expandedWar
            doFirst {
                if (project.tasks.dataInit.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
        project.task('dataImport') {
            dependsOn project.tasks.expandedWar
            doFirst {
                if (project.tasks.dataImport.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
        project.task('dataExport') {
            dependsOn project.tasks.expandedWar
            doFirst {
                if (project.tasks.dataExport.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
        project.task('dataDelete') {
            dependsOn project.tasks.expandedWar
            doFirst {
                if (project.tasks.dataDelete.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
        project.task('dataList') {
            dependsOn project.tasks.expandedWar
            doFirst {
                if (project.tasks.dataList.actions.size() == 1) {
                    logger.lifecycle('No actions have been defined for this task in this project')
                }
            }
        }
    }
}

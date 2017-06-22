package org.apereo.portal.start.gradle.plugins

import org.apache.pluto.util.assemble.Assembler
import org.apache.pluto.util.assemble.AssemblerConfig
import org.apache.pluto.util.assemble.AssemblerFactory
import org.gradle.api.Project
import org.gradle.api.Plugin

class GradlePlutoPlugin implements Plugin<Project> {
    void apply(Project project) {
        project.task('plutoAssemble') {
            dependsOn project.tasks.war
            doLast {
                File archiveSource = project.configurations.war.artifacts.files.iterator().next()
                File destinationDir = new File (project.buildDir, 'pluto')

                logger.lifecycle("Processing archive ${archiveSource.getName()} " +
                        "into destination directory ${destinationDir.getPath()} " +
                        "with the Apache Pluto Assembler")

                destinationDir.mkdirs()
                File archiveOutput = new File(destinationDir, archiveSource.getName())

                AssemblerConfig config = new AssemblerConfig()
                config.setSource(archiveSource)
                config.setDestination(archiveOutput)
                Assembler assembler = AssemblerFactory.getFactory().createAssembler(config)
                assembler.assemble(config)

                project.artifacts.add('pluto', archiveOutput)

            }
        }
        project.configurations {
            pluto {}
        }
    }
}

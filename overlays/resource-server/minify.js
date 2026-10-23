/*
 * Licensed to Apereo under one or more contributor license
 * agreements. See the NOTICE file distributed with this work
 * for additional information regarding copyright ownership.
 * Apereo licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License.  You may obtain a
 * copy of the License at the following location:
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Minifies the JS/CSS under a vendored `rs/` content tree, generating `.min.js`
 * and `.min.css` siblings for any source file that does not already ship one.
 *
 * Ported from resource-server's resource-server-webapp/minify.js. In the
 * resource-server webapp this ran (via frontend-maven-plugin) against the
 * assembled `target/ResourceServingWebapp/` directory. Here the `rs/` content
 * has been vendored into uPortal-start, so the minify step moves with it: the
 * target directory is passed in as the first CLI argument (the Gradle build
 * stages a working copy of `rs/` and runs this against it before packaging the
 * WAR).
 *
 * The esbuild options below are preserved verbatim from upstream, including
 * `minifyIdentifiers: false` (mangling identifiers broke object property access
 * such as `layout.navigation.tabs.externalId` in some legacy libraries) and the
 * explicit ignore list for libraries that already ship their own minified builds
 * or that must not be re-minified.
 */
const esbuild = require('esbuild');
const { globSync } = require('glob');
const path = require('path');
const fs = require('fs');

// Target directory is the first CLI argument; it must contain an `rs/` tree.
const targetDir = process.argv[2];
if (!targetDir) {
  console.error('Usage: node minify.js <targetDir>  (directory containing rs/)');
  process.exit(1);
}
if (!fs.existsSync(targetDir)) {
  console.log(`Target directory ${targetDir} not found, skipping minification`);
  process.exit(0);
}

// Normalize to a trailing slash so the glob patterns below compose correctly.
const base = targetDir.endsWith('/') ? targetDir : `${targetDir}/`;

console.log(`Working in target directory: ${base}`);

// Get all JS and CSS files under rs/, excluding libraries that ship their own
// minified builds or must not be re-minified.
const ignore = [
  '**/*.min.js',
  '**/rs/ckeditor/**',
  '**/rs/datatables/**',
  '**/rs/jquery/2.2.4/**',
  '**/rs/jquery/3.2.1/**'
];

const allJsFiles = globSync(`${base}rs/**/*.js`, { ignore });

const allCssFiles = globSync(`${base}rs/**/*.css`, {
  ignore: [
    '**/*.min.css',
    '**/rs/ckeditor/**',
    '**/rs/datatables/**',
    '**/rs/jquery/2.2.4/**',
    '**/rs/jquery/3.2.1/**'
  ]
});

// Filter to only files that don't already have a .min version.
const jsFiles = allJsFiles.filter((file) => {
  const minFile = file.replace(/\.js$/, '.min.js');
  return !fs.existsSync(minFile);
});

const cssFiles = allCssFiles.filter((file) => {
  const minFile = file.replace(/\.css$/, '.min.css');
  return !fs.existsSync(minFile);
});

async function minifyFiles() {
  console.log(
    `Minifying ${jsFiles.length} JavaScript files and ${cssFiles.length} CSS files...`
  );

  // Process JavaScript files
  for (const file of jsFiles) {
    try {
      // Safe minification that preserves object property access patterns.
      // minifyIdentifiers is disabled to avoid breaking property access like
      // layout.navigation.tabs.externalId.
      const result = await esbuild.build({
        entryPoints: [file],
        minify: true,
        minifyWhitespace: true,
        minifyIdentifiers: false,
        minifySyntax: true,
        write: false
      });

      const minFile = file.replace(/\.js$/, '.min.js');
      fs.writeFileSync(minFile, result.outputFiles[0].text);
      console.log(`Minified: ${path.relative(base, file)} -> ${path.relative(base, minFile)}`);
    } catch (error) {
      console.warn(`Failed to minify ${file}: ${error.message}`);
      // Copy original file as fallback
      const minFile = file.replace(/\.js$/, '.min.js');
      fs.copyFileSync(file, minFile);
    }
  }

  // Process CSS files
  for (const file of cssFiles) {
    try {
      const result = await esbuild.build({
        entryPoints: [file],
        minify: true,
        write: false
      });

      const minFile = file.replace(/\.css$/, '.min.css');
      fs.writeFileSync(minFile, result.outputFiles[0].text);
      console.log(`Minified: ${path.relative(base, file)} -> ${path.relative(base, minFile)}`);
    } catch (error) {
      console.warn(`Failed to minify ${file}: ${error.message}`);
      // Copy original file as fallback
      const minFile = file.replace(/\.css$/, '.min.css');
      fs.copyFileSync(file, minFile);
    }
  }

  console.log('Minification complete!');
}

minifyFiles().catch((err) => {
  console.error(err);
  process.exit(1);
});

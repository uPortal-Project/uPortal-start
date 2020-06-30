# Upgrading uPortal

uPortal upgrading is an exercise in using Git to merge changes form the upstream version of uPortal-start into a local uPortal-start repo. The goal is to pick up fixes and enhancements from the community.

## Pre-requisite

First, we need to confirm that the remote repo is mapped to `upstream`.

```
$ git remote -v
origin	git@github.com:bjagg/uPortal-start (fetch)
origin	git@github.com:bjagg/uPortal-start (push)
upstream	git@github.com:Jasig/uPortal-start.git (fetch)
upstream	git@github.com:Jasig/uPortal-start.git (push)
```

If `upstream` is not present, then it needs to be added.

```
$ git remote add upstream git@github.com:Jasig/uPortal-start.git
```

Run `git remote -v` again to confirm the mapping. Note that this is a local mapping -- this must be done for every repo.

## Prepare for upstream merge

Merging upstream changes can sometimes take time, especially if significant amount of time has passed since the last merge. A " merge branch" is recommended to avoid breaking the main development branch.

```
$ git checkout <main branch>
$ git checkout -b merge-upstream
```

The upstream commits are pulled down by fetching the remote repo. This does actually merge the commits, but rather, it pulls them down into the Git cache for the repo.

```
$ git fetch upstream
```

The order of the above two steps is not important.

## Merge and resolve upstream

The previous steps are simple, quick, and rarely are troublesome. Merging, however, is takes a lot more effort.

To start the merge, the Git command is:

```
$ git merge upstream/master
```

If -- unexpectedly -- there are no conflicts, testing is still strongly suggested. When the state of the `merge-upstream` branch is satisfactory, merge it into your main branch.

```
$ git checkout <main branch>
$ git merge merge-upstream
$ git push origin <main branch>
```

## Resolving merge conflicts

Merge conflicts are expected as the `uPortal-start` repo was designed to isolate changes.

Git will signal there are conflicts when `git merge` is executed. Merge conflict resolution is typically a cycle like the following:

1. `git status` to see the files with conflicts
2. Edit a file
3. `git add <file>`

Once all the files are fixed and tested, a commit will capture all the changes.

```
$ git commit -m 'Fixed conflicts in upstream merge'
```

With all the conflicts resolved, the workflow would continue with the last 3 commands in the previous section.

## Editing files with conflicts

If you are not familiar with the way Git marks conflicts, here is a quick summary.

For an example, let us assume that the Notification Portlet was upgraded in the local repo and also in `upstream` which causes a conflict in `gradle.properties`.

```
<<<<<<< HEAD
notificationPortletVersion=4.5.1
=======
notificationPortletVersion=4.5.3
>>>>>>> upstream/master
```

The lines between `<<<<<<< HEAD` and `=======` are the changes from the local repo. The conflicting lines between `=======` and `>>>>>>> upstream/master` are from the community version of uPortal.

Edit `cradle.properties`, replacing all those lines with something suitable. In this case, the resolution is simply

```
notificationPortletVersion=4.5.3
```
As noted above, mark this file as resolved with `git add cradle.properties` (for this example).

Note: that some files will have multiple conflict areas, so it is best to scan the whole file for other conflicting lines.

## uPortal specific tips 

### `data/`

The most common practice is to duplicate the `data/quickstart/` directory. This should avoid upstream conflicts with your copy of data files.

It is still highly recommended to run a `git diff` between the merge branch and main branch to review changes to the data files. While there may not be data file conflicts reported by Git, there have been changes requiring data file updates for functional code changes.

### Grade script files

Changes from `upstream` around the Gradle scripts should be accepted. These include most files in `gradleSrc/`, `gradle/` and `build.gradle` files throughout the repo. Obviously, you want to keep your changes, such as added database drivers.

`settings.gradle` often has customization references, so this file requires some special handling.

Similarly, `gradle.properties` will often have conflicts around version numbers. This will require some judicious editing to pick up the version you really want.

### `etc/`

This folder is a bit tricky. Most of the folders have files for the build scripts to use. However, `etc/portal/` files are meant to be customized, and `etc/tomcat/` usually has performance and security tweaks.

#### `etc/portal/`

The intention of files in this folder are two show the most commonly configured properties and to set a baseline for a dev environment. Real credentials **SHOULD NEVER BE STORED IN THIS FILES** exception for generic dev ones. 

Like `data/` these folder should be reviewed for changes and then updates made even if there are no conflicts. For example, a dependency change required that signature keys now meet a minimal size and format around uPortal version 5.5. This is in the upstream files along with comments on creating the keys.

#### `etc/tomcat/`

These files are copied over the generic Tomcat version used by uPortal. Over time both local repos and upstream repos will receive changes for performance and security.

Not only should conflicts be reviewed, differences between upstream files and local, main branch versions of these files should be checked.

### `overlays/`

The community version of this folder has few files as this is intended for customization. Most conflicts are minor around the `build.gradle` files and are easy to resolve.


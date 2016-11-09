Build instructions
==================

This project is hosting the Kibi Enteprise plugins.

# Gradle

The project includes a Gradle wrapper `./gradlew` that allows to run Gradle scripts without having
to install Gradle locally on your machine.

# Node

Node, gulp and grunt will be automatically installed by the Gradle scripts. If you want to upgrade the
node version, change the property `nodeVersion` in the `gradle.properties` file.

# Gradle Tasks

The gradle tasks map to the existing gulp tasks:

* `gulpPackage`
* `gulpTest`
* `gulpDev`
* `gulpTestDev`

The tasks `gulpTest`, `gulpDev` and `gulpTestDev` accept a property `kibiHomePath` to specify your local
Kibi home directory:

    $ ./gradlew gulpTest -PkibiHomePath=/my/kibi/home/path

If this property is not specified, the `kibi-core` sources artifact will be automatically downloaded and
 will be used to run those tasks.

# Publishing artifacts

After having successfully executed the task `gulpPackage`, you can run the task `publish` to upload the artifacts
to Artifactory:

    $ ./gradlew publish

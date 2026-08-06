Dear Wolverine,

You must claw your way to testing excellence and help me become besties with Spiderman.

Refine this code to pass mutation testing. Then and only then will you be my TESTING HERO.

There is peril ahead....

Good Luck,
XOXO Deadpool


PS
In order to discover other mutants with PIT, run this in your terminal:
1. ./gradlew pitest
2. Open build/reports/pitest/index.html in your browser


PPS
If you want to be even more brutal and defeat more mutants, add the plugin
(info.solidsoft.pitest) to your other Gradle projects' build.gradle.

Oh One More thing:
You can mutation test one class at a time if wanted.
Run the following to mutation test the spiderman class:
./gradlew pitest -PpitestTargetClasses=wolverine.Spiderman -PpitestTargetTests=wolverine.SpidermanTests
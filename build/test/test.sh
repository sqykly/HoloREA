# This covers the basics
export TSC_TEST_OPTIONS=--allowJs=true --allowUnreachableCode=true --allowUnusedLabels=true --downlevelIteration=true --target="ES6" --moduleResolution="Node" --newLine="lf" --noErrorTruncation=true --noFallthroughCasesInSwitch=true --declaration=true
tsc TSC_TEST_OPTIONS --rootDir="../../src/" --outDir="./bin/"
tsc TSC_TEST_OPTIONS --rootDir="./holo-mock/" --outDir="./bin/lib/ts/"
tsc TSC_TEST_OPTIONS --rootDir="../"

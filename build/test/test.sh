source ../bin.sh

tsc --project ./src --outputDir ../../bin/HoloREA/ui

cd ../../bin/HoloREA
hcdev web

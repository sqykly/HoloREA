BINDIR=../../bin/HoloREA/ui
tsc --project ./src --outDir $BINDIR
cp ./src/chai/chai.js $BINDIR/chai/
cp ./src/*.js $BINDIR/
cp ./src/*.html $BINDIR/
cp ./src/*.css $BINDIR/

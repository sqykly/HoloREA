ROOT=../
STAGING=$ROOT/build/staging
SRCDNA=$ROOT/src/HoloREA/dna
BINDNA=$ROOT/bin/HoloREA/dna
COMMON=$ROOT/src/common/common.ts
ZOMES="agents events resources"
DEPORT="-e 's:^//\\* ((?:IM|EX)PORT):/\\* &1:g'"

function allow {
  echo s:^/\\* $1://\\* $1:g
}
function block {
  echo s:^//\\* $1:/\\* $1:g
}

source ./stagingSetup.sh
source ./glomLibs.sh

for zome in $ZOMES; do
  folder=$STAGING/$zome
  sed $folder/${zome}.ts -e "$(block IMPORT)" -e "$(block EXPORT)" -e "$(block TYPE-SCOPE)" -e "$(allow HOLO-SCOPE)" > $folder/_${zome}.ts
  cat $STAGING/common/common.ts $folder/_${zome}.ts > $folder/${zome}.ts
done

# compile each zome with module: None to bin
for zome in $ZOMES; do
  tsc --project $STAGING/${zome}/ --outFile $BINDNA/${zome}/_${zome}.js
  cat $STAGING/shims.js $BINDNA/${zome}/_${zome}.js > $BINDNA/${zome}/${zome}.js
done

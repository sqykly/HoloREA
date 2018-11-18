ROOT=..
STAGING=$ROOT/build/staging
SRCDNA=$ROOT/src/HoloREA/dna
BINDNA=$ROOT/bin/HoloREA/dna
COMMON=$SRCDNA/common/
ZOMES="agents events resources"
MODULES="${ZOMES} common"

function allow {
  echo s:^/\\* $1://\\* $1:g
}
function block {
  echo s:^//\\* $1:/\\* $1:g
}

#BINS=-e "$(off IMPORT)" -e "$(off EXPORT)" -e "$(off TYPE-SCOPE)" -e "$(on HOLO-SCOPE)"


# cp: common to staging/common.
cp $COMMON -r $STAGING/


# cp: zomes to staging as zome.ts
for zome in $MODULES; do
  rm --interactive=never $STAGING/${zome}/${zome}.d.ts
  cp $SRCDNA/${zome}/${zome}.ts $STAGING/${zome}/_${zome}.ts
done

# sed: turn IMPORT comment-on, EXPORT comment-off, TYPE-SCOPE on, HOLO-SCOPE off to zome/zome.ts
sed $STAGING/common/_common.ts -e "$(block IMPORT)" -e "$(block EXPORT)" > $STAGING/common/common.ts

for zome in $ZOMES; do
  # removed -e "$(allow TYPE-SCOPE)"
  sed $STAGING/${zome}/_${zome}.ts -e "$(allow EXPORT)" -e "$(block HOLO-SCOPE)" -e "$(block IMPORT)" -e "$(allow TYPE-SCOPE)" > $STAGING/${zome}/${zome}.ts
done

# tsc: compile each zome/_types with declarations-only to zome/index.d.ts
# trying it with all files in the project
tsc --project $STAGING/ --declaration --emitDeclarationOnly --declarationDir $STAGING

# cut to glomLibs.sh

# move on to staging/staging.sh

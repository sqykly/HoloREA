ROOT=..
STAGING=$ROOT/build/staging
SRCDNA=$ROOT/src/HoloREA/dna
BINDNA=$ROOT/bin/HoloREA/dna
COMMON=$ROOT/src/lib/ts/common.ts
ZOMES="agents events resources"
MODULES="${ZOMES} common"

function allow {
  echo s:^/\\* $1://\\* $1:g
}
function block {
  echo s:^//\\* $1:/\\* $1:g
}
#echo $(off IMPORT)

#BINS=-e "$(off IMPORT)" -e "$(off EXPORT)" -e "$(off TYPE-SCOPE)" -e "$(on HOLO-SCOPE)"


# cp: common to staging/common.
cp $COMMON $STAGING/common/common.ts

# cp: zomes to staging as zome.ts
for zome in $ZOMES; do
  cp $SRCDNA/${zome}/${zome}.ts $STAGING/${zome}/${zome}.ts
done

# sed: turn IMPORT comment-on, EXPORT comment-off, TYPE-SCOPE on, HOLO-SCOPE off to zome/_types.ts
for zome in $MODULES; do
  sed $STAGING/${zome}/${zome}.ts -e "$(block IMPORT)" -e "$(allow EXPORT)" -e "$(allow TYPE-SCOPE)" -e "$(block HOLO-SCOPE)" > $STAGING/${zome}/_types.ts
done

# tsc: compile each zome/_types with declarations-only to zome/index.d.ts
for zome in $MODULES; do
  tsc $STAGING/${zome}/_types.ts --declaration --emitDeclarationOnly --allowUnreachableCode --allowUnusedLabels --declarationDir $STAGING/${zome}/
done
# cat common/index.d.ts, other zomes' index.d.ts to zome/lib.d.ts

# move on to staging/staging.sh

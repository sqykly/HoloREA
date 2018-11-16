export ROOT=../..
export STAGING=$ROOT/build/staging
export SRCDNA=$ROOT/src/HoloREA/dna
export BINDNA=$ROOT/bin/HoloREA/dna
export COMMON=$ROOT/src/lib/ts/common.ts
export ZOMES="agents events resources"
export DEPORT="-e 's:^//\\* ((?:IM|EX)PORT):/\\* &1:g'"
# copy common.ts to staging.

#cp $COMMON $STAGING/common.ts
sed $COMMON $DEPORT > $STAGING/common.ts

# copy zomes to staging/zome
for zome in $ZOMES; do
  cp -r $SRCDNA/${zome}/. $STAGING/${zome}/
done

# modify zome imports:
#   remove common import
for zome in $ZOMES; do
  sed $STAGING/${zome}/${zome}.ts -e "s:^//\* (IM|EX)PORT:/\*:g" > $STAGING/${zome}/_${zome}.ts
done

# prepend common to zomes
for zome in $ZOMES; do
  cat $STAGING/common.ts $STAGING/${zome}/_${zome}.ts > $STAGING/${zome}/${zome}.ts
done

# compile each zome with module: None to bin
for zome in $ZOMES; do
  tsc --project $STAGING/${zome}/ --outFile $BINDNA/${zome}/${zome}.js
done

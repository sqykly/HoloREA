ROOT=..
STAGING=$ROOT/build/staging
SRCDNA=$ROOT/src/HoloREA/dna
BINDNA=$ROOT/bin/HoloREA/dna
COMMON=$SRCDNA/common/
ZOMES="agents events resources"
MODULES="${ZOMES} common"
LIBPATH=$STAGING/common/
LIBS="$LIBPATH/holochain-proto.d.ts"

function allow {
  echo s:^/\\* $1://\\* $1:g
}
function block {
  echo s:^//\\* $1:/\\* $1:g
}

# cp: common to staging/common.
cp $COMMON -r $STAGING/


# cp: zomes to staging as zome.ts
for zome in $MODULES; do
  folder=$STAGING/$zome
  rm --interactive=never $folder/${zome}.d.ts $folder/_${zome}.d.ts $folder/_${zome}.ts $folder/_types.ts $folder/${zome}.js $folder/lib.d.ts
  cp $SRCDNA/${zome}/${zome}.ts $folder/_${zome}.ts
done

# sed: turn IMPORT comment-on, EXPORT comment-off, TYPE-SCOPE on, HOLO-SCOPE off to zome/zome.ts
sed $STAGING/common/_common.ts -e "$(block IMPORT)" -e "$(block EXPORT)" > $STAGING/common/common.ts

for zome in $ZOMES; do
  sed $STAGING/${zome}/_${zome}.ts -e "$(allow EXPORT)" -e "$(block HOLO-SCOPE)" -e "$(block IMPORT)" -e "$(allow TYPE-SCOPE)" > $STAGING/${zome}/${zome}.ts
done

# tsc: compile each zome/_types with declarations-only
tsc --project $STAGING/ --declaration --emitDeclarationOnly --declarationDir $STAGING

# remove "export default" to make the declarations fully ambient
for zome in $ZOMES; do
  folder=$STAGING/$zome
  sed $folder/${zome}.d.ts -e "s:export default[^;]*;://:g" > $folder/_$zome.d.ts
done

# accumulate all of the symbol imports of each zome to a default lib (lib.d.ts)
# agents
cat $LIBS $STAGING/events/_events.d.ts $STAGING/resources/_resources.d.ts > $STAGING/agents/lib.d.ts

# events
cat $LIBS $STAGING/agents/_agents.d.ts $STAGING/resources/_resources.d.ts > $STAGING/events/lib.d.ts

# resources
cat $LIBS $STAGING/agents/_agents.d.ts $STAGING/events/_events.d.ts > $STAGING/resources/lib.d.ts

# apply new settings for the output (-TYPE-SCOPE +HOLO-SCOPE) and inline code imports
for zome in $ZOMES; do
  folder=$STAGING/$zome
  sed $folder/${zome}.ts -e "$(block IMPORT)" -e "$(block EXPORT)" -e "$(block TYPE-SCOPE)" -e "$(allow HOLO-SCOPE)" > $folder/_${zome}.ts
  cat $STAGING/common/common.ts $folder/_${zome}.ts > $folder/${zome}.ts
done

# compile each zome with module: None to bin and add Map & Set shims.
for zome in $ZOMES; do
  tsc --project $STAGING/${zome}/ --outFile $BINDNA/${zome}/_${zome}.js
  cat $STAGING/shims.js $BINDNA/${zome}/_${zome}.js > $BINDNA/${zome}/${zome}.js
done

tsc ./json/inline.ts
cd json
node ./inline.js
cd ..

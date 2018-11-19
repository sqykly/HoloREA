ROOT=..
STAGING=$ROOT/build/staging
SRCDNA=$ROOT/src/HoloREA/dna
BINDNA=$ROOT/bin/HoloREA/dna
COMMON=$SRCDNA/common/
ZOMES="agents events resources"
MODULES="${ZOMES} common"
LIBPATH=$STAGING/common/
LIBS="$LIBPATH/holochain-proto.d.ts"

for zome in $ZOMES; do
  folder=$STAGING/$zome
  sed $folder/${zome}.d.ts -e "s:export default.*;://:g" > $folder/_$zome.d.ts

done

# agents
cat $LIBS $STAGING/events/_events.d.ts $STAGING/resources/_resources.d.ts > $STAGING/agents/lib.d.ts

# events
cat $LIBS $STAGING/agents/_agents.d.ts $STAGING/resources/_resources.d.ts > $STAGING/events/lib.d.ts

# resources
cat $LIBS $STAGING/agents/_agents.d.ts $STAGING/events/_events.d.ts > $STAGING/resources/lib.d.ts

# I think I'm done here.

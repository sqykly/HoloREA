export ROOT=../..
export STAGING=$ROOT/build/staging
export SRCDNA=$ROOT/src/HoloREA/dna
export BINDNA=$ROOT/bin/HoloREA/dna
export COMMON=$ROOT/src/lib/ts/common.ts
export ZOMES="agents events resources"
export DEPORT="-e 's:^//\\* ((?:IM|EX)PORT):/\\* &1:g'"

# cp: common to staging/common.

# cp: zomes to staging as zome.ts

# sed: turn IMPORT off, EXPORT on, TYPE-SCOPE on, HOLO-SCOPE off to zome/_types.ts

# tsc: compile each zome/_types with declarations-only to zome/index.d.ts

# cat common/index.d.ts, other zomes' index.d.ts to zome/lib.d.ts

# move on to staging/staging.sh

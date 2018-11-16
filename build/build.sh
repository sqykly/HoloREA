export ROOT=..
export STAGING=$ROOT/build/staging
export SRCDNA=$ROOT/src/HoloREA/dna
export BINDNA=$ROOT/bin/HoloREA/dna

# First: compile all code into index.D.TS so import is symbols-only, put in staging
# Next: clone all modules, append common at the beginning.  Clones all see each
# other's d.ts, not their source (they don't need any objects; types only)

# Finally, compile with module: "None"

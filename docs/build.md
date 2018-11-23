## To Build

    $ source build/bin.sh

Note that many, many errors will appear in the console.  They are irrelevant; upon inspection, the code that arrives in `bin/dna` is perfectly good.  The errors are due to TypeScript freaking out that the Holochain API was not defined in the project's code.  The API is a set of properties and methods on the global object, so they will be there at runtime.

### Which errors are expected?

`rm: can't remove ...`

Any error message from the compiler involving:
- `get`
- `commit`
- `makeHash`
- `getLinks`
- `holochain`
- `HC`
- `isError`
- `update`
- `remove`
- `call`

`staging/`*`module`*`/`*`module`*`.ts(`*`number`*`,`*`number`*`): error TS`*`...`*
- `2503`: can't locate namespaces `events`, `agents`, or `resources` from a module of a different name; it doesn't need to except to suppress the rest of these errors.
- `2339`: missing property from `{}`.  Caused by `2503`.
- `2322`: type mismatch with `{}`.  Caused by `2503`.

I'll figure out how to get rid of those... soon.

## To Write

Because of the difficulty with which TypeScript handles the Holochain API's lack of conventional module loaders, several measures were taken to coerce the compiler into compiling the source in pieces and gluing them back together.  Unfortunately, any additional code will have to maintain some of these efforts (for the time being).

### There is no module loader

Holochain has no module loader.  The only way to share code and objects between modules is to inline them.  I've done this with `common.ts` and `shim.js`, and adding additional files (at the moment) will require modifications to the staging script.

As such, it is strongly discouraged to `import`/`export` anything other than namespaces and types.  There is a cost for those, too...

### Tagged Toggle Comments

A toggle comment looks like this:

    //* ON
    A       // happens
    /*/
    B       // doesn't happen
    /**/

    /* OFF
    A       // doesn't happen
    /*/
    B       // happens
    /**/

The staging script looks for these types of comments, flipping them on or off to manipulate the compiler's impression of code visibility.  As such, certain activities *must* be enclosed in toggle comments.  Some of them may need to be toggled off in development in order to get auto-complete and content assist.

#### `EXPORT`

    //* EXPORT
    export default myModule;
    /**/

    //* EXPORT
    export /**/ class myGlobalClass ...


Recommended on during development.  Wraps *all* top-level `export` or `export default` statement.  Turning it off, along with `IMPORT`, tricks the compiler into treating modules as ambient modules.

#### `IMPORT`

    //* IMPORT
    import { foo, bar } from "baz";
    import "ambient";
    import defaultExport from "goodModule";
    /*/
    /**/

Recommended on during development.  Wraps *all* top-level `import` statements, even ambient modules.  See above for reasoning.

#### `TYPE-SCOPE`

    /* TYPE-SCOPE
    declare global {
    /**/
    namespace thatIsNormallyExported ...
    /* TYPE-SCOPE
    }
    /**/

Recommended off during development.  Anything needed to propagate type definitions without using `import` should get this.

#### `HOLO-SCOPE`

    //* HOLO-SCOPE
    function zomePublicFunction() ...

    function genesis() ...
    /*/
    /**/

Recommended on during development.  Any code the is shared with Holochain but not other modules should be wrapped like that.

### Schemas

Due to some missing capabilities in the Holochain JSON validator, schemas beyond
basic POD structs will need to be "compiled" for a build.  As such, the originals
have been moved into the `src` directory.

The keyword properties `$ref` and `dependencies` are buggy if not missing.  
Probably the most common cases of `dependencies` look like this:

    "properties": {
      "foo": {
        "type": "string",
        "dependencies": ["bar", "baz"]
      }
    }

I've seen errors that _imply_ that that may work.  However, I was using the more
complicated form to specify an actual schema for those dependent properties, and
that is not happening.  Thus, the build script also triggers a node module that:

- inlines all `$ref` to replace objects directly
- implements a new keyword, `$extends`.  The value is a reference to another
source JSON schema, and any fields in that schema that are not overwritten by the
first schema will be placed directly into the first schema.  That is a whole-file
deep merge, so anything in super's `properties` will appear in the sub-schema's
`properties`.  If the super has `required` properties, they will be appended to
the sub's `required`.  Doesn't do anything surprising.

After the build script runs, the zomes in `bin` are so simple that
misinterpreting them is impossible.

_as of 10/29_

# How to Holochain

## Calling functions through the web server API
[call]: #calling-functions-through-the-web-server-api 'call'

Holochain applications are divided into modules ("zomes"), which are defined in the application package index ("DNA").  The Zomes each have a section in the DNA that lists the functions they expose publicly.  The web server then responds to POST requests to URLs like this:

_`domain and such`_`/zomeName/functionName`

The POST request body must contain _exactly one_ argument to the function.  This is a JSON object whose form is defined by the function itself.  Similarly, the value returned by the server is in the form of a JSON object in the response body.  Since there is no `.json` extension in the URL, the MIME type for the request and response should be set to `"application/json"`.

## Classes
[class]: #classes

Holochain does not really do classes.  However, I've developed ways to fake them.
Anything I describe here as a class has a TypeScript `class` representation on the backend with methods, getters, setters, the works.  If these classes would be helpful on the
frontend, it is not impossible to make them available, though some work would be
required in order to use any method that deals with the DHT for obvious reasons.

## How to get REST-y access to things through the path and query strings

You can't.  There are two layers of path (zome name / function name).  The only
way to get additional information to those endpoints is in the _body_ of the
request; a query string will never make it into the app.  There is no way to
expand the function name set dynamically to e.g. make new functions named after
an item's hash so that you can get the data with just a url.  It just is not
going to happen.

## How to make general purpose relational queries about objects on the DHT

You can't.  The DHT is not a DB.  If there is a need to make queries from afar,
I'll have to open an endpoint for it, and there is likely to be a catch, e.g.
you need to know the exact identity of part of what you are looking for.  We'll
work something out, though.

## Holochain's `links` types

_Not sure if this will come up for UI purposes, as there are no functions exposed by the Holochain web server directly.  At present, I don't return them on the HoloREA web interface either, but I could if it would be helpful.  I include this information because the HoloREA web interface DOES make extensive use of `links`, and understanding them may help rationalize the way these functions work._

The Holochain DHT is not a database and it does not support SQL or anything like it.  The only query one can make on the DHT is for one entry by its primary key (its hash).

Enter `links` types.

### Is any of this important for UI?

[Probably just this](#link-property-notation) and [this](#can-i-use-those-classes-too)

### What a `link` is

Conceptually, a `link` is a directed, labelled edge on a graph where the vertices are all DHT entries.  The edge points from a "Base" to a "Link" (or target) and has a "Tag" string.  The Base _must_ exist as an entry on the DHT, but in theory, the Link can be any string at all.  It's most useful if it's also the hash of an entry.  Tags are just strings.  _To my knowledge_ there are no limitations on what strings can be used at any time as tags.

### Querying links

A query is made using the hash of the entry that is the Base (subject) of the link.  If only the base is supplied, all links from that entry match the query.  If a tag is given as well, only the links from the given base tagged as specified are matched.  Any (base, link, tag) tuple can be stored simultaneously - (A, B, "foo"), (A, B, "bar"), and (A, C, "foo") can all coexist.  The internal `getLinks` function returns all matched links, which include the hashes, data types, source agents, and data structures of the Link (object) of the link.  

Links can modified, appended, or deleted, but I have no clue why one would modify or append them rather than just making a new one and deleting the old one.

By managing links, operations associated with relational databases are realized on Holochain.

### "`links`" types

There are technically few limitations with links.  A link can be made in any module from data that are defined in any other module.  However, the app DNA does require that "`links` types" be declared to be within a zome.  A `links` type's only identifying attribute is its name, which is used in the internal `commit` and `makeHash` API functions.

Because "`links`" types are totally lawless, I've implemented two classes and several conventions to organize and fool-proof my links.  Each individual "`links`" entry in the DNA has a corresponding object that defines the entry types that can serve as the Base, the entry types that can be linked to, and the tag strings that can be used.  At runtime, it manages reciprocal links, e.g. "affects" <---> "affectedBy"

Since the data structures returned by the Holochain API when using links are highly polymorphic and tend to make little sense outside the context of the function that directly called `getLinks`, another object wraps all link-based query results to filter by tag (if not done already), map hashes to objects and back, filter by source agent, and filter by Link object type.  It can also remove the matched entries as a batch (e.g. query a base and tag, delete all the links that come from one source or link to a particular class).

### Can I use those classes too?

No.  Assuming you are talking about UI.  They are designed to live in a context that has an ambient Holochain API, i.e. not a browser.  That API _can_ be faked, e.g. I mocked the API so I could do testing in Node.js, but I have no plans to make another facade for a browser.  The async operation model is too different to work in a browser, I think.

The practical consequence is that all the things the classes I mentioned do are not happening anywhere but the backend.  There are no reciprocal or mutual or managed links in the data the server returns.  Only in the case of an object with just one outward link per tag, e.g. `EconomicEvent.affects`, will the data be there in the form of a `Hash`.  In all other cases, public HoloREA functions are used to make one-to-many and many-to-many queries that run on links, which will return arrays.

### Link property notation
[link]: #link-property-notation '`link`'

I annotate properties that are links on the backend like this:

`link` **tag**
  - **tag** links an instance to another instance of the same class, which has the same tag and a link back.

`aliased link` **tag** _..._
  - By default, there is *no* property called **tag** on the struct returned
  by the server.
  - For an `aliased link`, there *is* a property with the same name.
  - For a link of the form: `aliased link `_..._`T`, the type of that property is
  [`Hash`]`<T>`


`link` **tag** _..._ **foreignClass**
  - **tag** links to instance(s) of **foreignClass**
  - if there is a link back, it has the same tag.

`link` **tag** _..._ **foreignTag**`:` **foreignClass**
  - **tag** links this instance(s) to instance(s) of **foreignClass**
  - **foreignTag** links the **foreignClass** instance(s) back.

`link` _..._ **foreignTag**`:` **foreignClass**
  - **foreignClass** has a link to this class, but this class doesn't have a link back.  It's still possible to determine whether a particular foreign instance **foreignTag** points at an instance of this class, but in general it's not possible to query for all instances with links to this instance.

But what is a _..._?

... `--` ...
  - One to one, reciprocal.

... `-=` ...
  - One to many.
  - The reciprocal link will be documented as `=-`.

... `=-` ...
  - Many to one.
  - Reciprocal is `-=`.

... `==` ...
  - Many to many, reciprocal.

... `-->` ...
  - One to one, no reciprocal link back.  
  - The foreign class may or may not document the link as `<--`.

... `<--` ...
  - See above where there is no tag in the documentation.
  - Just one foreign instance is linked to this one instance.
  - The foreign instance linked to this instance isn't linked by the same tag to anything else.

... `-=>` ...
  - One to many with no reciprocal link back.
  - Example use case: a folder in a (naive) file system knows where its files are, they don't have any indication of where they are.
  - You get the picture about ... `<=-` ... by now, I think.

You get the picture with `=->`, `<-=`, `==>`, and `<==`, right?

And `...` is not real.  Replace it with one of the ascii art connectors.

# Current (poor) organization of the app

_as of 10/29.  All aspects of the module structure are deprecated and will be fixed after GFD._

There are currently three REA zomes in the app:

- Zome `agents` deals with REA Agents and their classifications.  This is the least developed zome and should see limited use.
- Zome `resources` deals with REA Resources and their classifications.  While there are a variety of accessible data on the objects it defines, consumes, and produces, the functional behavior exposed by this zome is currently limited to retrieving lists of events for operations in...
- Zome `events` deals with REA Events and supporting structures.  By far the most developed module.

# Reference

## Common structures

### `Hash<T>` type
[`Hash`]: #hasht-type

Holochain stores data in a distributed hash table (DHT).  Entries into the DHT (including all HoloREA data) are not available by any path, URL, or query; they can only be referred to by their hash, which is a spurious-looking string of letters and numbers.  These can only be obtained as the fields or elements of objects returned by module functions.  While there is no way to differentiate between hashes that refer to different types, they are always documented as being the hash _of a particular type_.  When a function gives you a `Hash<T>` in its result, that hash is _only_ valid as an argument documented as `Hash<T>`, not any other `Hash`.

### `QuantityValue` struct
[`QuantityValue`]: #quantityvalue-struct

A POD struct that expresses a unit of measure and quantity.  HoloREA uses these _strictly_ by value, never storing them on the DHT and never referring to them by a `Hash`.

*Properties*
- `string` `units`: The unit of measure.  If, for some reason, you need complicated units:
  - `"unit*otherUnit"` is the result of multiplying two quantities with unlike units.  
    - Example: man hours = `"man*hours"`
  - `"unit^exponent"` is the result of multiplying two quantities with the same unit.  
    - Example: square feet = `"feet^2"`
    - Example: kilometers per hour = `"km*hr^-1"`
  - `""` (blank string) is known in some circles as "Each".  Use this to indicate a quantity of something that only comes in units of itself.
    - Example: photons = `""`
  - `"%"` is a percentage.  Maybe we'll use it to indicate an interest rate or a discount or something.
- `number` `quantity`: How many of `units` is indicated by the `QuantityValue`.

Note that behind the scenes, actual math is being done, and if the units don't
match exactly for adding and subtracting, a `TypeError` is being thrown.

If it's helpful, the TypeScript [`class`](classes) that does the math could be made
available to the web API.  It would be uncharacteristically easy, in fact, because
it is never stored and thus never relies on the holochain API functions.

### `Date` type
[`Date`]: #date-type

Alias for `unsigned integer`.  The number of milliseconds since January 1, 1970.  Not useful to humans, but easy to compare and calculate differences on, so this is how it's stored internally.  Convert it to a real date using:

    realDate = new Date(wackyIntegerDate);

### `PhysicalLocation` type
[`PhysicalLocation`]: #physicallocation-type

This will have to do for now.  It's just an array of strings that should be
joined with line breaks or other unambiguous delimiters.  e.g.

    const demogorgon: Agent = /*...*/;
    demogorgon.primaryLocation = [
      `The Demogorgon`
      `c/o White House`,
      `1600 Pennsylvania Ave`,
      `The Upside-Down`
    ]

### `VfObject` [class]
[`VfObject`]: #vfobject-class


Carries the properties that any object in the ValueFlows ontology can have.

**Properties**
- (optional) `string` `name`: A not-necessarily-unique name.
- (optional) `string` `note`: A note.
- (optional) `string<uri>` `url`: A link with more information.
- (optional) `string<uri>` `image`: A link to a picture.

### `CrudResponse<T>` struct
[`CrudResponse`]: #crudresponset-struct

A structure that is intended to provide complete information on an object of type `T` when it is created, read, updated, or deleted.  Many functions either accept or return
one, either as the top level argument or nested inside somewhere.

**Properties**
- `object` `error`: if the operation caused an error, the information will be copied here.
  Note that if this field is present, the rest of the object should be viewed with
  suspicion.
  - `string` `error.name`: The name of the error.
  - `string` `error.message`: The error message.
  - `string` `error.stack`: Call stack.
- [`Hash`] `<T>` `hash`: The object's hash on the DHT.
- `T` `entry`: The object itself.
- `string` `type`: The name of the type as listed in the DNA.  This is identical to the class name.

### `Anything<T>` type
[`Anything`]: #anythingt-type

Any one of:
  - `T`
  - [`Hash`]`<T>`
  - [`CrudResponse`]`<T>`

In cases where the API will accept this, I felt really bad about making you
memorize what was a hash or an object you got from the API or the actual data
that came with it.  Made myself a set of functions that get each of them from
the others, and now you don't have to memorize all that.

## `agents` module
[agents]: #agents-module

### `EconomicAgent` [class] `extends` [`VfObject`]
[`EconomicAgent`]: #economicagent-class-extends-vfobject
[`Agent`]: #economicagent-class-extends-vfobject

Exists nominally.  Use the inherited properties or the location to make it unique so their hashes don't collide.

**Properties**
- (optional) [`PhysicalLocation`] `primaryLocation`: Where is this agent, usually?
- `string name`: inherited from [`VfObject`], required here.
- **[link]** `<-= owns: `[`EconomicResource`] Things the agent owns.  _This
terminology is deprecated and will change when VF defines Agent Resource Roles._

### `createAgent`: `function`
[`createAgent`]: #createagent-function

Creates an agent and returns its data, hash, and any errors.

- to [call]: POST /agents/createAgent/
- argument: [`EconomicAgent`] The properties of the agent to create.
- returns: [`CrudResponse`]`<`[`EconomicAgent`]`>` Any errors or the data and hash of the agent.

### `getOwnedResources`: `function`
[`getOwnedResources`]: #getownedresources-function

Returns the resources belonging to the specified agents.  _The "ownership" terminology is deprecated and will be replaced by agent resource roles._

- to [call]: POST /agents/getOwnedResources/

- argument: `object`
  - [`Hash`]`<`[`EconomicAgent`]`>[]` `agents`: the agents whose resources should be catalogued.
  - (optional) [`Hash`]`<`[`ResourceClassification`]`>[]` `types`: a list of classifications.  Only resources classified as one of these will be included.

- returns: dictionary of [`Hash`]`<`[`EconomicAgent`]`>`: a hash from `agents`.  All valid agents from `agents` should be included.
  - dictionary of [`Hash`]`<`[`ResourceClassification`]`>`: a resource classification hash.  Child elements under this key belong to this classification.  If the given agent is not the owner of one or more resources of this class, the key will be missing.
    - [`Hash`]`<`[`EconomicResource`]`>[]` The resources of the keyed class in
    the custodianship of the keyed agent.


## `resources` module
[resources]: #resources-module

### `ResourceClassification`: [class] `extends` [`VfObject`]
[`ResourceClassification`]: #resourceclassification-class-extends-vfobject

A categorization of resources.  Mostly nominal.

**Properties**
- `string` `defaultUnits`: a resource instance will have these units by default.
- **[link]** `classifies -= resourceClassifiedAs: `[`EconomicResource`].  All resource
instances that are classified as this.

### `EconomicResource`: [class] `extends` [`VfObject`]
[`EconomicResource`]: #economicresource-class-extends-vfobject

Represents an observed quantity of some resource.

**Properties**
- [`QuantityValue`] `currentQuantity`: as of the last calculation, this is how much of the resource there is.

- [`Date`] `quantityLastCalculated`: The `currentQuantity` is from this moment.  If there are events that affect it more recently, the `currentQuantity` is no longer valid.  Any method returning a resource will check on this, so don't worry about it.

- **aliased [link]** `resourceClassifiedAs =- classifies: `[`ResourceClassification`].  The
class that defines the resource.  Or it will, there's not much to it right now.

- **aliased [link]** `underlyingResource =- underlies`: a more concrete parent of this
resource.  Implemented only nominally.

- **aliased [link]** `contains -= inside`.  Not useful at this time.

- (optional) `string` `trackingIdentifier`: An identifier for tracking.  Like a serial number or batch number.

- (temporary) [`Hash`]`<`[`EconomicAgent`]`>` `owner`: The Agent who owns the resource.  This is for temporary use until ValueFlows explores Agent Resource Roles more precisely.

### `createResourceClassification` function
[`createResourceClassification`]: #createresourceclassification-function

Creates a resource classification.

- to [call]: POST /resources/createResourceClassification
- argument: [`ResourceClassification`] the properties for the classification to
be created.
- returns: [`CrudResponse`]`<`[`ResourceClassification`]`>`

### `createEconomicResource`: function
[`createEconomicResource`]: #createeconomicresource-function

Create a resource through an event.

- to [call]: POST /resources/createEconomicResource/
- argument: `object`
  - [`EconomicResource`] `resource`: the properties you would like the resource
  to have.
    - `currentQuantity`:
      - If `event` is blank or `event.affectedQuantity` is blank or zero, **make
      sure the units are the same.**
  - [`EconomicEvent`] `event`: properties you want the creation event to have
    - `affectedQuantity`
      - One of the two quantities should be zero or missing, but not both
      - If both exist, they _must_ have the same unit.
    - `action`
      - Unless you are trying to create a debt of some kind, ensure that this is
      the hash of an action with `behavior: '+'`.  In terms of fixtures as of
      11/12/18, from [`events/getFixtures`] `.Action.Receive` or `.Action.Adjust`
      are what you are looking for.  If left blank, it will default to `Adjust`.
- returns: [`CrudResponse`]`<`[`EconomicResource`]`>`
  - The event seen in this structure as `affectedBy` has already been created; do not run over to [`createEvent`] and make another.

Alternatively, consider using [`resourceCreationEvent`], which is more robust in
terms of the event.

### `getResourcesInClass`: `function`
Get a list hashes of all resources belonging to a classification.

- to call: POST /resources/getResourcesInClass/
- argument: `object`
  - [`Hash`](#hashtype-type)`<`[`ResourceClassification`](#resourceclassification-class-extends-vfobject)`>` `classification`: The classification whose instances should be returned.
- returns: [`Hash`](#hashtype-type)`<`[`EconomicResource`](#economicresource-class-extends-vfobject)`>`[]

### `getAffectingEvents`: `function`
Get the hashes of all events that have affected a single resource.

- to call: POST /resources/getaffectingevents/
- argument: `object`
  - [`Hash`]`<`[`EconomicResource`]`>` `resource`: The hash of the resource to trace.
- returns [`Hash`]`<`[`EconomicEvent`]`>[]`

## `events` module

### `TransferClassification`: [class] `extends` [`VfObject`]
[`TransferClassification`]: #transferclassification-class-extends-vfobject

This doesn't do anything yet.

**Properties**
- **link** `classifies -= classifiedAs: `[`Transfer`]
- `string name`: inherited from [`VfObject`], but required, not optional, here.
This is the case because a `TransferClassification` carries no other information
to identify it with a hash.

**Fixtures**
- `Stub`: Since, as of 11/13/18, a `TransferClassification` serves
no purpose except being required to make a [`Transfer`], the `Stub`
fixture can be used as the classification of any transfer.

### `Transfer`: [class] `extends` [`VfObject`]
[`Transfer`]: #transfer-class-extends-vfobject

A directed flow of resources connecting processes and events to each other.
Doesn't really do much right now.

**Properties**
- `transferClassifiedAs` **aliased link** `classifiedAs =- classifies` [`TransferClassification`]:
This is how you will know what kind of transfer this is.
- **aliased link** `inputs -- inputOf` [`EconomicEvent`]`|Process`
- **aliased link** `outputs -- outputOf` [`EconomicEvent`]`|Process`

**See**
- Creation
  - [`createTransfer`]
- Reports
  - [`traceTransfers`]
  - [`trackTransfers`]
  - [`traceEvents`]
  - [`trackEvents`]


### `Action`: [class] `extends` [`VfObject`]
[`Action`]: #action-class-extends-vfobject

A categorization of how an event can affect a resource.

**Properties**
- `'+'|'0'|'-'` `behavior`: does this action increase, not affect, or decrease a
resource's quantity?
- **link** `actionOf -= action` [`EconomicEvent`]

**Fixtures** _11/12/18_
- `Action` `Give`: Give something away out of your stock.
- `Action` `Receive`: Obtain something you didn't have before.
- `Action` `Adjust`: Sync system impression of a resource with reality, or enter
a previously unmodeled resource into the system (e.g. when setting up HoloREA)

See [`createAction`].

### `EconomicEvent`: [class] `extends` [`VfObject`]
[`EconomicEvent`]: #economicevent-class-extends-vfobject

An observed event that happened.

**Properties**
- **aliased link** `action =- actionOf`: [`Action`].  What kind of event is this?
- **aliased link** `inputOf -- inputs`: [`Transfer`]
- **aliased link** `outputOf -- outputs`: [`Transfer`]
- **aliased link** `affects =- affectedBy`: [`EconomicResource`].  The resource
that this event modifies.
- [`Hash`]`<`[`Agent`]`>` `provider`: The agent providing a resource.
- [`Hash`]`<`[`Agent`]`>` `receiver`: The agent receiving the resource.
- [`QuantityValue`] `affectedQuantity`: How much of the `affects` resource was
gained or lost?
- [`Hash`] `scope`: doesn't do anything yet.
- [`Date`] `start`: when the event began.  Use 0 if it hasn't begun (or wait)
- [`Date`] `duration`: how long did it take?  Use 1, not 0, for an instantaneous
event.  Use 0 if the event is not yet complete.

**See**
- Creating
  - [`createEvent`]
  - [`resourceCreationEvent`]
- Sort and filter
  - [`sortEvents`]
  - [`eventsStartedAfter`]
  - [`eventsStartedBefore`]
  - [`eventsEndedAfter`]
  - [`eventsEndedBefore`]
- Reports
  - [`eventSubtotals`]
  - [`traceEvents`]
  - [`trackEvents`]
  - [`traceTransfers`]
  - [`trackTransfers`]

### `Subtotals` struct
[`Subtotals`]: #subtotals-struct

The format of a record of past and present states of an [`EconomicResource`].

**Properties**

- dictionary [`QuantityValue`]` totals[`[`Hash`]`<`[`EconomicResource`]`>]`:
the final quantity of each requested resource after all events in `events` are complete (and any previous events)
- object array `events`
  - [`CrudResponse`]`<`[`EconomicEvent`]`>` `event`: The event that causes this
  change of states.
  - dictionary [`QuantityValue`] `subtotals[`[`Hash`]`<`[`EconomicResource`]`>]`:
  the state of each requested resource before `event` happened.
- [`Hash`]`<`[`EconomicResource`]`> resources[]` A list of the resource hashes that this [`Subtotals`] is concerned with.

See [`eventSubtotals`].

### `TimeFilter` struct
[`TimeFilter`]: #timefilter-struct

An argument object pattern used when filtering events by time.

**Properties**

- [`Hash`]`<`[`EconomicEvent`]`> events[]`: The events to be filtered.
- [`Date`]` when`: A time that will partition the `events` according to the
specific filtering function

See
- [`eventsEndedAfter`]
- [`eventsEndedBefore`]
- [`eventsStartedAfter`]
- [`eventsStartedBefore`]

### `createTransferClass` `function`
[`createTransferClass`]: #createtransferclass-function

Create a new transfer class.  It doesn't do much yet, but you still need one.
- To [call]: POST /events/createTransferClass/
- Argument: [`TransferClassification`] The desired properties.
- Returns: [`CrudResponse`]`<`[`TransferClassification`]`>` the new object.


### `createTransfer` `function`
[`createTransfer`]: #createtransfer-function

Creates a new Transfer object.  Don't forget to bring the hash of a
[`TransferClassification`]!

- To [call],  POST /events/createTransfer
- Argument [`Transfer`] Properties the object should have.
- Returns [`CrudResponse`]`<`[`Transfer`]`>` a new transfer object

### `createAction` `function`
[`createAction`]: #createaction-function

Creates an [`Action`].  You will need one to create an [`EconomicEvent`].
Use this function if none of the fixtures in [`events.getFixtures`] suits your
needs.

- To [call] POST /events/createAction
- Argument [`Action`] The properties the object should have.
- Returns [`CrudResponse`]`<`[`Action`]`>` The new object

### `createEvent`: `function`
[`createEvent`]: #createevent-function

Creates an event object.  Have the [`Action`], [`Transfer`], [`EconomicResource`],
and [`Agent`] hashes ready.

- To [call] POST /events/createEvent
- Argument [`EconomicEvent`] the properties the event should have.
  - [`Hash`]`<`[`Action`]`> action`: this **must** exist and be included.
  - [`Hash`]`<`[`EconomicResource`]`> affects`: this **must** exist beforehand
  and **must** be included.  If the event should create a new resource, do not
  use this function.
  - [`Hash`]`<`[`Agent`]`>`: **mandatory**
    - `provider`
    - `receiver`
  - [`Hash`]`<`[`Transfer`]`>`: Not required, but if you don't include them,
  you can't do it later.
    - `inputOf`
    - `outputOf`
  - [`QuantityValue`] `affectedQuantity`: not strictly required, but if left out,
  it defaults to 0, which means the event will have no effect.
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>` The new event object.

### `traceEvents` `function`
[`traceEvents`]: #traceEvents-function

Query a set of events and retrieve the transfers that were their inputs.

- To [call], POST /events/traceEvents/
- Argument [`Hash`]`<`[`EconomicEvent`]`>[]`: the events you would like to trace
- Returns [`CrudResponse`]`<`[`Transfer`]`>[]`: the transfers that trace those
events.


### `trackEvents` `function`
[`trackEvents`]: #trackevents-function

Query a set of events and retrieve the transfers that are their outputs

- To [call], POST /events/trackEvents/
- Argument [`Hash`]`<`[`EconomicEvent`]`>[]`: a list of events to query
- Returns [`CrudResponse`]`<`[`Transfer`]`>[]`: the transfers that track the
events


### `traceTransfers` `function`
[`traceTransfers`]: #traceTransfers-function

Query a set of transfers and retrieve the events (some day processes too) that
are their inputs.

- To [call], POST /events/traceTransfers/
- Argument [`Hash`]`<`[`Transfer`]`>[]`: the transfers to trace
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>[]`: the events that were inputs
of the transfers.

### `trackTransfers` `function`
[`trackTransfers`]: #tracktransfers-function

Query a set of transfers to follow their outputs.

- To [call], POST /events/trackTransfers/
- Argument [`Hash`]`<`[`Transfer`]`>[]` The transfers to track
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>[]` The events that are the
outputs of the given transfers.

### `sortEvents` `function`
[`sortEvents`]: #sortevents-function

Order the events given by their start or end date.

- To [call], POST /events/sortEvents/
- Argument `object`
  - [`Hash`]`<`[`EconomicEvent`]`> events[]`: The events to be sorted.
  - `string by`
    - `"start"`: sorts by start date.
    - `"end"`: sorts by end date.
  - `string order`
    - `"up"`: earlier events first.
    - `"down"`: most recent events first.
  - (optional) [`Date`]` start`: filter out events before this time.
  - (optional) [`Date`]` end`: filter out events after this time.
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>[]` The events in the specified
order, excluding filter-out elements.


### `eventsStartedBefore` `function`
[`eventsStartedBefore`]: #eventsstartedbefore-function

Filter a set of events down to those started before a time of your choice.

- To [call], POST /events/eventsStartedBefore
- Argument [`TimeFilter`] The events and the time to filter the start date under
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>[]` events in `events` that started
before `when`

### `eventsStartedAfter` `function`
[`eventsStartedAfter`]: #eventsstartedafter-function

Filter a set of events down to those started after a time of your choice.

- To [call], POST /events/eventsStartedAfter
- Argument [`TimeFilter`] The events and the time to filter the start date after
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>[]` events in `events` that started
after `when`.

### `eventsEndedBefore` `function`
[`eventsEndedBefore`]: #eventsendedbefore-function

Filter a set of events down to those ended before a time of your choice.

- To [call], POST /events/eventsEndedBefore
- Argument [`TimeFilter`] The events and the time to filter the end date before
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>[]` events in `events` that ended
before `when`.

### `eventsEndedAfter` `function`
[`eventsEndedAfter`]: #eventsendedafter-function

Filter a set of events down to those ended after a time of your choice.

- To [call], POST /events/eventsEndedAfter
- Argument [`TimeFilter`] The events and the time to filter the end date after
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>[]` events in `events` that ended
after `when`.

### `eventSubtotals` `function`
[`eventSubtotals`]: #eventsubtotals-function

For a set of events, construct a table detailing the state of the resources when
the events occurred and the effect they had on that state.  Only resources affected
by the events are shown are traced.

- To [call], POST /events/eventSubtotals
- Argument [`Hash`]`<`[`EconomicEvent`]`>[]` These events will appear as rows
in the table.
- Returns [`Subtotals`] A table showing how the given events have affected their
resources over time.

### `resourceCreationEvent` `function`
[`resourceCreationEvent`]: #resourcecreationevent-function

Creates a resource and an event to account for its existence.

- To [call] POST /events/resourceCreationEvent
- Argument `object`
  - [`EconomicResource`] `resource`: The resource that should be
  created along with the event.
    - `resourceClassifiedAs`: This must
    not be left blank.
    - `currentQuantity`
      - `units`: can be left blank, and the classification's default
      units will be used.
      - `quantity`: must not be 0.
    - `owner`: must not be left blank.
  - (optional) `object` [`times`]: defaults to now.
    - [`Date`] `start`: when the event started
    - (optional) [`Date`] `end`: when the event ended.  Defaults to 1
    ms after it started.
- Returns [`CrudResponse`]`<`[`EconomicEvent`]`>`: The event that has
now created the resource.

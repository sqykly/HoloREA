/**
 * We aren't going to be able to pass real Maps around between zomes and agents.
 * So old-school, morally wrong dictionary objects will have to do.
 */
declare type Dict<T> = {[key: string]: T};

/**
 * Some dicts need both a key type and a value type.
 */
declare type Catalog<K extends string, T> = {[key: string]: T}

/**
 * I believe Location was taken.  Don't need any additional detail for now.
 */
declare type PhysicalLocation = string[];

/**
 * I can write a good bisect of a sorted list in my sleep.  And I think I did,
 * here.  Takes a sorted list of numbers and a number to compare them to, min.
 * It returns an index in that array; all numbers with >= indexes are >= min,
 * all numbers with < indexes are < min.  Runs in log N time, so if you are
 * running filters related to your sort axis, this is going to be better.
 * @param {number[]} array A list of numbers.
 * @param {number} min the index returned is == the index of min, if it exists.
 * @returns {number}
 */
declare function bisect(array: number[], min: number): number;

/**
 * For when you don't know what you want or need to pass between zomes.
 * @interface
 */
declare interface CrudResponse<T extends object> {
  /** @prop {Error} error this error is why you can't have the other fields */
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  /** @prop {Hash<T>} hash the hash of a T; if there is an entry, this is its hash */
  hash?: Hash<T>;
  /** @prop {T} entry this is the T you asked for/gave */
  entry?: T;
  /** @prop {string} type this is the name of T as specified in the DNA. */
  type?: string;
}

/**
 * merges an object, src, into another object, dest.  It's like Object.assign,
 * but it doesn't copy over inner objects.  Instead, it copies properties over,
 * so that the inner object's properties are not all lost.
 * @arg {class} T the type of dest (will be inferred)
 * @arg {class} U the type of src (will be inferred)
 * @param {T} dest This object will receive the fields and inner fields of the
 *  rest of the arguments.
 * @param {U} src This is the first object to have its properties copied to dest
 * @param {object} [...] More objects to copy onto dest, in order.
 * @returns {T & U}
 */
declare function deepAssign<T extends object, U extends object>(dest: T, src: U, ...more: object[]): T & U;

/**
 * For when you're REALLY unsure what you are getting from some other zome.
 * @type
 */
declare type HoloThing<T extends object> = HoloObject<T> | CrudResponse<T> | Hash<T> | T;

declare function isCrud<T extends object>(thing: HoloThing<T>): thing is CrudResponse<T>;

/**
 * Gets the hash of an object, no matter what it is.
 * @arg {interface} T the type of the object you want a hash of.
 * @param {HoloThing<T>} thing You don't really know what this is.
 * @returns {Hash<T>}
 * @throws {Error} if thing really is a T, then it doesn't know its class name,
 *  and without that, it can't be hashed.
 */
declare function hashOf<T extends object>(thing: HoloThing<T>): Hash<T>

/**
 * Get the actual data structure from something related, no matter what it is.
 * @param {HoloThing<T>} thing It has something to do with a T, but you don't
 *  really know what it is because you didn't read the documentation on that
 *  exported zome function or bridge.
 * @returns {T}
 */
declare function entryOf<T extends object>(thing: HoloThing<T>): T;

/**
 * Get a bunch of information related to something, whatever it is.
 * @param {HoloThing<T>} thing - whatever that is.
 * @returns {CrudResponse<T>}
 */
declare function responseOf<T extends object>(thing: HoloThing<T>): CrudResponse<T>;

/**
 * This is for type safety when you need assurance that get(Hash) will return the correct type.
 * But I don't think it's working; it all comes out strings.
 */
declare type Hash<T> = holochain.Hash;

declare type HoloClass<T,U> = (new (o:U, h:Hash<T>) => T) &
  {
    create: (o:U) => T,
    get: (h:Hash<T>) => T,
    className: string,
    entryType: U
  };

/**
 * It's just as good as a QuantityValue as far as a real QV knows, and it can
 * cross zomes or machines, but you can't do math on it by itself.
 */
declare interface QVlike {units: string, quantity: number};

/**
 * A pretty robust implementation of QuantityValue that will some day enable
 * unit conversions and derived units (e.g. Newtons = kg*m^2*s^2)
 * some of the hard work is done, but clearly not all of it.
 */
declare class QuantityValue implements QVlike {
  /**
   * There are two special values of units: "" is like "Each", and "%" is a unitless percentage
   * "" only comes into play when multiplying and dividing
   * "%" can be used to add/subtract/multiply/divide in proportion to what is already there
   */
  units: string;
  quantity: number;
  /**
   * Construct a QV from a POO QVlike.
   * @param {string} units
   */
  constructor({units, quantity}: QVlike);

  /**
   * Check unit compatibility and return the sum of two QVs
   * if a % is added (not to a %) the addition is relative to the original quantity
   */
  add({units, quantity}: QVlike): QuantityValue;

  /**
   * Return a QV that is the product of this and another QV, complete with derived
   * units if necessary.  Multiplying by a % or unitless quantity will return
   * a QV with the same units.  Multiplying by the inverse units will return
   * a unitless ratio.
   */
  mul({units, quantity}: QVlike): QuantityValue;

  /**
   * Returns the difference between this and another QV.  If a % is given, the
   * subtraction will be proportional to the original value.  Otherwise, the
   * units must match.
   */
  sub({units, quantity}: QVlike): QuantityValue;

  /**
   * Returns the quotient of two this and another QV, deriving units if needed.
   * Unitless or % units will be treated as ratios and the output unit will be
   * the same as the input.
   */
  div({units, quantity}: QVlike): QuantityValue;

  isCount(): boolean;
}

/**
 * Either throw the error or return the desired result.  The type parameter
 * should usually be inferred from the argument, which will have better warnings
 * downstream.
 */
declare function notError<T>(maybeErr: holochain.CanError<T>): T;

/**
 * The hash you get when commiting a holochain.LinksEntry
 */
declare type LinkHash = Hash<holochain.LinksEntry>

/**
 * Tool for getting what you need from linkRepo.get() and preserving Hash types
 * and iterating with for...of
 * The type parameter is the type of the Link elements
 * It provides filter methods (tags, types, sources) to narrow your results,
 * and the output will be another LinkSet.
 * Get an array of entries (data()) or hashes (hashes())
 * It wants to be a Set, but targetting compilation to ES5 will only allow
 * arrays to be for..of'ed
 *
 */
declare class LinkSet<B, L, Tags extends string = string, T = B> extends Array<holochain.GetLinksResponse> {

  constructor(array: Array<holochain.GetLinksResponse>, private origin: LinkRepo<B,L,Tags>, private baseHash: string, private onlyTag?: string);
  /**
   * Filter by any number of tags.  Returns a new LinkSet of the same type.
   * @param {string[]} narrowing An array of the tag names wanted.
   */
  tags(...narrowing: string[]): LinkSet<B, L, Tags, T>;

  /**
   * Filter by any number of entryTypes, which you should probably get from HoloObj.className
   * returns a new LinkSet.
   * if you like typesafety, use the type parameter to narrow the types, too.
   * @arg C Type or union of types that the result should contain.  These are classes, not names.
   * @params {string} typeNames is the list of types that the result should have.
   *  these are the type names, not the classes.
   * @returns {LinkSet<C>}
   */
  types<C = T>(...typeNames: string[]): LinkSet<B,L,Tags,C>;

  /**
   * Returns an array of Hashes from the LinkSet, typed appropriately
   */
  hashes(): Hash<T>[];

  /**
   * Returns the entries in the LinkSet as a typesafe array.
   */
  data(): T[];

  /**
   * Filters by source.
   */
  sources(...allowed: holochain.Hash[]): LinkSet<B,L,Tags,T>;

  removeAll(): void;
}

interface Tag<B,L, T extends string> {
  tag: T,
  repo: LinkRepo<B,L,T>
}

/**
 * LinkRepo encapsulates all kinds of links.  I name them like NormalClasses when they
 * are encapsulating a whole entry type.  Used for keeping track of reciprocal
 * links, managing DHT interactions that are otherwise nuanced, producing
 * LinkSet objects, maintaining type-safe Hash types, and defending against
 * recursive reciprocal links.
 * @arg B: object extends HoloObject.  The union of types that can be the Base of the Links
 * @arg L: object extends HoloObject.  The union of types that can be the Link of the Links
 *  If there are reciprocal links within this LinkRepo, it's safest for B and L
 *  to be identical.
 * @arg T: any extends string.  This is a union of the tag strings used in this repo.
 *  If you don't want to know when you put the wrong tag in the wrong Repo, go
 *  ahead and let it default to string.  Do not use tags that include the pipe
 *  character, '|'
 */
declare class LinkRepo<B, L, T extends string = string> {
  /**
   * @param {string} name the exact dna.zomes[].Entries.Name that this repo will
   *  represent.
   */
  constructor (protected name: string) {}
  readonly BASE: B;
  readonly LINK: L;
  readonly TAGS: T;

  tag<Ts extends T>(t: Ts): Tag<B, L, T>;
  /**
   * Produce a LinkSet including all parameter-specified queries.
   * @param {Hash<B>} base this is the Base entry  whose outward links will
   *  be recovered.
   * @param {string} tag this is the tag or tags you want to filter by.
   *  If given an empty string or omitted, all links in this repo are retrieved.
   *  To allow multiple tags to be returned, put them in this string separated
   *  by the pipe character ('|')
   * @param {holochain.LinksOptions} options options that will be passed to getLinks
   *  Be aware that the LinkSet will NOT know about these.  Defaults to the default
   *  LinksOptions.
   * @returns {LinkSet<B>} containing the query result.
   */
  get(base: Hash<B>, tag: string = ``, options: holochain.LinksOptions = {}): LinkSet<B,L,T,B>;

  /**
   * Commits a new link to the DHT.
   * @param {Hash<B>} base the base of the link.  This is the object you can query by.
   * @param {Hash<L>} link the linked object of the link.  This is the object you
   *  CAN'T query by, which is the object of the tag.
   * @param {T} tag the tag for the link, of which base is the object.
   * @param {LinkRepo<L, B>?} backRepo optional repo that will contain a reciprocal
   *  link.  Any reciprocals already registered via linkBack() are already covered;
   *  Use that method instead when possible.
   * @param {string?} backTag optional but mandatory if backRepo is specified.
   *  this is the tag used for the reciprocal link in addition to those already
   *  entered into the repo; there is no need to repeat this information if
   *  the reciprocal has been entered already via linkBack
   * @returns {LinkHash} a hash of the link, but that's pretty useless, so I'll probably end up changing
   *  it to be chainable.
   */
  put(base: Hash<B>, link: Hash<L>, tag: T, backRepo?: LinkRepo<L, B>, backTag?: string): this;

  /**
   * Adds a reciprocal to a tag that, when put(), will trigger an additional
   * put() from the linked object from the base object.
   * @param {T} tag the tag that will trigger the reciprocal to be put().
   * @param {LinkRepo<L,B,string>} repo The repo that will contain the reciprocal.
   * @param {string} backTag the tag that will be used for the reciprocal link.
   * @returns {ThisType}
   */
  linkBack(tag: T, backTag?: T|string, repo?: LinkRepo<L, B, string>): this;
  // box example:
  // B -contains A: for N insideOf B { N -nextTo A; A -nextTo N }
  // TODO: repo should default to this, right?
  predicate<T2 extends string = T, T3 extends string = T>(
    triggerTag: T,
    query: { tag: T2, repo: LinkRepo<L|B, B|L, T2|T> },
    dependent: { tag: T3, repo: LinkRepo<L|B, B|L, T3|T> }
  ): this;

  singular(tag: T): this;

  /**
   * Gets the hash that a link would have if it existed.  Good to know if you use
   * update() and remove()
   * @param {Hash<B>} base the subject of the hypothetical link.
   * @param {Hash<L>} link the object of the hypothetical link.
   * @param {T} tag the tag of the hypothetical link.
   * @returns {LinkHash} if the list does or will exist, this is the hash it
   *  would have.
   */
  getHash(base: Hash<B>, link: Hash<L>, tag: T): LinkHash;

  // FIXME this looks pretty gnarly
  /**
   * Remove the link with the specified base, link, and tag.  Reciprocal links
   * entered by linkBack() will also be removed.
   * @param {Hash<B>} base the base of the link to remove.
   * @param {Hash<L>} link the base of the link to remove.
   * @param {T} tag the tag of the link to remove
   * @returns {LinkHash} but not really useful.  Expect to change.
   */
  remove(base: Hash<B>, link: Hash<L>, tag: T): this;

  /**
   * If the old link exists, remove it and replace it with the new link.  If
   * the old link doesn't exist, put() the new one.  As always, reciprocal links
   * are managed with no additional work.  Note that both arguments are the
   * holochain.Links type, complete with CamelCaseNames.
   * @param {holochain.Link} old The link to be replaced.
   * @param {holochain.Link} update The link to replace it with.
   * @returns {LinkHash} A hash that you can't use for much.  Expect to change.
   */
  replace(old: holochain.Link, update: holochain.Link): this;
}


interface Named {
  className: string;
}


/**
 * Abstraction to manage the relationship between the DHT, entry types, and the
 * feature-rich classes that enhance them with methods.
 * This is, unfortunately, a bit of work to subclass, but without it there is
 * no hope of easily classing up your json-type entries.
 * First, distinguish between the class that extends this one and the data actually
 * stored in the DHT.  Entries are purely POD structs, classes can have methods
 * to enrich their utility and future-proofness.  The entry type itself is one
 * that matches the EntryType.json schema and is given by the tE type parameter.
 * All subclasses need a type parameter as well to preserve that capability.
 * Overriding certain properties is also very important.
 * @see HoloObject.className
 * @see className
 * @see HoloObject.entryType
 * @arg tE this is the type of the POD structs that the DHT knows about.  I find
 *  it easier to declare an interface since you will need to repeat it several
 *  times.  When you extend the class, it is VITAL that the inheritor specifies
 *  the entry type in the extends clause.
 * @example class MyHoloObject<T> extends HoloObject<MyEntryType>
 * @example class LayeredSubclass<T> extends SubclassOfHoloObject<MyEntryType>
 */
declare class HoloObject<tE extends Object = {}> implements Named {
  /**
   * You must delcare an override of static className to reflect the name of the entry type
   * as listed in the DNA.  Yes, both static and instance className.
   * @static
   * @type {string}
   */
  static className:string;

  /**
   * You must override className to the identical string as the static className,
   * which is the entry type as listed in the DNA.  Yes, both.
   * @type {string}
   */
  className: string;

  /**
   * static entryType must be overriden to be an instance of your entry type or
   * typed as one.
   * Unfortunately it is not possible to include a type parameter, so the static
   * version will always be missing the entry type parameter you gave.  Merge it
   * with the superclass's entryType with an & expression.  See example.
   * @static
   * @abstract
   * @example static entryType: typeof Superclass.entryType & MyEntryType
   */
  static entryType: holochain.JsonEntry;

  /**
   * These are the default values that will be assigned to the entry of
   */
  static entryDefaults: holochain.JsonEntry;

  static create(entryProps?: typeof HoloObject.entryType): HoloObject;

  /**
   * Returns the POD struct that is stored in the DHT. Modifying the object
   * will have no effect.
   * @returns {tE & typeof Superclass.entryType} the entry
   */
  get entry(): typeof HoloObject.entryType & tE;

  /**
   * Use ThisClass.get() to fetch data that exists on the DHT and construct a
   * class instance based on it.
   * @override if you need to prepare instance properties from the entry data,
   *  or to provide better type safety; it is recommended to get the types right,
   *  even if the body is just returns super.get(hash);  it is truly impossible
   *  to do this in a DRY way.
   * @static
   * @param {Hash<this>} hash the hash of the entry on the DHT
   * @returns {this} an instance of this class
   */
  static get(hash: Hash<object>): HoloObject<object>;

  /**
   * Public accessor to get the hash of the entry.
   * @throws {holochain.HolochainError} if the entry is not loaded or created
   *  AND it doesn't exist on the DHT.
   * @returns {Hash<this>} the hash.
   */
  get hash(): Hash<this>;

  /**
   * constructs a HoloObject that has the given entry and hash.
   * @param {tE|null} entry the entry that will be represented by this instance.
   *  Use null if you know the hash.  Do not use both.
   * @param {Hash<object>} hash the hash that you are absolutely sure exists as
   *  this entry type on the DHT.  It can be left out if the entry is given.
   * @constructor
   * @throws {Error} if both entry and hash were given.
   * @throws {Error} if neither entry nor hash are given.
   * @throws {holochain.HolochainError} if making a hash fails when given entry
   * @throws {holochain.HolochainError} if the DHT didn't know about the given hash
   * @throws {TypeError} if the entry doesn't pass the DHT's inspection
   */
  constructor(entry?: tE|null, hash?: Hash<object>);

  /**
   * Retrieve a hypothetical hash of the entry.
   * @returns {Hash<this>} that hypothetically, the entry would have if committed.
   */
  makeHash(): Hash<this>;

  /**
   * Commit the entry to the chain.  If it's already up there, update it.
   * @returns {Hash<this>}
   */
  commit(): Hash<this>;
  /**
   * Checks whether changes were made since the last commit, updates them if they
   * have.  Updates the local hash property as well.
   * @returns {Hash<this>}
   */
  update(): Hash<this>;

  /**
   * Remove the entry from the DHT.  Chainable.  It is possible to screw up your
   * links this way, so override the method to manage those yourself (for now)
   * @param {string} msg The reason the entry is being deleted.  optional.
   * @returns {this}
   */
  remove(msg = ""): this;


  open(mutator: (t: tE) => tE): this;

  close(e: Error, fn?: (t: this) => void): boolean;

  portable(): CrudResponse<tE>;

  /* Experimental (toggle comment by adding/removing slash) */
  /*
  readonly links: LinkDict<tE, this> = {};
  protected updateLinks(values: LinkVals<tE>) {
    let my = this.myEntry,
      hash = this.myHash,
      {links} = this,
      key: string;

    for (key of Object.keys(links)) {
      let link = links[key],
        tag = link.alias || key,
        repo: LinkRepo<this, object> = link.repo,
        old = values[key];
      if (old && old !== my[key]) {
        repo.remove(hash, old, tag).put(hash, values[key], tag);
      }
    }
  }

}

type LinkDict<E, T = E> = {
  [P in keyof E]?:
    (P extends string ?
      (E[P] extends Hash<infer L> ?
        (E[P] extends { alias: infer A } ?
          A extends string ? { alias: A, repo: LinkRepo<T, L, A> } : { repo: LinkRepo<T, L, P> }
        : never)
      : never)
    : never)
};

type LinkVals<E> = {
  [P in keyof E]?:
    P extends string ?
      E[P] extends Hash<infer L> ? Hash<L> : never
    : never
};

/*/
}
/**/

/**
 * VfEntry and VfObject are a base class for entities that have to do with VF.
 * The standard says that there are a few fields that any object could have.
 */
declare interface VfEntry {
  name?: string;
  image?: string;
  note?: string;
  url?: string;
}

/**
 * A base class for all VF entities that enable them to carry the optional
 * properties any VF entity can have.  See docs on HoloObject on how to extend.
 * @see HoloObject
 * @arg T Use this type argument to convey the entry type of a subclass.
 */
declare class VfObject<T extends object = {}> extends HoloObject<VfEntry & typeof HoloObject.entryType & T> {
  static entryType: VfEntry & typeof HoloObject.entryType;
  protected myEntry: VfEntry & typeof HoloObject.entryType & T;
  static className: string = "VfObject";
  className: string = "VfObject";
  static entryDefaults: VfEntry & typeof HoloObject.entryDefaults = {};

  static create(entry: VfEntry & typeof HoloObject.entryType): VfObject;
  static get(hash: Hash<VfObject>): VfObject;
  constructor(entry: T|null, hash?: string);

  get name(): string;
  set name(to: string): void;

  get image(): string;
  set image(to: string): void;

  get note(): string;
  set note(to:string): void;

  get url(): string;
  set url(to:string): void;
}

import "./es6";
import "./holochain-proto";

// FIXME this is only used for testing.  remove when ready to ship
// maybe it will be fine.  fingers crossed.
// /FIXME

/**
 * This is for type safety when you need assurance that get(Hash) will return the correct type.
 */
export declare type Hash<T> = holochain.Hash;

export interface QVlike {units: string, quantity: number};
/**
 * A pretty robust implementation of QuantityValue that will some day enable
 * unit conversions and derived units (e.g. Newtons = kg*m^2*s^2)
 * some of the hard work is done, but clearly not all of it.
 */
export class QuantityValue implements QVlike {
  /**
   * There are two special values of units: "" is like "Each", and "%" is a unitless percentage
   * "" only comes into play when multiplying and dividing
   * "%" can be used to add/subtract/multiply/divide in proportion to what is already there
   */
  units: string;
  quantity: number;

  constructor({units, quantity}: QVlike) {
    this.units = units;
    this.quantity = quantity;
  }

  /**
   * Check unit compatibility and return the sum of two QVs
   * if a % is added (not to a %) the addition is relative to the original quantity
   */
  add({units, quantity}: QVlike): QuantityValue {

    if (units === this.units) {
      return new QuantityValue({units: this.units, quantity: this.quantity + quantity});
    } else if (units === `%`) {
      return this.mul({units: `%`, quantity: 100 + quantity});
    }
    throw new Error(`Can't add quantity in ${units} to quantity in ${this.units}`);
  }

  /**
   * Return a QV that is the product of this and another QV, complete with derived
   * units if necessary.  Multiplying by a % or unitless quantity will return
   * a QV with the same units.  Multiplying by the inverse units will return
   * a unitless ratio.
   */
  mul({units, quantity}: QVlike): QuantityValue {
    if (units === `%`) {
      quantity /= 100;
      units = ``;
    }
    if (units) {
      let decomp = QuantityValue.decomposeUnits(units),
        mine = QuantityValue.decomposeUnits(this.units);
      units = QuantityValue.recomposeUnits(QuantityValue.mulUnits(decomp, mine));
    } else {
      units = this.units;
    }

    return new QuantityValue({units, quantity: quantity*this.quantity});
  }

  /**
   * Returns the difference between this and another QV.  If a % is given, the
   * subtraction will be proportional to the original value.  Otherwise, the
   * units must match.
   */
  sub({units, quantity}: QVlike): QuantityValue {
    if (units === `%`) {
      quantity = 100 - quantity;
      return this.mul({units, quantity});
    } else if (units === this.units) {
      return new QuantityValue({units, quantity: this.quantity - quantity});
    } else {
      throw new Error(`Can't subtract ${units} from ${this.units}`);
    }
  }

  /**
   * Returns the quotient of two this and another QV, deriving units if needed.
   * Unitless or % units will be treated as ratios and the output unit will be
   * the same as the input.
   */
  div({units, quantity}: QVlike): QuantityValue {
    if (units === `%`) {
      units = ``;
      quantity = 100/quantity;
    }
    if (units) {
      units = QuantityValue.recomposeUnits(QuantityValue.mulUnits(
        QuantityValue.invertUnits(QuantityValue.decomposeUnits(units)),
        QuantityValue.decomposeUnits(this.units)
      ));
    } else {
      units = this.units;
    }
    return new QuantityValue({units, quantity: this.quantity/quantity});
  }

  static decomposeUnits(units: string): {[key: string]: number} {
    let decomp: string[] = units.split(`*`),
      dict: {[key: string]: number} = {};

      for (let unit of decomp) {
        let [match, unitName, expo] = /^([^\^]*)(?:\^([^]+))?$/.exec(unit);
        let n: number = parseFloat(expo || "1");

        if (dict.hasOwnProperty(unitName)) {
          n += dict[unitName];
          if (n === 0) {
            delete dict[unitName];
          } else {
            dict[unitName] = n;
          }
        } else {
          dict[unitName] = n;
        }

      }

      return dict;
  }

  static mulUnits(...decomps: {[key: string]: number}[]): {[key: string]: number} {
    let [dict, ...dicts] = decomps;
    dict = Object.assign({}, dict);

    for (let decomp of dicts) {
      for (let unit of Object.keys(decomp)) {
        let n = decomp[unit];

        if (dict.hasOwnProperty(unit)) {
          n += dict[unit];
        }

        if (n === 0) {
          delete dict[unit];
        } else {
          dict[unit] = n;
        }
      }
    }

    return dict;
  }

  static invertUnits(decomp: {[key: string]: number}): {[key: string]: number} {
    let dict: {[key: string]: number} = {};

    for (let unit of Object.keys(decomp)) {
      dict[unit] = -decomp[unit];
    }

    return dict;
  }

  static recomposeUnits(decomp: {[key: string]: number}): string {
    return Object.keys(decomp).map((unit) => {
      let expo = decomp[unit];
      if (expo !== 1) {
        return unit;
      } else {
        return `${unit}^${expo}`;
      }
    }).join(`*`);
  }

  isCount(): boolean {
    return this.units === "";
  }
}

/**
 * Either throw the error or return the desired result.  The type parameter
 * should usually be inferred from the argument, which will have better warnings
 * downstream.
 */
export function notError<T>(maybeErr: holochain.CanError<T>): T {
  if (isError(maybeErr)) {
    throw new Error(`That was an error! ${``+maybeErr}`);
  } else {
    return (<T> maybeErr);
  }
}

/**
 * The hash you get when commiting a holochain.LinksEntry
 */
export type LinkHash = Hash<holochain.LinksEntry>

/**
 * Tool for getting what you need from linkRepo.get() and preserving Hash types
 * and iterating with for...of
 * The type parameter is the type of the Link elements
 * It provides filter methods (tags, types, sources) to narrow your results,
 * and the output will be another LinkSet.
 * Get an array of entries (data()) or hashes (hashes())
 * It wants to be a Set, but targetting compilation to ES5 will only allow
 * arrays to be for..of'ed
 */
export class LinkSet<B, L, Tags extends string = string, T = B> extends Array<holochain.GetLinksResponse> {

  constructor(array: Array<holochain.GetLinksResponse>, private origin: LinkRepo<B,L,Tags>, private baseHash: string) {
    super(...array);
  }
  /**
   * Filter by any number of tags.  Returns a new LinkSet of the same type
   */
  tags(...narrowing: string[]): LinkSet<B, L, Tags, T> {
    let uniques = new Set(narrowing);
    return new LinkSet<B, L, Tags, T>( this.filter( ({Tag}) => uniques.has(Tag) ), this.origin, this.baseHash );
  }

  /**
   * Filter by any number of entryTypes, which you should probably get from HoloObj.className
   * returns a new LinkSet.
   * if you like typesafety, use the type parameter to narrow the types, too.
   */
  types<C = T>(...typeNames: string[]): LinkSet<B,L,Tags,C> {
    let uniques = new Set<string>(typeNames);
    return new LinkSet<B,L,Tags,C>(this.filter( ({EntryType}) => uniques.has(EntryType) ), this.origin, this.baseHash);
  }

  /**
   * Returns an array of Hashes from the LinkSet, typed appropriately
   */
  hashes(): Hash<T>[] {
    return this.map( ({Hash}) => Hash);
  }

  /**
   * Returns the entries in the LinkSet as a typesafe array.
   */
  data(): T[] {
    return this.map( ({Hash}) => <T>notError(get(Hash)));
  }

  /**
   * Filters by source.
   */
  sources(...allowed: holochain.Hash[]): LinkSet<B,L,Tags,T> {
    let uniques = new Set<holochain.Hash>(allowed);
    return new LinkSet<B,L,Tags,T>(this.filter( ({Source}) => uniques.has(Source) ), this.origin, this.baseHash);
  }

  removeAll(): void {
    this.forEach( (link: holochain.GetLinksResponse, index:number) => {
      let target = link.Hash, tag = link.Tag;
      try {
        this.origin.remove(this.baseHash, target, <Tags>tag);
      } catch (e) {
        // don't care, just keep deleting them.
      }
    });
    this.splice(0, this.length);
  }
}

/**
 * LinkRepo encapsulates all kinds of links.  There should be exactly one per
 * Links type Entry in DNA.json.  I name them like NormalClasses because they
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
export class LinkRepo<B, L, T extends string = string> {
  /**
   * @param {string} name the exact dna.zomes[].Entries.Name that this repo will
   *  represent.
   */
  constructor (protected name: string) {}
  protected backLinks = new Map<T, { repo: LinkRepo<L, B, string>, tag: string }[]>();
  protected recurseGuard: Set<T> = new Set<T>();

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
  get(base: Hash<B>, tag: string = ``, options: holochain.LinksOptions = {}): LinkSet<B,L,T,B> {
    if (!tag) {
      return new LinkSet<B,L,T,B>(<holochain.GetLinksResponse[]> notError(getLinks(base, tag, options)), this, base);
    }
    let tags = tag.split(`|`),
      responses: holochain.GetLinksResponse[] = [];

    for (tag of tags) {
      let response = <holochain.GetLinksResponse[]>getLinks(base, tag, options);
      responses = responses.concat(response);
    }

    return new LinkSet<B,L,T,B>(responses, this, base);
  }

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
  put(base: Hash<B>, link: Hash<L>, tag: T, backRepo?: LinkRepo<L, B>, backTag?: string): LinkHash {
    if (this.recurseGuard.has(tag)) return "";

    this.recurseGuard.add(tag);

    const hash = commit(this.name, { Links: [{Base: base, Link: link, Tag: tag}] });

    if (this.backLinks.has(tag)) {
      for (let backLink of this.backLinks.get(tag)) {
        let {repo, tag: revTag} = backLink;
        repo.put(link, base, revTag);
      }
    }
    if (backRepo && backTag) {
      backRepo.put(link, base, backTag);
    }

    this.recurseGuard.delete(tag);
    return notError(hash);
  }

  /**
   * Adds a reciprocal to a tag that, when put(), will trigger an additional
   * put() from the linked object from the base object.
   * @param {T} tag the tag that will trigger the reciprocal to be put().
   * @param {LinkRepo<L,B,string>} repo The repo that will contain the reciprocal.
   * @param {string} backTag the tag that will be used for the reciprocal link.
   *  note that if the forward and backward tags are the same, this probably
   *  will not work due to the overzealous recursion guard.
   */
  linkBack(tag: T, repo: LinkRepo<L, B, string>, backTag: string): this {
    const entry = { repo, tag: backTag };
    if (this.backLinks.has(tag)) {
      let existing = this.backLinks.get(tag);
      existing.push(entry);
    } else {
      this.backLinks.set(tag, [entry]);
    }
    return this;
  }

  private toLinks(base: Hash<B>, link: Hash<L>, tag: T): holochain.LinksEntry {
    return { Links: [{ Base: base, Link: link, Tag: tag }] }
  }

  private unLinks(links: holochain.LinksEntry): {Base: Hash<B>, Link: Hash<L>, Tag: T} {
    let {Base, Link, Tag} = links.Links[0];

    return {Base: <Hash<B>>Base, Link: <Hash<L>>Link, Tag: <T>Tag};
  }

  /**
   * Gets the hash that a link would have if it existed.  Good to know if you use
   * update() and remove()
   * @param {Hash<B>} base the subject of the hypothetical link.
   * @param {Hash<L>} link the object of the hypothetical link.
   * @param {T} tag the tag of the hypothetical link.
   * @returns {LinkHash} if the list does or will exist, this is the hash it
   *  would have.
   */
  getHash(base: Hash<B>, link: Hash<L>, tag: T): LinkHash {
    return notError<LinkHash>(
      makeHash(this.name, this.toLinks(base, link, tag))
    );
  }

  // FIXME this looks pretty gnarly
  /**
   * Remove the link with the specified base, link, and tag.  Reciprocal links
   * entered by linkBack() will also be removed.
   * @param {Hash<B>} base the base of the link to remove.
   * @param {Hash<L>} link the base of the link to remove.
   * @param {T} tag the tag of the link to remove
   * @returns {LinkHash} but not really useful.  Expect to change.
   */
  remove(base: Hash<B>, link: Hash<L>, tag: T): LinkHash {
    let presentLink = this.toLinks(base, link, tag);
    let hash = notError<LinkHash>(makeHash(this.name, presentLink));

    if (this.recurseGuard.has(tag)) {
      return hash;
    }

    if (get(hash) === HC.HashNotFound) return hash;

    presentLink.Links[0].LinkAction = HC.LinkAction.Del;
    hash = notError<LinkHash>(commit(this.name, presentLink));

    this.recurseGuard.add(tag);

    if (this.backLinks.has(tag)) {
      for (let {repo, tag: backTag} of this.backLinks.get(tag)) {
        repo.remove(link, base, backTag);
      }
    }

    this.recurseGuard.delete(tag);
    return hash;
  }

  /**
   * If the old link exists, remove it and replace it with the new link.  If
   * the old link doesn't exist, put() the new one.  As always, reciprocal links
   * are managed with no additional work.  Note that both arguments are the
   * holochain.Links type, complete with CamelCaseNames.
   * @param {holochain.Link} old The link to be replaced.
   * @param {holochain.Link} update The link to replace it with.
   * @returns {LinkHash} A hash that you can't use for much.  Expect to change.
   */
  replace(old: holochain.Link, update: holochain.Link): LinkHash {
    let oldHash = this.getHash(old.Base, old.Link, <T>old.Tag);
    if (get(oldHash) === HC.HashNotFound) {
      return this.put(update.Base, update.Link, <T>update.Tag)
    }

    this.remove(old.Base, old.Link, <T>old.Tag);
    return this.put(update.Base, update.Link, <T>update.Tag);
  }
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
export class HoloObject<tE extends Object = {}> implements Named {
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

  private isCommitted: boolean = false;
  private hasChanged(): boolean {
    if (this.myHash) {
      return this.myHash === this.makeHash();
    } else {
      return true;
    }
  }
  /**
   * static entryType must be overriden to be an instance of your entry type or
   * typed as one.
   * Unfortunately it is not possible to include a type parameter, so the static
   * version will always be missing the entry type parameter you gave.  Merge it
   * with the superclass's entryType with an & expression.  See example.
   * @static
   * @protected
   * @example static entryType: typeof Superclass.entryType & MyEntryType
   */
  static entryType: {};

  static entryDefaults: object = {};

  static create(entryProps?: object): HoloObject {
    let entry = {};
    Object.assign(entry, this.entryDefaults);
    if (entryProps) Object.assign(entry, entryProps);
    return new this(entry);
  }

  /**
   * If you extended correctly, your subclass entry type should already be there
   * and your own T as well.  Theoretically you can skip overriding this.
   * @example protected myEntry: T & MyEntryType & typeof Superclass.entryType
   * @protected
   */
  protected myEntry: tE;

  /**
   * myHash stores the hash of your entry.  Protected for tamper-proofing.
   * @protected
   */
  protected myHash: Hash<this>;

  /**
   * Returns the POD struct that is stored in the DHT. Do NOT modify any properties.
   * this maybe shouldn't exist at all.
   * @returns {tE & typeof Superclass.entryType} the entry
   */
  get entry(): typeof HoloObject.entryType & tE {
    return this.myEntry;
  }

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
  static get(hash: Hash<object>): HoloObject<object> {
    let obj = new this(null, hash);
    return obj;
  }

  /**
   * Public accessor to get the hash of the entry.
   * @throws {holochain.HolochainError} if the entry is not loaded or created
   *  AND it doesn't exist on the DHT.
   * @returns {Hash<this>} the hash.
   */
  get hash(): Hash<this> {
    if (this.myHash) return this.myHash;
    let hash = makeHash(this.className, this.myEntry);
    if (isError(hash)) {
      throw new TypeError(`entry type mismatch`);
    } else {
      return <Hash<this>>notError(hash);
    }
  }

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
  constructor(entry?: tE|null, hash?: Hash<object>) {
    if (entry && hash) throw new Error(`can't use both entry & hash arguments`);
    if (!entry && !hash) throw new Error(`use either entry or hash arguments; can't use both or none`)

    if (entry) {
      this.myEntry = entry;

    } else {
      this.myEntry = <tE>notError(get(hash));
      this.isCommitted = true;
      this.myHash = hash;
    }

  }

  /**
   * Retrieve a hypothetical hash of the entry.
   * @returns {Hash<this>} that hypothetically, the entry would have if committed.
   */
  makeHash(): Hash<this> {
    return notError<Hash<this>>(makeHash(this.className, this.entry));
  }

  /**
   * Commit the entry to the chain.  If it's already up there, update it.
   * @returns {Hash<this>}
   */
  commit(): Hash<this> {
    if (this.isCommitted) {
      return this.update();
    } else {
      let hash = commit(this.className, <holochain.JsonEntry>this.myEntry);
      if (isError(hash)) {
        throw new TypeError(`entry type mismatch; hash ${this.myHash} is not a ${this.className}`);
      } else {
        this.isCommitted = true;
        return hash;
      }
    }
  }

  /**
   * Checks whether changes were made since the last commit, updates them if they
   * have.  Updates the local hash property as well.
   * @returns {Hash<this>}
   */
  update(): Hash<this> {
    if (!this.isCommitted) {
      return this.commit();
    }
    if (this.hasChanged()) {
      return this.myHash = notError<Hash<this>>(update(this.className, this.entry, this.myHash));
    } else {
      return this.myHash;
    }
  }

  /**
   * Remove the entry from the DHT.  Chainable.  It is possible to screw up your
   * links this way, so override the method to manage those yourself (for now)
   * @param {string} msg The reason the entry is being deleted.  optional.
   * @returns {this}
   */
  remove(msg = ""): this {
    if (!!this.myHash && this.isCommitted) {
      remove(this.myHash, msg);
      return this;
    }
    return this;
  }
}

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
export class VfObject<T = {}> extends HoloObject<VfEntry & typeof HoloObject.entryType & T> {
  static entryType: VfEntry & typeof HoloObject.entryType;
  protected myEntry: VfEntry & typeof HoloObject.entryType & T;
  static className = "VfObject";
  className: string = "VfObject";
  static entryDefaults: VfEntry & typeof HoloObject.entryDefaults = {};

  static get(hash: Hash<VfObject>): VfObject {
    return <VfObject>super.get(hash);
  }

  constructor(entry: T|null, hash?: string) {
    super(entry, hash);
  }

}

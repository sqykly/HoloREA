// <reference path="./es6.d.ts"/>
// <reference path="./holochain-proto.d.ts"/>
/* IMPORT
import "./es6";
import "./holochain-proto";

/*/
/**/

/**
 * We aren't going to be able to pass real Maps around between zomes and agents.
 * So old-school, morally wrong dictionary objects will have to do.
 */
/* EXPORT
export/**/type Dict<T> = {[key: string]: T};

/**
 * Some dicts need both a key type and a value type.
 */
/* EXPORT
export /**/type Catalog<K extends string, T> = {[key: string]: T}

/**
 * I believe Location was taken.  Don't need any additional detail for now.
 */
/* EXPORT
export /**/type PhysicalLocation = string[];

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
/* EXPORT
export /**/function bisect(array: number[], min: number): number {
  let b = 0, t = array.length;
  while (t > b) {
    let i = (t + b) >> 1,
      v = array[i];
    if (v < min) {
      b = i;
    } else if (v > min) {
      t = i;
    } else {
      return i;
    }
  }
  return t;
}

/**
 * For when you don't know what you want or need to pass between zomes.
 * @interface
 */
/* EXPORT
export /**/interface CrudResponse<T extends object> {
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
/* EXPORT
export /**/function deepAssign<T extends object, U extends object>(dest: T, src: U, ...more: object[]): T & U {
  for (let p of Object.keys(src)) {
    let v: U[keyof U];
    if (typeof src[p] == `object`) {
      v = deepAssign(dest[p] || {}, src[p]);
    } else {
      v = src[p];
    }
    dest[p] = v;
  }

  if (more.length) {
    let [u, ...rest] = more;
    return deepAssign(<T&U>dest, u, ...rest);
  } else {
    return <T&U>dest;
  }
}

/**
 * For when you're REALLY unsure what you are getting from some other zome.
 * @type
 */
/* EXPORT
export /**/type HoloThing<T extends object> = HoloObject<T> | CrudResponse<T> | Hash<T> | T;

function isCrud<T extends object>(thing: HoloThing<T>): thing is CrudResponse<T> {
  if (typeof thing !== `object`) return false;
  let resp = <CrudResponse<T>>thing;
  return (
    typeof resp.hash == `string` &&
    (typeof resp.entry == `object` || typeof resp.type == `string`)
  ) || (
    typeof resp.entry == `object` && typeof resp.type == `string`
  );
}

/**
 * Gets the hash of an object, no matter what it is.
 * @arg {interface} T the type of the object you want a hash of.
 * @param {HoloThing<T>} thing You don't really know what this is.
 * @returns {Hash<T>}
 * @throws {Error} if thing really is a T, then it doesn't know its class name,
 *  and without that, it can't be hashed.
 */
/* EXPORT
export /**/function hashOf<T extends object>(thing: HoloThing<T>): Hash<T> {
  if (typeof thing == `string`) {
    return thing;
  } else if (thing instanceof HoloObject) {
    return thing.hash;
  } else if (isCrud(thing)) {
    if (!thing.hash) {
      thing.hash = notError(makeHash(thing.type, thing.entry));
    }
    return thing.hash;
  } else {
    throw new Error(`hashOf can't hash ${thing} without a typename`);
  }
}

/**
 * Get the actual data structure from something related, no matter what it is.
 * @param {HoloThing<T>} thing It has something to do with a T, but you don't
 *  really know what it is because you didn't read the documentation on that
 *  exported zome function or bridge.
 * @returns {T}
 */
/* EXPORT
export /**/function entryOf<T extends object>(thing: HoloThing<T>): T {
  if (typeof thing == `string`) {
    let got: holochain.CanError<T> = get(thing);
    return isError(got) ? null : got;
  } else if (thing instanceof HoloObject) {
    return thing.entry;
  } else if (isCrud(thing)) {
    if (!thing.entry) {
      let entry = get(thing.hash);
      if (!isError(entry)) thing.entry = entry;
    }
    return thing.entry;
  } else {
    return thing;
  }
}

/**
 * Get a bunch of information related to something, whatever it is.
 * @param {HoloThing<T>} thing - whatever that is.
 * @returns {CrudResponse<T>}
 */
/* EXPORT
export /**/function responseOf<T extends object>(thing: HoloThing<T>): CrudResponse<T> {
  const response: CrudResponse<T> = { error: null, hash: null, entry: null }
  try {
    let hash = response.hash = hashOf(thing);
    let entry = response.entry = entryOf(thing);
  } catch (e) {
    response.error = e;
  }
  return response;
}

/**
 * This is for type safety when you need assurance that get(Hash) will return the correct type.
 * But I don't think it's working; it all comes out strings.
 */
/* EXPORT
export /**/declare type Hash<T> = holochain.Hash;

/* EXPORT
export /**/type HoloClass<T,U> = (new (o:U, h:Hash<T>) => T) &
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
/* EXPORT
export /**/interface QVlike {units: string, quantity: number};

/**
 * A pretty robust implementation of QuantityValue that will some day enable
 * unit conversions and derived units (e.g. Newtons = kg*m^2*s^2)
 * some of the hard work is done, but clearly not all of it.
 */
/* EXPORT
export /**/class QuantityValue implements QVlike {
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
/* EXPORT
export /**/function notError<T>(maybeErr: holochain.CanError<T>): T {
  if (isError(maybeErr)) {
    throw new Error(`That was an error! ${``+maybeErr}`);
  } else {
    return (<T> maybeErr);
  }
}

/**
 * The hash you get when commiting a holochain.LinksEntry
 */
/* EXPORT
export /**/type LinkHash = Hash<holochain.LinksEntry>

/* EXPORT
export/**/interface LinkReplacement<T, Tags> {
  hash: Hash<T>;
  tag: Tags;
  type: string;
}

/* EXPORT
export/**/interface LinkReplace<T, Tags> extends LinkReplacement<T, Tags> {
  readonly entry: T;
}

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
/* EXPORT
export /**/class LinkSet<B, L, Tags extends string = string, T extends L = L> extends Array<holochain.GetLinksResponse> {

  constructor(array: Array<holochain.GetLinksResponse>, private origin: LinkRepo<B,L,Tags>, private baseHash: string, private onlyTag?: string) {
    super(...array);
    if (onlyTag) {
      this.forEach((item: holochain.GetLinksResponse) => {
        item.Tag = onlyTag;
      });
    }
  }
  /**
   * Filter by any number of tags.  Returns a new LinkSet of the same type.
   * @param {string[]} narrowing An array of the tag names wanted.
   */
  tags<Tx extends T>(...narrowing: string[]): LinkSet<B, L, Tags, Tx> {
    let uniques = new Set(narrowing);
    return new LinkSet<B, L, Tags, Tx>( this.filter( ({Tag}) => uniques.has(Tag) ), this.origin, this.baseHash );
  }

  /**
   * Filter by any number of entryTypes, which you should probably get from HoloObj.className
   * returns a new LinkSet.
   * if you like typesafety, use the type parameter to narrow the types, too.
   * @arg C Type or union of types that the result should contain.  These are classes, not names.
   * @params {string} typeNames is the list of types that the result should have.
   *  these are the type names, not the classes.
   * @returns {LinkSet<C>}
   * @deprecated
   * FIXME.  Super deprecated.
   */
  types<C extends T = T>(...typeNames: string[]): LinkSet<B,L,Tags,C> {
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

  /**
   * Filters and replaces elements of the set.  Provide a function that accepts
   * a LinkReplace ({hash, tag, type, entry}) and returns a LinkReplacement
   * ({hash, tag, type}).  Return undefined or the unmodified argument to leave
   * the link alone.  Return null to have the link deleted, both from the set
   * and the DHT.  Return false to remove the link from the set without deleting
   * on the DHT.  Otherwise, return the new {hash, tag, type}.
   * @returns {this}
   */
  replace(fn: (obj: LinkReplace<T, Tags>) => LinkReplacement<T, Tags>|false): this {
    const {length, origin} = this;
    const removals: number[] = [];

    for (let i = 0; i < length; i++) {
      const {EntryType: type} = this[i];
      let hash = <Hash<T>>this[i].Hash;
      let tag = <Tags>this[i].Tag;

      let entry = get(hash);

      if (!isError(entry)) {
        let rep = fn({hash, tag, type, entry});
        if (rep === null) {
          origin.remove(this.baseHash, hash, tag);
          removals.push(i);
        } else if (rep === false) {
          removals.push(i);
        } else if (rep && (tag !== rep.tag || hash !== rep.hash)) {
          if (hash === rep.hash && type !== rep.type) {
            throw new TypeError(`can't link to ${type} ${hash} as type ${rep.type}`);
          }
          origin.remove(this.baseHash, hash, tag);
          tag = rep.tag;
          hash = rep.hash;
          origin.put(this.baseHash, hash, tag);
          this[i] = {
            EntryType: rep.type,
            Tag: tag,
            Hash: hash
          };
        }
      } else {
        removals.push(i);
      }
    }

    for (let i of removals) {
      this.splice(i, 1);
    }

    return this;
  }

  /**
   * Go through the set link by link, accepting or rejecting them for a new
   * LinkSet as you go.  The callback should accept a {type, entry, hash, tag}
   * and return a boolean.
   */
  select(fn: (lr: LinkReplace<T, Tags>) => boolean): LinkSet<B, L, Tags, T> {
    let chosen = new LinkSet<B, L, Tags, T>([], this.origin, this.baseHash);

    for (let response of this) {
      let {EntryType: type, Hash: hash} = response;
      let tag = <Tags> response.Tag;
      let entry = <T>notError(get(hash));
      if (fn({type, entry, hash, tag})) chosen.push(response);
    }

    return chosen;
  }
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
/* EXPORT
export /**/class LinkRepo<B, L, T extends string = string> {
  /**
   * @param {string} name the exact dna.zomes[].Entries.Name that this repo will
   *  represent.
   */
  constructor (protected name: string) {}

  protected backLinks = new Map<T, Tag<L|B,B|L, T|string>[]>();
  protected recurseGuard = new Map<T, number>();
  protected selfLinks = new Map<T, T[]>();
  protected predicates = new Map<
    T,
    { query: Tag<L|B, B|L, T|string>, dependent: Tag<L|B, B|L, T|string> }[]
  >();
  protected exclusive = new Set<T>();
  readonly BASE: B;
  readonly LINK: L;
  readonly TAGS: T;

  tag<Ts extends T>(t: Ts): Tag<B, L, T> {
    return { tag: t, repo: this };
  }
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
  get<RT extends L = L>(base: Hash<B>, tag: string = ``, options: holochain.LinksOptions = {}): LinkSet<B,L,T,RT> {
    if (!tag) {
      return new LinkSet<B,L,T,RT>(<holochain.GetLinksResponse[]> notError(getLinks(base, tag, options)), this, base);
    }
    let tags = tag.split(`|`),
      responses: holochain.GetLinksResponse[] = [];

    for (tag of tags) {
      let response = <holochain.GetLinksResponse[]>getLinks(base, tag, options);
      responses = responses.concat(response);
    }

    return new LinkSet<B,L,T,RT>(responses, this, base);
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
  put(base: Hash<B>, link: Hash<L>, tag: T, backRepo?: LinkRepo<L, B>, backTag?: string): this {
    const rg = this.recurseGuard;
    let rgv = rg.get(tag);

    if (!rgv--) return this;

    rg.set(tag, rgv);

    if (this.exclusive.has(tag)) {
      this.get(base, tag).removeAll();
    }

    if (this.predicates.has(tag)) {
      this.addPredicate(tag, base, link);
    }

    const hash = commit(this.name, { Links: [{Base: base, Link: link, Tag: tag}] });


    if (this.backLinks.has(tag)) {
      for (let backLink of this.backLinks.get(tag)) {
        let {repo, tag: revTag} = backLink;
        repo.put(link, base, revTag);
      }
    }
    if (this.selfLinks.has(tag)) {
      for (let revTag of this.selfLinks.get(tag)) {
        this.put(link, base, revTag);
      }
    }
    if (backRepo && backTag) {
      backRepo.put(link, base, backTag);
    }

    rg.set(tag, ++rgv);
    return this;
  }

  /**
   * Adds a reciprocal to a tag that, when put(), will trigger an additional
   * put() from the linked object from the base object.
   * @param {T} tag the tag that will trigger the reciprocal to be put().
   * @param {LinkRepo<L,B,string>} repo The repo that will contain the reciprocal.
   * @param {string} backTag the tag that will be used for the reciprocal link.
   * @returns {ThisType}
   */
  linkBack(tag: T, backTag?: T|string, repo?: LinkRepo<L, B, string>): this {
    backTag = backTag || tag;
    if (!repo) {
      return this.internalLinkback(tag, <T>backTag);
    }
    const entry = { repo, tag: backTag };
    if (this.backLinks.has(tag)) {
      let existing = this.backLinks.get(tag);
      existing.push(entry);
    } else {
      this.backLinks.set(tag, [entry]);
    }
    this.recurseGuard.set(tag, 1);
    return this;
  }
  // box example:
  // B -contains A: for N insideOf B { N -nextTo A; A -nextTo N }
  // TODO: repo should default to this, right?
  predicate<T2 extends string = T, T3 extends string = T>(
    triggerTag: T,
    query: { tag: T2, repo: LinkRepo<L|B, B|L, T2|T> },
    dependent: { tag: T3, repo: LinkRepo<L|B, B|L, T3|T> }
  ): this {
    let {predicates} = this;
    if (!query.repo) query.repo = this;
    if (!dependent.repo) dependent.repo = this;

    if (predicates.has(triggerTag)) {
      predicates.get(triggerTag).push({query, dependent});
    } else {
      predicates.set(triggerTag, [{query, dependent}]);
    }

    return this;
  }

  singular(tag: T): this {
    this.exclusive.add(tag);
    return this;
  }

  private addPredicate(trigger: T, subj: Hash<B>, obj: Hash<L>) {
    const triggered = this.predicates.get(trigger);

    for (let {query, dependent} of triggered) {
      let queried = query.repo.get(subj, query.tag).hashes();
      for (let q of queried) {
        dependent.repo.put(q, obj, dependent.tag);
      }
    }
  }

  private removePredicate(trigger: T, subj: Hash<B>, obj: Hash<L>) {
    const triggered = this.predicates.get(trigger);

    for (let {query, dependent} of triggered) {
      let queried = query.repo.get(subj, query.tag).hashes();
      for (let q of queried) {
        dependent.repo.remove(q, obj, dependent.tag);
      }
    }
  }

  private internalLinkback(fwd: T, back: T): this {
    const mutual = fwd === back;
    if (this.selfLinks.has(fwd)) {
      this.selfLinks.get(fwd).push(back);
    } else {
      this.selfLinks.set(fwd, [back]);
    }
    if (mutual) {
      this.recurseGuard.set(fwd, 2);
    } else {
      this.recurseGuard.set(fwd, 1).set(back, 1);
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
  remove(base: Hash<B>, link: Hash<L>, tag: T): this {
    let presentLink = this.toLinks(base, link, tag);
    let hash = notError<LinkHash>(makeHash(this.name, presentLink));

    const rg = this.recurseGuard;
    let rgv = rg.get(tag);
    if (!rgv--) {
      return this;
    }

    if (get(hash) === HC.HashNotFound) return this;

    presentLink.Links[0].LinkAction = HC.LinkAction.Del;
    hash = notError<LinkHash>(commit(this.name, presentLink));

    rg.set(tag, rgv);

    if (this.backLinks.has(tag)) {
      for (let {repo, tag: backTag} of this.backLinks.get(tag)) {
        repo.remove(link, base, backTag);
      }
    }
    if (this.selfLinks.has(tag)) {
      for (let back of this.selfLinks.get(tag)) {
        this.remove(link, base, back);
      }
    }
    if (this.predicates.has(tag)) {
      this.removePredicate(tag, base, link);
    }

    rg.set(tag, ++rgv);
    return this;
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
  replace(old: holochain.Link, update: holochain.Link): this {
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
/* EXPORT
export /**/class HoloObject<tE extends Object = {}> implements Named {
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

  private openCount: number = 0;
  private openError: Error = null;
  private isCommitted: boolean = false;

  protected hasChanged(): boolean {
    if (this.myHash) {
      return this.myHash === this.makeHash();
    } else {
      return true;
    }
  }
  protected commited(): boolean {
    return this.isCommitted;
  }

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
  static entryDefaults: holochain.JsonEntry = {};

  static create(entryProps?: typeof HoloObject.entryType): HoloObject {
    let entry: typeof entryProps = {};
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
  protected myEntry: tE & holochain.JsonEntry;

  /**
   * myHash stores the hash of your entry.  Protected for tamper-proofing.
   * @protected
   */
  protected myHash: Hash<this>;

  /**
   * Returns the POD struct that is stored in the DHT. Modifying the object
   * will have no effect.
   * @returns {tE & typeof Superclass.entryType} the entry
   */
  get entry(): typeof HoloObject.entryType & tE {
    return Object.assign({}, this.myEntry);
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
  protected constructor(entry?: tE|null, hash?: Hash<object>) {
    if (!entry == !hash) throw new Error(`use either entry or hash arguments; can't use both or none`)

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
        throw new TypeError(`entry type mismatch or invalid data; hash ${this.myHash} is not a ${this.className}`);
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
    if (!!this.openCount) return this.myHash;
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

  open(mutator: (t: tE) => tE): this {
    ++this.openCount;
    let mutant: tE = Object.assign({}, this.myEntry),
      error: Error = null;
    try {
      let r: tE = mutator(mutant);
      if (r) {
        this.myEntry = Object.assign({}, this.myEntry, r);
      } else {
        this.myEntry = Object.assign({}, this.myEntry, mutant);
      }
      if (!this.openCount) this.openError = null;
      --this.openCount;
    } catch (e) {
      error = this.openError = e;
    }

    return this;
  }

  close(e: Error, fn?: (t: this) => void): boolean {
    if (!!this.openError && this.openError !== e) return false;
    if (!this.openCount) return false;
    --this.openCount;
    fn = fn || ((t) => { this.update(); });
    try {
      fn(this);
      return true;
    } catch (e) {
      return false;
    }
  }

  portable(): CrudResponse<tE> {
    return {
      hash: this.hash,
      entry: deepAssign({}, this.entry),
      error: this.openError && deepAssign({}, this.openError),
      type: this.className
    };
  }

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
interface VfEntry {
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
/* EXPORT
export /**/class VfObject<T extends object = {}> extends HoloObject<VfEntry & typeof HoloObject.entryType & T> {
  static entryType: VfEntry & typeof HoloObject.entryType;
  protected myEntry: VfEntry & typeof HoloObject.entryType & T;
  static className = "VfObject";
  className: string = "VfObject";
  static entryDefaults: VfEntry & typeof HoloObject.entryDefaults = {};

  static create(entry: VfEntry & typeof HoloObject.entryType): VfObject {
    return <VfObject> super.create(entry);
  }
  static get(hash: Hash<VfObject>): VfObject {
    return <VfObject>super.get(hash);
  }
  constructor(entry: T|null, hash?: string) {
    super(entry, hash);
  }

  get name(): string {
    return this.myEntry.name;
  }
  set name(to: string) {
    this.myEntry.name = to;
  }

  get image(): string {
    return this.myEntry.image;
  }
  set image(to: string) {
    this.myEntry.image = to;
  }

  get note(): string {
    return this.myEntry.note;
  }
  set note(to:string) {
    this.myEntry.note = to;
  }

  get url(): string {
    return this.myEntry.url;
  }
  set url(to:string) {
    this.myEntry.url = to;
  }
}
// <reference path="../common/common"/>
// <reference path="../agents/agents"/>
// <reference path="../resources/resources"/>
/* IMPORTS
//import { Hash, QuantityValue, LinkRepo, VfObject, QVlike, HoloObject, CrudResponse, bisect, HoloThing, hashOf, notError, HoloClass } from "../../../lib/ts/common";
import { Hash, QuantityValue, LinkRepo, VfObject, QVlike, HoloObject, CrudResponse, bisect, HoloThing, hashOf, notError, HoloClass } from "../common/common";
import resources from "../resources/resources";
import agents from "../agents/agents";
/*/
/**/

/* TYPE-SCOPE
//import "../agents/agents"
//import "../resources/resources"
//import "../common/common"
/*/
/**/


// <imports>
type Agent = agents.Agent;
type EconomicResource = resources.EconomicResource;

const TrackTrace: resources.TrackTrace = new LinkRepo(`TrackTrace`);
TrackTrace.linkBack("affects", "affectedBy")
  .linkBack("affectedBy", "affects");
// </imports>

// <links>
const Classifications: LinkRepo<
  events.Transfer|events.TransferClassification,
  events.Transfer|events.TransferClassification,
  "classifiedAs"|"classifies"
> = new LinkRepo("Classifications");
Classifications.linkBack("classifiedAs", "classifies")
  .linkBack("classifies", "classifiedAs");


const EventLinks: LinkRepo<
  events.EconomicEvent|events.Transfer|events.Process|events.Action,
  events.EconomicEvent|events.Transfer|events.Process|events.Action,
  "inputs"|"inputOf"|"outputs"|"outputOf"|"actionOf"|"action"
> = new LinkRepo("EventLinks");
EventLinks.linkBack("inputs", "inputOf")
  .linkBack("outputs", "outputOf")
  .linkBack("inputOf", "inputs")
  .linkBack("outputOf", "outputs")
  .linkBack("action", "actionOf")
  .linkBack("actionOf", "action");

// </links>

interface ActEntry {
  name?: string;
  behavior: '+'|'-'|'0';
}

class Action<T = {}> extends VfObject<ActEntry & T & typeof VfObject.entryType> {
  className = "Action";
  static className = "Action";
  static entryType: ActEntry & typeof VfObject.entryType;
  //protected myEntry: T & typeof Action.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <ActEntry> {
      behavior: '0'
    });

  static get(hash: Hash<Action>): Action {
    return <Action> super.get(hash);
  }
  static create(entry: ActEntry  & typeof VfObject.entryType): Action {
    return <Action> super.create(entry);
  }
  constructor(entry?: T & ActEntry & typeof VfObject.entryType, hash?: Hash<Action>) {
    super(entry, hash);
  }

  isIncrement(): boolean {
    return this.myEntry.behavior === '+';
  }

  isDecrement(): boolean {
    return this.myEntry.behavior === '-';
  }

  isNoEffect(): boolean {
    return this.myEntry.behavior === '0';
  }

  get behavior(): typeof Action.entryType.behavior {
    return this.myEntry.behavior;
  }

  set behavior(to: typeof Action.entryType.behavior) {
    this.myEntry.behavior = to;
  }

  get sign(): number {
    let behavior = this.myEntry.behavior;
    switch (behavior) {
      case "+": return 1;
      case "-": return -1;
      case "0": return 0;
    }
  }
}

interface ProcEntry {
  name: string;
}

class Process<T = {}> extends VfObject<T & ProcEntry  & typeof VfObject.entryType> {
  static className = "Process";
  className = "Process";
  static entryType: ProcEntry  & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <ProcEntry> {

    });

  static get(hash: Hash<Process>): Process {
    return <Process> super.get(hash);
  }
  static create(entry: ProcEntry  & typeof VfObject.entryType): Process {
    return <Process> super.create(entry);
  }
  constructor(entry?: T & ProcEntry  & typeof VfObject.entryType, hash?: Hash<Process>) {
    super(entry, hash);
  }

  // methods
}

interface XferClassEntry {
  name: string;
}

class TransferClassification<T = {}> extends VfObject<T & XferClassEntry & typeof VfObject.entryType> {
  static className = "TransferClassification";
  className = "TransferClassification";
  static entryType: XferClassEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <XferClassEntry> {

    });

  static get(hash: Hash<TransferClassification>): TransferClassification {
    return <TransferClassification> super.get(hash);
  }
  static create(entry: XferClassEntry & typeof VfObject.entryType): TransferClassification {
    return <TransferClassification> super.create(entry);
  }
  constructor(entry?: T & XferClassEntry & typeof VfObject.entryType, hash?: Hash<TransferClassification>) {
    super(entry, hash);
  }

}

const fixtures = {
  Action: {
    Give: new Action({name: `Give`, behavior: '-'}).commit(),
    Receive: new Action({name: `Receive`, behavior: '+'}).commit(),
    Adjust: new Action({name: `Adjust`, behavior: '+'}).commit()
  },
  TransferClassification: {
    Stub: new TransferClassification({
      name: `Transfer Classification Stub`
    }).commit()
  }
};

interface XferEntry {
  transferClassifiedAs: Hash<TransferClassification>;
  inputs: Hash<EconomicEvent|Process>;
  outputs: Hash<EconomicEvent|Process>;
}

class Transfer<T = {}> extends VfObject<T & typeof VfObject.entryType & XferEntry> {
  className = "Transfer";
  static className = "Transfer";
  static entryType: XferEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <XferEntry> {
    transferClassifiedAs: ``,
    inputs: ``,
    outputs: ``
  });
  //protected myEntry: T & XferEntry & typeof VfObject.entryType;
  static get(hash: Hash<Transfer>): Transfer {
    return <Transfer> super.get(hash);
  }
  static create(entry?: XferEntry & typeof VfObject.entryType): Transfer {
    return <Transfer> super.create(entry);
  }
  constructor(entry?: T & XferEntry & typeof VfObject.entryType, hash?: Hash<Transfer>) {
    super(entry, hash);
  }

  get input(): EconomicEvent {
    return EconomicEvent.get(this.myEntry.inputs);
  }
  set input(to: EconomicEvent) {
    let current = this.myEntry.inputs;
    if (current && current !== to.hash) {
      EventLinks.remove(this.hash, this.myEntry.inputs, `inputs`);
    }
    this.myEntry.inputs = to.hash;
  }

  get output(): EconomicEvent {
    return EconomicEvent.get(this.myEntry.outputs);
  }
  set output(to: EconomicEvent) {
    let current = this.myEntry.outputs;
    if (current && current !== to.hash) {
      EventLinks.remove(this.hash, current, `outputs`);
    }
    this.myEntry.outputs = to.hash;
  }

  get classification(): TransferClassification {
    return TransferClassification.get(this.myEntry.transferClassifiedAs);
  }
  set classification(to: TransferClassification) {
    let current = this.myEntry.transferClassifiedAs;
    if (current && current !== to.hash) {
      Classifications.remove(this.hash, current, `classifiedAs`);
    }
    this.myEntry.transferClassifiedAs = to.hash;
  }

  remove(msg:string): this {
    let {inputs, outputs, transferClassifiedAs: classy} = this.myEntry;
    if (inputs) {
      EventLinks.remove(this.hash, inputs, `inputs`);
    }
    if (outputs) {
      EventLinks.remove(this.hash, outputs, `outputs`);
    }
    if (classy) {
      Classifications.remove(this.hash, classy, `classifiedAs`);
    }
    return super.remove(msg);
  }
}

interface EeEntry {
  action: Hash<Action>;
  outputOf?: Hash<Transfer|Process>;
  inputOf?: Hash<Transfer|Process>;
  affects: Hash<EconomicResource>;
  receiver: string; //receiver?: Hash<Agent>;
  provider: string; //provider?: Hash<Agent>;
  scope?: Hash<any>;
  affectedQuantity: QVlike;
  start?: number;
  duration?: number;
}

class EconomicEvent<T = {}> extends VfObject<EeEntry & T & typeof VfObject.entryType> {
  // begin mandatory overrides
  static className = "EconomicEvent";
  className = "EconomicEvent";
  static entryType: EeEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <EeEntry>{
    action: fixtures.Action.Adjust,
    affects: ``,
    affectedQuantity: { units: ``, quantity: 0 },
    start: 0,
    duration: 0
  });
  static get(hash: Hash<EconomicEvent>): EconomicEvent {
    return <EconomicEvent> super.get(hash);
  }
  static create(entry: EeEntry & typeof VfObject.entryType): EconomicEvent {
    return <EconomicEvent> super.create(entry);
  }
  constructor(entry?: EeEntry & T & typeof VfObject.entryType, hash?: Hash<EconomicEvent>) {
    super(entry, hash);
    entry = this.myEntry;
    if (!entry.start) this.myEntry.start = Date.now();
    if (!entry.duration) this.myEntry.duration = Date.now();
  }

  get action(): Action {
    return this.entry.action && Action.get(this.entry.action) || null;
  }
  set action(obj: Action) {
    let my = this.myEntry;
    if (!obj) {
      if (my.action) {
        throw new Error(`economicEvent.action is a required field; can't be set to ${obj}`);
      }
    }
    let to = obj.hash;


    if (!!my.action && to !== my.action) {
      EventLinks.remove(this.hash, my.action, `action`);
    }
    my.action = to;
    this.update();
    EventLinks.put(this.hash, to, `action`);
  }

  get inputOf(): Transfer {
    return this.myEntry.inputOf && Transfer.get(this.myEntry.inputOf) || null;
  }
  set inputOf(to: Transfer) {
    let my = this.myEntry;
    if (!to) {
      if (my.outputOf) {
        EventLinks.remove(this.myHash, my.outputOf, `outputOf`);
        my.outputOf = null;
      }
      return;
    }

    let hash = to.hash;
    if (!!my.inputOf && my.inputOf !== hash) {
      EventLinks.remove(this.hash, my.inputOf, `inputOf`);
      // somehow get the other instance to reload its fields?
    }
    my.inputOf = hash;
    EventLinks.put(this.myHash, hash, `inputOf`);
    this.myHash = this.update();
  }

  get outputOf(): Transfer {
    return this.myEntry.outputOf && Transfer.get(this.myEntry.outputOf) || null;
  }

  get quantity(): QuantityValue {
    return new QuantityValue(this.myEntry.affectedQuantity);
  }
  set quantity(to: QuantityValue) {
    let {units, quantity} = to;
    this.myEntry.affectedQuantity = {units, quantity};
  }
  get start(): number {
    return this.myEntry.start;
  }
  started(when: number|Date): this {
    if (typeof when != `number`) {
      when = when.valueOf();
    }
    this.myEntry.start = when;
    this.update();
    return this;
  }
  get startDate(): Date {
    return new Date(this.start);
  }

  get duration(): number {
    return this.myEntry.duration;
  }

  get end(): number {
    const my = this.myEntry;
    return this.myEntry.start + this.myEntry.duration;
  }
  get endDate(): Date {
    return new Date(this.end);
  }
  ended(when?: number|Date): this {
    if (when === undefined || when === null) {
      when = Date.now();
    } else if (typeof when != `number`) {
      when = when.valueOf();
    }
    let my = this.myEntry;
    my.duration = when - my.start;
    this.update();
    return this;
  }
  instant(): this {
    this.myEntry.duration = 1;
    this.update();
    return this;
  }

  get isComplete(): boolean {
    return !!this.duration;
  }
  get isOngoing(): boolean {
    return !this.isComplete;
  }

  set affects(res: HoloThing<EconomicResource>) {
    let hash = hashOf(res);
    const my = this.myEntry;
    if (my.affects && my.affects !== hash) {
      TrackTrace.remove(this.hash, my.affects, `affects`);
    }
    my.affects = hash;
    this.update();
  }
  get affects(): HoloThing<EconomicResource> {
    return this.myEntry.affects;
  }

  private updateLinks(hash?: Hash<this>): Hash<this> {
    hash = hash || this.hash
    let my = this.myEntry;
    let linksOut = EventLinks.get(this.myHash);

    let action = linksOut.tags(`action`);
    if (my.action && (!action.length || action.hashes[0] !== my.action)) {
      EventLinks.put(hash, my.action, `action`);
      if (action.length) {
        action.removeAll();
      }
    }

    let inputOf = linksOut.tags(`outputOf`);
    if (my.inputOf && (!inputOf.length || inputOf.hashes()[0] !== my.inputOf)) {
      EventLinks.put(hash, my.inputOf, `inputOf`);
      if (inputOf.length) {
        inputOf.removeAll();
      }
    }

    let outputOf = linksOut.tags(`outputOf`);
    if (my.outputOf && (!outputOf.length || outputOf.hashes()[0] !== my.outputOf)) {
      EventLinks.put(hash, my.outputOf, `outputOf`);
      if (outputOf.length) {
        outputOf.removeAll();
      }
    }

    let affects = TrackTrace.get(hash, `affects`);
    if (my.affects && (!affects.length || affects.hashes()[0] === my.affects)) {
      TrackTrace.put(hash, my.affects, `affects`);
      if (affects.length) {
        affects.removeAll();
      }
    }

    return hash;
  }

  commit(): Hash<this> {
    return this.updateLinks(super.commit());
  }

  update(): Hash<this> {
    return this.updateLinks(super.update());
  }

  remove(): this {
    const my = this.myEntry;
    const hash = this.myHash;

    // If the event is removed, its effect is also reversed.
    let affects = TrackTrace.get(hash, `affects`);
    if (affects.length) {
      let resource = <resources.EconomicResource> affects.data()[0];
      let sign = this.action.sign;
      let effect = this.quantity.mul({units: '', quantity: sign});
      let old = new QuantityValue(resource.currentQuantity);
      let {units, quantity} = old.sub(effect);

      resource.currentQuantity = {units, quantity};
      update(`EconomicResource`, resource, my.affects);
      affects.removeAll();
    }

    EventLinks.get(hash).tags(`action`, `inputOf`, `outputOf`).removeAll();

    return super.remove();
  }
}

/*
 * Because I didn't think before dividing modules, they need to be freeze-dried
 * and thawed all the time to move between domains.  Further, to avoid compiling
 * each zome to a monolith, the only things they can export are type aliases.
 * That means entry types, not classes, and function signatures.  Oddly enough,
 * LinkRepo just needs a name and a type signature to thaw, so those will be ok
 */

/* TYPE-SCOPE
declare global {
/*/
/**/


namespace events {
  export type Action = typeof Action.entryType;
  export type EconomicEvent = typeof EconomicEvent.entryType;
  export type TransferClassification = typeof TransferClassification.entryType;
  export type Transfer = typeof Transfer.entryType;
  export type Process = typeof Process.entryType;
  export type Classifications = typeof Classifications;
  export type EventLinks = typeof EventLinks;
  //export type functions =
  //  "traceEvents"|"trackEvents"|"traceTransfers"|"trackTransfers"|
  //  "eventSubtotals"|"eventsEndedBefore"|"eventsStartedBefore"|"eventEndedAfter"|
  //  "eventsStartedAfter"|"createEvent"|"createTransfer"|"createTransferClass"|
  //  "createAction"|"resourceCreationEvent"|"sortEvents";
  //export type trackEvents = typeof trackEvents;
  //export type traceEvents = typeof traceEvents;
  //export type traceTransfers = typeof traceTransfers;
  //export type trackTransfers = typeof trackTransfers;
  //export type eventSubtotals = typeof eventSubtotals;
  //export type eventsStartedBefore = typeof eventsStartedBefore;
  //export type eventsEndedBefore = typeof eventsEndedBefore;
  //export type eventsStartedAfter = typeof eventsStartedAfter;
  //export type eventsEndedAfter = typeof eventsEndedAfter;
  //export type sortEvents = typeof sortEvents;
  //export type resourceCreationEvent = typeof resourceCreationEvent;
}
/* TYPE-SCOPE
}
/*/
/**/

/* EXPORT
export default events;
/*/
/**/


// <Zome exports> (call() functions)
//* HOLO-SCOPE
// for <DRY> purposes
function trackTrace<T, U>(subjects: Hash<T>[], tag: string): Hash<U>[] {
  return subjects.reduce((response: Hash<U>[], subject: Hash<T>) => {
    return response.concat(EventLinks.get(subject, tag).hashes());
  }, []);
}
interface TimeFilter {
  events: Hash<EconomicEvent>[],
  when: number
}
function filterByTime({events, when}: TimeFilter, filter: (ev: EconomicEvent) => boolean): Hash<EconomicEvent>[] {
  return events.map((ev) => EconomicEvent.get(ev))
    .filter(filter)
    .map((ev) => ev.hash);
}
// </DRY>

function traceEvents(events: Hash<EconomicEvent>[]): CrudResponse<events.Transfer>[] {
  return trackTrace(events, `outputOf`).map((hash) => {
    let instance = Transfer.get(hash);
    return instance.portable();
  });
}

function trackEvents(events: Hash<EconomicEvent>[]): CrudResponse<events.Transfer>[] {
  return trackTrace(events, `inputOf`).map((hash) => {
    let instance = Transfer.get(hash);
    return instance.portable();
  });
}

function traceTransfers(xfers: Hash<Transfer>[]): CrudResponse<events.EconomicEvent>[] {
  return trackTrace(xfers, `inputs`).map((hash) => {
    let instance = EconomicEvent.get(hash);
    return instance.portable();
  });
}

function trackTransfers(xfers: Hash<Transfer>[]): CrudResponse<events.EconomicEvent>[] {
  return trackTrace(xfers, `outputs`).map((hash) => {
    let instance = EconomicEvent.get(hash);
    return instance.portable();
  });
}

function eventsStartedBefore({events, when}: TimeFilter): CrudResponse<events.EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => when > ev.start)).map(hash => {
    return EconomicEvent.get(hash).portable();
  });
}

function eventsEndedBefore({events, when}: TimeFilter): CrudResponse<events.EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => ev.end < when)).map(hash => {
    return EconomicEvent.get(hash).portable();
  });
}

function eventsStartedAfter({events, when}: TimeFilter): CrudResponse<events.EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => when < ev.start)).map(hash => {
    return EconomicEvent.get(hash).portable();
  });
}

function eventsEndedAfter({events, when}: TimeFilter): CrudResponse<events.EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => ev.end > when)).map(hash => {
    return EconomicEvent.get(hash).portable();
  });
}

function sortEvents(
  {events, by, order, start, end}:
  {events: Hash<EconomicEvent>[], order: "up"|"down", by: "start"|"end", start?: number, end?: number}
): CrudResponse<events.EconomicEvent>[] {
  let objects = events.map((ev) => EconomicEvent.get(ev)),
    orderBy = by === "start" ?
      (ev:EconomicEvent) => ev.start :
      (ev:EconomicEvent) => ev.end;
  objects.sort((a, b) => {
    return Math.sign(orderBy(b) - orderBy(a));
  });

  let times = (!!start || !!end) && objects.map(orderBy);
  if (start) {
    let i = bisect(times, start);
    objects = objects.slice(i);
  }
  if (end) {
    let i = bisect(times, end);
    objects = objects.slice(0, i);
  }
  if (order === "down") objects = objects.reverse();
  return objects.map((ev) => ev.portable());
}
/*/
/**/

/**
 * A structure that details the event and state history of a group of resources
 * @interface
 * @member {object[]} events
 * @member {CrudResponse<EconomicEvent>} events[].event  The event that caused
 *  a state change.
 * @member {Dict<QVlike>} events[].subtotals using the hash of a resource as a key, the
 *  values are QuantityValue-like structs that reflect the state of that resource
 *  before the event occurred.
 * @member {Dict<QVlike>} totals The keys of all resources store the QVlike
 *  state of each resource after all the listed events (and previous)
 */
//* HOLO-SCOPE
interface Subtotals {
  events: {
    event: CrudResponse<typeof EconomicEvent.entryType>,
    subtotals: {[k:string]: QVlike}
  }[];
  resources: Hash<resources.EconomicResource>[];
  totals: {[k:string]: QVlike};
};

function eventSubtotals(hashes: Hash<EconomicEvent>[]): Subtotals {
  const uniqueRes = new Set<Hash<EconomicResource>>();
  let resourceHashes: Hash<resources.EconomicResource>[] = [];

  let events = hashes.map((h) => EconomicEvent.get(h));
  events.sort((a, b) => {
    return b.end - a.end;
  });

  events.forEach((ev) => {
    uniqueRes.add(ev.entry.affects);
  });

  let qvs: {[k:string]: QuantityValue};
  uniqueRes.forEach((ur) => {
    qvs[ur] = new QuantityValue({units: ``, quantity: 0});
    resourceHashes.push(ur);
  });

  let subs = events.map((ev) => {
    let item = {event: ev.portable(), subtotals: qvs},
      sign = ev.action.sign,
      quantity = ev.quantity.mul({units: ``, quantity: sign}),
      res = hashOf(ev.affects);

    qvs = Object.assign({}, qvs, { [res]: qvs[res].add(quantity) });

    return item;
  });

  return {events: subs, totals: qvs, resources: resourceHashes};
}

// <fixtures>


function getFixtures(dontCare: any): typeof fixtures {
  return fixtures;
}

// </fixures>

function resourceCreationEvent(
  { resource, dates }: {
    resource: resources.EconomicResource, dates?:{start: number, end?:number}
  }
): CrudResponse<events.EconomicEvent> {
  let adjustHash: Hash<Action> = fixtures.Action.Adjust;
  let qv = resource.currentQuantity;
  let start: number, end: number;
  if (dates) {
    start = dates.start;
    end = dates.end || start + 1;
  } else {
    start = Date.now();
    end = start + 1;
  }
  if (!qv.units) {
    let resClass =
      notError<resources.ResourceClassification>(get(resource.resourceClassifiedAs));
    qv.units = resClass.defaultUnits;
  }

  let resHash: Hash<resources.EconomicResource> =
    notError(commit(`EconomicResource`, resource));

  // THIS ONLY WORKS IN A STRATEGY-2 RESOURCE (see mattermost rants)
  // a strategy-1 resource is calculated forward, so the pre-event state MUST
  // have quantity 0.
  let entry: events.EconomicEvent = {
    action: adjustHash,
    affects: resHash,
    receiver: resource.owner,
    provider: resource.owner,
    affectedQuantity: qv,
    start: start,
    duration: end - start
  };
  let event = new EconomicEvent(entry);
  return {
    type: event.className,
    hash: event.commit(),
    entry: event.entry
  }
}

// CRUD
function createEvent(init: typeof EconomicEvent.entryType): CrudResponse<typeof EconomicEvent.entryType> {
  let it: EconomicEvent, err: Error;
  try {
    it = EconomicEvent.create(init);
    let affect = it.affects;

  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: it.hash,
    entry: it.entry
  };
}

function createTransfer(init: typeof Transfer.entryType): CrudResponse<typeof Transfer.entryType> {
  let it: Transfer, err: Error;
  try {
    it = Transfer.create(init);
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: it.hash,
    entry: it.entry
  };
}

function createTransferClass(init: typeof TransferClassification.entryType): CrudResponse<typeof TransferClassification.entryType> {
  let it: TransferClassification, err: Error;
  try {
    it = TransferClassification.create(init);
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: it.hash,
    entry: it.entry
  };
}

function createAction(init: typeof Action.entryType): CrudResponse<typeof Action.entryType> {
  let it: Action, err: Error;

  try {
    it = Action.create(init);
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: it.hash,
    entry: it.entry
  };
}

// callbacks
function genesis() {
  // YAGNI
  return true;
}

function validateCommit(entryType, entry, header, pkg, sources) {
  // check against schema: YAGNI
  return true;
}

function validatePut(entryType, entry, header, pkg, sources) {
  // check for data sanity: YAGNI
  return validateCommit(entryType, entry, header, pkg, sources);
}

function validateMod(entryType, entry, header, replaces, pkg, sources) {
  // messages are immutable for now.
  return true;
}

function validateDel(entryType, hash, pkg, sources) {
  // messages are permanent for now
  return true;
}

function validateLink(entryType, hash, links, pkg, sources) {
  return true;
}

function validatePutPkg(entryType) {
  // don't care.
  return null;
}

function validateModPkg(entryType) {
  // can't happen, don't care
  return null;
}

function validateDelPkg(entryType) {
  // can't happen, don't care
  return null;
}

function validateLinkPkg(entryType) {
  // can't happen, don't care
  return null;
}

/*/
/**/

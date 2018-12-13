import "./holochain-proto";

declare type Iterable<T extends string|number> = T[];

declare class Set<T extends string|number> {
  size: number;
  constructor(items?: Iterable<T>);
  add(item: T): this;
  has(item: T): boolean;
  delete(item: T): this;
  keys(): T[];
  values(): T[];
  forEach(cb: (t:T) => void, thisVal?: object): void;
}

declare class Map<K, T> {
  size: number;
  constructor(items?: [K, T][]);
  set(key: K, item: T): this;
  has(key: K): boolean;
  get(key: K): T;
  delete(key: K): this;
  keys(): K[];
  values(): T[];
  entries(): [K, T][];
  forEach(cb: (t:T, k:K) => void, thisVal?: object): void;
}

declare interface String {
  bold(): string;
  fixed(): string;
  italics(): string;
}

declare interface ObjectConstructor {
  assign<T,U>(t: T, u: U): T&U;
}


declare class ExArray<T> extends Array<T> {}

/**
 * This is for type safety when you need assurance that get(Hash) will return the correct type.
 * Not sure if it's working this way, but type safety for returns from get()
 * is still good.
 */
declare type Hash<T> = holochain.Hash;

/**
 * The hash you get when commiting a holochain.LinksEntry
 */
declare type LinkHash = Hash<holochain.LinksEntry>;

/**
 * Either throw the error or return the desired result.  The type parameter
 * should usually be inferred from the argument, which will have better warnings
 * downstream.
 */
declare function notError<T>(maybeErr: holochain.CanError<T>): T;

declare interface LinkReplacement<T, Tags> {
  hash: Hash<T>;
  tag: Tags;
  type: string;
}

declare interface LinkReplace<T, Tags> extends LinkReplacement<T, Tags> {
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
declare class LinkSet<B, L, Tags extends string = string, T extends L = L> extends ExArray<holochain.GetLinksResponse> {
  /**
   * typeof linkSet.BASE provides the base type the linkSet links from.
   */
  readonly BASE: B;
  /**
   * typeof linkSet.LINK provides the types the linkSet can link to.
   */
  readonly LINK: L;
  /**
   * typeof linkSet.TAGS gives the string literal types that can be used as tags.
   * note that this is not a string or array of strings, it is a type.  Best
   * used to type-check a tag you are about to use, i.e.
   * let tag: typeof linkSet.TAGS = "foo"
   * in that case a compilation error will occur if "foo" is not an acceptable
   * tag.
   */
  readonly TAGS: Tags;
  /**
   *
   */
  readonly TYPE: T;
  private origin: LinkRepo<B,L,Tags>;
  private baseHash: Hash<T>;
  private loaded: boolean;
  /**
   * Don't new this.
   */
  constructor(array: Array<holochain.GetLinksResponse>, origin: LinkRepo<B,L,Tags>, baseHash: string, onlyTag?: string, loaded?: boolean);
  /**
   * Filter by any number of tags.  Returns a new LinkSet of the same type.
   * @param {string[]} narrowing An array of the tag names wanted.
   */
  tags<Tt extends T>(...narrowing: string[]): LinkSet<B, L, Tags, Tt>;

  /**
   * Filter by any number of entryTypes, which you should probably get from HoloObj.className
   * returns a new LinkSet.
   * if you like typesafety, use the type parameter to narrow the types, too.
   * @arg C Type or union of types that the result should contain.  These are classes, not names.
   * @params {string} typeNames is the list of types that the result should have.
   *  these are the type names, not the classes.
   * @returns {LinkSet<C>}
   */
  types<C extends T = T>(...typeNames: string[]): LinkSet<B,L,Tags,C>;

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
   * @param {holochain.Hash} ... allowed sources to be allowed
   */
  sources(...allowed: holochain.Hash[]): LinkSet<B,L,Tags,T>;

  /**
   * All links in this set will be removed from the DHT.  Note that this is not
   * chainable, and the original object will be empty as well.
   */
  removeAll(): void;

  /**
   * Filters and replaces elements of the set.  Provide a function that accepts
   * a LinkReplace ({hash, tag, type, entry}) and returns a LinkReplacement
   * ({hash, tag, type}).  Return undefined or the unmodified argument to leave
   * the link alone.  Return null to have the link deleted, both from the set
   * and the DHT.  Return false to remove the link from the set without deleting
   * on the DHT.  Otherwise, return the new {hash, tag, type}.
   * @returns {this}
   */
  replace(fn: (obj: LinkReplace<T, Tags>) => LinkReplacement<T, Tags>|false): this;

  /**
   * Go through the set link by link, accepting or rejecting them for a new
   * LinkSet as you go.  The callback should accept a {type, entry, hash, tag}
   * and return a boolean.
   */
  select(fn: (lr: LinkReplace<T, Tags>) => boolean): LinkSet<B, L, Tags, T>;

  private descEntry(args: {Hash: Hash<B>, Tag?: string, EntryType?: string}): string;

  private desc(): string[];

  notIn<Bn extends B, Ln extends L, TagsN extends Tags, Tn extends Ln>
  (ls: LinkSet<Bn,Ln,TagsN,Tn>): LinkSet<B,L,Tags,T>;

  andIn<La extends L, TagsA extends string, Ta extends La>
  (ls: LinkSet<B,La,TagsA,Ta>): LinkSet<B, L, Tags, T>;


}

declare interface Tag<B,L, T extends string> {
  tag: T,
  repo: LinkRepo<B,L,T>
}

/**
 * Problems:
 *  The actual links entry type is not filtered in the response from getLinks.
 *  That kind of undermines the concept of it being a repository.
 *    Can't fake it with tags, since tag strings are types and are gone at runtime
 *
 *  FIXED: The recursion guard seems overzealous, stopping the application of a reciprocal
 *  tag unnecessarily.  Sometimes.  Maybe not the first time?
 *    Fixed by entering a full description of the event ("A +tag B") in the RG,
 *    doing away with the notion of how many times a tag can be repeated in the
 *    stack.
 *
 *  update() does not appear to work in the test system for load/store repos.
 *
 *  Remove() does not appear to be effective.  Of course removeAll() is broken
 *  too.
 *    Given that the test system assumes there is only one result for querying
 *    repos, it is possible that it is finding old versions by using the first
 *    of an array of all of its versions.  BUT it shouldn't be able to find
 *    an old version without asking for it specifically, right?
 *
 */

/**
 * LinkRepo encapsulates all kinds of links.  Used for keeping track of reciprocal
 * links, managing DHT interactions that are otherwise nuanced, producing
 * LinkSet objects, maintaining type-safe Hash types, and defending against
 * recursive reciprocal links.
 * @arg {object} B The union of types that can be the Base of the Links
 * @arg {object} L The union of types that can be the Link of the Links
 *  If there are reciprocal links within this LinkRepo, it's safest for B and L
 *  to be identical.
 * @arg {string} T.  This is a union of the tag strings used in this repo.
 *  If you don't want to know when you put the wrong tag in the wrong Repo, go
 *  ahead and let it default to string.  Do not use tags that include the pipe
 *  character, '|'; union the strings themselves like "foo"|"bar"|"baz"
 */
declare class LinkRepo<B, L, T extends string = string> {
  public readonly name: string;
  /**
   * @param {string} name the exact dna.zomes[].Entries.Name that this repo will
   *  represent.
   */
  constructor (name: string);

  protected backLinks: Map<T, Tag<L|B,B|L, T|string>[]>;
  /*
  protected recurseGuard: Map<T, number>();
  /*/
  protected recurseGuard: Set<string>;
  protected guard(base: Hash<B>, link: Hash<L>, tag: T, op: '+'|'-', fn: () => void): void;
  /**/
  protected selfLinks: Map<T, T[]>;
  protected predicates: Map<
    T,
    { query: Tag<L|B, B|L, T|string>, dependent: Tag<L|B, B|L, T|string> }[]
  >;
  protected exclusive: Set<T>;
  readonly BASE: B;
  readonly LINK: L;
  readonly TAGS: T;

  tag<Ts extends T>(t: Ts): Tag<B, L, T>;
  /**
   * Produce a LinkSet including all parameter-specified queries.
   * @param {Hash<B>} base this is the Base entry  whose outward links will
   *  be recovered.
   * @param {string} ...tags this is the tag or tags you want to filter by.  If
   *  omitted, all tags will be included - including those from other repos, so
   *  consider filtering the result by type or source afterward.
   * @param {holochain.LinksOptions} options options that will be passed to getLinks
   *  Be aware that the LinkSet will NOT know about these.  Defaults to the default
   *  LinksOptions.
   * @returns {LinkSet<B>} containing the query result.
   */
  get(base: Hash<B>, ...tags: T[]): LinkSet<B,L,T,L>;

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
  linkBack(tag: T, backTag?: T|string, repo?: LinkRepo<L|B, B|L, string>): this;

  // box example:
  // on A -insideOf B, for N: B contains N { N -nextTo A; A -nextTo N }
  // on A +insideOf B, for N: B contains N { N +nextTo A; A +nextTo N }
  /**
   * NOT WELL TESTED
   * Expresses a rule between 3 tags that ensures that any A triggerTag B,
   * for all C where B query.tag C, also C dependent.tag A
   * The reverse should also be true; if not A triggerTag B, any C where
   * B query.tag C, not C dependent.tag A
   * @param {T} triggerTag the tag local to this repo that will trigger
   *  maintenance of the predicate relationship
   * @param {Tag<L|B,B|L,T2|T>} query The repo and tag that determine which
   *  entries are subject to the predicate relationship.  The entries are the
   *  object of these links from the object of the trigger tag.
   * @param {Tag<L|B,B|L,T|T3>} dependent The repo and tag that are dependent
   *  on the trigger and query tag relationship.  The subject of the trigger tag
   *  will be linked/unlinked with this tag to the objects of the query tag.
   * @returns {ThisType} Chainable
   */
  predicate<T2 extends string = T, T3 extends string = T>(
    triggerTag: T,
    query: { tag: T2, repo: LinkRepo<L|B, B|L, T2|T> },
    dependent: { tag: T3, repo: LinkRepo<L|B, B|L, T3|T> }
  ): this;

  /**
   * When adding a link with the given tag, this repo will first remove any links
   * with the same tag from the same object.  This is for one-to-one and one end
   * of a one-to-many.
   * @param {T} tag the tag that is limited to one object per subject
   * @returns {ThisType} Chainable
   */
  singular(tag: T): this;

  private addPredicate(trigger: T, subj: Hash<B>, obj: Hash<L>);

  private removePredicate(trigger: T, subj: Hash<B>, obj: Hash<L>);

  private internalLinkback(fwd: T, back: T): this;

  private toLinks(base: Hash<B>, link: Hash<L>, tag: T): holochain.LinksEntry;

  private unLinks(links: holochain.LinksEntry): {Base: Hash<B>, Link: Hash<L>, Tag: T};

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
   * entered by linkBack() and dependent links from predicate() will also be
   * removed.
   * @param {Hash<B>} base the base of the link to remove.
   * @param {Hash<L>} link the base of the link to remove.
   * @param {T} tag the tag of the link to remove
   * @returns {ThisType}
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

/**
 * I guess typescript can't honor my ES5 target here?!  Ok...
 * It really only needs to implement the functions I use: constructor, get, set, add, has
 * And the key types I use: just string, I think.
 */
var Set, Map;

(function shimmy() {
  Set = (function (_super) {

    function Set(items) {
      this._keys = {};
      this.size = 0;
      var len;
      if (items && items.length) {
        len = items.length;
        for (var i = 0; i < len; i++) {
          this.add(items[i]);
          this.size++;
        }
      }
    }

    var proto = Set.prototype = Object.create(_super.prototype);
    proto.add = function (item) {
      if (!this._keys[''+item]) this.size++;
      this._keys[''+item] = true;
      return this;
    };
    proto.delete = function (item) {
      if (delete this._keys[''+item]) this.size--;
      return this;
    };
    proto.has = function (item) {
      return this._keys.hasOwnProperty(''+item);
    };

    proto.keys = proto.values = function () {
      var keys = this._keys;
      return Object.keys(keys).filter(function (key) {
        return keys[key] === true;
      });
    };

    proto.forEach = function (cb, thisVal) {
      thisVal = thisVal || this;
      var keys = this.keys();
      var i = keys.length;
      while (i--) {
        cb.call(thisVal, keys[i], this);
      }
    };

    proto.clear = function () {
      this._keys = {};
      this.size = 0;
    };

    proto.union = function (other) {
      var u = new Set();
      var size = -this.values().filter(function (v) {
        return other.has(v);
      }).length;
      Object.assign(u._keys, this._keys, other._keys);
      u.size = size + this.size + other.size;
      return u;
    };

    proto.intersect = function (that) {
      return new Set(this.values().filter(function (v) {
        return that.has(v);
      }));
    };

    proto.disjunct = function (other) {
      return new Set(this.values().filter(function (v) {
        return !other.has(v);
      }));
    }

    return Set;
  })(Object);

  Map = (function (_super) {

    function Map(items) {
      this._entries = this._keys = {};
      this.size = 0;
      var len = items && items.length;
      for (i = 0; i < len; i++) {
        this.set(items[0], items[1]);
      }
    }

    var proto = Map.prototype = Object.create(_super.prototype);
    proto.add = null;
    proto.set = function (what, to) {
      if (!(what in this._entries)) this.size++;
      this._entries[''+what] = to;
      return this;
    }
    proto.get = function (what) {
      return this._entries[''+what];
    }

    proto.keys = function () {
      return Object.keys(this._entries);
    }
    proto.values = function () {
      return this.keys().map(function (key) {
        return this._entries[key];
      });
    }
    proto.entries = function () {
      var entries = this._entries;
      return this.keys().map(function (key) {
        return [key, entries[key]];
      });
    }
    proto.forEach = function (cb, that) {
      var entries = this._entries;
      var me = this;
      that = that || this;
      this.keys().forEach(function (key) {
        cb.call(that, entries[key], key, me);
      });
    }

    return Map;
  })(Set)

  /**
   * It also doesn't know about Object.assign.....
   */

  Object.assign = function (dest, src) {
    if (!dest || typeof dest !== "object") throw new TypeError("Can't assign to non-object");
    if (src && typeof src === "object") {

      var keys = Object.keys(src);
      var i = keys.length;
      var key;

      while (i--) {
        key = keys[i];
        dest[key] = src[key];
      }

    }
    if (arguments.length > 2) {
      var more = [].slice.call(arguments, 2);
      return Object.assign(dest, more);
    }
    return dest;
  };

  /**
   * Man, I really forgot what it was like to ES5
   */
  (function (sp) {
    sp.bold = function () {
      return "<b>" + this + "</b>";
    }
    sp.italics = function () {
      return "<i>" + this + "</i>";
    }
    sp.fixed = function () {
      return "<tt>" + this + "</tt>";
    }
  })(String.prototype);
})();

function ExArray() {
  Array.apply(this);
  this.push.apply(this, arguments);
}
ExArray.prototype = Object.create(Array.prototype);
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// no. , "__esModule", { value: true });
// no. ("./holochain-proto");
// no. ("./shims");
// no. ("./ex-array-shim");
/**
 * Either throw the error or return the desired result.  The type parameter
 * should usually be inferred from the argument, which will have better warnings
 * downstream.
 */
function notError(maybeErr) {
    if (isErr(maybeErr)) {
        throw new Error("That was an error! " + ("" + maybeErr));
    }
    else {
        return maybeErr;
    }
}
// no. notError = notError;
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
var LinkSet = /** @class */ (function (_super) {
    __extends(LinkSet, _super);
    /**
     * Don't new this.
     */
    function LinkSet(array, origin, baseHash, onlyTag, loaded, sync) {
        if (loaded === void 0) { loaded = true; }
        if (sync === void 0) { sync = true; }
        var _this = _super.apply(this, array) || this;
        _this.origin = origin;
        _this.baseHash = baseHash;
        _this.loaded = loaded;
        _this.sync = true;
        _this.sync = sync;
        return _this;
        /*// I do not recall what I was doing here.
        if (onlyTag) {
          this.forEach((item: holochain.GetLinksResponse) => {
            item.Tag = onlyTag;
          });
        }
        */
    }
    /**
     * Filter by any number of tags.  Returns a new LinkSet of the same type.
     * @param {string[]} narrowing An array of the tag names wanted.
     */
    LinkSet.prototype.tags = function () {
        var narrowing = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            narrowing[_i] = arguments[_i];
        }
        var uniques = new Set(narrowing);
        return new LinkSet(this.filter(function (_a) {
            var Tag = _a.Tag;
            return uniques.has(Tag);
        }), this.origin, this.baseHash);
    };
    /**
     * Filter by any number of entryTypes, which you should probably get from HoloObj.className
     * returns a new LinkSet.
     * if you like typesafety, use the type parameter to narrow the types, too.
     * @arg C Type or union of types that the result should contain.  These are classes, not names.
     * @params {string} typeNames is the list of types that the result should have.
     *  these are the type names, not the classes.
     * @returns {LinkSet<C>}
     */
    LinkSet.prototype.types = function () {
        var typeNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            typeNames[_i] = arguments[_i];
        }
        var uniques = new Set(typeNames);
        return new LinkSet(this.filter(function (_a) {
            var EntryType = _a.EntryType;
            return uniques.has(EntryType);
        }), this.origin, this.baseHash);
    };
    /**
     * Returns an array of Hashes from the LinkSet, typed appropriately
     */
    LinkSet.prototype.hashes = function () {
        return this.map(function (_a) {
            var Hash = _a.Hash;
            return Hash;
        });
    };
    /**
     * Returns the entries in the LinkSet as a typesafe array.
     */
    LinkSet.prototype.data = function () {
        return this.map(function (_a) {
            var Hash = _a.Hash;
            return notError(get(Hash));
        });
    };
    /**
     * Filters by source.
     * @param {holochain.Hash} ... allowed sources to be allowed
     */
    LinkSet.prototype.sources = function () {
        var allowed = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            allowed[_i] = arguments[_i];
        }
        var uniques = new Set(allowed);
        return new LinkSet(this.filter(function (_a) {
            var Source = _a.Source;
            return uniques.has(Source);
        }), this.origin, this.baseHash);
    };
    /**
     * All links in this set will be removed from the DHT.  Note that this is not
     * chainable, and the original object will be empty as well.
     */
    LinkSet.prototype.removeAll = function () {
        var _this = this;
        //*
        if (this.sync)
            this.forEach(function (link, index) {
                var target = link.Hash, tag = link.Tag;
                try {
                    _this.origin.remove(_this.baseHash, target, tag);
                }
                catch (e) {
                    // don't care, just keep deleting them.
                }
            });
        this.splice(0, this.length);
        /*/// Why did I think this would work?
        if (this.sync) {
          commit(
            this.origin.name,
            {
              Links: this.map(link => ({
                Base: this.baseHash,
                Link: link.Hash,
                Tag: link.Tag,
                LinkAction: HC.LinkAction.Del
              }))
            }
          );
        } else {
          this.splice(0);
        }
        /**/
    };
    /**
     * Filters and replaces elements of the set.  Provide a function that accepts
     * a LinkReplace ({hash, tag, type, entry}) and returns a LinkReplacement
     * ({hash, tag, type}).  Return undefined or the unmodified argument to leave
     * the link alone.  Return null to have the link deleted, both from the set
     * and the DHT.  Return false to remove the link from the set without deleting
     * on the DHT.  Otherwise, return the new {hash, tag, type}.
     * @returns {this}
     */
    LinkSet.prototype.replace = function (fn) {
        var _a = this, length = _a.length, origin = _a.origin;
        var removals = [];
        for (var i = 0; i < length; i++) {
            var type = this[i].EntryType;
            var hash = this[i].Hash;
            var tag = this[i].Tag;
            var entry = get(hash);
            if (!isErr(entry)) {
                var rep = fn({ hash: hash, tag: tag, type: type, entry: entry }, i, this);
                if (rep === null) {
                    if (this.sync)
                        origin.remove(this.baseHash, hash, tag);
                    removals.push(i);
                }
                else if (rep === false) {
                    removals.push(i);
                }
                else if (rep && (tag !== rep.tag || hash !== rep.hash)) {
                    if (hash === rep.hash && type !== rep.type) {
                        throw new TypeError("can't link to " + type + " " + hash + " as type " + rep.type);
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
            }
            else {
                removals.push(i);
            }
        }
        for (var _i = 0, removals_1 = removals; _i < removals_1.length; _i++) {
            var i = removals_1[_i];
            this.splice(i, 1);
        }
        return this;
    };
    /**
     * Go through the set link by link, accepting or rejecting them for a new
     * LinkSet as you go.  The callback should accept a {type, entry, hash, tag}
     * and return a boolean.
     */
    LinkSet.prototype.select = function (fn) {
        var chosen = new LinkSet([], this.origin, this.baseHash);
        var _loop_1 = function (response) {
            var type = response.EntryType, hash = response.Hash;
            var tag = response.Tag;
            var lr = {
                hash: hash, tag: tag, type: type,
                get entry() {
                    return notError(get(hash));
                }
            };
            if (fn(lr))
                chosen.push(response);
        };
        for (var _i = 0, _a = this; _i < _a.length; _i++) {
            var response = _a[_i];
            _loop_1(response);
        }
        return chosen;
    };
    LinkSet.prototype.descEntry = function (args) {
        var Hash = args.Hash, Tag = args.Tag, EntryType = args.EntryType;
        return (Tag || "no-tag") + " " + Hash + ":" + (EntryType || "no-type");
    };
    LinkSet.prototype.desc = function () {
        return this.map(this.descEntry);
    };
    /**
     * Return this LinkSet without the links that are present in another LinkSet.
     * Useful to negate the other filtering methods, e.g. foo.notIn(foo.tags(`not this tag`))
     * If the LinkSet is not from the same LinkRepo or isn't the same link base,
     * the returned object will have the same elements.
     * @param {LinkSet} ls The disjoint LinkSet
     * @returns {LinkSet} A LinkSet with all elements of this linkset except those
     *  in the provided disjoint LinkSet.
     */
    LinkSet.prototype.notIn = function (ls) {
        var _this = this;
        if (ls.origin !== this.origin || ls.baseHash !== this.baseHash) {
            return new LinkSet(this, this.origin, this.baseHash);
        }
        var inLs = new Set(ls.desc());
        return new LinkSet(this.filter(function (link) {
            return !inLs.has(_this.descEntry(link));
        }), this.origin, this.baseHash, undefined, this.loaded, this.sync);
    };
    /**
     * Returns the links that are in both this linkset and another.  Useful if
     * you have two independent filtering operations.
     * @param {LinkSet} ls The intersecting LinkSet
     * @returns {LinkSet} LinkSet with elements in both this and ls
     */
    LinkSet.prototype.andIn = function (ls) {
        var _this = this;
        if (this.baseHash !== ls.baseHash) {
            return new LinkSet([], this.origin, this.baseHash);
        }
        var inLs = new Set(ls.desc());
        return new LinkSet(this.filter(function (link) { return inLs.has(_this.descEntry(link)); }), this.origin, this.baseHash, undefined, this.loaded, this.sync);
    };
    LinkSet.prototype.add = function (tag, hash, type) {
        if (this.sync)
            this.origin.put(this.baseHash, hash, tag);
        this.push({
            Hash: hash,
            Tag: tag,
            EntryType: type,
            Source: App.Agent.Hash
        });
        return this;
    };
    LinkSet.prototype.save = function (add, rem) {
        if (add === void 0) { add = true; }
        if (rem === void 0) { rem = false; }
        if (this.sync)
            return this;
        var tags = new Set(this.map(function (_a) {
            var Tag = _a.Tag;
            return Tag;
        }));
        for (var _i = 0, _a = tags.values(); _i < _a.length; _i++) {
            var tag = _a[_i];
            var existing = this.origin.get(this.baseHash, tag);
            if (add)
                for (var _b = 0, _c = this.notIn(existing).hashes(); _b < _c.length; _b++) {
                    var hash = _c[_b];
                    this.origin.put(this.baseHash, hash, tag);
                }
            if (rem) {
                existing.notIn(this).removeAll();
            }
        }
        return this;
    };
    return LinkSet;
}(ExArray));
// no. LinkSet = LinkSet;
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
var LinkRepo = /** @class */ (function () {
    /**
     * @param {string} name the exact dna.zomes[].Entries.Name that this repo will
     *  represent.
     */
    function LinkRepo(name) {
        this.name = name;
        this.backLinks = new Map();
        /*
        protected recurseGuard = new Map<T, number>();
        /*/
        this.recurseGuard = new Set();
        /**/
        this.selfLinks = new Map();
        this.predicates = new Map();
        this.exclusive = new Set();
    }
    LinkRepo.prototype.guard = function (base, link, tag, op, fn) {
        var descript = base + " " + op + tag + " " + link;
        if (!this.recurseGuard.has(descript)) {
            this.recurseGuard.add(descript);
            fn();
            this.recurseGuard.delete(descript);
        }
    };
    LinkRepo.prototype.tag = function (t) {
        return { tag: t, repo: this };
    };
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
    LinkRepo.prototype.get = function (base) {
        var tags = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            tags[_i - 1] = arguments[_i];
        }
        var options = { Load: true };
        if (tags.length === 0) {
            return new LinkSet(notError(getLinks(base, '', options)), this, base);
        }
        var responses = [];
        for (var _a = 0, tags_1 = tags; _a < tags_1.length; _a++) {
            var tag = tags_1[_a];
            var response = getLinks(base, tag, options);
            for (var _b = 0, response_1 = response; _b < response_1.length; _b++) {
                var lnk = response_1[_b];
                lnk.Tag = tag;
            }
            responses = responses.concat(response);
        }
        return new LinkSet(responses, this, base);
    };
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
    LinkRepo.prototype.put = function (base, link, tag, backRepo, backTag) {
        var _this = this;
        /*
        const rg = this.recurseGuard;
        let rgv = rg.has(tag) ? rg.get(tag) : 1;
    
        if (!rgv--) return this;
    
        if (this.exclusive.has(tag)) {
          this.get(base, tag).removeAll();
        }
        rg.set(tag, rgv);
    
    
    
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
        /*/
        this.guard(base, link, tag, '+', function () {
            if (_this.exclusive.has(tag)) {
                _this.get(base, tag).removeAll();
            }
            if (_this.predicates.has(tag)) {
                _this.addPredicate(tag, base, link);
            }
            var hash = commit(_this.name, { Links: [{ Base: base, Link: link, Tag: tag }] });
            if (_this.backLinks.has(tag)) {
                for (var _i = 0, _a = _this.backLinks.get(tag); _i < _a.length; _i++) {
                    var backLink = _a[_i];
                    var repo = backLink.repo, revTag = backLink.tag;
                    repo.put(link, base, revTag);
                }
            }
            if (_this.selfLinks.has(tag)) {
                for (var _b = 0, _c = _this.selfLinks.get(tag); _b < _c.length; _b++) {
                    var revTag = _c[_b];
                    _this.put(link, base, revTag);
                }
            }
            if (backRepo && backTag) {
                backRepo.put(link, base, backTag);
            }
        });
        /**/
        return this;
    };
    /**
     * Adds a reciprocal to a tag that, when put(), will trigger an additional
     * put() from the linked object from the base object.
     * @param {T} tag the tag that will trigger the reciprocal to be put().
     * @param {LinkRepo<L,B,string>} repo The repo that will contain the reciprocal.
     * @param {string} backTag the tag that will be used for the reciprocal link.
     * @returns {ThisType}
     */
    LinkRepo.prototype.linkBack = function (tag, backTag, repo) {
        if (backTag === void 0) { backTag = tag; }
        backTag = backTag || tag;
        if (!repo || repo === this) {
            return this.internalLinkback(tag, backTag);
        }
        var entry = { repo: repo, tag: backTag };
        if (this.backLinks.has(tag)) {
            var existing = this.backLinks.get(tag);
            existing.push(entry);
        }
        else {
            this.backLinks.set(tag, [entry]);
        }
        //this.recurseGuard.set(tag, 1);
        return this;
    };
    // box example:
    // on A -insideOf B, for N: B contains N { N -nextTo A; A -nextTo N }
    // on A +insideOf B, for N: B contains N { N +nextTo A; A +nextTo N }
    /**
     * NOT WELL TESTED
     * Expresses a rule between 3 tags that ensures that any A triggerTag B,
     * all C where B query.tag C, also C dependent.tag A
     * The reverse should also be true; if not A triggerTag B, any C where
     * B query.tag C, not C dependent.tag A
     */
    LinkRepo.prototype.predicate = function (triggerTag, query, dependent) {
        var predicates = this.predicates;
        if (!query.repo)
            query.repo = this;
        if (!dependent.repo)
            dependent.repo = this;
        if (predicates.has(triggerTag)) {
            predicates.get(triggerTag).push({ query: query, dependent: dependent });
        }
        else {
            predicates.set(triggerTag, [{ query: query, dependent: dependent }]);
        }
        return this;
    };
    /**
     * When adding a link with the given tag, this repo will first remove any links
     * with the same tag.  This is for one-to-one and one end of a one-to-many.
     * @param {T} tag The tag to become singular
     * @returns {this} Chainable.
     */
    LinkRepo.prototype.singular = function (tag) {
        this.exclusive.add(tag);
        return this;
    };
    LinkRepo.prototype.addPredicate = function (trigger, subj, obj) {
        var triggered = this.predicates.get(trigger);
        for (var _i = 0, triggered_1 = triggered; _i < triggered_1.length; _i++) {
            var _a = triggered_1[_i], query_1 = _a.query, dependent = _a.dependent;
            var queried = query_1.repo.get(obj, query_1.tag).hashes();
            for (var _b = 0, queried_1 = queried; _b < queried_1.length; _b++) {
                var q = queried_1[_b];
                dependent.repo.put(q, subj, dependent.tag);
            }
        }
    };
    LinkRepo.prototype.removePredicate = function (trigger, subj, obj) {
        var triggered = this.predicates.get(trigger);
        for (var _i = 0, triggered_2 = triggered; _i < triggered_2.length; _i++) {
            var _a = triggered_2[_i], query_2 = _a.query, dependent = _a.dependent;
            var queried = query_2.repo.get(obj, query_2.tag).hashes();
            for (var _b = 0, queried_2 = queried; _b < queried_2.length; _b++) {
                var q = queried_2[_b];
                dependent.repo.remove(q, subj, dependent.tag);
            }
        }
    };
    LinkRepo.prototype.internalLinkback = function (fwd, back) {
        var mutual = fwd === back;
        if (this.selfLinks.has(fwd)) {
            this.selfLinks.get(fwd).push(back);
        }
        else {
            this.selfLinks.set(fwd, [back]);
        }
        /*
        if (mutual) {
          this.recurseGuard.set(fwd, 2);
        } else {
          this.recurseGuard.set(fwd, 1).set(back, 1);
        }
        */
        return this;
    };
    LinkRepo.prototype.toLinks = function (base, link, tag) {
        return { Links: [{ Base: base, Link: link, Tag: tag }] };
    };
    LinkRepo.prototype.unLinks = function (links) {
        var _a = links.Links[0], Base = _a.Base, Link = _a.Link, Tag = _a.Tag;
        return { Base: Base, Link: Link, Tag: Tag };
    };
    /**
     * Gets the hash that a link would have if it existed.  Good to know if you use
     * update() and remove()
     * @param {Hash<B>} base the subject of the hypothetical link.
     * @param {Hash<L>} link the object of the hypothetical link.
     * @param {T} tag the tag of the hypothetical link.
     * @returns {LinkHash} if the list does or will exist, this is the hash it
     *  would have.
     */
    LinkRepo.prototype.getHash = function (base, link, tag) {
        return notError(makeHash(this.name, this.toLinks(base, link, tag)));
    };
    // FIXME this looks pretty gnarly
    /**
     * Remove the link with the specified base, link, and tag.  Reciprocal links
     * entered by linkBack() will also be removed.
     * @param {Hash<B>} base the base of the link to remove.
     * @param {Hash<L>} link the base of the link to remove.
     * @param {T} tag the tag of the link to remove
     * @returns {LinkHash} but not really useful.  Expect to change.
     */
    LinkRepo.prototype.remove = function (base, link, tag) {
        var _this = this;
        var presentLink = this.toLinks(base, link, tag);
        // Not going to happen.  makeHash doesn't work out for links.  Nor get.
        //let hash = notError<LinkHash>(makeHash(this.name, presentLink));
        // ADD THIS BACK ONCE THE TEST SYSTEM ISSUE IS WORKED OUT
        //if (get(hash) === HC.HashNotFound) return this;
        /*
        const rg = this.recurseGuard;
        let rgv = rg.has(tag) ? rg.get(tag) : 1;
        if (!rgv--) {
          return this;
        }
    
        //if (get(hash) === HC.HashNotFound) return this;
    
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
        /*/
        this.guard(base, link, tag, '-', function () {
            presentLink.Links[0].LinkAction = HC.LinkAction.Del;
            var hash = notError(commit(_this.name, presentLink));
            if (_this.backLinks.has(tag)) {
                for (var _i = 0, _a = _this.backLinks.get(tag); _i < _a.length; _i++) {
                    var _b = _a[_i], repo = _b.repo, backTag = _b.tag;
                    repo.remove(link, base, backTag);
                }
            }
            if (_this.selfLinks.has(tag)) {
                for (var _c = 0, _d = _this.selfLinks.get(tag); _c < _d.length; _c++) {
                    var back = _d[_c];
                    _this.remove(link, base, back);
                }
            }
            if (_this.predicates.has(tag)) {
                _this.removePredicate(tag, base, link);
            }
        });
        /**/
        return this;
    };
    /**
     * If the old link exists, remove it and replace it with the new link.  If
     * the old link doesn't exist, put() the new one.  As always, reciprocal links
     * are managed with no additional work.  Note that both arguments are the
     * holochain.Links type, complete with CamelCaseNames.
     * @param {holochain.Link} old The link to be replaced.
     * @param {holochain.Link} update The link to replace it with.
     * @returns {LinkHash} A hash that you can't use for much.  Expect to change.
     */
    LinkRepo.prototype.replace = function (old, update) {
        var oldHash = this.getHash(old.Base, old.Link, old.Tag);
        if (get(oldHash) === HC.HashNotFound) {
            return this.put(update.Base, update.Link, update.Tag);
        }
        this.remove(old.Base, old.Link, old.Tag);
        return this.put(update.Base, update.Link, update.Tag);
    };
    return LinkRepo;
}());
// no. LinkRepo = LinkRepo;
// <reference path="./es6.d.ts"/>
// <reference path="./holochain-proto.d.ts"/>
/* IMPORT
//import "./es6";
import "./holochain-proto";
import { LinkRepo, LinkSet, LinkReplace, LinkReplacement } from "./LinkRepo";

/*/
/**/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
export /**/ function bisect(array, min) {
    var b = 0, t = array.length;
    while (t > b) {
        var i = (t + b) >> 1, v = array[i];
        if (v < min) {
            b = i;
        }
        else if (v > min) {
            t = i;
        }
        else {
            return i;
        }
    }
    return t;
}
/* EXPORT
export/**/ function reader(Hc) {
    function crudR(hashes) {
        return hashes.map(function (hash) { return Hc.get(hash).portable(); });
    }
    return crudR;
}
/* EXPORT
export/**/ function creator(Hc) {
    return function crudC(props) {
        var it;
        try {
            it = Hc.create(props);
            it.commit();
            return it.portable();
        }
        catch (e) {
            return {
                error: e,
                hash: it && it.hash,
                entry: it && it.entry,
                type: Hc.className
            };
        }
    };
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
export /**/ function deepAssign(dest, src) {
    var more = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        more[_i - 2] = arguments[_i];
    }
    for (var _a = 0, _b = Object.keys(src); _a < _b.length; _a++) {
        var p = _b[_a];
        var v = void 0; // FIXME: this makes me want to cry.
        if (typeof src[p] == "object") {
            if (src[p] instanceof Array) {
                var d = dest[p];
                if (d && d instanceof Array) {
                    v = d.concat(src[p]);
                }
                else {
                    v = [].concat(src[p]);
                }
            }
            else {
                v = deepAssign(dest[p] || {}, src[p]);
            }
        }
        else {
            v = src[p];
        }
        dest[p] = v;
    }
    if (more.length) {
        var u = more[0], rest = more.slice(1);
        return deepAssign.apply(void 0, [dest, u].concat(rest));
    }
    else {
        return dest;
    }
}
var foo = function () { return "baz"; };
/* EXPORT
export/**/ function deepInit(target) {
    var inits = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        inits[_i - 1] = arguments[_i];
    }
    target = target || {};
    for (var _a = 0, inits_1 = inits; _a < inits_1.length; _a++) {
        var init = inits_1[_a];
        for (var _b = 0, _c = Object.keys(init); _b < _c.length; _b++) {
            var key = _c[_b];
            var val = init[key];
            while (typeof val === "function") {
                val = val.call(target, target);
            }
            if (typeof val === "object") {
                var over = target[key];
                if (over instanceof Array) {
                    val = over.concat(val);
                }
                else if (!(val instanceof Array)) {
                    val = deepInit(over || {}, val);
                }
            }
            target[key] = val;
        }
    }
    return target;
}
function isCrud(thing) {
    if (typeof thing !== "object")
        return false;
    var resp = thing;
    return (typeof resp.hash == "string" &&
        (typeof resp.entry == "object" || typeof resp.type == "string")) || (typeof resp.entry == "object" && typeof resp.type == "string");
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
export /**/ function hashOf(thing, type) {
    if (typeof thing == "string") {
        return thing;
    }
    else if (thing instanceof HoloObject) {
        return thing.hash;
    }
    else if (isCrud(thing)) {
        if (!thing.hash) {
            thing.hash = notError(makeHash(thing.type, thing.entry));
        }
        return thing.hash;
    }
    else if (type && typeof thing === "object") {
        return notError(commit(type, thing));
    }
    else {
        throw new Error("hashOf can't hash " + thing + " without a typename");
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
export /**/ function entryOf(thing) {
    if (typeof thing == "string") {
        var got = get(thing);
        return isErr(got) ? null : got;
    }
    else if (thing instanceof HoloObject) {
        return thing.entry;
    }
    else if (isCrud(thing)) {
        if (!thing.entry) {
            var entry = get(thing.hash);
            if (!isErr(entry))
                thing.entry = entry;
        }
        return thing.entry;
    }
    else {
        return thing;
    }
}
/**
 * Get a bunch of information related to something, whatever it is.
 * @param {HoloThing<T>} thing - whatever that is.
 * @returns {CrudResponse<T>}
 */
/* EXPORT
export /**/ function responseOf(thing) {
    var response = { error: null, hash: null, entry: null };
    try {
        var hash = response.hash = hashOf(thing);
        var entry = response.entry = entryOf(thing);
        if (isCrud(thing)) {
            response.type = thing.type;
        }
    }
    catch (e) {
        response.error = e;
    }
    return response;
}
;
/**
 * A pretty robust implementation of QuantityValue that will some day enable
 * unit conversions and derived units (e.g. Newtons = kg*m^2*s^2)
 * some of the hard work is done, but clearly not all of it.
 */
/* EXPORT
export /**/ var QuantityValue = /** @class */ (function () {
    /**
     * Construct a QV from a POO QVlike.
     * @param {string} units
     */
    function QuantityValue(_a) {
        var units = _a.units, quantity = _a.quantity;
        this.units = units;
        this.quantity = quantity;
    }
    QuantityValue.prototype.valueOf = function () {
        return this.quantity;
    };
    QuantityValue.prototype.toString = function () {
        return this.quantity + " " + this.units;
    };
    /**
     * Check unit compatibility and return the sum of two QVs
     * if a % is added (not to a %) the addition is relative to the original quantity
     */
    QuantityValue.prototype.add = function (_a) {
        var units = _a.units, quantity = _a.quantity;
        if (units === this.units) {
            return new QuantityValue({ units: this.units, quantity: this.quantity + quantity });
        }
        else if (units === "%") {
            return this.mul({ units: "%", quantity: 100 + quantity });
        }
        throw new Error("Can't add quantity in " + units + " to quantity in " + this.units);
    };
    /**
     * Return a QV that is the product of this and another QV, complete with derived
     * units if necessary.  Multiplying by a % or unitless quantity will return
     * a QV with the same units.  Multiplying by the inverse units will return
     * a unitless ratio.
     */
    QuantityValue.prototype.mul = function (_a) {
        var units = _a.units, quantity = _a.quantity;
        if (units === "%") {
            quantity /= 100;
            units = "";
        }
        if (units) {
            var decomp = QuantityValue.decomposeUnits(units), mine = QuantityValue.decomposeUnits(this.units);
            units = QuantityValue.recomposeUnits(QuantityValue.mulUnits(decomp, mine));
        }
        else {
            units = this.units;
        }
        return new QuantityValue({ units: units, quantity: quantity * this.quantity });
    };
    /**
     * Returns the difference between this and another QV.  If a % is given, the
     * subtraction will be proportional to the original value.  Otherwise, the
     * units must match.
     */
    QuantityValue.prototype.sub = function (_a) {
        var units = _a.units, quantity = _a.quantity;
        if (units === "%") {
            quantity = 100 - quantity;
            return this.mul({ units: units, quantity: quantity });
        }
        else if (units === this.units) {
            return new QuantityValue({ units: units, quantity: this.quantity - quantity });
        }
        else {
            throw new Error("Can't subtract " + units + " from " + this.units);
        }
    };
    /**
     * Returns the quotient of two this and another QV, deriving units if needed.
     * Unitless or % units will be treated as ratios and the output unit will be
     * the same as the input.
     */
    QuantityValue.prototype.div = function (_a) {
        var units = _a.units, quantity = _a.quantity;
        if (units === "%") {
            units = "";
            quantity = 100 / quantity;
        }
        if (units) {
            units = QuantityValue.recomposeUnits(QuantityValue.mulUnits(QuantityValue.invertUnits(QuantityValue.decomposeUnits(units)), QuantityValue.decomposeUnits(this.units)));
        }
        else {
            units = this.units;
        }
        return new QuantityValue({ units: units, quantity: this.quantity / quantity });
    };
    QuantityValue.decomposeUnits = function (units) {
        var decomp = units.split("*"), dict = {};
        for (var _i = 0, decomp_1 = decomp; _i < decomp_1.length; _i++) {
            var unit = decomp_1[_i];
            var _a = /^([^\^]*)(?:\^(\d+(?:\.\d+)?))?$/.exec(unit), match = _a[0], unitName = _a[1], expo = _a[2];
            var n = parseFloat(expo || "1");
            if (dict.hasOwnProperty(unitName)) {
                n += dict[unitName];
                if (n === 0) {
                    delete dict[unitName];
                }
                else {
                    dict[unitName] = n;
                }
            }
            else {
                dict[unitName] = n;
            }
        }
        return dict;
    };
    QuantityValue.mulUnits = function () {
        var decomps = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            decomps[_i] = arguments[_i];
        }
        var dict = decomps[0], dicts = decomps.slice(1);
        dict = Object.assign({}, dict);
        for (var _a = 0, dicts_1 = dicts; _a < dicts_1.length; _a++) {
            var decomp = dicts_1[_a];
            for (var _b = 0, _c = Object.keys(decomp); _b < _c.length; _b++) {
                var unit = _c[_b];
                var n = decomp[unit];
                if (dict.hasOwnProperty(unit)) {
                    n += dict[unit];
                }
                if (n === 0) {
                    delete dict[unit];
                }
                else {
                    dict[unit] = n;
                }
            }
        }
        return dict;
    };
    QuantityValue.invertUnits = function (decomp) {
        var dict = {};
        for (var _i = 0, _a = Object.keys(decomp); _i < _a.length; _i++) {
            var unit = _a[_i];
            dict[unit] = -decomp[unit];
        }
        return dict;
    };
    QuantityValue.recomposeUnits = function (decomp) {
        return Object.keys(decomp).map(function (unit) {
            var expo = decomp[unit];
            if (expo !== 1) {
                return unit;
            }
            else {
                return unit + "^" + expo;
            }
        }).join("*");
    };
    QuantityValue.prototype.isCount = function () {
        return this.units === "";
    };
    return QuantityValue;
}());
/**
 * Either throw the error or return the desired result.  The type parameter
 * should usually be inferred from the argument, which will have better warnings
 * downstream.
 */
/* EXPORT
export /**/ function notError(maybeErr) {
    if (isErr(maybeErr)) {
        throw new Error("That was an error! " + ("" + maybeErr));
    }
    else {
        return maybeErr;
    }
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
export /**/ var HoloObject = /** @class */ (function () {
    /**
     * constructs a HoloObject that has the given entry and hash.  Don't call this.
     * use the static create() or get() depending on your needs.
     * Override this with the correct entry types as arguments.
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
    function HoloObject(entry, hash) {
        this.openCount = 0;
        this.openError = null;
        this.isCommitted = false;
        if (!entry == !hash)
            throw new Error("use either entry or hash arguments; can't use both or none");
        if (entry) {
            this.myEntry = entry;
        }
        else {
            this.myEntry = notError(get(hash));
            this.isCommitted = true;
            this.myHash = hash;
        }
    }
    /**
     * Subclasses may call hasChanged() to determine whether their entry has been
     * changed since the last update() or commit()
     */
    HoloObject.prototype.hasChanged = function () {
        if (this.myHash) {
            return this.myHash === this.makeHash();
        }
        else {
            return true;
        }
    };
    /**
     * Subclasses may call committed() to determine whether any version of the entry
     * is in the DHT.
     */
    HoloObject.prototype.commited = function () {
        return this.isCommitted;
    };
    /**
     * Create a brand new entry and return the HoloObject that handles it.
     * Override this to get the argument type (typeof MyClass.entryType) and the
     * return type (MyClass) right.  You can also hook in here for object initialization
     * @static
     * @abstract
     * @param {holochain.JsonEntry} entryProps The new entry properties
     * @returns {HoloObject}
     */
    HoloObject.create = function (entryProps) {
        var entry = {};
        var defs = this.entryDefaults;
        deepInit(entry, defs);
        if (entryProps)
            deepAssign(entry, entryProps);
        return new this(entry);
    };
    Object.defineProperty(HoloObject.prototype, "entry", {
        /**
         * Returns the POD struct that is stored in the DHT. Modifying the object
         * will have no effect.
         * @returns {tE & typeof Superclass.entryType} the entry
         */
        get: function () {
            return deepAssign({}, this.myEntry);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Use ThisClass.get() to fetch data that exists on the DHT and construct a
     * class instance based on it.
     * @override if you need to prepare instance properties from the entry data,
     *  or to provide better type safety; it is recommended to get the types right,
     *  even if the body is just returns super.get(hash).  If the entry has aliased
     *  link properties, you should load them up here.
     * @static
     * @abstract
     * @param {Hash<this>} hash the hash of the entry on the DHT
     * @returns {this} an instance of this class
     */
    HoloObject.get = function (hash) {
        var obj = new this(null, hash);
        return obj;
    };
    Object.defineProperty(HoloObject.prototype, "hash", {
        /**
         * Public accessor to get the hash of the entry.
         * @throws {holochain.HolochainError} if the entry is not loaded or created
         *  AND it doesn't exist on the DHT.
         * @returns {Hash<this>} the hash.
         */
        get: function () {
            if (this.myHash)
                return this.myHash;
            var hash = makeHash(this.className, this.myEntry);
            if (isErr(hash)) {
                throw new TypeError("entry type mismatch");
            }
            else {
                return notError(hash);
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Retrieve a hypothetical hash of the entry.  Note that this hash is not
     * necessarily in the DHT.
     * @returns {Hash<this>} that hypothetically, the entry would have if committed.
     */
    HoloObject.prototype.makeHash = function () {
        return notError(makeHash(this.className, this.entry));
    };
    HoloObject.prototype._commit = function () {
        var hash = commit(this.className, this.myEntry);
        if (!hash || isErr(hash)) {
            throw new TypeError("entry type mismatch or invalid data; hash " + this.myHash + " is not a " + this.className);
        }
        else {
            this.isCommitted = true;
            return hash;
        }
    };
    /**
     * Commit the entry to the chain.  If it's already up there, update it.
     * Override this method and update if there are link-aliased properties you
     * need to update here.
     * @returns {Hash<this>}
     */
    HoloObject.prototype.commit = function () {
        if (!!this.openCount)
            return this.myHash;
        if (this.openError)
            throw this.openError;
        if (this.isCommitted) {
            return this._update();
        }
        else {
            return this._commit();
        }
    };
    HoloObject.prototype._update = function () {
        return this.myHash = notError(update(this.className, this.entry, this.myHash));
    };
    /**
     * Checks whether changes were made since the last commit, updates them if they
     * have.  Updates the local hash property as well.
     * @returns {Hash<this>}
     */
    HoloObject.prototype.update = function () {
        if (!!this.openCount)
            return this.myHash;
        if (this.openError)
            throw this.openError;
        if (!this.isCommitted) {
            return this._commit();
        }
        else if (this.hasChanged()) {
            return this._update();
        }
        else {
            return this.myHash;
        }
    };
    /**
     * Remove the entry from the DHT.  Chainable.  It is possible to screw up your
     * links this way, so override the method to manage those yourself (for now)
     * @param {string} msg The reason the entry is being deleted.  optional.
     * @returns {this}
     */
    HoloObject.prototype.remove = function (msg) {
        if (msg === void 0) { msg = ""; }
        if (!!this.myHash && this.isCommitted) {
            remove(this.myHash, msg);
            return this;
        }
        return this;
    };
    /**
     * Perform any number of mutation operations as a batch, preventing each of
     * the inner functions from updating the entry until all operations are
     * complete and without error.  This method is chainable, allowing you to
     * call update() or close() immediately.
     * @param {(this.entryType) => this.entryType} mutator A function that will
     *  possibly mutate the entry or throw an error.  It will receive the current
     *  entry.  To make changes, the function may return a new entry of the same
     *  type, change the argument and return nothing, or make changes through the
     *  HoloObject's methods and return nothing.
     * @returns {ThisType}
     */
    HoloObject.prototype.open = function (mutator) {
        var stack = this.openCount++;
        var mutant = Object.assign({}, this.myEntry), error = null;
        try {
            var r = mutator(mutant);
            if (r) {
                this.myEntry = Object.assign({}, this.myEntry, r);
            }
            else {
                this.myEntry = Object.assign({}, this.myEntry, mutant);
            }
            if (--this.openCount === stack)
                this.openError = null;
        }
        catch (e) {
            error = this.openError = e;
        }
        return this;
    };
    /**
     * If the recent open() operation threw, examine the error to determine
     * whether the entry should be updated anyway.  If there was no error, update
     * the entry unless it is holding for another open call.
     * @param {(Error) => boolean} fn This is a catch function that will receive
     *  the recent error if it exists.  It should return true if the error is not
     *  unforgivable.
     * @returns {ThisType}
     */
    HoloObject.prototype.close = function (fn) {
        var shouldUpdate = !this.openError;
        if (this.openError) {
            shouldUpdate = fn(this.openError) && !!this.openCount--;
        }
        if (shouldUpdate) {
            this.update();
        }
        return this;
    };
    /**
     * Returns a CrudResponse for the entry.
     * @returns {CrudResponse<this.entryType>}
     */
    HoloObject.prototype.portable = function () {
        return {
            hash: this.commit(),
            entry: this.entry,
            error: this.openError && deepAssign({}, this.openError),
            type: this.className
        };
    };
    /**
     * These are the default values that will be assigned to the entry when not
     * specified to the constructor or create().
     * @abstract
     * @static
     */
    HoloObject.entryDefaults = {};
    return HoloObject;
}());
/**
 * A base class for all VF entities that enable them to carry the optional
 * properties any VF entity can have.  See docs on HoloObject on how to extend.
 * @see HoloObject
 * @arg T Use this type argument to convey the entry type of a subclass.
 */
/* EXPORT
export /**/ var VfObject = /** @class */ (function (_super) {
    __extends(VfObject, _super);
    function VfObject(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "VfObject";
        return _this;
    }
    VfObject.create = function (entry) {
        return _super.create.call(this, entry);
    };
    VfObject.get = function (hash) {
        return _super.get.call(this, hash);
    };
    Object.defineProperty(VfObject.prototype, "name", {
        get: function () {
            return this.myEntry.name;
        },
        set: function (to) {
            this.myEntry.name = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VfObject.prototype, "image", {
        get: function () {
            return this.myEntry.image;
        },
        set: function (to) {
            this.myEntry.image = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VfObject.prototype, "note", {
        get: function () {
            return this.myEntry.note;
        },
        set: function (to) {
            this.myEntry.note = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VfObject.prototype, "url", {
        get: function () {
            return this.myEntry.url;
        },
        set: function (to) {
            this.myEntry.url = to;
        },
        enumerable: true,
        configurable: true
    });
    VfObject.className = "VfObject";
    VfObject.entryDefaults = {};
    return VfObject;
}(HoloObject));
var TrackTrace = new LinkRepo("TrackTrace");
TrackTrace.linkBack("affects", "affectedBy")
    .linkBack("affectedBy", "affects");
// </imports>
// <links>
var Classifications = new LinkRepo("Classifications");
Classifications.linkBack("classifiedAs", "classifies")
    .linkBack("classifies", "classifiedAs");
var EventLinks = new LinkRepo("EventLinks");
EventLinks.linkBack("inputs", "inputOf")
    .linkBack("outputs", "outputOf")
    .linkBack("inputOf", "inputs")
    .linkBack("outputOf", "outputs")
    .linkBack("action", "actionOf")
    .linkBack("actionOf", "action")
    .singular("inputOf")
    .singular("outputOf")
    .singular("action");
var Action = /** @class */ (function (_super) {
    __extends(Action, _super);
    function Action(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "Action";
        return _this;
    }
    Action.get = function (hash) {
        return _super.get.call(this, hash);
    };
    Action.create = function (entry) {
        return _super.create.call(this, entry);
    };
    Action.prototype.isIncrement = function () {
        return this.myEntry.behavior === '+';
    };
    Action.prototype.isDecrement = function () {
        return this.myEntry.behavior === '-';
    };
    Action.prototype.isNoEffect = function () {
        return this.myEntry.behavior === '0';
    };
    Object.defineProperty(Action.prototype, "behavior", {
        get: function () {
            return this.myEntry.behavior;
        },
        set: function (to) {
            this.myEntry.behavior = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Action.prototype, "sign", {
        get: function () {
            var behavior = this.myEntry.behavior;
            switch (behavior) {
                case "+": return 1;
                case "-": return -1;
                case "0": return 0;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Action.prototype, "events", {
        get: function () {
            return EventLinks.get(this.myHash, "actionOf").hashes().map(function (hash) { return EconomicEvent.get(hash); });
        },
        enumerable: true,
        configurable: true
    });
    Action.className = "Action";
    //protected myEntry: T & typeof Action.entryType;
    Action.entryDefaults = deepAssign({}, VfObject.entryDefaults, {
        behavior: '0'
    });
    return Action;
}(VfObject));
var ProcessClassification = /** @class */ (function (_super) {
    __extends(ProcessClassification, _super);
    function ProcessClassification(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "ProcessClassification";
        return _this;
    }
    ProcessClassification.get = function (hash) {
        return _super.get.call(this, hash);
    };
    ProcessClassification.create = function (entry) {
        return _super.create.call(this, entry);
    };
    ProcessClassification.className = "ProcessClassification";
    ProcessClassification.entryDefaults = Object.assign({}, VfObject.entryDefaults, {});
    return ProcessClassification;
}(VfObject));
var Process = /** @class */ (function (_super) {
    __extends(Process, _super);
    function Process(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "Process";
        _this.links = Process.links;
        return _this;
    }
    Process.prototype.loadLinks = function () {
        this.myEntry.processClassifiedAs = this.links.processClassifiedAs
            .get(this.myHash, "classifiedAs").hashes()[0];
        this.inputs = this.links.inputs.get(this.myHash, "inputs").types("EconomicEvent");
        this.inputs.forEach(function (_a, i, inputs) {
            var Hash = _a.Hash;
            inputs[i].Entry = EconomicEvent.get(Hash);
        });
        this.inputs.sync = false;
        this.outputs = this.links.outputs.get(this.myHash, "outputs").types("EconomicEvent");
        this.outputs.forEach(function (_a, i, outputs) {
            var Hash = _a.Hash;
            outputs[i].Entry = EconomicEvent.get(Hash);
        });
        this.outputs.sync = false;
    };
    Process.prototype.saveLinks = function (hash) {
        this.links.processClassifiedAs.put(this.myHash, this.myEntry.processClassifiedAs, "classifiedAs");
        this.inputs.save(true, true);
        this.outputs.save(true, true);
        return hash;
    };
    Process.get = function (hash) {
        var proc = _super.get.call(this, hash);
        proc.loadLinks();
        return proc;
    };
    Process.create = function (entry) {
        return _super.create.call(this, entry);
    };
    Process.prototype.asFunction = function () {
        return new EconomicFunction(this.myEntry);
    };
    Process.prototype.linksChanged = function () {
        var _a = this, inputs = _a.inputs, outputs = _a.outputs, hash = _a.hash;
        var oldInputs = this.links.inputs.get(hash, "inputs");
        var oldOutputs = this.links.outputs.get(hash, "outputs");
        if (inputs.notIn(oldInputs).length || oldInputs.notIn(inputs).length) {
            return true;
        }
        if (outputs.notIn(oldOutputs).length || oldOutputs.notIn(outputs).length) {
            return true;
        }
        return false;
    };
    Process.prototype.hasChanged = function () {
        return _super.prototype.hasChanged.call(this) || this.linksChanged();
    };
    Object.defineProperty(Process.prototype, "processClassifiedAs", {
        get: function () {
            return ProcessClassification.get(this.myEntry.processClassifiedAs);
        },
        set: function (to) {
            this.myEntry.processClassifiedAs = to.hash;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Process.prototype, "plannedDuration", {
        get: function () {
            return this.myEntry.plannedDuration;
        },
        set: function (to) {
            this.myEntry.plannedDuration = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Process.prototype, "plannedStart", {
        get: function () {
            return this.myEntry.plannedStart;
        },
        set: function (to) {
            this.myEntry.plannedStart = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Process.prototype, "plannedEnd", {
        get: function () {
            var my = this.myEntry;
            return my.plannedStart + (my.plannedDuration || Infinity);
        },
        set: function (to) {
            var my = this.myEntry;
            if (!to || to === Infinity) {
                my.plannedDuration = 0;
            }
            else {
                my.plannedDuration = to - my.plannedStart;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Process.prototype, "isFinished", {
        get: function () {
            return this.myEntry.isFinished;
        },
        set: function (to) {
            this.myEntry.isFinished = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Process.prototype, "start", {
        get: function () {
            var now = Date.now();
            var t = this.inputs.data().concat(this.outputs.data()).reduce((function (early, _a) {
                var start = _a.start;
                return (start < early ? start : early);
            }), now);
            if (t === now) {
                return 0;
            }
            else {
                return t;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Process.prototype, "end", {
        get: function () {
            if (!this.myEntry.isFinished)
                return 0;
            var then = 0;
            var t = this.inputs.data().concat(this.outputs.data()).reduce((function (later, _a) {
                var start = _a.start, duration = _a.duration;
                if (duration === 0)
                    return later;
                var end = start + duration;
                return end > later ? end : later;
            }), then);
            return t;
        },
        enumerable: true,
        configurable: true
    });
    Process.prototype.addInputs = function () {
        var events = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            events[_i] = arguments[_i];
        }
        for (var _a = 0, events_1 = events; _a < events_1.length; _a++) {
            var event = events_1[_a];
            this.inputs.add("inputs", event.hash, event.className);
        }
        return this;
    };
    Process.prototype.addOutputs = function () {
        var events = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            events[_i] = arguments[_i];
        }
        for (var _a = 0, events_2 = events; _a < events_2.length; _a++) {
            var event = events_2[_a];
            this.outputs.add("outputs", event.hash, event.className);
        }
        return this;
    };
    Process.prototype.getInputs = function (i) {
        if (!i && i !== 0) {
            return this.inputs.hashes().map(EconomicEvent.get);
        }
        else {
            var len = this.inputs.length;
            if (i >= len || i < 0)
                throw new RangeError("invalid index " + i + " for length " + len);
            return EconomicEvent.get(this.inputs[i].Hash);
        }
    };
    Process.prototype.getOutputs = function (i) {
        if (!i && i !== 0) {
            return this.outputs.hashes().map(EconomicEvent.get);
        }
        else {
            var len = this.outputs.length;
            if (i >= len || i < 0)
                throw new RangeError("invalid index " + i + " for length " + len);
            return EconomicEvent.get(this.outputs[i].Hash);
        }
    };
    Process.prototype.netEffectOn = function (res) {
        var resHash = hashOf(res);
        return this.getOutputs().concat(this.getInputs())
            .filter(function (ev) { return ev.affects === resHash; })
            .reduce(function (sum, ev) {
            var term = ev.quantity.mul({ quantity: ev.action.sign, units: "" });
            if (sum)
                term = term.add(sum);
            return term;
        }, null);
    };
    Process.prototype.commit = function () {
        return this.saveLinks(_super.prototype.commit.call(this));
    };
    Process.prototype.update = function () {
        return this.saveLinks(_super.prototype.update.call(this));
    };
    Process.prototype.remove = function () {
        this.links.inputs.get(this.myHash, "inputs").removeAll();
        this.links.outputs.get(this.myHash, "outputs").removeAll();
        this.links.processClassifiedAs.remove(this.myHash, this.myEntry.processClassifiedAs, "classifiedAs");
        return _super.prototype.remove.call(this);
    };
    Process.prototype.portable = function () {
        var crud = _super.prototype.portable.call(this);
        var entry = deepAssign(crud.entry, {
            inputs: this.inputs.hashes(),
            outputs: this.outputs.hashes()
        });
        var error = crud.error, hash = crud.hash, type = crud.type;
        return { error: error, hash: hash, type: type, entry: entry };
    };
    Process.className = "Process";
    Process.entryDefaults = deepAssign({}, VfObject.entryDefaults, {
        processClassifiedAs: function () { return (getFixtures({}).ProcessClassification.stub); },
        plannedStart: 0,
        plannedDuration: 0,
        isFinished: false,
        note: ""
    });
    Process.links = {
        processClassifiedAs: new LinkRepo("Classifications")
            .linkBack("classifiedAs", "classifies")
            .linkBack("classifies", "classifiedAs")
            .singular("classifiedAs"),
        inputs: new LinkRepo("EventLinks")
            .linkBack("inputs", "inputOf")
            .linkBack("inputOf", "inputs")
            .singular("inputOf"),
        outputs: new LinkRepo("EventLinks")
            .linkBack("outputs", "outputOf")
            .linkBack("outputOf", "outputs")
            .singular("outputOf")
    };
    return Process;
}(VfObject));
var TransferClassification = /** @class */ (function (_super) {
    __extends(TransferClassification, _super);
    function TransferClassification(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "TransferClassification";
        return _this;
    }
    TransferClassification.get = function (hash) {
        return _super.get.call(this, hash);
    };
    TransferClassification.create = function (entry) {
        return _super.create.call(this, entry);
    };
    TransferClassification.className = "TransferClassification";
    TransferClassification.entryDefaults = deepAssign({}, VfObject.entryDefaults, {});
    return TransferClassification;
}(VfObject));
var Transfer = /** @class */ (function (_super) {
    __extends(Transfer, _super);
    function Transfer(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "Transfer";
        return _this;
    }
    //protected myEntry: T & XferEntry & typeof VfObject.entryType;
    Transfer.get = function (hash) {
        return _super.get.call(this, hash);
    };
    Transfer.create = function (entry) {
        return _super.create.call(this, entry);
    };
    Transfer.prototype.asFunction = function () {
        return new EconomicFunction(this.myEntry);
    };
    Object.defineProperty(Transfer.prototype, "input", {
        get: function () {
            return EconomicEvent.get(this.myEntry.inputs);
        },
        set: function (to) {
            var current = this.myEntry.inputs;
            if (current && current !== to.hash) {
                EventLinks.remove(this.hash, this.myEntry.inputs, "inputs");
            }
            this.myEntry.inputs = to.hash;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transfer.prototype, "output", {
        get: function () {
            return EconomicEvent.get(this.myEntry.outputs);
        },
        set: function (to) {
            var current = this.myEntry.outputs;
            if (current && current !== to.hash) {
                EventLinks.remove(this.hash, current, "outputs");
            }
            this.myEntry.outputs = to.hash;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transfer.prototype, "classification", {
        get: function () {
            return TransferClassification.get(this.myEntry.transferClassifiedAs);
        },
        set: function (to) {
            var current = this.myEntry.transferClassifiedAs;
            if (current && current !== to.hash) {
                Classifications.remove(this.hash, current, "classifiedAs");
            }
            this.myEntry.transferClassifiedAs = to.hash;
        },
        enumerable: true,
        configurable: true
    });
    Transfer.prototype.remove = function (msg) {
        var _a = this.myEntry, inputs = _a.inputs, outputs = _a.outputs, classy = _a.transferClassifiedAs;
        if (inputs) {
            EventLinks.remove(this.hash, inputs, "inputs");
        }
        if (outputs) {
            EventLinks.remove(this.hash, outputs, "outputs");
        }
        if (classy) {
            Classifications.remove(this.hash, classy, "classifiedAs");
        }
        return _super.prototype.remove.call(this, msg);
    };
    Transfer.prototype.saveLinks = function (hash) {
        var my = this.myEntry;
        var links = EventLinks.get(this.myHash).tags("inputs", "outputs");
        var inputs = links.tags("inputs");
        if (inputs.length) {
            if (inputs[0].Hash !== my.inputs) {
                inputs.removeAll();
            }
        }
        if (my.inputs)
            EventLinks.put(hash, my.inputs, "inputs");
        var outputs = links.tags("outputs");
        if (outputs.length) {
            if (outputs[0].Hash !== my.outputs) {
                outputs.removeAll();
            }
        }
        if (my.outputs)
            EventLinks.put(hash, my.outputs, "outputs");
        var cl = Classifications.get(this.myHash, "classifiedAs");
        if (cl.length) {
            if (cl[0].Hash !== my.transferClassifiedAs) {
                cl.removeAll();
            }
        }
        if (my.transferClassifiedAs)
            Classifications.put(hash, my.transferClassifiedAs, "classifiedAs");
        return hash;
    };
    Transfer.prototype.commit = function () {
        return this.saveLinks(_super.prototype.commit.call(this));
    };
    Transfer.prototype.update = function () {
        return this.saveLinks(_super.prototype.update.call(this));
    };
    Transfer.className = "Transfer";
    Transfer.entryDefaults = deepAssign({}, VfObject.entryDefaults, {
        transferClassifiedAs: "",
        inputs: "",
        outputs: ""
    });
    return Transfer;
}(VfObject));
var EconomicFunction = /** @class */ (function (_super) {
    __extends(EconomicFunction, _super);
    function EconomicFunction(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "EconomicFunction";
        if (_this.isProcess()) {
            _this.className = Process.className;
        }
        else if (_this.isTransfer) {
            _this.className = Transfer.className;
        }
        return _this;
    }
    EconomicFunction.get = function (hash) {
        return _super.get.call(this, hash);
    };
    EconomicFunction.create = function (entry) {
        return _super.create.call(this, entry);
    };
    EconomicFunction.prototype.asFunction = function () {
        return this;
    };
    Object.defineProperty(EconomicFunction.prototype, "inputs", {
        get: function () {
            return EventLinks.get(this.myHash, "inputs").hashes().map(function (hash) { return EconomicEvent.get(hash); });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicFunction.prototype, "outputs", {
        get: function () {
            return EventLinks.get(this.myHash, "outputs").hashes().map(function (hash) { return EconomicEvent.get(hash); });
        },
        enumerable: true,
        configurable: true
    });
    EconomicFunction.prototype.isTransfer = function () {
        return "transferClassifiedAs" in this.myEntry;
    };
    EconomicFunction.prototype.transfer = function () {
        return this.isTransfer() ? new Transfer(this.myEntry) : null;
    };
    EconomicFunction.prototype.isProcess = function () {
        return "processClassifiedAs" in this.myEntry;
    };
    EconomicFunction.prototype.process = function () {
        return this.isProcess() ? new Process(this.myEntry) : null;
    };
    EconomicFunction.prototype.portable = function () {
        var crud = _super.prototype.portable.call(this);
        if (this.isTransfer()) {
            crud.type = Transfer.className;
        }
        else if (this.isProcess()) {
            crud.type = Process.className;
        }
        return crud;
    };
    EconomicFunction.prototype.commit = function () {
        throw new Error("Can't commit directly from EconomicFunction; convert to Process or Transfer first");
    };
    EconomicFunction.prototype.update = function () {
        throw new Error("Can't update directly from EconomicFunction; convert to Process or Transfer first");
    };
    EconomicFunction.className = "EconomicFunction";
    EconomicFunction.entryDefaults = Object.assign({}, VfObject.entryDefaults, {});
    return EconomicFunction;
}(VfObject));
var EconomicEvent = /** @class */ (function (_super) {
    __extends(EconomicEvent, _super);
    function EconomicEvent(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "EconomicEvent";
        entry = _this.myEntry;
        if (!entry.start)
            _this.myEntry.start = Date.now();
        if (!entry.duration)
            _this.myEntry.duration = 0;
        return _this;
    }
    EconomicEvent.get = function (hash) {
        return _super.get.call(this, hash);
    };
    EconomicEvent.create = function (entry) {
        return _super.create.call(this, entry);
    };
    Object.defineProperty(EconomicEvent.prototype, "action", {
        get: function () {
            return this.entry.action && Action.get(this.entry.action) || null;
        },
        set: function (obj) {
            var my = this.myEntry;
            if (!obj) {
                if (my.action) {
                    throw new Error("economicEvent.action is a required field; can't be set to " + obj);
                }
            }
            var to = obj.hash;
            my.action = to;
            //EventLinks.put(this.hash, to, `action`);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "inputOf", {
        get: function () {
            return this.myEntry.inputOf && EconomicFunction.get(this.myEntry.inputOf) || null;
        },
        set: function (to) {
            var my = this.myEntry;
            my.inputOf = to && to.hash;
        },
        enumerable: true,
        configurable: true
    });
    EconomicEvent.prototype.setInputOf = function (ef) {
        this.inputOf = ef && ef.asFunction();
    };
    Object.defineProperty(EconomicEvent.prototype, "outputOf", {
        get: function () {
            return this.myEntry.outputOf && EconomicFunction.get(this.myEntry.outputOf) || null;
        },
        set: function (ef) {
            this.myEntry.outputOf = ef && ef.hash;
        },
        enumerable: true,
        configurable: true
    });
    EconomicEvent.prototype.setOutputOf = function (ef) {
        this.outputOf = ef && ef.asFunction();
    };
    Object.defineProperty(EconomicEvent.prototype, "quantity", {
        get: function () {
            return new QuantityValue(this.myEntry.affectedQuantity);
        },
        set: function (to) {
            var units = to.units, quantity = to.quantity;
            this.myEntry.affectedQuantity = { units: units, quantity: quantity };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "start", {
        get: function () {
            return this.myEntry.start;
        },
        enumerable: true,
        configurable: true
    });
    EconomicEvent.prototype.started = function (when) {
        if (typeof when != "number") {
            when = when.valueOf();
        }
        this.myEntry.start = when;
        this.update();
        return this;
    };
    Object.defineProperty(EconomicEvent.prototype, "startDate", {
        get: function () {
            return new Date(this.start);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "duration", {
        get: function () {
            return this.myEntry.duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "end", {
        get: function () {
            return this.myEntry.start + this.myEntry.duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "endDate", {
        get: function () {
            return new Date(this.end);
        },
        enumerable: true,
        configurable: true
    });
    EconomicEvent.prototype.ended = function (when) {
        if (when === undefined || when === null) {
            when = Date.now();
        }
        else if (typeof when != "number") {
            when = when.valueOf();
        }
        var my = this.myEntry;
        my.duration = when - my.start;
        this.update();
        return this;
    };
    EconomicEvent.prototype.instant = function () {
        this.myEntry.duration = 1;
        this.update();
        return this;
    };
    Object.defineProperty(EconomicEvent.prototype, "isComplete", {
        get: function () {
            return !!this.duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "isOngoing", {
        get: function () {
            return !this.isComplete;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "affects", {
        get: function () {
            return this.myEntry.affects;
        },
        set: function (res) {
            var hash = hashOf(res);
            var my = this.myEntry;
            if (my.affects && my.affects !== hash) {
                TrackTrace.remove(this.hash, my.affects, "affects");
            }
            my.affects = hash;
            //this.update();
        },
        enumerable: true,
        configurable: true
    });
    EconomicEvent.prototype.loadLinks = function () {
        var my = this.myEntry, hash = this.myHash;
        my.action = EventLinks.get(hash, "action").hashes()[0];
        my.affects = TrackTrace.get(hash, "affects").hashes()[0];
        var links = EventLinks.get(hash, "inputOf");
        if (links.length) {
            my.inputOf = links.hashes()[0];
        }
        else {
            my.inputOf = null;
        }
        links = EventLinks.get(hash, "outputOf");
        if (links.length) {
            my.outputOf = links.hashes()[0];
        }
        else {
            my.outputOf = null;
        }
    };
    EconomicEvent.prototype.updateLinks = function (hash) {
        // hash is now the OLD hash.  If there was a problem and there was no update
        // or commit, the hash will be the same.
        if (hash === this.myHash)
            return hash;
        //hash = hash || this.myHash;
        var my = this.myEntry;
        var myHash = this.myHash;
        var linksOut = EventLinks.get(hash);
        var action = linksOut.tags("action");
        if (my.action !== (action.length && action.hashes()[0] || null)) {
            if (my.action) {
                EventLinks.put(myHash, my.action, "action");
            }
            else {
                action.removeAll();
            }
        }
        var inputOf = linksOut.tags("inputOf");
        if (my.inputOf !== (inputOf.length && inputOf.hashes()[0] || null)) {
            if (my.inputOf) {
                EventLinks.put(myHash, my.inputOf, "inputOf");
            }
            else {
                inputOf.removeAll();
            }
        }
        var outputOf = linksOut.tags("outputOf");
        if (my.outputOf !== (outputOf.length && outputOf.hashes()[0] || null)) {
            if (my.outputOf) {
                EventLinks.put(myHash, my.outputOf, "outputOf");
            }
            else {
                inputOf.removeAll();
            }
        }
        var affects = TrackTrace.get(hash, "affects");
        if (my.affects !== (affects.length && affects.hashes()[0] || null)) {
            if (my.affects) {
                this.unaffect(affects[0].Hash);
                TrackTrace.put(myHash, my.affects, "affects");
                this.affect(my.affects);
            }
            else {
                affects.removeAll();
            }
        }
        return hash;
    };
    EconomicEvent.prototype.commit = function () {
        var hash = this.myHash;
        _super.prototype.commit.call(this);
        this.updateLinks(hash);
        return this.myHash;
    };
    EconomicEvent.prototype.update = function () {
        var hash = this.myHash;
        _super.prototype.commit.call(this);
        this.updateLinks(hash);
        return this.myHash;
    };
    EconomicEvent.prototype.affect = function (hash) {
        var qv = this.quantity.mul({ units: "", quantity: this.action.sign });
        var quantity = qv.quantity, units = qv.units;
        call("resources", "affect", { resource: hash, quantity: { quantity: quantity, units: units } });
    };
    EconomicEvent.prototype.unaffect = function (hash) {
        var my = this.myEntry;
        var resource = notError(get(hash));
        var sign = this.action.sign;
        var effect = this.quantity.mul({ units: '', quantity: sign });
        var old = new QuantityValue(resource.currentQuantity);
        var _a = old.sub(effect), units = _a.units, quantity = _a.quantity;
        resource.currentQuantity = { units: units, quantity: quantity };
        update("EconomicResource", resource, my.affects);
    };
    EconomicEvent.prototype.remove = function () {
        var my = this.myEntry;
        var hash = this.myHash;
        // If the event is removed, its effect is also reversed.
        var affects = TrackTrace.get(hash, "affects");
        if (affects.length) {
            this.unaffect(affects.hashes()[0]);
        }
        EventLinks.get(hash).tags("action", "inputOf", "outputOf").removeAll();
        return _super.prototype.remove.call(this);
    };
    // begin mandatory overrides
    EconomicEvent.className = "EconomicEvent";
    EconomicEvent.entryDefaults = deepAssign({}, VfObject.entryDefaults, {
        action: function () { return getFixtures(null).Action.Adjust; },
        affects: "",
        affectedQuantity: { units: "", quantity: 0 },
        start: 0,
        duration: 0,
        provider: "",
        receiver: ""
    });
    return EconomicEvent;
}(VfObject));
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
// TODO Fix trace/track funcs to use EconomicFunction
// for <DRY> purposes
function trackTrace(subjects, tag) {
    return subjects.reduce(function (response, subject) {
        return response.concat(EventLinks.get(subject, tag).hashes());
    }, []);
}
function filterByTime(_a, filter) {
    var events = _a.events, when = _a.when;
    return events.map(function (ev) { return EconomicEvent.get(ev); })
        .filter(filter)
        .map(function (ev) { return ev.hash; });
}
// </DRY>
function traceEvents(events) {
    return trackTrace(events, "outputOf").map(function (hash) {
        var instance = EconomicFunction.get(hash);
        return instance.portable();
    });
}
function trackEvents(events) {
    return trackTrace(events, "inputOf").map(function (hash) {
        var instance = EconomicFunction.get(hash);
        return instance.portable();
    });
}
function traceTransfers(xfers) {
    return trackTrace(xfers, "inputs").map(function (hash) {
        var instance = EconomicEvent.get(hash);
        return instance.portable();
    });
}
function trackTransfers(xfers) {
    return trackTrace(xfers, "outputs").map(function (hash) {
        var instance = EconomicEvent.get(hash);
        return instance.portable();
    });
}
function eventsStartedBefore(_a) {
    var events = _a.events, when = _a.when;
    return filterByTime({ events: events, when: when }, (function (ev) { return when > ev.start; })).map(function (hash) {
        return EconomicEvent.get(hash).portable();
    });
}
function eventsEndedBefore(_a) {
    var events = _a.events, when = _a.when;
    return filterByTime({ events: events, when: when }, (function (ev) { return ev.end < when; })).map(function (hash) {
        return EconomicEvent.get(hash).portable();
    });
}
function eventsStartedAfter(_a) {
    var events = _a.events, when = _a.when;
    return filterByTime({ events: events, when: when }, (function (ev) { return when < ev.start; })).map(function (hash) {
        return EconomicEvent.get(hash).portable();
    });
}
function eventsEndedAfter(_a) {
    var events = _a.events, when = _a.when;
    return filterByTime({ events: events, when: when }, (function (ev) { return ev.end > when; })).map(function (hash) {
        return EconomicEvent.get(hash).portable();
    });
}
function sortEvents(_a) {
    var events = _a.events, by = _a.by, order = _a.order, start = _a.start, end = _a.end;
    var objects = events.map(function (ev) { return EconomicEvent.get(ev); }), orderBy = by === "start" ?
        function (ev) { return ev.start; } :
        function (ev) { return ev.end; };
    objects.sort(function (a, b) {
        return Math.sign(orderBy(b) - orderBy(a));
    });
    var times = (!!start || !!end) && objects.map(orderBy);
    if (start) {
        var i = bisect(times, start);
        objects = objects.slice(i);
    }
    if (end) {
        var i = bisect(times, end);
        objects = objects.slice(0, i);
    }
    if (order === "down")
        objects = objects.reverse();
    return objects.map(function (ev) { return ev.portable(); });
}
;
function eventSubtotals(hashes) {
    var uniqueRes = new Set();
    var resourceHashes = [];
    var events = hashes.map(function (h) { return EconomicEvent.get(h); });
    events.sort(function (a, b) {
        return b.end - a.end;
    });
    events.forEach(function (ev) {
        uniqueRes.add(ev.entry.affects);
    });
    var qvs;
    uniqueRes.forEach(function (ur) {
        qvs[ur] = new QuantityValue({ units: "", quantity: 0 });
        resourceHashes.push(ur);
    });
    var subs = events.map(function (ev) {
        var _a;
        var item = { event: ev.portable(), subtotals: qvs }, sign = ev.action.sign, quantity = ev.quantity.mul({ units: "", quantity: sign }), res = hashOf(ev.affects);
        qvs = Object.assign({}, qvs, (_a = {}, _a[res] = qvs[res].add(quantity), _a));
        return item;
    });
    return { events: subs, totals: qvs, resources: resourceHashes };
}
// <fixtures>
var fixtures;
function getFixtures(dontCare) {
    return {
        Action: {
            give: new Action({ name: "Give", behavior: '-' }).commit(),
            receive: new Action({ name: "Receive", behavior: '+' }).commit(),
            adjust: new Action({ name: "Adjust", behavior: '+' }).commit(),
            produce: new Action({ name: "Produce", behavior: '+' }).commit(),
            consume: new Action({ name: "Consume", behavior: '-' }).commit()
        },
        TransferClassification: {
            stub: new TransferClassification({
                name: "Transfer Classification Stub"
            }).commit()
        },
        ProcessClassification: {
            stub: new ProcessClassification({ label: "Process Class Stub" }).commit()
        }
    };
}
// </fixures>
function resourceCreationEvent(_a) {
    var resource = _a.resource, dates = _a.dates;
    var adjustHash = getFixtures({}).Action.Adjust;
    var qv = resource.currentQuantity;
    var start, end;
    if (dates) {
        start = dates.start;
        end = dates.end || start + 1;
    }
    else {
        start = Date.now();
        end = start + 1;
    }
    if (!qv.units) {
        var resClass = notError(get(resource.resourceClassifiedAs));
        qv.units = resClass.defaultUnits;
    }
    var resHash = notError(commit("EconomicResource", resource));
    // THIS ONLY WORKS IN A STRATEGY-2 RESOURCE (see mattermost rants)
    // a strategy-1 resource is calculated forward, so the pre-event state MUST
    // have quantity 0.
    var entry = {
        action: adjustHash,
        affects: resHash,
        receiver: resource.owner,
        provider: resource.owner,
        affectedQuantity: qv,
        start: start,
        duration: end - start
    };
    var event = new EconomicEvent(entry);
    return {
        type: event.className,
        hash: event.commit(),
        entry: event.entry
    };
}
// CRUD
function createEvent(init) {
    var it = null, err;
    try {
        it = EconomicEvent.create(init);
        if (it.affects) {
            call("resources", "affect", {
                resource: it.affects,
                quantity: it.quantity.mul({ units: "", quantity: it.action.sign })
            });
        }
        return it.portable();
    }
    catch (e) {
        return {
            error: e,
            hash: it && it.hash,
            entry: it && it.entry,
            type: it && it.className
        };
    }
}
var readEvents = reader(EconomicEvent);
function createTransfer(init) {
    var it = null, err;
    try {
        var inputs = void 0;
        if (typeof init.inputs === "string") {
            inputs = init.inputs;
        }
        else {
            var that = createEvent(entryOf(init.inputs));
            if (that.error)
                throw that.error;
            inputs = that.hash;
        }
        var outputs = void 0;
        if (typeof init.outputs === "string") {
            outputs = init.outputs;
        }
        else {
            var that = createEvent(entryOf(init.outputs));
            if (that.error)
                throw that.error;
            outputs = that.hash;
        }
        var props = {
            transferClassifiedAs: init.transferClassifiedAs,
            inputs: inputs, outputs: outputs
        };
        it = Transfer.create(props);
        it.commit();
        return it.portable();
    }
    catch (e) {
        err = e;
        return {
            error: err,
            hash: it && it.hash,
            entry: it && it.entry,
            type: it && it.className
        };
    }
}
var readTransfers = reader(Transfer);
var createTransferClass = creator(TransferClassification);
var readTransferClasses = reader(TransferClassification);
var createAction = creator(Action);
var readActions = reader(Action);
var createProcessClass = creator(ProcessClassification);
var readProcessClasses = reader(ProcessClassification);
function createProcess(init) {
    var props = {
        image: init.image,
        isFinished: init.isFinished,
        name: init.name,
        note: init.note,
        plannedStart: init.plannedStart,
        plannedDuration: init.plannedDuration,
        processClassifiedAs: init.processClassifiedAs
    };
    var it;
    try {
        it = Process.create(props);
        it.addInputs.apply(it, init.inputs.map(EconomicEvent.get));
        it.addOutputs.apply(it, init.outputs.map(EconomicEvent.get));
        it.commit();
        return it.portable();
    }
    catch (e) {
        return {
            error: e,
            hash: it && it.hash,
            entry: it && it.entry,
            type: it && it.className
        };
    }
}
function readProcesses(hashes) {
    return hashes.map(function (hash) {
        var proc;
        try {
            var proc_1 = Process.get(hash);
            return deepAssign(proc_1.portable(), {
                entry: {
                    inputs: proc_1.inputs.hashes(),
                    outputs: proc_1.outputs.hashes()
                }
            });
        }
        catch (e) {
            return {
                error: e,
                hash: proc && proc.hash,
                entry: proc && proc.entry,
                type: proc && proc.className
            };
        }
    });
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

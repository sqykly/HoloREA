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

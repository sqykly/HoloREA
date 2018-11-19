// <reference path="./es6.d.ts"/>
// <reference path="./holochain-proto.d.ts"/>
/* IMPORT
import "./es6";
import "./holochain-proto";

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
        var v = void 0;
        if (typeof src[p] == "object") {
            v = deepAssign(dest[p] || {}, src[p]);
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
export /**/ function hashOf(thing) {
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
        return isError(got) ? null : got;
    }
    else if (thing instanceof HoloObject) {
        return thing.entry;
    }
    else if (isCrud(thing)) {
        if (!thing.entry) {
            var entry = get(thing.hash);
            if (!isError(entry))
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
            var _a = /^([^\^]*)(?:\^([^]+))?$/.exec(unit), match = _a[0], unitName = _a[1], expo = _a[2];
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
    if (isError(maybeErr)) {
        throw new Error("That was an error! " + ("" + maybeErr));
    }
    else {
        return maybeErr;
    }
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
export /**/ var LinkSet = /** @class */ (function (_super) {
    __extends(LinkSet, _super);
    function LinkSet(array, origin, baseHash, onlyTag) {
        var _this = _super.apply(this, array) || this;
        _this.origin = origin;
        _this.baseHash = baseHash;
        _this.onlyTag = onlyTag;
        if (onlyTag) {
            _this.forEach(function (item) {
                item.Tag = onlyTag;
            });
        }
        return _this;
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
     * @deprecated
     * FIXME.  Super deprecated.
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
    LinkSet.prototype.removeAll = function () {
        var _this = this;
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
            if (!isError(entry)) {
                var rep = fn({ hash: hash, tag: tag, type: type, entry: entry });
                if (rep === null) {
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
        for (var _i = 0, _a = this; _i < _a.length; _i++) {
            var response = _a[_i];
            var type = response.EntryType, hash = response.Hash;
            var tag = response.Tag;
            var entry = notError(get(hash));
            if (fn({ type: type, entry: entry, hash: hash, tag: tag }))
                chosen.push(response);
        }
        return chosen;
    };
    return LinkSet;
}(Array));
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
export /**/ var LinkRepo = /** @class */ (function () {
    /**
     * @param {string} name the exact dna.zomes[].Entries.Name that this repo will
     *  represent.
     */
    function LinkRepo(name) {
        this.name = name;
        this.backLinks = new Map();
        this.recurseGuard = new Map();
        this.selfLinks = new Map();
        this.predicates = new Map();
        this.exclusive = new Set();
    }
    LinkRepo.prototype.tag = function (t) {
        return { tag: t, repo: this };
    };
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
    LinkRepo.prototype.get = function (base, tag, options) {
        if (tag === void 0) { tag = ""; }
        if (options === void 0) { options = {}; }
        if (!tag) {
            return new LinkSet(notError(getLinks(base, tag, options)), this, base);
        }
        var tags = tag.split("|"), responses = [];
        for (var _i = 0, tags_1 = tags; _i < tags_1.length; _i++) {
            tag = tags_1[_i];
            var response = getLinks(base, tag, options);
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
        var rg = this.recurseGuard;
        var rgv = rg.get(tag);
        if (!rgv--)
            return this;
        rg.set(tag, rgv);
        if (this.exclusive.has(tag)) {
            this.get(base, tag).removeAll();
        }
        if (this.predicates.has(tag)) {
            this.addPredicate(tag, base, link);
        }
        var hash = commit(this.name, { Links: [{ Base: base, Link: link, Tag: tag }] });
        if (this.backLinks.has(tag)) {
            for (var _i = 0, _a = this.backLinks.get(tag); _i < _a.length; _i++) {
                var backLink = _a[_i];
                var repo = backLink.repo, revTag = backLink.tag;
                repo.put(link, base, revTag);
            }
        }
        if (this.selfLinks.has(tag)) {
            for (var _b = 0, _c = this.selfLinks.get(tag); _b < _c.length; _b++) {
                var revTag = _c[_b];
                this.put(link, base, revTag);
            }
        }
        if (backRepo && backTag) {
            backRepo.put(link, base, backTag);
        }
        rg.set(tag, ++rgv);
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
        backTag = backTag || tag;
        if (!repo) {
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
        this.recurseGuard.set(tag, 1);
        return this;
    };
    // box example:
    // B -contains A: for N insideOf B { N -nextTo A; A -nextTo N }
    // TODO: repo should default to this, right?
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
    LinkRepo.prototype.singular = function (tag) {
        this.exclusive.add(tag);
        return this;
    };
    LinkRepo.prototype.addPredicate = function (trigger, subj, obj) {
        var triggered = this.predicates.get(trigger);
        for (var _i = 0, triggered_1 = triggered; _i < triggered_1.length; _i++) {
            var _a = triggered_1[_i], query = _a.query, dependent = _a.dependent;
            var queried = query.repo.get(subj, query.tag).hashes();
            for (var _b = 0, queried_1 = queried; _b < queried_1.length; _b++) {
                var q = queried_1[_b];
                dependent.repo.put(q, obj, dependent.tag);
            }
        }
    };
    LinkRepo.prototype.removePredicate = function (trigger, subj, obj) {
        var triggered = this.predicates.get(trigger);
        for (var _i = 0, triggered_2 = triggered; _i < triggered_2.length; _i++) {
            var _a = triggered_2[_i], query = _a.query, dependent = _a.dependent;
            var queried = query.repo.get(subj, query.tag).hashes();
            for (var _b = 0, queried_2 = queried; _b < queried_2.length; _b++) {
                var q = queried_2[_b];
                dependent.repo.remove(q, obj, dependent.tag);
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
        if (mutual) {
            this.recurseGuard.set(fwd, 2);
        }
        else {
            this.recurseGuard.set(fwd, 1).set(back, 1);
        }
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
        var presentLink = this.toLinks(base, link, tag);
        var hash = notError(makeHash(this.name, presentLink));
        var rg = this.recurseGuard;
        var rgv = rg.get(tag);
        if (!rgv--) {
            return this;
        }
        if (get(hash) === HC.HashNotFound)
            return this;
        presentLink.Links[0].LinkAction = HC.LinkAction.Del;
        hash = notError(commit(this.name, presentLink));
        rg.set(tag, rgv);
        if (this.backLinks.has(tag)) {
            for (var _i = 0, _a = this.backLinks.get(tag); _i < _a.length; _i++) {
                var _b = _a[_i], repo = _b.repo, backTag = _b.tag;
                repo.remove(link, base, backTag);
            }
        }
        if (this.selfLinks.has(tag)) {
            for (var _c = 0, _d = this.selfLinks.get(tag); _c < _d.length; _c++) {
                var back = _d[_c];
                this.remove(link, base, back);
            }
        }
        if (this.predicates.has(tag)) {
            this.removePredicate(tag, base, link);
        }
        rg.set(tag, ++rgv);
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
    HoloObject.prototype.hasChanged = function () {
        if (this.myHash) {
            return this.myHash === this.makeHash();
        }
        else {
            return true;
        }
    };
    HoloObject.prototype.commited = function () {
        return this.isCommitted;
    };
    HoloObject.create = function (entryProps) {
        var entry = {};
        Object.assign(entry, this.entryDefaults);
        if (entryProps)
            Object.assign(entry, entryProps);
        return new this(entry);
    };
    Object.defineProperty(HoloObject.prototype, "entry", {
        /**
         * Returns the POD struct that is stored in the DHT. Modifying the object
         * will have no effect.
         * @returns {tE & typeof Superclass.entryType} the entry
         */
        get: function () {
            return Object.assign({}, this.myEntry);
        },
        enumerable: true,
        configurable: true
    });
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
            if (isError(hash)) {
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
     * Retrieve a hypothetical hash of the entry.
     * @returns {Hash<this>} that hypothetically, the entry would have if committed.
     */
    HoloObject.prototype.makeHash = function () {
        return notError(makeHash(this.className, this.entry));
    };
    /**
     * Commit the entry to the chain.  If it's already up there, update it.
     * @returns {Hash<this>}
     */
    HoloObject.prototype.commit = function () {
        if (this.isCommitted) {
            return this.update();
        }
        else {
            var hash = commit(this.className, this.myEntry);
            if (isError(hash)) {
                throw new TypeError("entry type mismatch or invalid data; hash " + this.myHash + " is not a " + this.className);
            }
            else {
                this.isCommitted = true;
                return hash;
            }
        }
    };
    /**
     * Checks whether changes were made since the last commit, updates them if they
     * have.  Updates the local hash property as well.
     * @returns {Hash<this>}
     */
    HoloObject.prototype.update = function () {
        if (!!this.openCount)
            return this.myHash;
        if (!this.isCommitted) {
            return this.commit();
        }
        if (this.hasChanged()) {
            return this.myHash = notError(update(this.className, this.entry, this.myHash));
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
    HoloObject.prototype.open = function (mutator) {
        ++this.openCount;
        var mutant = Object.assign({}, this.myEntry), error = null;
        try {
            var r = mutator(mutant);
            if (r) {
                this.myEntry = Object.assign({}, this.myEntry, r);
            }
            else {
                this.myEntry = Object.assign({}, this.myEntry, mutant);
            }
            if (!this.openCount)
                this.openError = null;
            --this.openCount;
        }
        catch (e) {
            error = this.openError = e;
        }
        return this;
    };
    HoloObject.prototype.close = function (e, fn) {
        var _this = this;
        if (!!this.openError && this.openError !== e)
            return false;
        if (!this.openCount)
            return false;
        --this.openCount;
        fn = fn || (function (t) { _this.update(); });
        try {
            fn(this);
            return true;
        }
        catch (e) {
            return false;
        }
    };
    HoloObject.prototype.portable = function () {
        return {
            hash: this.hash,
            entry: deepAssign({}, this.entry),
            error: this.openError && deepAssign({}, this.openError),
            type: this.className
        };
    };
    /**
     * These are the default values that will be assigned to the entry of
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
var Agent = /** @class */ (function (_super) {
    __extends(Agent, _super);
    function Agent(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "Agent";
        return _this;
    }
    Agent.get = function (hash) {
        return _super.get.call(this, hash);
    };
    Agent.create = function (entry) {
        return _super.create.call(this, entry);
    };
    Agent.className = "Agent";
    Agent.entryDefaults = Object.assign({}, VfObject.entryDefaults, {
        primaryLocation: ["middle of nowhere", "placeville, XX 12345"]
    });
    return Agent;
}(VfObject));
var AgentProperty = new LinkRepo("AgentProperty");
/* TYPE-SCOPE
}
/*/
/**/
/* EXPORT
export default agents;
/*/
/**/
// <zome> public functions
//* HOLO-SCOPE
function createAgent(props) {
    var it, err;
    try {
        it = notError(Agent.create(props));
    }
    catch (e) {
        err = e;
    }
    return {
        error: err,
        hash: err ? null : it.commit(),
        entry: err ? null : it.entry,
        type: err ? "error" : it.className
    };
}
function getOwnedResources(_a) {
    var agents = _a.agents, types = _a.types;
    //              [agent][class][resource]
    var agentDicts = {}, typeSet = null;
    if (types) {
        typeSet = new Set(types);
    }
    var _loop_1 = function (agentHash) {
        var classDict = {}, stuffHeHas = AgentProperty.get(agentHash, "owns").tags("owns");
        stuffHeHas.data().forEach(function (resource, index) {
            var type = resource.resourceClassifiedAs;
            if (!types || typeSet.has(type)) {
                var instances = classDict[type] || [];
                instances.push(stuffHeHas[index].Hash);
                classDict[type] = instances;
            }
        });
        agentDicts[agentHash] = classDict;
    };
    // This is going to have to be a query-filter-collate.
    for (var _i = 0, agents_1 = agents; _i < agents_1.length; _i++) {
        var agentHash = agents_1[_i];
        _loop_1(agentHash);
    }
    return agentDicts;
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

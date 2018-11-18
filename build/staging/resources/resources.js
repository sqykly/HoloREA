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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
// <reference path="../common/common"/>
// <reference path="../agents/agents"/>
// <reference path="../events/events"/>
//* IMPORT
//import { LinkRepo, VfObject, QuantityValue, Hash, QVlike, notError, CrudResponse, PhysicalLocation, HoloThing, entryOf, hashOf } from "../../../lib/ts/common";
require("../common/common");
/*/
/**/
/* TYPE-SCOPE
//import "../common/common";
//import "../events/events";
//import "../agents/agents";
/*/
/**/
// <links>
// <imported from events>
var EventLinks = new LinkRepo("EventLinks");
EventLinks.linkBack("inputs", "inputOf")
    .linkBack("outputs", "outputOf")
    .linkBack("inputOf", "inputs")
    .linkBack("outputOf", "outputs")
    .linkBack("action", "actionOf")
    .linkBack("actionOf", "action");
var XferClasses = new LinkRepo("Classifications");
XferClasses.linkBack("classifiedAs", "classifies")
    .linkBack("classifies", "classifiedAs");
// </imported from agents/>
var AgentProperty = new LinkRepo("AgentProperty");
// </imported>
// <own> links
var ResourceClasses = new LinkRepo("ResourceClasses");
ResourceClasses
    .linkBack("classifiedAs", "classifies")
    .linkBack("classifies", "classifiedAs");
var ResourceRelationships = new LinkRepo("ResourceRelationships");
ResourceRelationships
    .linkBack("underlyingResource", "underlies")
    .linkBack("underlies", "underlyingResource")
    .linkBack("contains", "inside")
    .linkBack("inside", "contains");
var TrackTrace = new LinkRepo("TrackTrace");
TrackTrace.linkBack("affects", "affectedBy")
    .linkBack("affectedBy", "affects");
/**
 * Represents a category of resources.  For now, it merely provides the default unit
 * for quantities of resources in this class.
 * @extends HoloObject
 */
var ResourceClassification = /** @class */ (function (_super) {
    __extends(ResourceClassification, _super);
    function ResourceClassification(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "ResourceClassification";
        return _this;
    }
    ResourceClassification.get = function (hash) {
        return _super.get.call(this, hash);
    };
    ResourceClassification.create = function (entry) {
        return _super.create.call(this, entry);
    };
    ResourceClassification.prototype.instance = function (properties) {
        var _a = properties.currentQuantity, units = _a.units, quantity = _a.quantity, my = this.myEntry;
        if (!units) {
            units = my.defaultUnits;
        }
        else if (!!my.defaultUnits && units !== my.defaultUnits) {
            throw new TypeError("Quantity of resources of class " + (my.name || my.url) + " is expressed in " + my.defaultUnits + ", not " + units);
        }
        return EconomicResource.create({
            resourceClassifiedAs: this.hash,
            currentQuantity: { units: units, quantity: quantity },
            underlyingResource: properties.underlyingResource,
            contains: properties.contains,
            trackingIdentifier: properties.trackingIdentifier,
            owner: properties.owner
        });
    };
    Object.defineProperty(ResourceClassification.prototype, "defaultUnits", {
        get: function () {
            return this.myEntry.defaultUnits;
        },
        set: function (to) {
            this.myEntry.defaultUnits = to;
        },
        enumerable: true,
        configurable: true
    });
    ResourceClassification.prototype.instances = function () {
        return ResourceClasses.get(this.myHash, "classifies")
            .types("EconomicResource")
            .hashes().map(function (erh) { return EconomicResource.get(erh); });
    };
    ResourceClassification.className = "ResourceClassification";
    ResourceClassification.entryDefaults = Object.assign({}, VfObject.entryDefaults, {
        defaultUnits: ''
    });
    return ResourceClassification;
}(VfObject));
var EconomicResource = /** @class */ (function (_super) {
    __extends(EconomicResource, _super);
    function EconomicResource(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        // <mandatory overrides>
        _this.className = "EconomicResource";
        return _this;
    }
    EconomicResource.get = function (hash) {
        var it = _super.get.call(this, hash);
        var my = it.myEntry;
        var owners = AgentProperty.get(my.owner, "owns").select(function (_a) {
            var hash = _a.hash;
            return hash === it.myHash;
        });
        if (my.owner && !owners.length) {
            throw new Error("resource was re-assigned ownership, but can't recover new owner");
        }
        var underlying = ResourceRelationships.get(hash, "underlyingResource");
        if (underlying.length) {
            var mine = underlying.select(function (_a) {
                var link = _a.hash;
                return link === my.underlyingResource;
            });
            var more = underlying.select(function (_a) {
                var link = _a.hash;
                return link !== my.underlyingResource;
            });
            if (more.length) {
                mine.removeAll();
                var pop_1 = more.hashes()[0];
                more.select(function (_a) {
                    var link = _a.hash;
                    return link !== pop_1;
                }).removeAll();
                my.underlyingResource = pop_1;
            }
            else if (!mine.length) {
                my.underlyingResource = null;
            }
        }
        var contains = ResourceRelationships.get(hash, "contains");
        if (contains.length) {
            var mine = contains.select(function (_a) {
                var link = _a.hash;
                return link === my.contains;
            });
            var more = contains.select(function (_a) {
                var link = _a.hash;
                return link !== my.contains;
            });
            if (more.length) {
                mine.removeAll();
                var pop_2 = more.hashes()[0];
                more.select(function (_a) {
                    var link = _a.hash;
                    return link !== pop_2;
                }).removeAll();
                my.contains = pop_2;
            }
            else if (!mine.length) {
                my.contains = null;
            }
        }
        var classy = ResourceClasses.get(hash, "classifiedAs");
        if (classy.length) {
            var mine = classy.select(function (_a) {
                var link = _a.hash;
                return link === my.resourceClassifiedAs;
            });
            var more = classy.select(function (_a) {
                var link = _a.hash;
                return link !== my.resourceClassifiedAs;
            });
            if (more.length) {
                mine.removeAll();
                var pop_3 = more.hashes()[0];
                more.select(function (_a) {
                    var link = _a.hash;
                    return link !== pop_3;
                }).removeAll();
                my.resourceClassifiedAs = pop_3;
            }
            else if (!mine.length) {
                my.resourceClassifiedAs = null;
            }
        }
        it.update();
        return it;
    };
    EconomicResource.create = function (entry) {
        var rc = notError(ResourceClassification.get(entry.resourceClassifiedAs));
        if (entry.currentQuantity) {
            if (!entry.currentQuantity.units) {
                entry.currentQuantity.units = rc.defaultUnits;
            }
        }
        else {
            entry.currentQuantity = { units: rc.defaultUnits, quantity: 0 };
        }
        var it = _super.create.call(this, entry);
        it.updateLinks();
        return it;
    };
    Object.defineProperty(EconomicResource.prototype, "underlyingResource", {
        // </mandatory overrides>
        get: function () {
            return EconomicResource.get(this.myEntry.underlyingResource);
        },
        set: function (to) {
            this.myEntry.underlyingResource = to && to.hash;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicResource.prototype, "contains", {
        get: function () {
            return EconomicResource.get(this.myEntry.contains);
        },
        set: function (to) {
            this.myEntry.contains = to && to.hash;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicResource.prototype, "classification", {
        get: function () {
            return ResourceClassification.get(this.myEntry.resourceClassifiedAs);
        },
        set: function (to) {
            this.myEntry.resourceClassifiedAs = to && to.hash;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicResource.prototype, "owner", {
        get: function () {
            return this.myEntry.owner;
        },
        set: function (to) {
            this.owner = to || null;
        },
        enumerable: true,
        configurable: true
    });
    EconomicResource.prototype.updateLinks = function (hash) {
        var _this = this;
        hash = hash || this.myHash;
        var my = this.myEntry;
        var relationships = ResourceRelationships.get(hash);
        var underlying = relationships.tags("underlyingResource");
        if (my.underlyingResource && (!underlying.length || underlying.hashes()[0] !== my.underlyingResource)) {
            ResourceRelationships.put(hash, my.underlyingResource, "underlyingResource");
            underlying.removeAll();
        }
        var contains = relationships.tags("contains");
        if (my.contains && (!contains.length || contains.hashes()[0] !== my.contains)) {
            ResourceRelationships.put(hash, my.contains, "contains");
            contains.removeAll();
        }
        var classy = ResourceClasses.get(hash, "classifiedAs");
        var myClass = my.resourceClassifiedAs;
        if (myClass && (!classy.length || classy.hashes()[0] !== myClass)) {
            ResourceClasses.put(hash, myClass, "classifiedAs");
            classy.removeAll();
        }
        if (my.owner) {
            var owner = AgentProperty.get(my.owner, "owns").select(function (_a) {
                var hash = _a.hash;
                return hash === _this.myHash;
            });
            if (!owner.length) {
                AgentProperty.put(my.owner, hash, "owns");
            }
        }
        return hash;
    };
    EconomicResource.prototype.remove = function (msg) {
        var e_1, _a, e_2, _b;
        var my = this.myEntry;
        if (my.resourceClassifiedAs) {
            ResourceClasses.remove(this.myHash, my.resourceClassifiedAs, "classifiedAs");
        }
        TrackTrace.get(this.myHash, "affectedBy").removeAll();
        var relations = ResourceRelationships.get(this.myHash);
        var internal = relations.tags("underlyingResource", "contains");
        var external = relations.tags("underlies", "inside");
        internal.removeAll();
        try {
            for (var _c = __values(external.tags("underlies").hashes()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var underlies = _d.value;
                var res = EconomicResource.get(underlies);
                res.underlyingResource = null;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var _e = __values(external.tags("inside").hashes()), _f = _e.next(); !_f.done; _f = _e.next()) {
                var inside = _f.value;
                var res = EconomicResource.get(inside);
                res.contains = null;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return _super.prototype.remove.call(this, msg);
    };
    EconomicResource.prototype.update = function () {
        return this.updateLinks(_super.prototype.update.call(this));
    };
    EconomicResource.prototype.commit = function () {
        return this.updateLinks(_super.prototype.commit.call(this));
    };
    EconomicResource.prototype.trace = function () {
        var links = TrackTrace.get(this.myHash, "affectedBy");
        var eEvents = links.types("EconomicEvent");
        // I hate this a lot.
        return call("events", "sortEvents", { events: eEvents.hashes(), order: "up", by: "end" });
    };
    Object.defineProperty(EconomicResource.prototype, "currentQuantity", {
        get: function () {
            return new QuantityValue(this.myEntry.currentQuantity);
        },
        set: function (to) {
            var units = to.units, quantity = to.quantity;
            this.myEntry.currentQuantity = { units: units, quantity: quantity };
        },
        enumerable: true,
        configurable: true
    });
    EconomicResource.className = "EconomicResource";
    EconomicResource.entryDefaults = Object.assign({}, VfObject.entryDefaults, {
        currentQuantity: { units: '', quantity: 0 },
        resourceClassifiedAs: "",
        quantityLastCalculated: 0
    });
    return EconomicResource;
}(VfObject));
/*/
/**/
// </export>
// <fixtures>
var fixtures = {
    ResourceClassification: {
        Currency: new ResourceClassification({ name: "Currency", defaultUnits: "" }).commit(),
        Work: new ResourceClassification({ name: "Work", defaultUnits: "hours" }).commit(),
        Idea: new ResourceClassification({ name: "Idea", defaultUnits: "citations" }).commit()
    }
};
// </fixtures>
// public <zome> functions
/**
 * Retrieves the hashes of all EconomicResource instances classified as given.
 * @param {Hash<ResourceClassification>} classification the classification to
 *  get instances of.
 * @returns {Hash<EconomicResource>[]}
 */
/* HOLO-SCOPE
function getResourcesInClass(
  {classification}:
  {classification: Hash<ResourceClassification>}
): Hash<EconomicResource>[] {
  return ResourceClasses.get(classification, `classifies`).hashes();
}

function getAffectingEvents({resource}: {resource: Hash<EconomicResource>}): Hash<events.EconomicEvent>[] {
  return TrackTrace.get(resource, "affectedBy").types<events.EconomicEvent>("EconomicEvent").hashes();
}

// CRUD

function createEconomicResource(
  {properties: props, event: thing}: {
    properties: resources.EconomicResource,
    event: HoloThing<events.EconomicEvent>
  }
): CrudResponse<typeof EconomicResource.entryType> {
  let it: EconomicResource, err: Error;
  let event: events.EconomicEvent;
  if (thing) {
    event = entryOf(thing);
  }
  if (!event) {
    let crud = <CrudResponse<events.EconomicEvent>>
      call(`events`, `resourceCreationEvent`, {
        resource: props
      });
    if (crud.error) {
      return {
        error: crud.error,
        entry: null,
        type: `Error`,
        hash: ``
      };
    }
    event = crud.entry;
    let res = EconomicResource.get(event.affects);
    // that's all we needed to do to sync up its links.
    res.update();
    return res.portable();
  }

  let resQv = props.currentQuantity;
  let evQv = event.affectedQuantity;
  if (resQv && evQv) {
    if (resQv.units !== evQv.units) {
      if (!resQv.units && resQv.quantity === 0) {
        resQv.quantity = evQv.quantity;
        resQv.units = evQv.units;
      } else if (!evQv.units && evQv.quantity === 0) {
        evQv.units = resQv.units;
        evQv.quantity = resQv.quantity;
      } else {
        err = new TypeError(`Can't create resource in ${resQv.units} from event in ${evQv.units}`);
      }
    }
    if (!err) {
      props.currentQuantity = resQv;
      event.affectedQuantity = evQv;
    }
  }
  if (!err) try {
    it = notError<EconomicResource>(EconomicResource.create(props));
    event.affects = it.hash;
    call(`events`, `createEconomicResource`, event);
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: err ? null : it.commit(),
    entry: err ? null : it.entry,
    type: err ? "error" : it.className
  };
}

function createResourceClassification(props?: typeof ResourceClassification.entryType): CrudResponse<typeof ResourceClassification.entryType> {
  let it: ResourceClassification, err: Error;
  try {
    it = notError<ResourceClassification>(ResourceClassification.create(props));
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: err ? null : it.commit(),
    entry: err ? null : it.entry,
    type: err ? "error" : it.className
  };
}

function getFixtures(dontCare: {}): typeof fixtures {
  return fixtures;
}

function affect({resource, quantity}:{
  resource: HoloThing<resources.EconomicResource>,
  quantity: QVlike
}): CrudResponse<resources.EconomicResource> {
  let err: Error, hash: Hash<resources.EconomicResource>, res:EconomicResource;
  try {
    res = EconomicResource.get(hashOf(resource));
    hash = res.open((entry) => {
      let current = res.currentQuantity.add(quantity);
      res.currentQuantity = current;
      return entry;
    }).update();
  } catch (e) {
    err = e;
  }

  return {
    error: err,
    hash: hash || (res && res.hash) || '',
    entry: (res && res.entry) || entryOf(resource),
    type: (res && res.className) || `Who knows what this thing is?!`
  };
}

// </zome>

// <callbacks>
function genesis() {
  return true;
}

// </callbacks>
/*/
/**/

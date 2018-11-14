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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../../lib/ts/common"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var common_1 = require("../../../lib/ts/common");
    // <links>
    // <imported from events>
    var EventLinks = new common_1.LinkRepo("EventLinks");
    EventLinks.linkBack("inputs", "inputOf")
        .linkBack("outputs", "outputOf")
        .linkBack("inputOf", "inputs")
        .linkBack("outputOf", "outputs")
        .linkBack("action", "actionOf")
        .linkBack("actionOf", "action");
    var XferClasses = new common_1.LinkRepo("Classifications");
    XferClasses.linkBack("classifiedAs", "classifies")
        .linkBack("classifies", "classifiedAs");
    // </imported from agents/>
    var AgentProperty = new common_1.LinkRepo("AgentProperty");
    // </imported>
    // <own> links
    var ResourceClasses = new common_1.LinkRepo("ResourceClasses");
    ResourceClasses
        .linkBack("classifiedAs", "classifies")
        .linkBack("classifies", "classifiedAs");
    var ResourceRelationships = new common_1.LinkRepo("ResourceRelationships");
    ResourceRelationships
        .linkBack("underlyingResource", "underlies")
        .linkBack("underlies", "underlyingResource")
        .linkBack("contains", "inside")
        .linkBack("inside", "contains");
    var TrackTrace = new common_1.LinkRepo("TrackTrace");
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
            else if (units !== my.defaultUnits) {
                throw new TypeError("Quantity of resources of class " + (my.name || my.url) + " is expressed in " + my.defaultUnits + ", not " + units);
            }
            return EconomicResource.create({
                resourceClassifiedAs: this.hash,
                currentQuantity: { units: units, quantity: quantity },
                underlyingResource: properties.underlyingResource,
                contains: properties.contains,
                trackingIdentifier: properties.trackingIdentifier,
                quantityLastCalculated: properties.quantityLastCalculated,
                owner: properties.owner
            });
        };
        Object.defineProperty(ResourceClassification.prototype, "defaultUnits", {
            get: function () {
                return this.myEntry.defaultUnits;
            },
            enumerable: true,
            configurable: true
        });
        ResourceClassification.className = "ResourceClassification";
        ResourceClassification.entryDefaults = Object.assign({}, common_1.VfObject.entryDefaults, {
            defaultUnits: ''
        });
        return ResourceClassification;
    }(common_1.VfObject));
    exports.ResourceClassification = ResourceClassification;
    var EconomicResource = /** @class */ (function (_super) {
        __extends(EconomicResource, _super);
        function EconomicResource(entry, hash) {
            var _this = _super.call(this, entry, hash) || this;
            // <mandatory overrides>
            _this.className = "EconomicResource";
            return _this;
        }
        EconomicResource.get = function (hash) {
            return _super.get.call(this, hash);
        };
        EconomicResource.create = function (entry) {
            var rc = common_1.notError(ResourceClassification.get(entry.resourceClassifiedAs));
            if (entry.currentQuantity) {
                if (!entry.currentQuantity.units) {
                    entry.currentQuantity.units = rc.defaultUnits;
                }
            }
            else {
                entry.currentQuantity = { units: rc.defaultUnits, quantity: 0 };
            }
            var it = _super.create.call(this, entry);
            if (rc) {
                ResourceClasses.put(it.hash, rc.hash, "classifiedAs");
            }
            if (entry.owner) {
                AgentProperty.put(entry.owner, it.hash, "owns");
            }
            if (entry.underlyingResource) {
                ResourceRelationships.put(it.hash, entry.underlyingResource, "underlyingResource");
            }
            if (entry.contains) {
                ResourceRelationships.put(it.hash, entry.contains, "contains");
            }
            return it;
        };
        // </mandatory overrides>
        EconomicResource.prototype.remove = function (msg) {
            var my = this.myEntry;
            if (my.resourceClassifiedAs) {
                ResourceClasses.remove(this.myHash, my.resourceClassifiedAs, "classifiedAs");
            }
            TrackTrace.get(this.myHash, "affectedBy").removeAll();
            return _super.prototype.remove.call(this, msg);
        };
        EconomicResource.prototype.trace = function () {
            var links = TrackTrace.get(this.myHash, "affectedBy");
            var eEvents = links.types("EconomicEvent");
            // I hate this a lot.
            return call("events", "sortEvents", { events: eEvents.hashes(), order: "up", by: "end" });
        };
        Object.defineProperty(EconomicResource.prototype, "currentQuantity", {
            get: function () {
                return new common_1.QuantityValue(this.myEntry.currentQuantity);
            },
            set: function (to) {
                var units = to.units, quantity = to.quantity;
                this.myEntry.currentQuantity = { units: units, quantity: quantity };
            },
            enumerable: true,
            configurable: true
        });
        EconomicResource.className = "EconomicResource";
        EconomicResource.entryDefaults = Object.assign({}, common_1.VfObject.entryDefaults, {
            currentQuantity: { units: '', quantity: 0 },
            resourceClassifiedAs: "",
            quantityLastCalculated: 0
        });
        return EconomicResource;
    }(common_1.VfObject));
    // </export>
    // <fixtures>
    var fixtures = {
        ResourceClassification: {
            Currency: new ResourceClassification({ name: "Currency", defaultUnits: "" }),
            Work: new ResourceClassification({ name: "Work", defaultUnits: "hours" }),
            Idea: new ResourceClassification({ name: "Idea", defaultUnits: "citations" })
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
    function getResourcesInClass(_a) {
        var classification = _a.classification;
        return ResourceClasses.get(classification, "classifies").hashes();
    }
    function getAffectingEvents(_a) {
        var resource = _a.resource;
        return TrackTrace.get(resource, "affectedBy").types("EconomicEvent").hashes();
    }
    // CRUD
    function createEconomicResource(_a) {
        var props = _a.properties, thing = _a.event;
        var it, err;
        var event;
        if (thing) {
            event = common_1.entryOf(thing);
        }
        if (!event) {
            var crud = call("events", "resourceCreationEvent", {
                resource: props
            });
            if (crud.error) {
                return {
                    error: crud.error,
                    entry: null,
                    type: "Error",
                    hash: ""
                };
            }
            event = crud.entry;
            var res = EconomicResource.get(event.affects);
            // that's all we needed to do to sync up its links.
            res.update();
            return res.portable();
        }
        var resQv = props.currentQuantity;
        var evQv = event.affectedQuantity;
        if (resQv && evQv) {
            if (resQv.units !== evQv.units) {
                if (!resQv.units && resQv.quantity === 0) {
                    resQv.quantity = evQv.quantity;
                    resQv.units = evQv.units;
                }
                else if (!evQv.units && evQv.quantity === 0) {
                    evQv.units = resQv.units;
                    evQv.quantity = resQv.quantity;
                }
                else {
                    err = new TypeError("Can't create resource in " + resQv.units + " from event in " + evQv.units);
                }
            }
            if (!err) {
                props.currentQuantity = resQv;
                event.affectedQuantity = evQv;
            }
        }
        if (!err)
            try {
                it = common_1.notError(EconomicResource.create(props));
                event.affects = it.hash;
                call("events", "createEconomicResource", event);
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
    function createResourceClassification(props) {
        var it, err;
        try {
            it = common_1.notError(ResourceClassification.create(props));
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
    function getFixtures(dontCare) {
        return fixtures;
    }
    function affect(_a) {
        var resource = _a.resource, quantity = _a.quantity;
        var err, hash, res;
        try {
            res = EconomicResource.get(common_1.hashOf(resource));
            hash = res.open(function (entry) {
                var current = res.currentQuantity.add(quantity);
                res.currentQuantity = current;
                return entry;
            }).update();
        }
        catch (e) {
            err = e;
        }
        return {
            error: err,
            hash: hash || (res && res.hash) || '',
            entry: (res && res.entry) || common_1.entryOf(resource),
            type: (res && res.className) || "Who knows what this thing is?!"
        };
    }
    // </zome>
    // <callbacks>
    function genesis() {
        return true;
    }
});
// </callbacks>

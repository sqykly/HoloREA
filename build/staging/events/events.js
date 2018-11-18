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
Object.defineProperty(exports, "__esModule", { value: true });
// <reference path="../common/common"/>
// <reference path="../agents/agents"/>
// <reference path="../resources/resources"/>
//* IMPORTS
//import { Hash, QuantityValue, LinkRepo, VfObject, QVlike, HoloObject, CrudResponse, bisect, HoloThing, hashOf, notError, HoloClass } from "../../../lib/ts/common";
require("../common/common");
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
    .linkBack("actionOf", "action");
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
    Action.className = "Action";
    //protected myEntry: T & typeof Action.entryType;
    Action.entryDefaults = Object.assign({}, VfObject.entryDefaults, {
        behavior: '0'
    });
    return Action;
}(VfObject));
var Process = /** @class */ (function (_super) {
    __extends(Process, _super);
    function Process(entry, hash) {
        var _this = _super.call(this, entry, hash) || this;
        _this.className = "Process";
        return _this;
    }
    Process.get = function (hash) {
        return _super.get.call(this, hash);
    };
    Process.create = function (entry) {
        return _super.create.call(this, entry);
    };
    Process.className = "Process";
    Process.entryDefaults = Object.assign({}, VfObject.entryDefaults, {});
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
    TransferClassification.entryDefaults = Object.assign({}, VfObject.entryDefaults, {});
    return TransferClassification;
}(VfObject));
var fixtures = {
    Action: {
        Give: new Action({ name: "Give", behavior: '-' }).commit(),
        Receive: new Action({ name: "Receive", behavior: '+' }).commit(),
        Adjust: new Action({ name: "Adjust", behavior: '+' }).commit()
    },
    TransferClassification: {
        Stub: new TransferClassification({
            name: "Transfer Classification Stub"
        }).commit()
    }
};
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
    Transfer.className = "Transfer";
    Transfer.entryDefaults = Object.assign({}, VfObject.entryDefaults, {
        transferClassifiedAs: "",
        inputs: "",
        outputs: ""
    });
    return Transfer;
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
            _this.myEntry.duration = Date.now();
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
            if (!!my.action && to !== my.action) {
                EventLinks.remove(this.hash, my.action, "action");
            }
            my.action = to;
            this.update();
            EventLinks.put(this.hash, to, "action");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "inputOf", {
        get: function () {
            return this.myEntry.inputOf && Transfer.get(this.myEntry.inputOf) || null;
        },
        set: function (to) {
            var my = this.myEntry;
            if (!to) {
                if (my.outputOf) {
                    EventLinks.remove(this.myHash, my.outputOf, "outputOf");
                    my.outputOf = null;
                }
                return;
            }
            var hash = to.hash;
            if (!!my.inputOf && my.inputOf !== hash) {
                EventLinks.remove(this.hash, my.inputOf, "inputOf");
                // somehow get the other instance to reload its fields?
            }
            my.inputOf = hash;
            EventLinks.put(this.myHash, hash, "inputOf");
            this.myHash = this.update();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EconomicEvent.prototype, "outputOf", {
        get: function () {
            return this.myEntry.outputOf && Transfer.get(this.myEntry.outputOf) || null;
        },
        enumerable: true,
        configurable: true
    });
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
            var my = this.myEntry;
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
            this.update();
        },
        enumerable: true,
        configurable: true
    });
    EconomicEvent.prototype.updateLinks = function (hash) {
        hash = hash || this.hash;
        var my = this.myEntry;
        var linksOut = EventLinks.get(this.myHash);
        var action = linksOut.tags("action");
        if (my.action && (!action.length || action.hashes[0] !== my.action)) {
            EventLinks.put(hash, my.action, "action");
            if (action.length) {
                action.removeAll();
            }
        }
        var inputOf = linksOut.tags("outputOf");
        if (my.inputOf && (!inputOf.length || inputOf.hashes()[0] !== my.inputOf)) {
            EventLinks.put(hash, my.inputOf, "inputOf");
            if (inputOf.length) {
                inputOf.removeAll();
            }
        }
        var outputOf = linksOut.tags("outputOf");
        if (my.outputOf && (!outputOf.length || outputOf.hashes()[0] !== my.outputOf)) {
            EventLinks.put(hash, my.outputOf, "outputOf");
            if (outputOf.length) {
                outputOf.removeAll();
            }
        }
        var affects = TrackTrace.get(hash, "affects");
        if (my.affects && (!affects.length || affects.hashes()[0] === my.affects)) {
            TrackTrace.put(hash, my.affects, "affects");
            if (affects.length) {
                affects.removeAll();
            }
        }
        return hash;
    };
    EconomicEvent.prototype.commit = function () {
        return this.updateLinks(_super.prototype.commit.call(this));
    };
    EconomicEvent.prototype.update = function () {
        return this.updateLinks(_super.prototype.update.call(this));
    };
    EconomicEvent.prototype.remove = function () {
        var my = this.myEntry;
        var hash = this.myHash;
        // If the event is removed, its effect is also reversed.
        var affects = TrackTrace.get(hash, "affects");
        if (affects.length) {
            var resource = affects.data()[0];
            var sign = this.action.sign;
            var effect = this.quantity.mul({ units: '', quantity: sign });
            var old = new QuantityValue(resource.currentQuantity);
            var _a = old.sub(effect), units = _a.units, quantity = _a.quantity;
            resource.currentQuantity = { units: units, quantity: quantity };
            update("EconomicResource", resource, my.affects);
            affects.removeAll();
        }
        EventLinks.get(hash).tags("action", "inputOf", "outputOf").removeAll();
        return _super.prototype.remove.call(this);
    };
    // begin mandatory overrides
    EconomicEvent.className = "EconomicEvent";
    EconomicEvent.entryDefaults = Object.assign({}, VfObject.entryDefaults, {
        action: fixtures.Action.Adjust,
        affects: "",
        affectedQuantity: { units: "", quantity: 0 },
        start: 0,
        duration: 0
    });
    return EconomicEvent;
}(VfObject));
/*/
/**/
// <Zome exports> (call() functions)
/* HOLO-SCOPE
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
/* HOLO-SCOPE
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
/*/
/**/

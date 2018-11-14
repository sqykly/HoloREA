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
    var TrackTrace = new common_1.LinkRepo("TrackTrace");
    TrackTrace.linkBack("affects", "affectedBy")
        .linkBack("affectedBy", "affects");
    // </imports>
    // <links>
    var Classifications = new common_1.LinkRepo("Classifications");
    Classifications.linkBack("classifiedAs", "classifies")
        .linkBack("classifies", "classifiedAs");
    exports.EventLinks = new common_1.LinkRepo("EventLinks");
    exports.EventLinks.linkBack("inputs", "inputOf")
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
        Action.entryDefaults = Object.assign({}, common_1.VfObject.entryDefaults, {
            behavior: '0'
        });
        return Action;
    }(common_1.VfObject));
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
        Process.entryDefaults = Object.assign({}, common_1.VfObject.entryDefaults, {});
        return Process;
    }(common_1.VfObject));
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
        TransferClassification.entryDefaults = Object.assign({}, common_1.VfObject.entryDefaults, {});
        return TransferClassification;
    }(common_1.VfObject));
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
                    exports.EventLinks.remove(this.hash, this.myEntry.inputs, "inputs");
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
                    exports.EventLinks.remove(this.hash, current, "outputs");
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
        Transfer.className = "Transfer";
        Transfer.entryDefaults = Object.assign({}, common_1.VfObject.entryDefaults, {
            transferClassifiedAs: "",
            inputs: "",
            outputs: ""
        });
        return Transfer;
    }(common_1.VfObject));
    exports.Transfer = Transfer;
    var EconomicEvent = /** @class */ (function (_super) {
        __extends(EconomicEvent, _super);
        function EconomicEvent(entry, hash) {
            var _this = _super.call(this, entry, hash) || this;
            _this.className = "EconomicEvent";
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
                var to = obj.hash;
                var my = this.myEntry;
                if (!!my.action && to !== my.action) {
                    exports.EventLinks.remove(this.hash, my.action, "action");
                }
                my.action = to;
                this.update();
                exports.EventLinks.put(this.hash, to, "action");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EconomicEvent.prototype, "quantity", {
            get: function () {
                return new common_1.QuantityValue(this.myEntry.affectedQuantity);
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
                var hash = common_1.hashOf(res);
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
        // begin mandatory overrides
        EconomicEvent.className = "EconomicEvent";
        EconomicEvent.entryDefaults = Object.assign({}, common_1.VfObject.entryDefaults, {
            action: "",
            affects: "",
            affectedQuantity: { units: "", quantity: 0 },
            start: 0,
            duration: 0
        });
        return EconomicEvent;
    }(common_1.VfObject));
    exports.EconomicEvent = EconomicEvent;
    // <Zome exports> (call() functions)
    // for <DRY> purposes
    function trackTrace(subjects, tag) {
        return subjects.reduce(function (response, subject) {
            return response.concat(exports.EventLinks.get(subject, tag).hashes());
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
            var instance = Transfer.get(hash);
            return instance.portable();
        });
    }
    function trackEvents(events) {
        return trackTrace(events, "inputOf").map(function (hash) {
            var instance = Transfer.get(hash);
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
            var i = common_1.bisect(times, start);
            objects = objects.slice(i);
        }
        if (end) {
            var i = common_1.bisect(times, end);
            objects = objects.slice(0, i);
        }
        if (order === "down")
            objects = objects.reverse();
        return objects.map(function (ev) { return ev.portable(); });
    }
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
            qvs[ur] = new common_1.QuantityValue({ units: "", quantity: 0 });
            resourceHashes.push(ur);
        });
        var subs = events.map(function (ev) {
            var _a;
            var item = { event: ev.portable(), subtotals: qvs }, sign = ev.action.sign, quantity = ev.quantity.mul({ units: "", quantity: sign }), res = common_1.hashOf(ev.affects);
            qvs = Object.assign({}, qvs, (_a = {}, _a[res] = qvs[res].add(quantity), _a));
            return item;
        });
        return { events: subs, totals: qvs, resources: resourceHashes };
    }
    // <fixtures>
    var fixtures = {
        Action: {
            Give: new Action({ name: "Give", behavior: '-' }).commit(),
            Receive: new Action({ name: "Receive", behavior: '+' }).commit(),
            Adjust: new Action({ name: "Adjust", behavior: '+' }).commit()
        },
        TransferClassification: {
            Stub: new TransferClassification({
                name: "Transfer Classification Stub"
            })
        }
    };
    function getFixtures(dontCare) {
        return fixtures;
    }
    // </fixures>
    function resourceCreationEvent(_a) {
        var resource = _a.resource, dates = _a.dates;
        var adjustHash = fixtures.Action.Adjust;
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
            var resClass = common_1.notError(get(resource.resourceClassifiedAs));
            qv.units = resClass.defaultUnits;
        }
        var resHash = common_1.notError(commit("EconomicResource", resource));
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
        var it, err;
        try {
            it = EconomicEvent.create(init);
            var affect = it.affects;
        }
        catch (e) {
            err = e;
        }
        return {
            error: err,
            hash: it.hash,
            entry: it.entry
        };
    }
    function createTransfer(init) {
        var it, err;
        try {
            it = Transfer.create(init);
        }
        catch (e) {
            err = e;
        }
        return {
            error: err,
            hash: it.hash,
            entry: it.entry
        };
    }
    function createTransferClass(init) {
        var it, err;
        try {
            it = TransferClassification.create(init);
        }
        catch (e) {
            err = e;
        }
        return {
            error: err,
            hash: it.hash,
            entry: it.entry
        };
    }
    function createAction(init) {
        var it, err;
        try {
            it = Action.create(init);
        }
        catch (e) {
            err = e;
        }
        return {
            error: err,
            hash: it.hash,
            entry: it.entry
        };
    }
});

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
        Agent.entryDefaults = Object.assign({}, common_1.VfObject.entryDefaults, {
            primaryLocation: ["middle of nowhere", "placeville, XX 12345"]
        });
        return Agent;
    }(common_1.VfObject));
    var AgentProperty = new common_1.LinkRepo("AgentProperty");
    // <zome> public functions
    function createAgent(props) {
        var it, err;
        try {
            it = common_1.notError(Agent.create(props));
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
            var classDict = {}, stuffHeHas = AgentProperty.get(agentHash, "owns").types("EconomicResource");
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
});

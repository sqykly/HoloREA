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
// <reference path="../common/common.ts"/>
// <reference path="../resources/resources.ts"/>
//* IMPORT
//import { HoloObject, LinkRepo, Hash, VfObject, PhysicalLocation, Dict, CrudResponse, notError } from "../../../lib/ts/common";
require("../common/common");
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
/*/
/**/
// <zome> public functions
/* HOLO-SCOPE
function createAgent(props?: typeof Agent.entryType): CrudResponse<typeof Agent.entryType> {
  let it: Agent, err: Error;
  try {
    it = notError<Agent>(Agent.create(props));
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


function getOwnedResources(
  {agents, types}: {agents: Hash<Agent>[], types?: Hash<resources.ResourceClassification>[]}
): {
  [agent: string]: { [classification: string]: Hash<resources.EconomicResource>[] }
} {
  //              [agent][class][resource]
  let agentDicts: Dict<Dict<Hash<resources.EconomicResource>[]>> = {},
    typeSet: Set<Hash<resources.ResourceClassification>> = null;
  if (types) {
    typeSet = new Set(types);
  }
  // This is going to have to be a query-filter-collate.
  for (let agentHash of agents) {

    let classDict: Dict<Hash<resources.EconomicResource>[]> = {},
      stuffHeHas = AgentProperty.get(agentHash, "owns").types<resources.EconomicResource>("EconomicResource");

    stuffHeHas.data().forEach((resource: resources.EconomicResource, index: number) => {
      let type = resource.resourceClassifiedAs;
      if (!types || typeSet.has(type)) {
        let instances = classDict[type] || [];
        instances.push(stuffHeHas[index].Hash);
        classDict[type] = instances;
      }
    });

    agentDicts[agentHash] = classDict;
  }

  return agentDicts;
}
/*/
/**/

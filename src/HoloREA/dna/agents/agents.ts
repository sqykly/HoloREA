import { HoloObject, LinkRepo, Hash, VfObject, PhysicalLocation, Dict, CrudResponse, notError } from "../../../lib/ts/common";
import resources from "../resources/resources";

/**
 * A Holo-zome defining functions that deal with agents, relationships, and locations
 */

interface AgentEntry {
  primaryLocation: PhysicalLocation;
  name: string;
}

class Agent<T = {}> extends VfObject<T & AgentEntry & typeof VfObject.entryType> {
  static className = "Agent";
  className = "Agent";
  static entryType: AgentEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <AgentEntry> {
      primaryLocation: [`middle of nowhere`, `placeville, XX 12345`]
    });

  static get(hash: Hash<Agent>): Agent {
    return <Agent> super.get(hash);
  }
  static create(entry: AgentEntry & typeof VfObject.entryType): Agent {
    return <Agent> super.create(entry);
  }
  constructor(entry?: T & AgentEntry & typeof VfObject.entryType, hash?: Hash<Agent>) {
    super(entry, hash);
  }


}

interface ScopeEntry {
  agent: Hash<Agent>
}

class Scope<T = {}> extends HoloObject<T & ScopeEntry & typeof HoloObject.entryType> {
  static className = "Scope";
  className = "Scope";
  static entryType: ScopeEntry & typeof HoloObject.entryType;
  static entryDefaults = Object.assign({}, HoloObject.entryDefaults, <ScopeEntry> {
      property: defaultValue
    });

  static get(hash: Hash<Scope>): Scope {
    return <Scope> super.get(hash);
  }
  static create(entry: ScopeEntry & typeof HoloObject.entryType): Scope {
    return <Scope> super.create(entry);
  }
  constructor(entry?: T & ScopeEntry & typeof HoloObject.entryType, hash?: Hash<Scope>) {
    super(entry, hash);
  }


}


export const AgentProperty = new LinkRepo<Agent, resources.EconomicResource, "owns">("AgentProperty");
export const Scopes

namespace zome {
  export type Agent = typeof Agent.entryType;
}

export default zome;

// <zome> public functions

export function createAgent(props?: typeof Agent.entryType): CrudResponse<typeof Agent.entryType> {
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


export function getOwnedResources(
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

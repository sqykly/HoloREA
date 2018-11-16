import "../es6";
import "../uncommon";
import "../resources/";

/**
 * A Holo-zome defining functions that deal with agents, relationships, and locations
 */

interface AgentEntry {
  primaryLocation: PhysicalLocation;
  name: string;
}

class Agent<T = {}> extends VfObject<T & AgentEntry & typeof VfObject.entryType> {
  static className: string;
  className: string;
  static entryType: AgentEntry & typeof VfObject.entryType;
  static entryDefaults: typeof VfObject.entryDefaults & AgentEntry;

  static get(hash: Hash<Agent>): Agent;
  static create(entry: AgentEntry & typeof VfObject.entryType): Agent;
  constructor(entry?: T & AgentEntry & typeof VfObject.entryType, hash?: Hash<Agent>);

}

const AgentProperty: LinkRepo<Agent, resources.EconomicResource>;

declare namespace agents {
  export type Agent = typeof Agent.entryType;
  export type AgentProperty = typeof AgentProperty;
}

// <zome> public functions

function createAgent(props?: typeof Agent.entryType): CrudResponse<typeof Agent.entryType>;

function getOwnedResources(
  {agents, types}: {agents: Hash<Agent>[], types?: Hash<resources.ResourceClassification>[]}
): {
  [agent: string]: { [classification: string]: Hash<resources.EconomicResource>[] }
};

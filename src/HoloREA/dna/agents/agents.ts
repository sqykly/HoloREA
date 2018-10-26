import { HoloObject, LinkRepo, Hash, VfObject, PhysicalLocation } from "../../../lib/ts/common";

/**
 * A Holo-zome defining functions that deal with agents, relationships, and locations
 */

interface AgentEntry {
  primaryLocation: PhysicalLocation;
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

namespace zome {
  export type Agent = typeof Agent.entryType;
}

export default zome;

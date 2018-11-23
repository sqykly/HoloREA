import "../common/common";
import "../resources/resources";
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
    static entryDefaults: VfEntry & object;
    static get(hash: Hash<Agent>): Agent;
    static create(entry: AgentEntry & typeof VfObject.entryType): Agent;
    constructor(entry?: T & AgentEntry & typeof VfObject.entryType, hash?: Hash<Agent>);
}
const AgentProperty: LinkRepo<agents.Agent, resources.EconomicResource, "owns">;
declare global {
    namespace agents {
        type Agent = typeof Agent.entryType;
        type AgentProperty = typeof AgentProperty;
    }
}
export default agents;

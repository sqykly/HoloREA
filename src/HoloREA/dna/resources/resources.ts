import "../../../lib/ts/common";
import { LinkRepo, VfObject, QuantityValue, Hash, QVlike } from "../../../lib/ts/common";
import events from "../events/events";
import agents from "../agents/agents";

type Action = events.Action;
type EconomicEvent = events.EconomicEvent;
type TransferClassification = events.TransferClassification;
type Transfer = events.Transfer;
const EventLinks: events.EventLinks = new LinkRepo(`EventLinks`);
const XferClasses: events.Classifications = new LinkRepo(`Classifications`);
type Agent = agents.Agent;


class ResourceClassification extends VfObject {};

const ResourceClasses = new LinkRepo<
  EconomicResource|ResourceClassification,
  EconomicResource|ResourceClassification,
  "classifiedAs"|"classifies">("ResourceClasses");
ResourceClasses.linkBack("classifiedAs","classifies")
  .linkBack("classifies", "classifiedAs");


interface ErEntry {
  currentQuantity: QVlike;
  resourceClassifiedAs: string; //Hash<ResourceClassification>;
  underlyingResource?: Hash<EconomicResource>;
  contains?: Hash<EconomicResource>;
  trackingIdentifier?: string;
  quantityLastCalculated?: number;
  // TODO agent resource roles when they are established
  owner: Hash<Agent>
}


class EconomicResource<T = {}> extends VfObject<T & ErEntry & typeof VfObject.entryType> {
  // <- mandatory overrides
  className:string = "EconomicResource";
  static className = "EconomicResource";
  static entryType: typeof VfObject.entryType & ErEntry;
  //protected myEntry: ErEntry & T & typeof VfObject.entryType;
  static get(hash: Hash<EconomicResource>): EconomicResource {
    return <EconomicResource> super.get(hash);
  }
  constructor(entry: T & ErEntry & typeof VfObject.entryType | null, hash?: Hash<EconomicResource>) {
    super(entry, hash);
  }
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, {
    currentQuantity: {units: "", quantity: 0},
    resourceClassifiedAs: `SomeKindOfResource`,
    quantityLastCalculated: Date.now()
  });
  // mandatory overrides ->

  remove(msg?: string): this {
    const my = this.myEntry;
    if (my.resourceClassifiedAs) {
      ResourceClasses.remove(this.myHash, my.resourceClassifiedAs, `classifiedAs`);
    }
    TrackTrace.get(this.myHash, `affectedBy`).removeAll();
    return super.remove(msg);
  }

  trace(): Hash<EconomicEvent>[] {
    let links = TrackTrace.get(this.myHash, `affectedBy`);
    let eEvents = links.types<EconomicEvent>("EconomicEvent");
    // I hate this a lot.
    return <Hash<EconomicEvent>[]> call(`events`, `sortEvents`, {events: eEvents.hashes(), order: `up`, by: `end` });
  }
}

const TrackTrace = new LinkRepo<EconomicResource|EconomicEvent, EconomicEvent|EconomicResource, "affects"|"affectedBy">("TrackTrace");
TrackTrace.linkBack("affects", "affectedBy")
  .linkBack("affectedBy", "affects");

namespace zome {
  export type EconomicResource = typeof EconomicResource.entryType;
  export type TrackTrace = typeof TrackTrace;
}
export default zome;

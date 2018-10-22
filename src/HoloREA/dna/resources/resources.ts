import "../../../lib/ts/common";
import { LinkRepo, VfObject, QuantityValue, Hash, QVlike } from "../../../lib/ts/common";
import { EconomicEvent, Transfer, Process, Action } from "../events/events";

export class ResourceClassification extends VfObject {};

export const ResourceClasses = new LinkRepo<
  EconomicResource|ResourceClassification,
  EconomicResource|ResourceClassification,
  "classifiedAs"|"classifies">("ResourceClasses");
ResourceClasses.linkBack("classifiedAs", ResourceClasses, "classifies")
  .linkBack("classifies", ResourceClasses, "classifiedAs");


declare interface ErEntry {
  currentQuantity: QVlike;
  resourceClassifiedAs: Hash<ResourceClassification>;
  underlyingResource?: Hash<EconomicResource>;
  contains?: Hash<EconomicResource>;
  trackingIdentifier?: string;
}

export class EconomicResource<T = {}> extends VfObject<T & ErEntry & typeof VfObject.entryType> {
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
    resourceClassifiedAs: ``
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

  trace() {
    let links = TrackTrace.get(this.myHash, `affectedBy`);
    let events = links.types<EconomicEvent>(EconomicEvent.className).data();
    
    // TODO
  }
}

export const TrackTrace = new LinkRepo<EconomicResource|EconomicEvent, EconomicEvent|EconomicResource, "affects"|"affectedBy">("TrackTrace");
TrackTrace.linkBack("affects", TrackTrace, "affectedBy")
  .linkBack("affectedBy", TrackTrace, "affects");

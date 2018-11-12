import "../../../lib/ts/common";
import { LinkRepo, VfObject, QuantityValue, Hash, QVlike, notError, CrudResponse, PhysicalLocation, HoloThing, entryOf } from "../../../lib/ts/common";
import events from "../events/events";
import agents, { AgentProperty } from "../agents/agents";

type Action = events.Action;
type EconomicEvent = events.EconomicEvent;
type TransferClassification = events.TransferClassification;
type Transfer = events.Transfer;
const EventLinks: events.EventLinks = new LinkRepo(`EventLinks`);
const XferClasses: events.Classifications = new LinkRepo(`Classifications`);
type Agent = agents.Agent;

interface RcEntry {
  /**
   * New instances of the resource will have these units unless overriden on
   * the instance itself.  Non-standard.
   * @type {string}
   */
  defaultUnits: string;
}

/**
 * Represents a category of resources.  For now, it merely provides the default unit
 * for quantities of resources in this class.
 * @extends HoloObject
 */
export class ResourceClassification<T = {}> extends VfObject<T & RcEntry & typeof VfObject.entryType> {
  static className = "ResourceClassification";
  className = "ResourceClassification";
  static entryType: RcEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <RcEntry> {
      defaultUnits: ''
    });

  static get(hash: Hash<ResourceClassification>): ResourceClassification {
    return <ResourceClassification> super.get(hash);
  }
  static create(entry: RcEntry & typeof VfObject.entryType): ResourceClassification {
    return <ResourceClassification> super.create(entry);
  }
  constructor(entry?: T & RcEntry & typeof VfObject.entryType, hash?: Hash<ResourceClassification>) {
    super(entry, hash);
  }

  instance(properties: typeof EconomicResource.entryType): EconomicResource {
    let {units, quantity} = properties.currentQuantity,
      my = this.myEntry;
    if (!units) {
      units = my.defaultUnits;
    } else if (units !== my.defaultUnits) {
      throw new TypeError(`Quantity of resources of class ${my.name || my.url} is expressed in ${my.defaultUnits}, not ${units}`);
    }
    return EconomicResource.create({
      resourceClassifiedAs: this.hash,
      currentQuantity: {units, quantity},
      underlyingResource: properties.underlyingResource,
      contains: properties.contains,
      trackingIdentifier: properties.trackingIdentifier,
      quantityLastCalculated: properties.quantityLastCalculated,
      owner: properties.owner
    });
  }

  get defaultUnits(): string {
    return this.myEntry.defaultUnits;
  }
}


export const ResourceClasses = new LinkRepo<
  EconomicResource|ResourceClassification,
  EconomicResource|ResourceClassification,
  "classifiedAs"|"classifies"
>("ResourceClasses");
ResourceClasses
  .linkBack("classifiedAs","classifies")
  .linkBack("classifies", "classifiedAs");

export const ResourceRelationships = new LinkRepo<
  EconomicResource,
  EconomicResource,
  "underlyingResource"|"contains"|"underlies"|"inside"
>("ResourceRelationships");

ResourceRelationships
  .linkBack(`underlyingResource`, `underlies`)
  .linkBack(`underlies`, `underlyingResource`)
  .linkBack(`contains`, `inside`)
  .linkBack(`inside`, `contains`);

interface ErEntry {
  currentQuantity: QVlike;
  currentLocation: PhysicalLocation;
  resourceClassifiedAs: Hash<ResourceClassification>; //Hash<ResourceClassification>;
  underlyingResource?: Hash<EconomicResource>;
  contains?: Hash<EconomicResource>;
  trackingIdentifier?: string;
  quantityLastCalculated: number;
  // TODO agent resource roles when they are established
  owner: Hash<Agent>
}

export class EconomicResource<T = {}> extends VfObject<T & ErEntry & typeof VfObject.entryType> {
  // <mandatory overrides>
  className:string = "EconomicResource";
  static className = "EconomicResource";
  static entryType: typeof VfObject.entryType & ErEntry;

  static get(hash: Hash<EconomicResource>): EconomicResource {
    return <EconomicResource> super.get(hash);
  }

  static create(entry: ErEntry & typeof VfObject.entryType): EconomicResource {
    let rc = notError(ResourceClassification.get(entry.resourceClassifiedAs));

    if (entry.currentQuantity) {
      if (!entry.currentQuantity.units) {
        entry.currentQuantity.units = rc.defaultUnits;
      }
    } else {
      entry.currentQuantity = {units: rc.defaultUnits, quantity: 0};
    }

    let it = super.create(entry);
    if (rc) {
      ResourceClasses.put(it.hash, rc.hash, "classifiedAs");
    }
    if (entry.owner) {
      AgentProperty.put(entry.owner, it.hash, "owns");
    }
    if (entry.underlyingResource) {
      ResourceRelationships.put(it.hash, entry.underlyingResource, "underlyingResource");
    }
    if (entry.contains) {
      ResourceRelationships.put(it.hash, entry.contains, "contains");
    }

    return <EconomicResource> it;
  }
  protected constructor(entry: T & ErEntry & typeof VfObject.entryType | null, hash?: Hash<EconomicResource>) {
    super(entry, hash);
  }
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, {
    currentQuantity: {units: '', quantity: 0},
    resourceClassifiedAs: ``,
    quantityLastCalculated: 0
  });

  // </mandatory overrides>

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

export const TrackTrace = new LinkRepo<EconomicResource|EconomicEvent, EconomicEvent|EconomicResource, "affects"|"affectedBy">("TrackTrace");
TrackTrace.linkBack("affects", "affectedBy")
  .linkBack("affectedBy", "affects");

namespace zome {
  export type EconomicResource = typeof EconomicResource.entryType;
  export type ResourceClassification = typeof ResourceClassification.entryType;
  export type TrackTrace = typeof TrackTrace;
}
export default zome;

// public <zome> functions

/**
 * Retrieves the hashes of all EconomicResource instances classified as given.
 * @param {Hash<ResourceClassification>} classification the classification to
 *  get instances of.
 * @returns {Hash<EconomicResource>[]}
 */
export function getResourcesInClass(
  {classification}:
  {classification: Hash<ResourceClassification>}
): Hash<EconomicResource>[] {
  return ResourceClasses.get(classification, `classifies`).hashes();
}

export function getAffectingEvents({resource}: {resource: Hash<EconomicResource>}): Hash<EconomicEvent>[] {
  return TrackTrace.get(resource, "affectedBy").types<EconomicEvent>("EconomicEvent").hashes();
}

// CRUD

export function createEconomicResource(
  {properties: props, event: thing}: {
    properties: zome.EconomicResource,
    event: HoloThing<events.EconomicEvent>
  }
): CrudResponse<typeof EconomicResource.entryType> {
  let it: EconomicResource, err: Error;
  let event: events.EconomicEvent;
  if (thing) {
    event = entryOf(thing);
  }
  if (!event) {
    let crud = <ReturnType<events.resourceCreationEvent>>
      call(`events`, `resourceCreationEvent`, {
        resource: props
      });
    if (crud.error) {
      throw crud.error;
    }
    event = crud.entry;
    let res = EconomicResource.get(event.affects);
    // that's all we needed to do to sync up its links.
    res.update();
    return res.portable();
  }

  let resQv = props.currentQuantity;
  let evQv = event.affectedQuantity;
  if (resQv && evQv) {
    if (resQv.units !== evQv.units) {
      // TODO
    }
  }
  try {
    it = notError<EconomicResource>(EconomicResource.create(props));
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

export function createResourceClassification(props?: typeof ResourceClassification.entryType): CrudResponse<typeof ResourceClassification.entryType> {
  let it: ResourceClassification, err: Error;
  try {
    it = notError<ResourceClassification>(ResourceClassification.create(props));
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

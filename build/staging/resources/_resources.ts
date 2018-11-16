/* IMPORTS
import { LinkRepo, VfObject, QuantityValue, Hash, QVlike, notError, CrudResponse, PhysicalLocation, HoloThing, entryOf, hashOf } from "../../../lib/ts/common";
import events from "../events/events";
import agents from "../agents/agents";
/*/
/**/

// <links>
// <imported from events>
const EventLinks: events.EventLinks = new LinkRepo(`EventLinks`);
EventLinks.linkBack("inputs", "inputOf")
  .linkBack("outputs", "outputOf")
  .linkBack("inputOf", "inputs")
  .linkBack("outputOf", "outputs")
  .linkBack("action", "actionOf")
  .linkBack("actionOf", "action");

const XferClasses: events.Classifications = new LinkRepo(`Classifications`);
XferClasses.linkBack("classifiedAs", "classifies")
  .linkBack("classifies", "classifiedAs");

// </imported from agents/>

const AgentProperty: agents.AgentProperty = new LinkRepo(`AgentProperty`);

// </imported>

// <own> links
const ResourceClasses = new LinkRepo<
  EconomicResource|ResourceClassification,
  EconomicResource|ResourceClassification,
  "classifiedAs"|"classifies"
>("ResourceClasses");
ResourceClasses
  .linkBack("classifiedAs","classifies")
  .linkBack("classifies", "classifiedAs");

const ResourceRelationships = new LinkRepo<
  EconomicResource,
  EconomicResource,
  "underlyingResource"|"contains"|"underlies"|"inside"
>("ResourceRelationships");
ResourceRelationships
  .linkBack(`underlyingResource`, `underlies`)
  .linkBack(`underlies`, `underlyingResource`)
  .linkBack(`contains`, `inside`)
  .linkBack(`inside`, `contains`);

const TrackTrace = new LinkRepo<EconomicResource|events.EconomicEvent, events.EconomicEvent|EconomicResource, "affects"|"affectedBy">("TrackTrace");
TrackTrace.linkBack("affects", "affectedBy")
  .linkBack("affectedBy", "affects");

// </own> </links>

// <classes>
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
class ResourceClassification<T = {}> extends VfObject<T & RcEntry & typeof VfObject.entryType> {
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
    } else if (!!my.defaultUnits && units !== my.defaultUnits) {
      throw new TypeError(`Quantity of resources of class ${my.name || my.url} is expressed in ${my.defaultUnits}, not ${units}`);
    }
    return EconomicResource.create({
      resourceClassifiedAs: this.hash,
      currentQuantity: {units, quantity},
      underlyingResource: properties.underlyingResource,
      contains: properties.contains,
      trackingIdentifier: properties.trackingIdentifier,
      owner: properties.owner
    });
  }

  get defaultUnits(): string {
    return this.myEntry.defaultUnits;
  }

  instances(): EconomicResource[] {
    return ResourceClasses.get(this.myHash, `classifies`)
      .types<typeof EconomicResource.entryType>(`EconomicResource`)
      .hashes().map(erh => EconomicResource.get(erh));
  }

}



interface ErEntry {
  currentQuantity: QVlike;
  resourceClassifiedAs: Hash<ResourceClassification>; //Hash<ResourceClassification>;
  underlyingResource?: Hash<EconomicResource>;
  contains?: Hash<EconomicResource>;
  trackingIdentifier?: string;
  //quantityLastCalculated: number;
  // TODO agent resource roles when they are established
  owner: Hash<agents.Agent>
}

class EconomicResource<T = {}> extends VfObject<T & ErEntry & typeof VfObject.entryType> {
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

  trace(): Hash<events.EconomicEvent>[] {
    let links = TrackTrace.get(this.myHash, `affectedBy`);
    let eEvents = links.types<events.EconomicEvent>("EconomicEvent");
    // I hate this a lot.
    return <Hash<events.EconomicEvent>[]> call(`events`, `sortEvents`, {events: eEvents.hashes(), order: `up`, by: `end` });
  }

  get currentQuantity(): QuantityValue {
    return new QuantityValue(this.myEntry.currentQuantity);
  }
  set currentQuantity(to: QuantityValue) {
    let {units, quantity} = to;
    this.myEntry.currentQuantity = {units, quantity};
  }
}
// </classes>

// <export>

namespace zome {
  export type EconomicResource = typeof EconomicResource.entryType;
  export type ResourceClassification = typeof ResourceClassification.entryType;
  export type TrackTrace = typeof TrackTrace;
  export type ResourceClasses = typeof ResourceClasses;
  export type ResourceRelationships = typeof ResourceRelationships;
}
/* IMPORT
export default zome;
/*/
/**/

// </export>

// <fixtures>
const fixtures = {
  ResourceClassification: {
    Currency: new ResourceClassification({name: `Currency`, defaultUnits: ``}).commit(),
    Work: new ResourceClassification({name: `Work`, defaultUnits: `hours`}).commit(),
    Idea: new ResourceClassification({name: `Idea`, defaultUnits: `citations`}).commit()
  }
}
// </fixtures>

// public <zome> functions

/**
 * Retrieves the hashes of all EconomicResource instances classified as given.
 * @param {Hash<ResourceClassification>} classification the classification to
 *  get instances of.
 * @returns {Hash<EconomicResource>[]}
 */
function getResourcesInClass(
  {classification}:
  {classification: Hash<ResourceClassification>}
): Hash<EconomicResource>[] {
  return ResourceClasses.get(classification, `classifies`).hashes();
}

function getAffectingEvents({resource}: {resource: Hash<EconomicResource>}): Hash<events.EconomicEvent>[] {
  return TrackTrace.get(resource, "affectedBy").types<events.EconomicEvent>("EconomicEvent").hashes();
}

// CRUD

function createEconomicResource(
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
      return {
        error: crud.error,
        entry: null,
        type: `Error`,
        hash: ``
      };
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
      if (!resQv.units && resQv.quantity === 0) {
        resQv.quantity = evQv.quantity;
        resQv.units = evQv.units;
      } else if (!evQv.units && evQv.quantity === 0) {
        evQv.units = resQv.units;
        evQv.quantity = resQv.quantity;
      } else {
        err = new TypeError(`Can't create resource in ${resQv.units} from event in ${evQv.units}`);
      }
    }
    if (!err) {
      props.currentQuantity = resQv;
      event.affectedQuantity = evQv;
    }
  }
  if (!err) try {
    it = notError<EconomicResource>(EconomicResource.create(props));
    event.affects = it.hash;
    call(`events`, `createEconomicResource`, event);
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

function createResourceClassification(props?: typeof ResourceClassification.entryType): CrudResponse<typeof ResourceClassification.entryType> {
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

function getFixtures(dontCare: {}): typeof fixtures {
  return fixtures;
}

function affect({resource, quantity}:{
  resource: HoloThing<zome.EconomicResource>,
  quantity: QVlike
}): CrudResponse<zome.EconomicResource> {
  let err: Error, hash: Hash<zome.EconomicResource>, res:EconomicResource;
  try {
    res = EconomicResource.get(hashOf(resource));
    hash = res.open((entry) => {
      let current = res.currentQuantity.add(quantity);
      res.currentQuantity = current;
      return entry;
    }).update();
  } catch (e) {
    err = e;
  }

  return {
    error: err,
    hash: hash || (res && res.hash) || '',
    entry: (res && res.entry) || entryOf(resource),
    type: (res && res.className) || `Who knows what this thing is?!`
  };
}

// </zome>

// <callbacks>
function genesis() {
  return true;
}

// </callbacks>

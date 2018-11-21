// <reference path="../common/common"/>
// <reference path="../agents/agents"/>
// <reference path="../events/events"/>
//* IMPORT
//import { LinkRepo, VfObject, QuantityValue, Hash, QVlike, notError, CrudResponse, PhysicalLocation, HoloThing, entryOf, hashOf } from "../../../lib/ts/common";
import { LinkRepo, VfObject, QuantityValue, Hash, QVlike, notError, CrudResponse, PhysicalLocation, HoloThing, entryOf, hashOf } from "../common/common";
import events from "../events/events";
import agents from "../agents/agents";
/*/
/**/

/* TYPE-SCOPE
//import "../common/common";
//import "../events/events";
//import "../agents/agents";
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
const ResourceClasses: LinkRepo<
  resources.EconomicResource|resources.ResourceClassification,
  resources.EconomicResource|resources.ResourceClassification,
  "classifiedAs"|"classifies"
> = new LinkRepo("ResourceClasses");
ResourceClasses
  .linkBack("classifiedAs","classifies")
  .linkBack("classifies", "classifiedAs");

const ResourceRelationships: LinkRepo<
  resources.EconomicResource,
  resources.EconomicResource,
  "underlyingResource"|"contains"|"underlies"|"inside"
> = new LinkRepo("ResourceRelationships");
ResourceRelationships
  .linkBack(`underlyingResource`, `underlies`)
  .linkBack(`underlies`, `underlyingResource`)
  .linkBack(`contains`, `inside`)
  .linkBack(`inside`, `contains`);

const TrackTrace: LinkRepo<
  resources.EconomicResource|events.EconomicEvent,
  events.EconomicEvent|resources.EconomicResource,
"affects"|"affectedBy">
= new LinkRepo("TrackTrace");
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
  set defaultUnits(to: string) {
    this.myEntry.defaultUnits = to;
  }

  instances(): EconomicResource[] {
    return ResourceClasses.get(this.myHash)
      .tags<resources.EconomicResource>(`classifies`)
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
    const it = <EconomicResource> super.get(hash);
    const my = it.myEntry;

    const owners = AgentProperty.get(my.owner, `owns`).select(({hash}) => hash === it.myHash);
    if (my.owner && !owners.length) {
      throw new Error(`resource was re-assigned ownership, but can't recover new owner`);
    }

    const underlying = ResourceRelationships.get(hash, `underlyingResource`);
    if (underlying.length) {
      const mine = underlying.select(({hash: link}) => link === my.underlyingResource);
      let more = underlying.select(({hash: link}) => link !== my.underlyingResource);
      if (more.length) {
        mine.removeAll();
        let pop: Hash<EconomicResource> = more.hashes()[0];
        more.select(({hash: link}) => link !== pop).removeAll();
        my.underlyingResource = pop;
      } else if (!mine.length) {
        my.underlyingResource = null;
      }
    }

    const contains = ResourceRelationships.get(hash, `contains`);
    if (contains.length) {
      const mine = contains.select(({hash: link}) => link === my.contains);
      let more = contains.select(({hash: link}) => link !== my.contains);
      if (more.length) {
        mine.removeAll()
        let pop = more.hashes()[0];
        more.select(({hash: link}) => link !== pop).removeAll();
        my.contains = pop;
      } else if (!mine.length) {
        my.contains = null;
      }
    }

    const classy = ResourceClasses.get(hash, `classifiedAs`);
    if (classy.length) {
      const mine = classy.select(({hash: link}) => link === my.resourceClassifiedAs);
      let more = classy.select(({hash: link}) => link !== my.resourceClassifiedAs);
      if (more.length) {
        mine.removeAll()
        let pop = more.hashes()[0];
        more.select(({hash: link}) => link !== pop).removeAll();
        my.resourceClassifiedAs = pop;
      } else if (!mine.length) {
        my.resourceClassifiedAs = null;
      }
    }

    it.update();
    return it;
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

    let it = <EconomicResource> super.create(entry);
    it.updateLinks();

    return it;
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

  get underlyingResource(): EconomicResource {
    return EconomicResource.get(this.myEntry.underlyingResource);
  }
  set underlyingResource(to: EconomicResource) {
    this.myEntry.underlyingResource = to && to.hash;
  }

  get contains(): EconomicResource {
    return EconomicResource.get(this.myEntry.contains);
  }
  set contains(to: EconomicResource) {
    this.myEntry.contains = to && to.hash;
  }

  get classification(): ResourceClassification {
    return ResourceClassification.get(this.myEntry.resourceClassifiedAs);
  }
  set classification(to: ResourceClassification) {
    this.myEntry.resourceClassifiedAs = to && to.hash;
  }

  get owner(): Hash<agents.Agent> {
    return this.myEntry.owner;
  }
  set owner(to: Hash<agents.Agent>) {
    this.owner = to || null;
  }

  protected updateLinks(hash?: Hash<this>): Hash<this> {
    hash = hash || this.myHash;
    const my = this.myEntry;

    let relationships = ResourceRelationships.get(hash);

    let underlying = relationships.tags(`underlyingResource`);
    if (my.underlyingResource && (!underlying.length || underlying.hashes()[0] !== my.underlyingResource)) {
      ResourceRelationships.put(hash, my.underlyingResource, `underlyingResource`);
      underlying.removeAll();
    }

    let contains = relationships.tags(`contains`);
    if (my.contains && (!contains.length || contains.hashes()[0] !== my.contains)) {
      ResourceRelationships.put(hash, my.contains, `contains`);
      contains.removeAll();
    }

    let classy = ResourceClasses.get(hash, `classifiedAs`);
    let myClass = my.resourceClassifiedAs;
    if (myClass && (!classy.length || classy.hashes()[0] !== myClass)) {
      ResourceClasses.put(hash, myClass, `classifiedAs`);
      classy.removeAll();
    }

    if (my.owner) {
      let owner = AgentProperty.get(my.owner, `owns`).select(({hash}) => hash === this.myHash);
      if (!owner.length) {
        AgentProperty.put(my.owner, hash, `owns`);
      }
    }

    return hash;
  }

  remove(msg?: string): this {
    const my = this.myEntry;
    if (my.resourceClassifiedAs) {
      ResourceClasses.remove(this.myHash, my.resourceClassifiedAs, `classifiedAs`);
    }
    TrackTrace.get(this.myHash, `affectedBy`).removeAll();

    let relations = ResourceRelationships.get(this.myHash);
    let internal = relations.tags(`underlyingResource`, `contains`);
    let external = relations.tags(`underlies`, `inside`);
    internal.removeAll();

    for (let underlies of external.tags(`underlies`).hashes()) {
      let res = EconomicResource.get(underlies);
      res.underlyingResource = null;
    }
    for (let inside of external.tags(`inside`).hashes()) {
      let res = EconomicResource.get(inside);
      res.contains = null;
    }

    return super.remove(msg);
  }

  update(): Hash<this> {
    return this.updateLinks(super.update());
  }

  commit(): Hash<this> {
    return this.updateLinks(super.commit());
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

//* TYPE-SCOPE
declare global {
/*/
/**/
namespace resources {
  export type EconomicResource = typeof EconomicResource.entryType;
  export type ResourceClassification = typeof ResourceClassification.entryType;
  export type TrackTrace = typeof TrackTrace;
  export type ResourceClasses = typeof ResourceClasses;
  export type ResourceRelationships = typeof ResourceRelationships;
}
//* TYPE-SCOPE
}
/*/
/**/
//* EXPORT
export default resources;
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
//* HOLO-SCOPE
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

function createResource(
  {properties: props, event: thing}: {
    properties: resources.EconomicResource,
    event: HoloThing<events.EconomicEvent>
  }
): CrudResponse<typeof EconomicResource.entryType> {
  let it: EconomicResource, err: Error;
  let event: events.EconomicEvent;
  if (thing) {
    event = entryOf(thing);
  }
  if (!event) {
    let crud = <CrudResponse<events.EconomicEvent>>
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
  resource: HoloThing<resources.EconomicResource>,
  quantity: QVlike
}): CrudResponse<resources.EconomicResource> {
  let err: Error, hash: Hash<resources.EconomicResource>, res:EconomicResource;
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

// callbacks
function genesis() {
  // YAGNI
  return true;
}

function validateCommit(entryType, entry, header, pkg, sources) {
  // check against schema: YAGNI
  return true;
}

function validatePut(entryType, entry, header, pkg, sources) {
  // check for data sanity: YAGNI
  return validateCommit(entryType, entry, header, pkg, sources);
}

function validateMod(entryType, entry, header, replaces, pkg, sources) {
  // messages are immutable for now.
  return true;
}

function validateDel(entryType, hash, pkg, sources) {
  // messages are permanent for now
  return true;
}

function validateLink(entryType, hash, links, pkg, sources) {
  return true;
}

function validatePutPkg(entryType) {
  // don't care.
  return null;
}

function validateModPkg(entryType) {
  // can't happen, don't care
  return null;
}

function validateDelPkg(entryType) {
  // can't happen, don't care
  return null;
}

function validateLinkPkg(entryType) {
  // can't happen, don't care
  return null;
}

// </callbacks>
/*/
/**/

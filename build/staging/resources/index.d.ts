import "../uncommon";
import "../events/";
import "../agents/";

// <links>
// <imported from events>
const EventLinks: events.EventLinks;
const XferClasses: events.Classifications;
// </imported from agents/>

const AgentProperty: agents.AgentProperty;

// </imported>

// <own> links
const ResourceClasses: LinkRepo<
  EconomicResource|ResourceClassification,
  EconomicResource|ResourceClassification,
  "classifiedAs"|"classifies"
>

const ResourceRelationships: LinkRepo<
  EconomicResource,
  EconomicResource,
  "underlyingResource"|"contains"|"underlies"|"inside"
>

const TrackTrace: LinkRepo<EconomicResource|events.EconomicEvent, events.EconomicEvent|EconomicResource, "affects"|"affectedBy">;

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
  static className: "ResourceClassification";
  className: "ResourceClassification";
  static entryType: RcEntry & typeof VfObject.entryType;
  static entryDefaults: typeof VfObject.entryDefaults & typeof RcEntry;

  static get(hash: Hash<ResourceClassification>): ResourceClassification;
  static create(entry: RcEntry & typeof VfObject.entryType): ResourceClassification;
  constructor(entry?: T & RcEntry & typeof VfObject.entryType, hash?: Hash<ResourceClassification>);

  instance(properties: typeof EconomicResource.entryType): EconomicResource;

  get defaultUnits(): string;
}



interface ErEntry {
  currentQuantity: QVlike;
  resourceClassifiedAs: Hash<ResourceClassification>; //Hash<ResourceClassification>;
  underlyingResource?: Hash<EconomicResource>;
  contains?: Hash<EconomicResource>;
  trackingIdentifier?: string;
  quantityLastCalculated: number;
  // TODO agent resource roles when they are established
  owner: Hash<agents.Agent>;
}

class EconomicResource<T = {}> extends VfObject<T & ErEntry & typeof VfObject.entryType> {
  // <mandatory overrides>
  className: "EconomicResource";
  static className: "EconomicResource";
  static entryType: typeof VfObject.entryType & ErEntry;

  static get(hash: Hash<EconomicResource>): EconomicResource;

  static create(entry: ErEntry & typeof VfObject.entryType): EconomicResource;
  protected constructor(entry: T & ErEntry & typeof VfObject.entryType | null, hash?: Hash<EconomicResource>);
  static entryDefaults: typeof VfObject.entryType & ErEntry;

  // </mandatory overrides>

  remove(msg?: string): this;

  trace(): Hash<events.EconomicEvent>[];
  get currentQuantity(): QuantityValue;
  set currentQuantity(to: QuantityValue):void;
}
// </classes>

// <export>
declare namespace resources {
  export type EconomicResource = typeof EconomicResource.entryType;
  export type ResourceClassification = typeof ResourceClassification.entryType;
  export type TrackTrace = typeof TrackTrace;
  export type ResourceClasses = typeof ResourceClasses;
  export type ResourceRelationships = typeof ResourceRelationships;
}
//esport default zome;
// </export>

// <fixtures>
interface fixtures {
  ResourceClassification: {
    Currency: Hash<ResourceClassification>;
    Work: Hash<ResourceClassification>;
    Idea: Hash<ResourceClassification>;
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
): Hash<EconomicResource>[];

function getAffectingEvents({resource}: {resource: Hash<EconomicResource>}): Hash<events.EconomicEvent>[];

// CRUD

function createEconomicResource(
  {properties: props, event: thing}: {
    properties: zome.EconomicResource,
    event: HoloThing<events.EconomicEvent>
  }
): CrudResponse<typeof EconomicResource.entryType>;

function createResourceClassification(props?: typeof ResourceClassification.entryType): CrudResponse<typeof ResourceClassification.entryType>;

function getFixtures(dontCare: {}): fixtures;

function affect({resource, quantity}:{
  resource: HoloThing<zome.EconomicResource>,
  quantity: QVlike
}): CrudResponse<zome.EconomicResource>;

// </zome>

// <callbacks>
function genesis(): boolean;
// </callbacks>

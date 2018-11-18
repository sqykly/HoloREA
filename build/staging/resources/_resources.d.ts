const ResourceClasses: LinkRepo<EconomicResource | ResourceClassification, EconomicResource | ResourceClassification, "classifiedAs" | "classifies">;
const ResourceRelationships: LinkRepo<EconomicResource, EconomicResource, "underlyingResource" | "contains" | "underlies" | "inside">;
const TrackTrace: LinkRepo<EconomicResource | events.EconomicEvent, events.EconomicEvent | EconomicResource, "affects" | "affectedBy">;
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
    static className: string;
    className: string;
    static entryType: RcEntry & typeof VfObject.entryType;
    static entryDefaults: VfEntry & object & RcEntry;
    static get(hash: Hash<ResourceClassification>): ResourceClassification;
    static create(entry: RcEntry & typeof VfObject.entryType): ResourceClassification;
    constructor(entry?: T & RcEntry & typeof VfObject.entryType, hash?: Hash<ResourceClassification>);
    instance(properties: typeof EconomicResource.entryType): EconomicResource;
    defaultUnits: string;
    instances(): EconomicResource[];
}
interface ErEntry {
    currentQuantity: QVlike;
    resourceClassifiedAs: Hash<ResourceClassification>;
    underlyingResource?: Hash<EconomicResource>;
    contains?: Hash<EconomicResource>;
    trackingIdentifier?: string;
    owner: Hash<agents.Agent>;
}
class EconomicResource<T = {}> extends VfObject<T & ErEntry & typeof VfObject.entryType> {
    className: string;
    static className: string;
    static entryType: typeof VfObject.entryType & ErEntry;
    static get(hash: Hash<EconomicResource>): EconomicResource;
    static create(entry: ErEntry & typeof VfObject.entryType): EconomicResource;
    protected constructor(entry: T & ErEntry & typeof VfObject.entryType | null, hash?: Hash<EconomicResource>);
    static entryDefaults: VfEntry & object & {
        currentQuantity: {
            units: string;
            quantity: number;
        };
        resourceClassifiedAs: string;
        quantityLastCalculated: number;
    };
    underlyingResource: EconomicResource;
    contains: EconomicResource;
    classification: ResourceClassification;
    owner: Hash<agents.Agent>;
    protected updateLinks(hash?: Hash<this>): Hash<this>;
    remove(msg?: string): this;
    update(): Hash<this>;
    commit(): Hash<this>;
    trace(): Hash<events.EconomicEvent>[];
    currentQuantity: QuantityValue;
}
declare global {
    namespace resources {
        type EconomicResource = typeof EconomicResource.entryType;
        type ResourceClassification = typeof ResourceClassification.entryType;
        type TrackTrace = typeof TrackTrace;
        type ResourceClasses = typeof ResourceClasses;
        type ResourceRelationships = typeof ResourceRelationships;
    }
}
//
/**
 * Retrieves the hashes of all EconomicResource instances classified as given.
 * @param {Hash<ResourceClassification>} classification the classification to
 *  get instances of.
 * @returns {Hash<EconomicResource>[]}
 */

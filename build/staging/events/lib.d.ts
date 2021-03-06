/*
 * Adaptation of holochain-proto-types that includes additional type safety.
 * Original Source: https://github.com/holochain/holochain-proto-types/blob/master/index.d.ts
 *
 * Added sections and replaced sections are tagged ADDED and REPLACED respectively.
 * Everything else is credited to the original source.
 *
 * In summary:
 *
 *  All functions documented as returning some type or an error are now declared
 *  to return a CanError<type>
 *
 *  All entry data is now declared as the type EntryData, which is a union of
 *  the types that entry data can actually be (vs. any).
 *  The DNA file determines which type it really is
 *  (unfortunately DNA is not accessible to TypeScript)
 *    - StringEntry where zomeEntryType.DataFormat == "string"
 *    - JsonEntry where zomeEntryType.DataFormat == "json".  There is more to
 *      know about these since the DNA must supply a schema for them, but the
 *      schema is also inaccessible.
 *    - LinksEntry where zomeEntryType.DataFormat == "links"
 *      LinksEntry is further structured; a linksEntry.Links is an array of Link
 *      as defined in the API documentation.
 *
 *  All enums supplied as properties of the HC global are declared as an opaque
 *  type, of which the only instances are those properties of the global.  That
 *  will ensure that only the appropriate values (whose actual type is undisclosed)
 *  are accepted rather than any old value.
 *
 *  All functions which take an options argument with defined fields now have a
 *  type for their options to provide type safety on the documented fields of
 *  those objects.
 *
 * todo (maybe): callbacks & types therein
 * todo (maybe): annotations.
 * todo: a micro-library to shorthand casts and type guards.
 */

// holochain ambient type defs for API

// ADDED: there is apparently an isError()
declare function isError<T>(thing: holochain.CanError<T>): thing is holochain.HolochainError;

// REPLACED declare function property(name: string): string;
declare function property(name: string): holochain.CanError<string>;

// REPLACED declare function makeHash (entryType: string, entryData: any): holochain.Hash;
declare function makeHash(entryType: string, entryData: holochain.EntryData): holochain.CanError<holochain.Hash>;

declare function debug(value: any): void;

// REPLACED declare function call(zomeName: string, functionName: string, arguments: string | object): any;
declare function call(zomeName: string, functionName: string, arguments: holochain.Arguments): holochain.CanError<any>;

// REPLACED declare function bridge(appDNAHash: holochain.Hash, zomeName: string, functionName: string, arguments: string | object): any;
declare function bridge(appDNAHash: holochain.Hash, zomeName: string, functionName: string, arguments: holochain.Arguments): any;

declare function getBridges(): holochain.BridgeStatus[];

// REPLACED declare function sign(doc: string): string;
declare function sign(doc: string): holochain.CanError<string>;

// REPLACED declare function verifySignature(signature: string, data: string, pubKey: string): boolean;
declare function verifySignature(signature: holochain.Signature, data: string, pubKey: string): holochain.CanError<boolean>;

// REPLACED declare function commit(entryType: string, entryData: string | object): holochain.Hash;
declare function commit(entryType: string, entryData: holochain.EntryData): holochain.CanError<holochain.Hash>;

// REPLACED declare function get(hash: holochain.Hash, options?: object): holochain.GetResponse | any;
declare function get(hash: holochain.Hash, options?: holochain.GetOptions): holochain.GetResponse | holochain.EntryData | holochain.HashNotFound;

// REPLACED declare function getLinks(base: holochain.Hash, tag: string, options?: object): holochain.GetLinksResponse[];
// todo: options.Load determines exact return type; should be possible to infer.
declare function getLinks(base: holochain.Hash, tag?: string, options?: holochain.LinksOptions):
  holochain.CanError<holochain.GetLinksResponse[] | holochain.EntryData[]>;

// REPLACED declare function update(entryType: string, entryData: string | object, replaces: holochain.Hash): holochain.Hash;
declare function update(entryType: string, entryData: holochain.EntryData, replaces: holochain.Hash): holochain.CanError<holochain.Hash>;

// REPLACED declare function updateAgent(options: object): holochain.Hash;
declare function updateAgent(options: holochain.UpdateAgentOptions): holochain.CanError<holochain.Hash>;

declare function remove(entryHash: holochain.Hash, message: string): holochain.Hash;

// REPLACED declare function query(options?: object): holochain.QueryResponse[] | any[];
// todo: options.Return keys & values determine exact return type.  Should be possible to infer.
declare function query(options?: holochain.QueryOptions): holochain.CanError<holochain.QueryResult>;

// REPLACED declare function send(to: holochain.Hash, message: object, options?: object): any;
declare function send(to: holochain.Hash, message: object, options?: holochain.SendOptions): any;

declare function bundleStart(timeout: number, userParam: any): void;
declare function bundleClose(commit: boolean): void;

declare var HC: holochain.HolochainSystemGlobals;
declare var App: holochain.HolochainAppGlobals;


declare namespace holochain {
	type Hash = string;
	type Signature = string;
	type HolochainError = object;
	type PackageRequest = object;

  // ADDED single-instance types in the HC object
  type HashNotFound = any;

  // ADDED enum properties in the HC object
  // property of HC.LinkAction
  type LinkAction = any;
  // property of HC.Status; can be combined with + operator
  type StatusMaskValue = number;
  // property of HC.GetMask; can be combined with + operator
  type GetMaskValue = number;
  // property of HC.PkgReq
  // todo: can they be combined?
  type PkgReqValue = any;
  // property of HC.Bridge
  type BridgeSide = any;
  // property of HC.SysEntryType
  type SysEntry = any;
  // property of HC.BundleCancel.Reason
  type BundleCancelReason = any;
  // property of HC.BundleCancel.Response
  type BundleCancelResponse = any;

  // ADDED entries can be strings, "JSON" entries, or arrays of links wrapped in {Links:[]}
  type StringEntry = string;
  type JsonEntry = object;
  // a linksEntry.Links[] has properties we might as well know...
  interface Link {
    Base: Hash;
    Link: Hash;
    Tag: string;
    LinkAction?: LinkAction;
  }
  // link arrays are wrapped in an object
  interface LinksEntry {
    Links: Link[];
  }
  type EntryData = StringEntry | JsonEntry | LinksEntry;

  // ADDED a lot of the API functions can return errors, too.
  type CanError<T> = T | HolochainError;

  // ADDED but not sure I want it as it could force an inconvenient cast
  type Arguments = string | object;

  // ADDED an options interface for get() to ensure the proper enums are used.
  interface GetOptions {
    StatusMask?: StatusMaskValue;
    GetMask?: GetMaskValue;
    Local?: boolean;
    Bundle?: boolean;
  }

  // ADDED an options interface for getLinks()
  interface LinksOptions {
    Load?: boolean;
    StatusMask?: StatusMaskValue;
  }

  // ADDED an options interface for updateAgent()
  interface UpdateAgentOptions {
    Revocation: string;
    Identity: string;
  }

  // ADDED an options interface for query().  Might not be useful as the docs
  // are not clear on what is optional, what defaults are, etc.
  interface QueryOptions {
    Return?: {
      Entries?: boolean;
      Hashes?: boolean;
      Headers?: boolean;
    }
    Constrain?: {
      EntryTypes?: string[];
      Contains?: string;
      Equals?: string;
      Matches?: RegExp;
      Count?: number;
      Page?: number;
    }
    Order?: {
      Ascending?: boolean;
    }
    Bundle?: boolean;
  }

  // ADDED an options interface for send()
  interface SendOptions {
    Callback: {
      Function: string;
      ID: string;
    }
  }

	interface Header {
	  Type: string;
	  Time: string;
	  HeaderLink: Hash;
	  EntryLink: Hash;
	  TypeLink: Hash;
	  Sig: Signature;
	  Change: Hash;
	}

  interface GetResponse {

    // REPLACED Entry?: any;
    Entry?: EntryData;
	  EntryType?: string;
	  Sources?: Hash[];
	}

	interface GetLinksResponse {
	  Hash: Hash;

    // REPLACED Entry?: any;
    Entry?: EntryData;

	  EntryType?: string;
	  Tag?: string;
	  Source?: Hash;
	}

  interface QueryResponse {

    // REPLACED Hash?: string
    Hash?: Hash;

    // REPLACED Entry?: any
	  Entry?: EntryData;

	  Header?: Header
	}

  // ADDED the actual result of query() is an array of Hashes, Entries, Headers, or QueryResponse
  type QueryResult = Hash[] | EntryData[] | Header[] | QueryResponse[];

	interface BridgeStatus {
	  Side: number;
	  CalleeName?: string;
	  CalleeApp?: Hash;
	  Token?: string;
	}


	/*=====  End of Holochain Data Types  ======*/


	interface HolochainSystemGlobals {
	  Version: string;

    // REPLACED HashNotFound: any;
	  HashNotFound: HashNotFound;

    // REPLACED Status: any;
	  Status: {
      Live: StatusMaskValue;
      Deleted: StatusMaskValue;
      Rejected: StatusMaskValue;
      Any: StatusMaskValue;
    }

    // REPLACED GetMask: any;
	  GetMask: {
      Default: GetMaskValue;
      Entry: GetMaskValue;
      EntryType: GetMaskValue;
      Sources: GetMaskValue;
      All: GetMaskValue;
    }

    // REPLACED LinkAction: any;
	  LinkAction: {
      Add: LinkAction;
      Del: LinkAction;
    }

    // REPLACED PkgReq: any;
	  PkgReq: {
      Chain: PkgReqValue;
      ChainOpt: PkgReqValue;
      EntryTypes: PkgReqValue;
    }

    // REPLACED Bridge: any;
	  Bridge: {
      From: BridgeSide;
      To: BridgeSide;
    }

    // REPLACED SysEntryType: any;
	  SysEntryType: {
      DNA: SysEntry;
      Agent: SysEntry;
      Key: SysEntry;
      Headers: SysEntry;
      Del: SysEntry;
    }

    // REPLACED BundleCancel: any;
	  BundleCancel: {
      Reason: {
        User: BundleCancelReason;
        Timeout: BundleCancelReason;
      }
      Response: {
        Commit: BundleCancelResponse;
        OK: BundleCancelResponse;
      }
    }
	}

	interface HolochainAppGlobals {
	  Name: string;
	  DNA: {
	    Hash: Hash;
	  };
	  Key: {
	    Hash: Hash;
	  }
	  Agent: {
	    Hash: Hash;
	    TopHash: Hash;
	    String: string;
	  }
	}
}
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
//
const ResourceClasses: LinkRepo<resources.EconomicResource | resources.ResourceClassification, resources.EconomicResource | resources.ResourceClassification, "classifiedAs" | "classifies">;
const ResourceRelationships: LinkRepo<resources.EconomicResource, resources.EconomicResource, "underlyingResource" | "contains" | "underlies" | "inside">;
const TrackTrace: LinkRepo<resources.EconomicResource | events.EconomicEvent, events.EconomicEvent | resources.EconomicResource, "affects" | "affectedBy">;
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
    static entryDefaults: VfEntry & object;
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

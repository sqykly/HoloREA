/**
 * fake-holochain mocks the holochain API so that TypeScript modules can be
 * tested in their native state without too much build hassle.  Only the functions
 * I need are mocked at the moment.
 */
import {sha1} from "./sha1";

enum ErrorHandling {
  Ret = "returnErrorValue",
  Throw = "throwErrors"
}


export namespace holochain {
  interface ZomeConfig {
    ErrorHandling: ErrorHandling;
  }

  interface ZomeSpec {
    Name: string;
    Desciption?: string;
    RibosomeType: "js";
    Config?: ZomeConfig;
    CodeFile: string;
    BridgeFuncs?: string[];
    Functions: any[];
    EntryTypes: {
      Name: string;
      Description?: string;
      DataFormat: "string" | "json" | "links";
      SchemaFile: string;
      Sharing: "public" | "private";
    }[];
  }

  let zome: ZomeSpec = {};
  // wacky things to throw.
  export class HolochainError extends Error {

    constructor(msg: string| Error) {
      super(typeof msg === `string` ? msg : msg.message);
      if (msg instanceof Error) {
       this.stack = msg.stack;
       this.name = msg.name;
      }
    }

  }

  class NotFound extends HolochainError {
    private static singleton: NotFound;
    constructor() {
      super(new RangeError(`hash type, just can't find that thing`));
      if (NotFound.singleton) return NotFound.singleton;
      NotFound.singleton = this;
    }
  }

  export type HashNotFound = NotFound;
  export const HashNotFound = new NotFound();

  export type CanError<T> = HolochainError|T;

  export function holoThrow<E extends Error> (error: (new (msg?:string) => E) | E | string = undefined, msg?: string): HolochainError {
    let err:HolochainError;
    if (typeof error === `string`) {
      err = new HolochainError(new Error(error));
    } else if (typeof error === `function`) {
      msg = msg || ``;
      err = new HolochainError(new error(msg));
    } else {
      err = new HolochainError(error);
    }

    let handling = <ErrorHandling> zome.Config.ErrorHandling;
    if (handling == ErrorHandling.Ret) {
      return err;
    } else {
      throw err;
    }
  }

  export enum LinkAction { None, Add, Del }
  type Hash = string;
	type Signature = string;
	//type HolochainError = object;
	type PackageRequest = object;

  // ADDED single-instance types in the HC object
  //type HashNotFound = any;

  // ADDED enum properties in the HC object
  // property of HC.LinkAction
  //type LinkAction = any;
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
    LinkAction?: holochain.LinkAction;
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

type CanError<T> = Error | T;

export function isError<T>(maybeError: holochain.CanError<T>): maybeError is holochain.HolochainError {
   return maybeError instanceof holochain.HolochainError;
}

namespace DHT {
  const HashNotFound = holochain.HashNotFound;
  const HolochainError = holochain.HolochainError;
  const holoThrow = holochain.holoThrow;
  type LinkAction = holochain.LinkAction;
  const LinkActions = holochain.LinkAction;
  const SOURCE = `fake holochain`

  abstract class EntryClass {
    type: string;
    abstract format: "string"|"json"|"links";
    abstract data;
    abstract hash(): string;
    isDeleted: boolean = false;
    wasUpdated: string = ``;
    source: string = ``;
  }
  class StringEntryClass extends EntryClass {
    format: "string" = "string";
    data: string;
    hash(): string {
      return sha1.hash(this.data);
    }

  }
  export interface UserLink {
    Base: string;
    Link: string;
    Tag: string;
    LinkAction?: LinkAction;
  }
  export interface Link {
    Base: string;
    Tag: string;
    Link: string;
    Source: string;
    EntryType: string;
  }
  export interface LinkResponse<T = any> {
    Hash: string;
    Tag: string;
    Entry: T;
    EntryType: string;
    Source: string;
  }
  export interface LinksResponse<T = any> {
    Links: LinkResponse<T>[];
  }
  class JsonEntryClass<T = object> extends EntryClass {
    data: T;
    format: "json" = "json";
    hash() {
      return sha1.hash(JSON.stringify(this.data));
    }
  }
  class LinksEntryClass extends EntryClass {
    hash(): string {
		  return sha1.hash(JSON.stringify(this.data));
	  }
    format: "links" = "links";
	  data: Link;
    next: string = null;
  }
  export type Entry = LinksEntryClass | JsonEntryClass | StringEntryClass;

  class DHT {

    // it's not distributed at all!  fooled you!
    //                    typename  template.
    private types = new Map<string, Entry>();
    //                      base        tag     hash
    private links = new Map<string, Map<string, string>>();
    //                    hash    entry
    private all = new Map<string, Entry>();



    register<T extends object = object>({TypeName, DataFormat, Exemplar}:{TypeName:string, DataFormat:"json"|"links"|"string", Exemplar?:T}): this {
      let entry: Entry;
      if (this.types.has(TypeName)) holoThrow(`duplicate typename!`);

      switch (DataFormat) {
        case `string`:
          entry = new StringEntryClass();
        break;

        case `json`:
          if (!Exemplar) holoThrow(`"json" entry types must include an Exemplar`);
          entry = new JsonEntryClass<T>();
          entry.data = Exemplar;
        break;

        case `links`:
          entry = new LinksEntryClass();

        break;
      }
      entry.source = SOURCE;
      entry.type = TypeName;
      this.types.set(TypeName, entry);
      return this;
    }

    private findEntry(hash: string): CanError<string> {
      let {all} = this;
      if (!all.has(hash)) return HashNotFound;

      let entry = all.get(hash),
        loopDetect = new Set<string>([hash]),
        dosDetect = 200;

      while (entry.wasUpdated && !entry.isDeleted && --dosDetect) {
        hash = entry.wasUpdated;
        if (!all.has(hash)) return HashNotFound;
        if (loopDetect.has(hash)) return new Error(`infinite loop of updates found`);
        loopDetect.add(hash);
      }

      if (!dosDetect) return new Error(`too many updates, something is fishy`);
      if (entry.isDeleted) return HashNotFound;

      return hash;
    }

    private findLink(base: string, tag:string): CanError<string> {
      let {links, all} = this,
        mapT = links.has(base) && links.get(base),
        hash = mapT && mapT.has(tag) && mapT.get(tag);
      if (!hash) return HashNotFound;

      return this.findEntry(hash);
    }

    private traverseLinks(hash: string, cb?: (entry:LinksEntryClass) => boolean): CanError<string> {
      let {all} = this,
        dosDetect = 200,
        loopDetect = new Set<string>(),
        shouldContinue: boolean = true,
        tailHash: CanError<string> = hash;

      for (
        let tail: LinksEntryClass = <LinksEntryClass> all.get(tailHash);
        !!tail && (!cb || cb(tail)) && tail.next && dosDetect-- && !loopDetect.has(tailHash);
        tail = <LinksEntryClass> all.get(tailHash)
      ) {
        loopDetect.add(tailHash);
        tailHash = this.findEntry(tail.next);
        if (isError(tailHash)) {
          tailHash.message = `while traversing a set of links: ${tailHash.message}`;
          return new HolochainError(tailHash);
        }
      }

      if (!dosDetect) {
        return new Error(`Something's fishy.  Too many links chained together`);
      } else if (loopDetect.has(tailHash)) {
        return new Error(`infinite loop of links detected`);
      }

      return tailHash;
    }

    private pushLink(base: string, tag: string, hash: string): string {
      let {links, all} = this,
        mapT = links.has(base) && links.get(base);

      if (!mapT.has(tag)) {
        mapT.set(tag, hash);
        return null;
      } else {
        let oldHash = mapT.get(tag);
        mapT.set(tag, hash);
        let tail = this.findEntry(oldHash);
        if (tail instanceof Error) return null;
        return tail;
      }

    }

    commit(typeName: string, entry: object|string): CanError<string> {
      let proto:Entry, {types, all} = this;
      if (!types.has(typeName)) return holoThrow(TypeError, `type not found`);
      proto = types.get(typeName);
      if (proto.type !== typeName) return holoThrow(Error, `mischief has occured.  Type name mismatch`);

      let record:Entry;

      switch(proto.format) {

        case `string`:
          proto = <StringEntryClass> proto;
          record = new StringEntryClass();
          record.data = <string> entry;

        break;

        case `json`:
          proto = <JsonEntryClass> proto;
          record = new JsonEntryClass<object>();
          record.data = Object.assign({}, proto.data, <object>entry);
        break;

        case `links`:
          proto = <LinksEntryClass> proto;
          record = new LinksEntryClass();


          let link:UserLink = (<UserLink>entry),
            baseHash = this.findEntry(link.Base),
            targetHash = this.findEntry(link.Link),
            target: Entry,
            whatDo = link.LinkAction;
          record.data = {
            Base: link.Base,
            Tag: link.Tag,
            Link: link.Link,
            Source: SOURCE,
            EntryType: null
          };


          if (targetHash instanceof Error) {
            return holoThrow(targetHash, `while finding link target: ${targetHash.message}`);
          } else if (baseHash instanceof Error) {
            return holoThrow(baseHash, `while finding link base: ${baseHash.message}`);
          } else {
            target = all.get(targetHash);
            record.data.EntryType = target.type;
            record.data.Link = targetHash;
            record.data.Base = baseHash;
          }


          if (whatDo !== LinkActions.Del) {
            let hash = record.hash();
            record.next = this.pushLink(link.Base, link.Tag, hash);
            all.set(hash, record);
            return hash;
          } else {
            let hash = this.findLink(link.Base, link.Tag);
            if (hash instanceof Error) return holoThrow(hash, `Could not find links entry: ${hash.message}`);
            let last:LinksEntryClass;

            this.traverseLinks(hash, (entry) => {
              let data: Link = <Link>record.data,
                base = this.findEntry(entry.data.Base),
                targ = this.findEntry(entry.data.Link);
              if (isError(base)) return false;
              if (isError(targ)) return false;
              // do some maintainance while we are here.
              entry.data.Base = base;
              entry.data.Link = targ;
              if (base == data.Base && targ == data.Link && entry.data.Tag == data.Tag) {
                if (last) {
                  last.next = entry.next;
                }
                entry.isDeleted = true;
                return false;
              }
              last = entry;
              return true;
            });
          }
          break;
      }
      record.source = SOURCE;
      record.type = typeName;
      record.format = proto.format;

      let hash = record.hash();
      all.set(hash, record);
      return hash;
    }

    get(hash:string, options?:object): string | object | Link | holochain.HolochainError {
      let h = this.findEntry(hash);
      if (isError(h)) return holoThrow(h);
      return this.all.get(h);
    }

    getLinks(base: string, tag?: string, opt?: object): LinksResponse {
      let response: LinkResponse[],
        {links, all} = this,
        toGet = new Set<string>(),
        hasBase = links.has(base),
        mapT = hasBase && links.get(base);

      if (!hasBase) return {Links: response};
      if (tag) {
        if (mapT.has(tag)) return {Links: response};
        toGet.add(mapT.get(tag));
      } else {
        mapT.forEach((value) => {
          toGet.add(value);
        });
      }

      toGet.forEach((hash) => {
        this.traverseLinks(hash, (entry) => {
          let target = this.findEntry(entry.data.Link);
          if (isError(target)) return true;
          let targetEntry = all.get(target);
          response.push({
            Hash: entry.data.Link,
            Tag: entry.data.Tag,
            Entry: targetEntry.data,
            Source: SOURCE,
            EntryType: targetEntry.type
          });
          return true;
        });
      });

      return {Links: response};
    }

    update(type: string, entryData: string | Link | object, oldHash: string ): CanError<string> {
      let {types, all, links} = this,
        proto = types.has(type) && types.get(type),
        entry: Entry,
        oldH2 = this.findEntry(oldHash);

      switch (proto.format) {
        case `string`: {
          proto = <StringEntryClass>proto;
          entryData = <string> entryData;
          entry = new StringEntryClass();
          entry.data = entryData;
        }
        break;
        case `json`: {
          proto = <JsonEntryClass> proto;
          entryData = <object> entryData;
          entry = new JsonEntryClass<object>();
          entry.data = Object.assign({}, proto.data, entryData);

        }
        break;
        case `links`: {
          proto = <LinksEntryClass> proto;
          let data = <Link> entryData;
          entry = new LinksEntryClass();
          entry.data = <Link> Object.assign({}, entryData);

          let oldLink = this.findEntry(this.pushLink(data.Base, data.Tag, entry.hash()));

          if (isError(oldLink)) break;
          let oldEntry = <LinksEntryClass> all.get(oldLink);
          let oldNext = oldEntry.next && this.findEntry(oldEntry.next);
          if (isError(oldNext)) break;
          entry.next = oldNext;
        }
        break;
      }

      entry.type = type;
      entry.source = SOURCE;
      let hash = entry.hash();

      if (!isError(oldH2) && all.has(oldH2)) {
        all.get(oldH2).wasUpdated = hash;
      }
      all.set(hash, entry);
      return hash;
    }

    makeHash(type: string, data: string | Link | object): CanError<string> {
      let {types} = this,
        proto: Entry;
      if (!types.has(type)) return holoThrow(TypeError, `Couldn't find entry type`);
      proto = types.get(type);

      let record: Entry;

      switch (proto.format) {
        case `string`: {
          proto = <StringEntryClass> proto;
          record = new StringEntryClass();
          record.data = <string> data;
        } break;
        case `json`: {
          record = new JsonEntryClass<object>();
          record.data = Object.assign({}, proto.data, data);
        } break;
        case `links`: {
          record = new LinksEntryClass();
          record.data = <Link> data;
        }
      }

      return record.hash();
    }

    remove(hash: string, message: string): CanError<string> {
      let {all} = this,
        loopDetect = new Set<string>(),
        dosDetect = 200;

      if (!all.has(hash)) return holoThrow(HashNotFound, `while trying to remove for ${message}: HashNotFound`);

      let entry: Entry = all.get(hash);


      do {
        loopDetect.add(hash);
        entry = all.get(hash);
        if (entry.isDeleted) return hash;
        entry.isDeleted = true;
        hash = entry.wasUpdated;
      } while (hash && all.has(hash) && !loopDetect.has(hash) && --dosDetect)


      return hash;
    }
  }
  export const dht = new DHT();

}

const dht = DHT.dht;
type Link = DHT.Link;
type UserLink = DHT.UserLink;
type LinkResponse = DHT.LinkResponse;
export type GetLinksResponse = DHT.LinksResponse;
type Entry = DHT.Entry;

export function register({TypeName, DataFormat, Exemplar}: {TypeName:string, DataFormat:"string"|"json"|"links", Exemplar?: any}): typeof dht {
  return dht.register({TypeName, DataFormat, Exemplar});
}

export function makeHash(type: string, data: string | Link | object): CanError<string> {
  return dht.makeHash(type, data);
}

export function commit(typeName:string, entry: string | object): CanError<string> {
  return dht.commit(typeName, entry)
}

export function get(hash: string, options?: object): CanError<string|object> {
  return dht.get(hash, options);
}

export function getLinks(base: string, tag?: string, options?: object): CanError<GetLinksResponse> {
  return dht.getLinks(base, tag, options);
}

export function update(type: string, entryData: string | Link | object, oldHash: string ): CanError<string> {
  return dht.update(type, entryData, oldHash);
}

export function remove(hash: string, message: string): CanError<string> {
  return dht.remove(hash, message);
}

export namespace holochain {



	/*=====  End of Holochain Data Types  ======*/



}

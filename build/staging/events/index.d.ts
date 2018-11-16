import "../resources/";
import "../agents/"
import "../uncommon";
import "../es6";

// <imports>
type Agent = agents.Agent;
type EconomicResource = resources.EconomicResource;

const TrackTrace: resources.TrackTrace;

// <links>
const Classifications: LinkRepo<
  Transfer|TransferClassification,
  Transfer|TransferClassification,
  "classifiedAs"|"classifies"
>;

const EventLinks: LinkRepo<
  EconomicEvent|Transfer|Process|Action,
  EconomicEvent|Transfer|Process|Action,
  "inputs"|"inputOf"|"outputs"|"outputOf"|"actionOf"|"action"
>;

// </links>

interface ActEntry {
  name?: string;
  behavior: '+'|'-'|'0';
}

class Action<T = {}> extends VfObject<ActEntry & T & typeof VfObject.entryType> {
  className:string;
  static className:string;
  static entryType: ActEntry & typeof VfObject.entryType;
  //protected myEntry: T & typeof Action.entryType;
  static entryDefaults: typeof VfObject.entryDefaults & ActEntry;

  static get(hash: Hash<Action>): Action;
  static create(entry: ActEntry  & typeof VfObject.entryType): Action;
  constructor(entry?: T & ActEntry & typeof VfObject.entryType, hash?: Hash<Action>);

  isIncrement(): boolean;

  isDecrement(): boolean;

  isNoEffect(): boolean;

  get behavior(): typeof Action.entryType.behavior;

  set behavior(to: typeof Action.entryType.behavior);

  get sign(): number;
}

interface ProcEntry {
  name: string;
}

class Process<T = {}> extends VfObject<T & ProcEntry  & typeof VfObject.entryType> {
  static className:string;
  className:string;
  static entryType: ProcEntry  & typeof VfObject.entryType;
  static entryDefaults: typeof VfObject.entryDefaults & ProcEntry

  static get(hash: Hash<Process>): Process;
  static create(entry: ProcEntry  & typeof VfObject.entryType): Process;
  constructor(entry?: T & ProcEntry  & typeof VfObject.entryType, hash?: Hash<Process>);

  // methods
}

interface XferClassEntry {
  name: string;
}

class TransferClassification<T = {}> extends VfObject<T & XferClassEntry & typeof VfObject.entryType> {
  static className: string;
  className: string;
  static entryType: XferClassEntry & typeof VfObject.entryType;
  static entryDefaults: typeof VfObject.entryDefaults & XferClassEntry;

  static get(hash: Hash<TransferClassification>): TransferClassification;
  static create(entry: XferClassEntry & typeof VfObject.entryType): TransferClassification;
  constructor(entry?: T & XferClassEntry & typeof VfObject.entryType, hash?: Hash<TransferClassification>);

}


export interface XferEntry {
  transferClassifiedAs: Hash<TransferClassification>;
  inputs: Hash<EconomicEvent|Process>;
  outputs: Hash<EconomicEvent|Process>;
}

export class Transfer<T = {}> extends VfObject<T & typeof VfObject.entryType & XferEntry> {
  className: string;
  static className: string;
  static entryType: XferEntry & typeof VfObject.entryType;
  static entryDefaults: typeof VfObject.entryDefaults & XferEntry;
  //protected myEntry: T & XferEntry & typeof VfObject.entryType;
  static get(hash: Hash<Transfer>): Transfer;
  static create(entry?: XferEntry & typeof VfObject.entryType): Transfer;
  constructor(entry?: T & XferEntry & typeof VfObject.entryType, hash?: Hash<Transfer>);

  get input(): EconomicEvent;
  set input(to: EconomicEvent): void;

  get output(): EconomicEvent;
  set output(to: EconomicEvent): void;

  get classification(): TransferClassification;
  set classification(to: TransferClassification): void;

}

interface EeEntry {
  action: Hash<Action>;
  outputOf?: Hash<Transfer|Process>;
  inputOf?: Hash<Transfer|Process>;
  affects: Hash<EconomicResource>;
  receiver: string; //receiver?: Hash<Agent>;
  provider: string; //provider?: Hash<Agent>;

  scope?: Hash<any>;
  affectedQuantity: QVlike;
  start?: number;
  duration?: number;
}

export class EconomicEvent<T = {}> extends VfObject<EeEntry & T & typeof VfObject.entryType> {
  // begin mandatory overrides
  static className: "EconomicEvent";
  className: "EconomicEvent";
  static entryType: EeEntry & typeof VfObject.entryType;
  static entryDefaults: typeof VfObject.entryDefaults & EeEntry;
  static get(hash: Hash<EconomicEvent>): EconomicEvent;
  static create(entry: EeEntry & typeof VfObject.entryType): EconomicEvent;
  constructor(entry?: EeEntry & T & typeof VfObject.entryType, hash?: Hash<EconomicEvent>);

  get action(): Action;
  set action(obj: Action): void;

  get quantity(): QuantityValue;
  set quantity(to: QuantityValue): void;
  get start(): number;
  started(when: number|Date): this;
  get startDate(): Date;

  get duration(): number;

  get end(): number;
  get endDate(): Date;
  ended(when?: number|Date): this;
  instant(): this;

  get isComplete(): boolean;
  get isOngoing(): boolean;

  set affects(res: HoloThing<EconomicResource>): void;
  get affects(): HoloThing<EconomicResource>;
}

/*
 * Because I didn't think before dividing modules, they need to be freeze-dried
 * and thawed all the time to move between domains.  Further, to avoid compiling
 * each zome to a monolith, the only things they can export are type aliases.
 * That means entry types, not classes, and function signatures.  Oddly enough,
 * LinkRepo just needs a name and a type signature to thaw, so those will be ok
 */
declare namespace events {
  export type Action = typeof Action.entryType;
  export type EconomicEvent = typeof EconomicEvent.entryType;
  export type TransferClassification = typeof TransferClassification.entryType;
  export type Transfer = typeof Transfer.entryType;
  export type Process = typeof Process.entryType;
  export type Classifications = typeof Classifications;
  export type EventLinks = typeof EventLinks;
  export type functions =
    "traceEvents"|"trackEvents"|"traceTransfers"|"trackTransfers"|
    "eventSubtotals"|"eventsEndedBefore"|"eventsStartedBefore";
  export type trackEvents = typeof trackEvents;
  export type traceEvents = typeof traceEvents;
  export type traceTransfers = typeof traceTransfers;
  export type trackTransfers = typeof trackTransfers;
  export type eventSubtotals = typeof eventSubtotals;
  export type eventsStartedBefore = typeof eventsStartedBefore;
  export type eventsEndedBefore = typeof eventsEndedBefore;
  export type eventsStartedAfter = typeof eventsStartedAfter;
  export type eventsEndedAfter = typeof eventsEndedAfter;
  export type sortEvents = typeof sortEvents;
  export type resourceCreationEvent = typeof resourceCreationEvent;
}

//export default zome;

// <Zome exports> (call() functions)

// for <DRY> purposes
function trackTrace<T, U>(subjects: Hash<T>[], tag: string): Hash<U>[];
interface TimeFilter {
  events: Hash<EconomicEvent>[],
  when: number
}
function filterByTime({events, when}: TimeFilter, filter: (ev: EconomicEvent) => boolean): Hash<EconomicEvent>[];
// </DRY>

function traceEvents(events: Hash<EconomicEvent>[]): CrudResponse<zome.Transfer>[];

function trackEvents(events: Hash<EconomicEvent>[]): CrudResponse<zome.Transfer>[];

function traceTransfers(xfers: Hash<Transfer>[]): CrudResponse<zome.EconomicEvent>[];

function trackTransfers(xfers: Hash<Transfer>[]): CrudResponse<zome.EconomicEvent>[];

function eventsStartedBefore({events, when}: TimeFilter): CrudResponse<zome.EconomicEvent>[];

function eventsEndedBefore({events, when}: TimeFilter): CrudResponse<zome.EconomicEvent>[];

function eventsStartedAfter({events, when}: TimeFilter): CrudResponse<zome.EconomicEvent>[];

function eventsEndedAfter({events, when}: TimeFilter): CrudResponse<zome.EconomicEvent>[];

function sortEvents(
  {events, by, order, start, end}:
  {events: Hash<EconomicEvent>[], order: "up"|"down", by: "start"|"end", start?: number, end?: number}
): CrudResponse<zome.EconomicEvent>[];

/**
 * A structure that details the event and state history of a group of resources
 * @interface
 * @member {object[]} events
 * @member {CrudResponse<EconomicEvent>} events[].event  The event that caused
 *  a state change.
 * @member {Dict<QVlike>} events[].subtotals using the hash of a resource as a key, the
 *  values are QuantityValue-like structs that reflect the state of that resource
 *  before the event occurred.
 * @member {Dict<QVlike>} totals The keys of all resources store the QVlike
 *  state of each resource after all the listed events (and previous)
 */
interface Subtotals {
  events: {
    event: CrudResponse<typeof EconomicEvent.entryType>,
    subtotals: {[k:string]: QVlike}
  }[];
  resources: Hash<resources.EconomicResource>[];
  totals: {[k:string]: QVlike};
};

function eventSubtotals(hashes: Hash<EconomicEvent>[]): Subtotals;
// <fixtures>

interface fixtures {
  Action: {
    Give: Hash<Action>;
    Receive: Hash<Action>;
    Adjust: Hash<Action>;
  };
  TransferClassification: {
    Stub: Hash<TransferClassification>;
  };
};

function getFixtures(dontCare: object): fixtures;

// </fixures>

function resourceCreationEvent(
  { resource, dates }: {
    resource: resources.EconomicResource, dates?:{start: number, end?:number}
  }
): CrudResponse<zome.EconomicEvent>;
// CRUD

function createEvent(init: typeof EconomicEvent.entryType): CrudResponse<typeof EconomicEvent.entryType>;

function createTransfer(init: typeof Transfer.entryType): CrudResponse<typeof Transfer.entryType>;

function createTransferClass(init: typeof TransferClassification.entryType): CrudResponse<typeof TransferClassification.entryType>;

function createAction(init: typeof Action.entryType): CrudResponse<typeof Action.entryType>;

import resources from "../resources/resources";
import agents from "../agents/agents"
import { Hash, QuantityValue, LinkRepo, VfObject, QVlike, HoloObject, CrudResponse, bisect } from "../../../lib/ts/common";

type Agent = agents.Agent;
type EconomicResource = resources.EconomicResource;
// oh snap, I have to add the linkbacks too.
const TrackTrace: resources.TrackTrace = new LinkRepo(`TrackTrace`);
TrackTrace.linkBack("affects", "affectedBy")
  .linkBack("affectedBy", "affects");

export interface ActEntry {
  name?: string;
  behavior: '+'|'-'|'0';
}

class Action<T = {}> extends VfObject<ActEntry & T & typeof VfObject.entryType> {
  className = "Action";
  static className = "Action";
  static entryType: ActEntry & typeof VfObject.entryType;
  //protected myEntry: T & typeof Action.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <ProcEntry> {
      behavior: '0'
    });

  static get(hash: Hash<Action>): Action {
    return <Action> super.get(hash);
  }
  static create(entry: ActEntry  & typeof VfObject.entryType): Action {
    return <Action> super.create(entry);
  }
  constructor(entry?: T & ActEntry & typeof VfObject.entryType, hash?: Hash<Action>) {
    super(entry, hash);
  }

  isIncrement(): boolean {
    return this.myEntry.behavior === '+';
  }

  isDecrement(): boolean {
    return this.myEntry.behavior === '-';
  }

  isNoEffect(): boolean {
    return this.myEntry.behavior === '0';
  }

  get behavior(): typeof Action.entryType.behavior {
    return this.myEntry.behavior;
  }

  set behavior(to: typeof Action.entryType.behavior) {
    this.myEntry.behavior = to;
  }

  get sign(): number {
    let behavior = this.myEntry.behavior;
    switch (behavior) {
      case "+": return 1;
      case "-": return -1;
      case "0": return 0;
    }
  }
}

interface ProcEntry {}

class Process<T = {}> extends VfObject<T & ProcEntry  & typeof VfObject.entryType> {
  static className = "Process";
  className = "Process";
  static entryType: ProcEntry  & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <ProcEntry> {

    });

  static get(hash: Hash<Process>): Process {
    return <Process> super.get(hash);
  }
  static create(entry: ProcEntry  & typeof VfObject.entryType): Process {
    return <Process> super.create(entry);
  }
  constructor(entry?: T & ProcEntry  & typeof VfObject.entryType, hash?: Hash<Process>) {
    super(entry, hash);
  }

  // methods
}

interface XferClassEntry {}

class TransferClassification<T = {}> extends VfObject<T & XferClassEntry & typeof VfObject.entryType> {
  static className = "TransferClassification";
  className = "TransferClassification";
  static entryType: XferClassEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <XferClassEntry> {

    });

  static get(hash: Hash<TransferClassification>): TransferClassification {
    return <TransferClassification> super.get(hash);
  }
  static create(entry: XferClassEntry & typeof VfObject.entryType): TransferClassification {
    return <TransferClassification> super.create(entry);
  }
  constructor(entry?: T & XferClassEntry & typeof VfObject.entryType, hash?: Hash<TransferClassification>) {
    super(entry, hash);
  }

}

export const Classifications = new LinkRepo<
  Transfer|TransferClassification,
  Transfer|TransferClassification,
  "classifiedAs"|"classifies"
>("Classifications");
Classifications.linkBack("classifiedAs", "classifies")
  .linkBack("classifies", "classifiedAs");


export const EventLinks = new LinkRepo<
  EconomicEvent|Transfer|Process|Action,
  EconomicEvent|Transfer|Process|Action,
  "inputs"|"inputOf"|"outputs"|"outputOf"|"actionOf"|"action"
>("EventLinks");
EventLinks.linkBack("inputs", "inputOf")
  .linkBack("outputs", "outputOf")
  .linkBack("inputOf", "inputs")
  .linkBack("outputOf", "outputs")
  .linkBack("action", "actionOf")
  .linkBack("actionOf", "action");

export interface XferEntry {
  transferClassifiedAs: Hash<TransferClassification>;
  inputs: Hash<EconomicEvent|Process>;
  outputs: Hash<EconomicEvent|Process>;
}

class Transfer<T = {}> extends VfObject<T & typeof VfObject.entryType & XferEntry> {
  className = "Transfer";
  static className = "Transfer";
  static entryType: XferEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <XferEntry> {
    transferClassifiedAs: ``,
    inputs: ``,
    outputs: ``
  });
  //protected myEntry: T & XferEntry & typeof VfObject.entryType;
  static get(hash: Hash<Transfer>): Transfer {
    return <Transfer> super.get(hash);
  }
  static create(entry?: XferEntry & typeof VfObject.entryType): Transfer {
    return <Transfer> super.create(entry);
  }
  constructor(entry?: T & XferEntry & typeof VfObject.entryType, hash?: Hash<Transfer>) {
    super(entry, hash);
  }

  get input(): EconomicEvent {
    return EconomicEvent.get(this.myEntry.inputs);
  }
  set input(to: EconomicEvent) {
    let current = this.myEntry.inputs;
    if (current && current !== to.hash) {
      EventLinks.remove(this.hash, this.myEntry.inputs, `inputs`);
    }
    this.myEntry.inputs = to.hash;
  }

  get output(): EconomicEvent {
    return EconomicEvent.get(this.myEntry.outputs);
  }
  set output(to: EconomicEvent) {
    let current = this.myEntry.outputs;
    if (current && current !== to.hash) {
      EventLinks.remove(this.hash, current, `outputs`);
    }
    this.myEntry.outputs = to.hash;
  }

  get classification(): TransferClassification {
    return TransferClassification.get(this.myEntry.transferClassifiedAs);
  }
  set classification(to: TransferClassification) {
    let current = this.myEntry.transferClassifiedAs;
    if (current && current !== to.hash) {
      Classifications.remove(this.hash, current, `classifiedAs`);
    }
    this.myEntry.transferClassifiedAs = to.hash;
  }

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

class EconomicEvent<T = {}> extends VfObject<EeEntry & T & typeof VfObject.entryType> {
  // begin mandatory overrides
  static className = "EconomicEvent";
  className = "EconomicEvent";
  static entryType: EeEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <EeEntry>{
    action: ``,
    affects: ``,
    affectedQuantity: { units: ``, quantity: 0 },
    start: 0,
    duration: 0
  });
  static get(hash: Hash<EconomicEvent>): EconomicEvent {
    return <EconomicEvent> super.get(hash);
  }
  static create(entry: EeEntry & typeof VfObject.entryType): EconomicEvent {
    return <EconomicEvent> super.create(entry);
  }
  constructor(entry?: EeEntry & T & typeof VfObject.entryType, hash?: Hash<EconomicEvent>) {
    super(entry, hash);
    if (!entry.start) this.myEntry.start = Date.now();
    if (!entry.duration) this.myEntry.duration = Date.now();
  }

  get action(): Action {
    return this.entry.action && Action.get(this.entry.action) || null;
  }
  set action(obj: Action) {
    let to = obj.hash;
    let my = this.myEntry;

    if (!!my.action && to !== my.action) {
      EventLinks.remove(this.hash, my.action, `action`);
    }
    my.action = to;
    this.update();
    EventLinks.put(this.hash, to, `action`);
  }

  get quantity(): QuantityValue {
    return new QuantityValue(this.myEntry.affectedQuantity);
  }
  set quantity(to: QuantityValue) {
    let {units, quantity} = to;
    this.myEntry.affectedQuantity = {units, quantity};
  }
  get start(): number {
    return this.myEntry.start;
  }
  started(when: number|Date): this {
    if (typeof when != `number`) {
      when = when.valueOf();
    }
    this.myEntry.start = when;
    this.update();
    return this;
  }
  get startDate(): Date {
    return new Date(this.start);
  }

  get duration(): number {
    return this.myEntry.duration;
  }

  get end(): number {
    const my = this.myEntry;
    return this.myEntry.start + this.myEntry.duration;
  }
  get endDate(): Date {
    return new Date(this.end);
  }
  ended(when?: number|Date): this {
    if (when === undefined || when === null) {
      when = Date.now();
    } else if (typeof when != `number`) {
      when = when.valueOf();
    }
    let my = this.myEntry;
    my.duration = when - my.start;
    this.update();
    return this;
  }
  instant(): this {
    this.myEntry.duration = 1;
    this.update();
    return this;
  }

  get isComplete(): boolean {
    return !!this.duration;
  }
  get isOngoing(): boolean {
    return !this.isComplete;
  }

  set affects(hash: Hash<EconomicResource>) {
    const my = this.myEntry;
    if (my.affects && my.affects !== hash) {
      TrackTrace.remove(this.hash, my.affects, `affects`);
    }
    my.affects = hash;
    this.update();
  }
  get affects(): Hash<EconomicResource> {
    return this.myEntry.affects;
  }


}

/*
 * Because I didn't think before dividing modules, they need to be freeze-dried
 * and thawed all the time to move between domains.  Further, to avoid compiling
 * each zome to a monolith, the only things they can export are type aliases.
 * That means entry types, not classes, and function signatures.  Oddly enough,
 * LinkRepo just needs a name and a type signature to thaw, so those will be ok
 */
namespace zome {
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
}

export default zome;

// <Zome exports> (call() functions)

// for <DRY> purposes
function trackTrace<T, U>(subjects: Hash<T>[], tag: string): Hash<U>[] {
  return subjects.reduce((response: Hash<U>[], subject: Hash<T>) => {
    return response.concat(EventLinks.get(subject, tag).hashes());
  }, []);
}
interface TimeFilter {
  events: Hash<EconomicEvent>[],
  when: number
}
function filterByTime({events, when}: TimeFilter, filter: (ev: EconomicEvent) => boolean): Hash<EconomicEvent>[] {
  return events.map((ev) => EconomicEvent.get(ev))
    .filter(filter)
    .map((ev) => ev.hash);
}
// </DRY>



// as of right now, events & transfers are one to one, so no need to be explody
/*
export interface Tracing {
  events: Hash<EconomicEvent>[];
  transfers: Hash<EconomicEvent>[];
  depth: number;
}
*/


function traceEvents(events: Hash<EconomicEvent>[]): Hash<Transfer>[] {
  return trackTrace(events, `outputOf`);
}

function trackEvents(events: Hash<EconomicEvent>[]): Hash<Transfer>[] {
  return trackTrace(events, `inputOf`);
}

function traceTransfers(xfers: Hash<Transfer>[]): Hash<EconomicEvent>[] {
  return trackTrace(xfers, `inputs`);
}

function trackTransfers(xfers: Hash<Transfer>[]): Hash<EconomicEvent>[] {
  return trackTrace(xfers, `outputs`);
}

function eventsStartedBefore({events, when}: TimeFilter): Hash<EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => when > ev.start));
}

function eventsEndedBefore({events, when}: TimeFilter): Hash<EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => ev.end < when));
}

function eventsStartedAfter({events, when}: TimeFilter): Hash<EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => when < ev.start));
}

function eventsEndedAfter({events, when}: TimeFilter): Hash<EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => ev.end > when));
}

function sortEvents(
  {events, by, order, start, end}:
  {events: Hash<EconomicEvent>[], order: "up"|"down", by: "start"|"end", start?: number, end?: number}
): Hash<EconomicEvent>[] {
  // Filter first: M = N; O = M + Mlog M = Nlog N + N
  // sort first: M = Nlog N; O = Nlog N + log M = Nlog N + (log N) + (log log N)
  // sort first.  N is more than log N + log log N
  let objects = events.map((ev) => EconomicEvent.get(ev)),
    orderBy = by === "start" ?
      (ev:EconomicEvent) => ev.start :
      (ev:EconomicEvent) => ev.end;
  objects.sort((a, b) => {
    return Math.sign(orderBy(b) - orderBy(a));
  });

  let times = (!!start || !!end) && objects.map(orderBy);
  if (start) {
    let i = bisect(times, start);
    objects = objects.slice(i);
  }
  if (end) {
    let i = bisect(times, end);
    objects = objects.slice(0, i);
  }
  if (order === "down") objects = objects.reverse();
  return objects.map((ev) => ev.hash);
}

type Subtotals = {
  events: {
    event: CrudResponse<typeof EconomicEvent.entryType>,
    subtotals: {[k:string]: QVlike}
  }[],
  totals: {[k:string]: QVlike}
};

function eventSubtotals(hashes: Hash<EconomicEvent>[]): Subtotals {
  const uniqueRes = new Set<Hash<EconomicResource>>();
  let events = hashes.map((h) => EconomicEvent.get(h));
  events.sort((a, b) => {
    return b.end - a.end;
  });

  events.forEach((ev) => {
    uniqueRes.add(ev.entry.affects);
  });

  let qvs: {[k:string]: QuantityValue};
  uniqueRes.forEach((ur) => {
    qvs[ur] = new QuantityValue({units: ``, quantity: 0});
  });

  let subs = events.map((ev) => {
    let item = {event: ev.portable(), subtotals: qvs},
      sign = ev.action.sign,
      quantity = ev.quantity.mul({units: ``, quantity: sign}),
      res = ev.affects;

    qvs = Object.assign({}, qvs, { [res]: qvs[res].add(quantity) });

    return item;
  });

  return {events: subs, totals: qvs};
}

function createEvent(init: typeof EconomicEvent.entryType): CrudResponse<typeof EconomicEvent.entryType> {
  let it: EconomicEvent, err: Error;
  try {
    it = EconomicEvent.create(init);
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: it.hash,
    entry: it.entry
  };
}

function createTransfer(init: typeof Transfer.entryType): CrudResponse<typeof Transfer.entryType> {
  let it: Transfer, err: Error;
  try {
    it = Transfer.create(init);
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: it.hash,
    entry: it.entry
  };
}

function createTransferClass(init: typeof TransferClassification.entryType): CrudResponse<typeof TransferClassification.entryType> {
  let it: TransferClassification, err: Error;
  try {
    it = TransferClassification.create(init);
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: it.hash,
    entry: it.entry
  };
}

function createAction(init: typeof Action.entryType): CrudResponse<typeof Action.entryType> {
  let it: Action, err: Error;

  try {
    it = Action.create(init);
  } catch (e) {
    err = e;
  }
  return {
    error: err,
    hash: it.hash,
    entry: it.entry
  };
}

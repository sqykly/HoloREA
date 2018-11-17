//* IMPORTS
import { Hash, QuantityValue, LinkRepo, VfObject, QVlike, HoloObject, CrudResponse, bisect, HoloThing, hashOf, notError, HoloClass } from "../../../lib/ts/common";
import resources from "../resources/resources";
import agents from "../agents/agents";
/*/
/**/

/* TYPE-SCOPE
import "../agents/agents"
import "../resources/resources"
import "../common/common"
/*/
/**/


// <imports>
type Agent = agents.Agent;
type EconomicResource = resources.EconomicResource;

const TrackTrace: resources.TrackTrace = new LinkRepo(`TrackTrace`);
TrackTrace.linkBack("affects", "affectedBy")
  .linkBack("affectedBy", "affects");
// </imports>

// <links>
const Classifications = new LinkRepo<
  Transfer|TransferClassification,
  Transfer|TransferClassification,
  "classifiedAs"|"classifies"
>("Classifications");
Classifications.linkBack("classifiedAs", "classifies")
  .linkBack("classifies", "classifiedAs");


const EventLinks = new LinkRepo<
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

// </links>

interface ActEntry {
  name?: string;
  behavior: '+'|'-'|'0';
}

class Action<T = {}> extends VfObject<ActEntry & T & typeof VfObject.entryType> {
  className = "Action";
  static className = "Action";
  static entryType: ActEntry & typeof VfObject.entryType;
  //protected myEntry: T & typeof Action.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <ActEntry> {
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

interface ProcEntry {
  name: string;
}

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

interface XferClassEntry {
  name: string;
}

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

const fixtures = {
  Action: {
    Give: new Action({name: `Give`, behavior: '-'}).commit(),
    Receive: new Action({name: `Receive`, behavior: '+'}).commit(),
    Adjust: new Action({name: `Adjust`, behavior: '+'}).commit()
  },
  TransferClassification: {
    Stub: new TransferClassification({
      name: `Transfer Classification Stub`
    }).commit()
  }
};

interface XferEntry {
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

  remove(msg:string): this {
    let {inputs, outputs, transferClassifiedAs: classy} = this.myEntry;
    if (inputs) {
      EventLinks.remove(this.hash, inputs, `inputs`);
    }
    if (outputs) {
      EventLinks.remove(this.hash, outputs, `outputs`);
    }
    if (classy) {
      Classifications.remove(this.hash, classy, `classifiedAs`);
    }
    return super.remove(msg);
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
    action: fixtures.Action.Adjust,
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
    entry = this.myEntry;
    if (!entry.start) this.myEntry.start = Date.now();
    if (!entry.duration) this.myEntry.duration = Date.now();
  }

  get action(): Action {
    return this.entry.action && Action.get(this.entry.action) || null;
  }
  set action(obj: Action) {
    let my = this.myEntry;
    if (!obj) {
      if (my.action) {
        throw new Error(`economicEvent.action is a required field; can't be set to ${obj}`);
      }
    }
    let to = obj.hash;


    if (!!my.action && to !== my.action) {
      EventLinks.remove(this.hash, my.action, `action`);
    }
    my.action = to;
    this.update();
    EventLinks.put(this.hash, to, `action`);
  }

  get inputOf(): Transfer {
    return this.myEntry.inputOf && Transfer.get(this.myEntry.inputOf) || null;
  }
  set inputOf(to: Transfer) {
    let my = this.myEntry;
    if (!to) {
      if (my.outputOf) {
        EventLinks.remove(this.myHash, my.outputOf, `outputOf`);
        my.outputOf = null;
      }
      return;
    }

    let hash = to.hash;
    if (!!my.inputOf && my.inputOf !== hash) {
      EventLinks.remove(this.hash, my.inputOf, `inputOf`);
      // somehow get the other instance to reload its fields?
    }
    my.inputOf = hash;
    EventLinks.put(this.myHash, hash, `inputOf`);
    this.myHash = this.update();
  }

  get outputOf(): Transfer {
    return this.myEntry.outputOf && Transfer.get(this.myEntry.outputOf) || null;
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

  set affects(res: HoloThing<EconomicResource>) {
    let hash = hashOf(res);
    const my = this.myEntry;
    if (my.affects && my.affects !== hash) {
      TrackTrace.remove(this.hash, my.affects, `affects`);
    }
    my.affects = hash;
    this.update();
  }
  get affects(): HoloThing<EconomicResource> {
    return this.myEntry.affects;
  }

  private updateLinks(hash?: Hash<this>): Hash<this> {
    hash = hash || this.hash
    let my = this.myEntry;
    let linksOut = EventLinks.get(this.myHash);

    let action = linksOut.tags(`action`);
    if (my.action && (!action.length || action.hashes[0] !== my.action)) {
      EventLinks.put(hash, my.action, `action`);
      if (action.length) {
        action.removeAll();
      }
    }

    let inputOf = linksOut.tags(`outputOf`);
    if (my.inputOf && (!inputOf.length || inputOf.hashes()[0] !== my.inputOf)) {
      EventLinks.put(hash, my.inputOf, `inputOf`);
      if (inputOf.length) {
        inputOf.removeAll();
      }
    }

    let outputOf = linksOut.tags(`outputOf`);
    if (my.outputOf && (!outputOf.length || outputOf.hashes()[0] !== my.outputOf)) {
      EventLinks.put(hash, my.outputOf, `outputOf`);
      if (outputOf.length) {
        outputOf.removeAll();
      }
    }

    let affects = TrackTrace.get(hash, `affects`);
    if (my.affects && (!affects.length || affects.hashes()[0] === my.affects)) {
      TrackTrace.put(hash, my.affects, `affects`);
      if (affects.length) {
        affects.removeAll();
      }
    }

    return hash;
  }

  commit(): Hash<this> {
    return this.updateLinks(super.commit());
  }

  update(): Hash<this> {
    return this.updateLinks(super.update());
  }

  remove(): this {
    const my = this.myEntry;
    const hash = this.myHash;

    // If the event is removed, its effect is also reversed.
    let affects = TrackTrace.get(hash, `affects`);
    if (affects.length) {
      let resource = <resources.EconomicResource> affects.data()[0];
      let sign = this.action.sign;
      let effect = this.quantity.mul({units: '', quantity: sign});
      let old = new QuantityValue(resource.currentQuantity);
      let {units, quantity} = old.sub(effect);

      resource.currentQuantity = {units, quantity};
      update(`EconomicResource`, resource, my.affects);
      affects.removeAll();
    }

    EventLinks.get(hash).tags(`action`, `inputOf`, `outputOf`).removeAll();

    return super.remove();
  }
}

/*
 * Because I didn't think before dividing modules, they need to be freeze-dried
 * and thawed all the time to move between domains.  Further, to avoid compiling
 * each zome to a monolith, the only things they can export are type aliases.
 * That means entry types, not classes, and function signatures.  Oddly enough,
 * LinkRepo just needs a name and a type signature to thaw, so those will be ok
 */

/* TYPE-SCOPE
//declare
/*/
/**/
//* EXPORT

namespace events {
  export type Action = typeof Action.entryType;
  export type EconomicEvent = typeof EconomicEvent.entryType;
  export type TransferClassification = typeof TransferClassification.entryType;
  export type Transfer = typeof Transfer.entryType;
  export type Process = typeof Process.entryType;
  export type Classifications = typeof Classifications;
  export type EventLinks = typeof EventLinks;
  //export type functions =
  //  "traceEvents"|"trackEvents"|"traceTransfers"|"trackTransfers"|
  //  "eventSubtotals"|"eventsEndedBefore"|"eventsStartedBefore"|"eventEndedAfter"|
  //  "eventsStartedAfter"|"createEvent"|"createTransfer"|"createTransferClass"|
  //  "createAction"|"resourceCreationEvent"|"sortEvents";
  //export type trackEvents = typeof trackEvents;
  //export type traceEvents = typeof traceEvents;
  //export type traceTransfers = typeof traceTransfers;
  //export type trackTransfers = typeof trackTransfers;
  //export type eventSubtotals = typeof eventSubtotals;
  //export type eventsStartedBefore = typeof eventsStartedBefore;
  //export type eventsEndedBefore = typeof eventsEndedBefore;
  //export type eventsStartedAfter = typeof eventsStartedAfter;
  //export type eventsEndedAfter = typeof eventsEndedAfter;
  //export type sortEvents = typeof sortEvents;
  //export type resourceCreationEvent = typeof resourceCreationEvent;
}
export default events;
/*/
/**/


// <Zome exports> (call() functions)
//* HOLO-SCOPE
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

function traceEvents(events: Hash<EconomicEvent>[]): CrudResponse<events.Transfer>[] {
  return trackTrace(events, `outputOf`).map((hash) => {
    let instance = Transfer.get(hash);
    return instance.portable();
  });
}

function trackEvents(events: Hash<EconomicEvent>[]): CrudResponse<events.Transfer>[] {
  return trackTrace(events, `inputOf`).map((hash) => {
    let instance = Transfer.get(hash);
    return instance.portable();
  });
}

function traceTransfers(xfers: Hash<Transfer>[]): CrudResponse<events.EconomicEvent>[] {
  return trackTrace(xfers, `inputs`).map((hash) => {
    let instance = EconomicEvent.get(hash);
    return instance.portable();
  });
}

function trackTransfers(xfers: Hash<Transfer>[]): CrudResponse<events.EconomicEvent>[] {
  return trackTrace(xfers, `outputs`).map((hash) => {
    let instance = EconomicEvent.get(hash);
    return instance.portable();
  });
}

function eventsStartedBefore({events, when}: TimeFilter): CrudResponse<events.EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => when > ev.start)).map(hash => {
    return EconomicEvent.get(hash).portable();
  });
}

function eventsEndedBefore({events, when}: TimeFilter): CrudResponse<events.EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => ev.end < when)).map(hash => {
    return EconomicEvent.get(hash).portable();
  });
}

function eventsStartedAfter({events, when}: TimeFilter): CrudResponse<events.EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => when < ev.start)).map(hash => {
    return EconomicEvent.get(hash).portable();
  });
}

function eventsEndedAfter({events, when}: TimeFilter): CrudResponse<events.EconomicEvent>[] {
  return filterByTime({events, when}, ((ev) => ev.end > when)).map(hash => {
    return EconomicEvent.get(hash).portable();
  });
}

function sortEvents(
  {events, by, order, start, end}:
  {events: Hash<EconomicEvent>[], order: "up"|"down", by: "start"|"end", start?: number, end?: number}
): CrudResponse<events.EconomicEvent>[] {
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
  return objects.map((ev) => ev.portable());
}
/*/
/**/

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
//* HOLO-SCOPE
interface Subtotals {
  events: {
    event: CrudResponse<typeof EconomicEvent.entryType>,
    subtotals: {[k:string]: QVlike}
  }[];
  resources: Hash<resources.EconomicResource>[];
  totals: {[k:string]: QVlike};
};

function eventSubtotals(hashes: Hash<EconomicEvent>[]): Subtotals {
  const uniqueRes = new Set<Hash<EconomicResource>>();
  let resourceHashes: Hash<resources.EconomicResource>[] = [];

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
    resourceHashes.push(ur);
  });

  let subs = events.map((ev) => {
    let item = {event: ev.portable(), subtotals: qvs},
      sign = ev.action.sign,
      quantity = ev.quantity.mul({units: ``, quantity: sign}),
      res = hashOf(ev.affects);

    qvs = Object.assign({}, qvs, { [res]: qvs[res].add(quantity) });

    return item;
  });

  return {events: subs, totals: qvs, resources: resourceHashes};
}

// <fixtures>


function getFixtures(dontCare: any): typeof fixtures {
  return fixtures;
}

// </fixures>

function resourceCreationEvent(
  { resource, dates }: {
    resource: resources.EconomicResource, dates?:{start: number, end?:number}
  }
): CrudResponse<events.EconomicEvent> {
  let adjustHash: Hash<Action> = fixtures.Action.Adjust;
  let qv = resource.currentQuantity;
  let start: number, end: number;
  if (dates) {
    start = dates.start;
    end = dates.end || start + 1;
  } else {
    start = Date.now();
    end = start + 1;
  }
  if (!qv.units) {
    let resClass =
      notError<resources.ResourceClassification>(get(resource.resourceClassifiedAs));
    qv.units = resClass.defaultUnits;
  }

  let resHash: Hash<resources.EconomicResource> =
    notError(commit(`EconomicResource`, resource));

  // THIS ONLY WORKS IN A STRATEGY-2 RESOURCE (see mattermost rants)
  // a strategy-1 resource is calculated forward, so the pre-event state MUST
  // have quantity 0.
  let entry: events.EconomicEvent = {
    action: adjustHash,
    affects: resHash,
    receiver: resource.owner,
    provider: resource.owner,
    affectedQuantity: qv,
    start: start,
    duration: end - start
  };
  let event = new EconomicEvent(entry);
  return {
    type: event.className,
    hash: event.commit(),
    entry: event.entry
  }
}

// CRUD
function createEvent(init: typeof EconomicEvent.entryType): CrudResponse<typeof EconomicEvent.entryType> {
  let it: EconomicEvent, err: Error;
  try {
    it = EconomicEvent.create(init);
    let affect = it.affects;

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
/*/
/**/

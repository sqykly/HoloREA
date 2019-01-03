// <reference path="../common/common"/>
// <reference path="../agents/agents"/>
// <reference path="../resources/resources"/>
//* IMPORTS
//import { Hash, QuantityValue, LinkRepo, VfObject, QVlike, HoloObject, CrudResponse, bisect, HoloThing, hashOf, notError, HoloClass } from "../../../lib/ts/common";
import {
  Hash, QuantityValue, VfObject, QVlike, HoloObject, CrudResponse, bisect,
  HoloThing, hashOf, notError, HoloClass, deepAssign, Fixture, Initializer,
  reader, entryOf, creator
} from "../common/common";
import resources from "../resources/resources";
import agents from "../agents/agents";
import { LinkRepo } from "../common/LinkRepo";
import { LinkSet } from "../common/LinkRepo";
/*/
/**/

/* TYPE-SCOPE
//import "../agents/agents"
//import "../resources/resources"
//import "../common/common"
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
const Classifications: LinkRepo<
  events.Transfer|events.TransferClassification,
  events.Transfer|events.TransferClassification,
  "classifiedAs"|"classifies"
> = new LinkRepo("Classifications");
Classifications.linkBack("classifiedAs", "classifies")
  .linkBack("classifies", "classifiedAs");


const EventLinks: LinkRepo<
  events.EconomicEvent|events.Transfer|events.Process|events.Action,
  events.EconomicEvent|events.Transfer|events.Process|events.Action,
  "inputs"|"inputOf"|"outputs"|"outputOf"|"actionOf"|"action"
> = new LinkRepo("EventLinks");
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
  static entryDefaults = deepAssign({}, VfObject.entryDefaults, <Initializer<ActEntry>> {
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

  get events(): EconomicEvent[] {
    return EventLinks.get(this.myHash, `actionOf`).hashes().map((hash) => EconomicEvent.get(hash));
  }
}

interface ProcClass {
  label: string;
}

class ProcessClassification<T = {}> extends VfObject<T & ProcClass & typeof VfObject.entryType> {
  static className = "ProcessClassification";
  className = "ProcessClassification";
  static entryType: ProcClass & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <Initializer<ProcClass>> {

    });

  static get(hash: Hash<ProcessClassification>): ProcessClassification {
    return <ProcessClassification> super.get(hash);
  }
  static create(entry: ProcClass & typeof VfObject.entryType): ProcessClassification {
    return <ProcessClassification> super.create(entry);
  }
  constructor(entry?: T & ProcClass & typeof VfObject.entryType, hash?: Hash<ProcessClassification>) {
    super(entry, hash);
  }

}

interface ProcEntry {
  name: string;
  plannedStart: number;
  plannedDuration: number;
  isFinished: boolean;
  note: string;
  processClassifiedAs: Hash<ProcessClassification>;
}

type VfProc = ProcEntry & typeof VfObject.entryType & {
  inputs?: Hash<EconomicEvent>[];
  outputs?: Hash<EconomicEvent>[];
}

interface ProcLinks {
  processClassifiedAs: LinkRepo<ProcEntry, ProcClass, "classifiedAs"|"classifies">,
  inputs: LinkRepo<ProcEntry, typeof EconomicEvent.entryType, "inputs"|"inputOf">,
  outputs: LinkRepo<ProcEntry, typeof EconomicEvent.entryType, "outputs"|"outputOf">
}

class Process<T = {}> extends VfObject<T & ProcEntry  & typeof VfObject.entryType> {
  static className = "Process";
  className = "Process";
  static entryType: ProcEntry  & typeof VfObject.entryType;
  static entryDefaults = deepAssign({}, VfObject.entryDefaults,
    <Initializer<ProcEntry>> {
      processClassifiedAs: () => (getFixtures({}).ProcessClassification.stub),
      plannedStart: 0,
      plannedDuration: 0,
      isFinished: false,
      note: ``
    });

  private static readonly links: ProcLinks = {
    processClassifiedAs: new LinkRepo<ProcEntry, ProcClass, "classifies"|"classifiedAs">(`Classifications`)
      .linkBack(`classifiedAs`, `classifies`)
      .linkBack(`classifies`, `classifiedAs`)
      .singular(`classifiedAs`),
    inputs: new LinkRepo<ProcEntry, typeof EconomicEvent.entryType, "inputs"|"inputOf">(`EventLinks`)
      .linkBack(`inputs`, `inputOf`)
      .linkBack(`inputOf`, `inputs`)
      .singular(`inputOf`),
    outputs: new LinkRepo<ProcEntry, typeof EconomicEvent.entryType, "outputs"|"outputOf">(`EventLinks`)
      .linkBack(`outputs`, `outputOf`)
      .linkBack(`outputOf`, `outputs`)
      .singular(`outputOf`)
  }

  private readonly links: typeof Process.links = Process.links;

  private loadLinks() {
    this.myEntry.processClassifiedAs = this.links.processClassifiedAs
      .get(this.myHash, `classifiedAs`).hashes()[0];

    this.inputs = this.links.inputs.get(this.myHash, `inputs`).types(`EconomicEvent`);
    this.inputs.forEach(({Hash}, i, inputs) => {
      inputs[i].Entry = EconomicEvent.get(Hash);
    });
    this.inputs.sync = false;

    this.outputs = this.links.outputs.get(this.myHash, `outputs`).types(`EconomicEvent`);
    this.outputs.forEach(({Hash}, i, outputs) => {
      outputs[i].Entry = EconomicEvent.get(Hash);
    });
    this.outputs.sync = false;

  }
  private saveLinks(hash: Hash<ProcEntry>): Hash<ProcEntry> {
    this.links.processClassifiedAs.put(this.myHash, this.myEntry.processClassifiedAs, `classifiedAs`);

    this.inputs.save(true, true);

    this.outputs.save(true, true);

    return hash;
  }

  static get(hash: Hash<Process>): Process {
    let proc = <Process> super.get(hash);
    proc.loadLinks();
    return proc;
  }

  static create(entry: ProcEntry  & typeof VfObject.entryType): Process {
    return <Process> super.create(entry);
  }
  constructor(entry?: T & ProcEntry  & typeof VfObject.entryType, hash?: Hash<Process>) {
    super(entry, hash);
  }

  inputs: LinkSet<ProcEntry, EeEntry, "inputs"|"inputOf">;
  outputs: LinkSet<ProcEntry, EeEntry, "outputs"|"outputOf">;

  protected linksChanged(): boolean {
    let {inputs, outputs, hash} = this;
    let oldInputs = this.links.inputs.get(hash, `inputs`);
    let oldOutputs = this.links.outputs.get(hash, `outputs`);
    if (inputs.notIn(oldInputs).length || oldInputs.notIn(inputs).length) {
      return true;
    }
    if (outputs.notIn(oldOutputs).length || oldOutputs.notIn(outputs).length) {
      return true;
    }
    return false;
  }

  get processClassifiedAs(): ProcessClassification {
    return ProcessClassification.get(this.myEntry.processClassifiedAs);
  }

  set processClassifiedAs(to: ProcessClassification) {
    this.myEntry.processClassifiedAs = to.hash;
  }

  get plannedDuration(): number {
    return this.myEntry.plannedDuration;
  }

  set plannedDuration(to: number) {
    this.myEntry.plannedDuration = to;
  }

  get plannedStart(): number {
    return this.myEntry.plannedStart;
  }
  set plannedStart(to: number) {
    this.myEntry.plannedStart = to;
  }

  get plannedEnd(): number {
    let my = this.myEntry;
    return my.plannedStart + (my.plannedDuration || Infinity);
  }
  set plannedEnd(to: number) {
    let my = this.myEntry;
    if (!to || to === Infinity) {
      my.plannedDuration = 0;
    } else {
      my.plannedDuration = to - my.plannedStart;
    }
  }

  get isFinished(): boolean {
    return this.myEntry.isFinished;
  }
  set isFinished(to: boolean) {
    this.myEntry.isFinished = to;
  }

  get start(): number {
    let now = Date.now();
    let t = this.inputs.data().concat(this.outputs.data()).reduce(
      ((early, {start}) => (start < early ? start : early)),
      now
    );
    if (t === now) {
      return 0;
    } else {
      return t;
    }
  }

  get end(): number {
    if (!this.myEntry.isFinished) return 0;

    let then = 0;

    let t = this.inputs.data().concat(this.outputs.data()).reduce(
      ((later, {start, duration}) => {
        if (duration === 0) return later;
        let end = start + duration;
        return end > later ? end : later;
      }),
      then
    );

    return t;
  }

  addInputs(...events: EconomicEvent[]): this {
    for (let event of events) {
      this.inputs.add(`inputs`, event.hash, event.className);
    }
    return this;
  }

  addOutputs(...events: EconomicEvent[]): this {
    for (let event of events) {
      this.outputs.add(`outputs`, event.hash, event.className);
    }
    return this;
  }

  getInputs(): EconomicEvent[];
  getInputs(i: number): EconomicEvent;
  getInputs(i?: number) {
    if (!i && i !== 0) {
      return this.inputs.hashes().map(EconomicEvent.get);
    } else {
      let len = this.inputs.length;
      if (i >= len || i < 0) throw new RangeError(`invalid index ${i} for length ${len}`);

      return EconomicEvent.get(this.inputs[i].Hash);
    }
  }

  getOutputs(): EconomicEvent[];
  getOutputs(i: number): EconomicEvent;
  getOutputs(i?: number) {
    if (!i && i !== 0) {
      return this.outputs.hashes().map(EconomicEvent.get);
    } else {
      let len = this.outputs.length;
      if (i >= len || i < 0) throw new RangeError(`invalid index ${i} for length ${len}`);

      return EconomicEvent.get(this.outputs[i].Hash);
    }
  }

  netEffectOn(res: HoloThing<resources.EconomicResource>): QuantityValue {
    let resHash: Hash<resources.EconomicResource> = hashOf(res);
    return this.getOutputs().concat(this.getInputs())
      .filter((ev) => ev.affects === resHash)
      .reduce(
        (sum: QuantityValue, ev) => {
          let term = ev.quantity.mul({quantity: ev.action.sign, units: ``});
          if (sum) term = term.add(sum);
          return term;
        },
        null
      );
  }

  commit(): Hash<Process> {
    return this.saveLinks(super.commit());
  }

  update(): Hash<Process> {
    return this.saveLinks(super.update());
  }

  remove(): this {
    this.links.inputs.get(this.myHash, `inputs`).removeAll();
    this.links.outputs.get(this.myHash, `outputs`).removeAll();
    this.links.processClassifiedAs.remove(this.myHash, this.myEntry.processClassifiedAs, `classifiedAs`);
    return super.remove();
  }
}

interface XferClassEntry {
  name: string;
}

class TransferClassification<T = {}> extends VfObject<T & XferClassEntry & typeof VfObject.entryType> {
  static className = "TransferClassification";
  className = "TransferClassification";
  static entryType: XferClassEntry & typeof VfObject.entryType;
  static entryDefaults = deepAssign({}, VfObject.entryDefaults, <Initializer<XferClassEntry>> {

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

// Can't have DHT functions at the top level like this.

interface XferEntry {
  transferClassifiedAs: Hash<TransferClassification>;
  inputs: Hash<EconomicEvent>;
  outputs: Hash<EconomicEvent>;
}

class Transfer<T = {}> extends VfObject<T & typeof VfObject.entryType & XferEntry> {
  className = "Transfer";
  static className = "Transfer";
  static entryType: XferEntry & typeof VfObject.entryType;
  static entryDefaults = deepAssign({}, VfObject.entryDefaults, <Initializer<XferEntry>> {
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

  private saveLinks(hash: Hash<this>) {
    let my = this.myEntry;
    let links = EventLinks.get(this.myHash).tags(`inputs`, `outputs`);

    let inputs = links.tags(`inputs`);
    if (inputs.length) {
      if (inputs[0].Hash !== my.inputs) {
        inputs.removeAll();
      }
    }
    if (my.inputs) EventLinks.put(hash, my.inputs, `inputs`);

    let outputs = links.tags(`outputs`);
    if (outputs.length) {
      if (outputs[0].Hash !== my.outputs) {
        outputs.removeAll();
      }
    }
    if (my.outputs) EventLinks.put(hash, my.outputs, `outputs`);

    let cl = Classifications.get(this.myHash, `classifiedAs`);
    if (cl.length) {
      if (cl[0].Hash !== my.transferClassifiedAs) {
        cl.removeAll();
      }
    }
    if (my.transferClassifiedAs) Classifications.put(hash, my.transferClassifiedAs, `classifiedAs`);

    return hash;
  }

  commit(): Hash<this> {
    return this.saveLinks(super.commit());
  }

  update(): Hash<this> {
    return this.saveLinks(super.update());
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
  static entryDefaults = deepAssign({}, VfObject.entryDefaults, <Initializer<EeEntry>>{

    action: () => getFixtures(null).Action.Adjust,
    affects: ``,
    affectedQuantity: { units: ``, quantity: 0 },
    start: 0,
    duration: 0,
    provider: ``,
    receiver: ``
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
    //EventLinks.put(this.hash, to, `action`);
  }

  get inputOf(): Transfer|Process {
    return this.myEntry.inputOf && Transfer.get(this.myEntry.inputOf) || null;
  }
  set inputOf(to: Transfer|Process) {
    let my = this.myEntry;
    if (!to) {
      if (my.inputOf) {
        EventLinks.remove(this.myHash, my.inputOf, `outputOf`);
        my.inputOf = null;
      }
      return;
    }

    let hash = to.hash;
    if (!!my.inputOf && my.inputOf !== hash) {
      EventLinks.remove(this.hash, my.inputOf, `inputOf`);
      // somehow get the other instance to reload its fields?
    }
    my.inputOf = hash;
    //EventLinks.put(this.myHash, hash, `inputOf`);

  }

  get inputOfProcess(): Process {
    return Process.get(this.myEntry.inputOf);
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
    //this.update();
  }
  get affects(): HoloThing<EconomicResource> {
    return this.myEntry.affects;
  }

  protected updateLinks(hash?: Hash<this>): Hash<this> {
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

    let inputOf = linksOut.tags(`inputOf`);
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

//* TYPE-SCOPE
declare global {
/*/
/**/


namespace events {
  export type Action = typeof Action.entryType;
  export type EconomicEvent = typeof EconomicEvent.entryType;
  export type TransferClassification = typeof TransferClassification.entryType;
  export type Transfer = typeof Transfer.entryType;
  export type ProcessClassification = typeof ProcessClassification.entryType;
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
//* TYPE-SCOPE
}
/*/
/**/

//* EXPORT
export default events;
/*/
/**/


// <Zome exports> (call() functions)
//* HOLO-SCOPE
// for <DRY> purposes
function trackTrace<T, U>(subjects: Hash<T>[], tag: "inputs"|"outputs"|"outputOf"|"inputOf"): Hash<U>[] {
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
let fixtures: {
  Action: Fixture<Action>,
  TransferClassification: Fixture<TransferClassification>,
  ProcessClassification: Fixture<ProcessClassification>
};

function getFixtures(dontCare: any): typeof fixtures {
  return {
    Action: {
      give: new Action({name: `Give`, behavior: '-'}).commit(),
      receive: new Action({name: `Receive`, behavior: '+'}).commit(),
      adjust: new Action({name: `Adjust`, behavior: '+'}).commit(),
      produce: new Action({name: `Produce`, behavior: '+'}).commit(),
      consume: new Action({name: `Consume`, behavior: '-'}).commit()
    },
    TransferClassification: {
      stub: new TransferClassification({
        name: `Transfer Classification Stub`
      }).commit()
    },
    ProcessClassification: {
      stub: new ProcessClassification({label: `Process Class Stub`}).commit()
    }
  };
}

// </fixures>

function resourceCreationEvent(
  { resource, dates }: {
    resource: resources.EconomicResource, dates?:{start: number, end?:number}
  }
): CrudResponse<events.EconomicEvent> {
  let adjustHash: Hash<Action> = getFixtures({}).Action.Adjust;
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
  let it: EconomicEvent = null, err: Error;
  try {
    it = EconomicEvent.create(init);

    if (it.affects) {
      call(`resources`, `affect`, {
        resource: it.affects,
        quantity: it.quantity.mul({ units: ``, quantity: it.action.sign })
      });
    }

    return it.portable();
  } catch (e) {
    return {
      error: e,
      hash: it && it.hash,
      entry: it && it.entry,
      type: it && it.className
    };
  }
}

const readEvents = reader(EconomicEvent);

type ExtXfer = typeof VfObject.entryType & {
  transferClassifiedAs: Hash<TransferClassification>,
  inputs: HoloThing<typeof EconomicEvent.entryType>,
  outputs: HoloThing<typeof EconomicEvent.entryType>
};

function createTransfer(init: ExtXfer): CrudResponse<typeof Transfer.entryType> {
  let it: Transfer = null, err: Error;
  try {
    let inputs: Hash<events.EconomicEvent>;
    if (typeof init.inputs === `string`) {
      inputs = init.inputs;
    } else {
      let that = createEvent(entryOf(init.inputs));
      if (that.error) throw that.error;
      inputs = that.hash;
    }

    let outputs: Hash<events.EconomicEvent>
    if (typeof init.outputs === `string`) {
      outputs = init.outputs;
    } else {
      let that = createEvent(entryOf(init.outputs));
      if (that.error) throw that.error;
      outputs = that.hash;
    }

    let props: events.Transfer = {
      transferClassifiedAs: init.transferClassifiedAs,
      inputs, outputs
    };
    it = Transfer.create(props);
    it.commit();
    return it.portable();
  } catch (e) {
    err = e;
    return {
      error: err,
      hash: it && it.hash,
      entry: it && it.entry,
      type: it && it.className
    };
  }
}

const readTransfers = reader(Transfer);

const createTransferClass = creator(TransferClassification);
const readTransferClasses = reader(TransferClassification);

const createAction = creator(Action);
const readActions = reader(Action);

const createProcessClass = creator(ProcessClassification);
const readProcessClasses = reader(ProcessClassification);

function createProcess(init: VfProc): CrudResponse<events.Process> {
  let props = {
    image: init.image,
    isFinished: init.isFinished,
    name: init.name,
    note: init.note,
    plannedStart: init.plannedStart,
    plannedDuration: init.plannedDuration,
    processClassifiedAs: init.processClassifiedAs
  };

  let it: Process;
  try {
    it = Process.create(props);
    it.addInputs(...init.inputs.map(EconomicEvent.get));
    it.addOutputs(...init.outputs.map(EconomicEvent.get));
    it.commit();
    return it.portable();
  } catch (e) {
    return {
      error: e,
      hash: it && it.hash,
      entry: it && it.entry,
      type: it && it.className
    };
  }
}

function readProcesses(hashes: Hash<ProcEntry>[]): CrudResponse<VfProc>[] {
  return hashes.map((hash) => {
    let proc: Process;
    try {

      let proc = Process.get(hash);
      return deepAssign(proc.portable(), {
        entry: {
          inputs: proc.inputs.hashes(),
          outputs: proc.outputs.hashes()
        }
      });

    } catch (e) {

      return {
        error: e,
        hash: proc && proc.hash,
        entry: proc && proc.entry,
        type: proc && proc.className
      }

    }
  });
}

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

/*/
/**/

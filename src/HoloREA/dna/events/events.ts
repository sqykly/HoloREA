import { EconomicResource, TrackTrace } from "../resources/resources";
import { Agent } from "../agents/agents"
import { Hash, QuantityValue, LinkRepo, VfObject, QVlike } from "../../../lib/ts/common";

interface ActEntry {
  name: string;
  behavior: "+"|"-"|"0";
}

export class Action<T = {}> extends VfObject<ActEntry & T & typeof VfObject.entryType> {
  className = "Action";
  static className = "Action";
  static entryType: ActEntry & typeof VfObject.entryType;
  protected myEntry: T & typeof Action.entryType;

  isIncrement(): boolean {
    return this.myEntry.behavior === "+";
  }

  isDecrement(): boolean {
    return this.myEntry.behavior === "-";
  }

  isNoEffect(): boolean {
    return this.myEntry.behavior === "0";
  }

  get behavior(): typeof Action.entryType.behavior {
    return this.myEntry.behavior;
  }

  set behavior(to: typeof Action.entryType.behavior) {
    this.myEntry.behavior = to;
  }

  get name(): string {
    return this.myEntry.name;
  }

  set name(to: string) {
    this.myEntry.name = to;
  }
}

export class Process<T={}> extends VfObject<T & typeof VfObject.entryType> {
  className = "Process";
  static className = "Process";
  static entryType: typeof VfObject.entryType;
  protected myEntry: T & typeof Process.entryType;
}
export type TransferClassification = VfObject;

export const Classifications = new LinkRepo<Transfer|TransferClassification, Transfer|TransferClassification, "classifiedAs"|"classifiedBy">("Classifications");
Classifications.linkBack("classifiedAs", Classifications, "classifiedBy")
  .linkBack("classifiedBy", Classifications, "classifiedAs");


export const EventLinks = new LinkRepo<EconomicEvent|Transfer|Process, EconomicEvent|Transfer|Process, "inputs"|"inputOf"|"outputs"|"outputOf">("EventLinks");
EventLinks.linkBack("inputs", EventLinks, "inputOf")
  .linkBack("outputs", EventLinks, "outputOf")
  .linkBack("inputOf", EventLinks, "inputs")
  .linkBack("outputOf", EventLinks, "outputs");

interface XferEntry {
  transferClassifiedAs: Hash<TransferClassification>;
  inputs: Hash<EconomicEvent|Process>;
  outputs: Hash<EconomicEvent|Process>;
}

export class Transfer<T = {}> extends VfObject<T & typeof VfObject.entryType & XferEntry> {
  className = "Transfer";
  static className = "Transfer";
  static entryType: XferEntry & typeof VfObject.entryType;
  //protected myEntry: T & XferEntry & typeof VfObject.entryType;

  // TODO
}

interface EeEntry {
  action: Hash<Action>;
  outputOf?: Hash<Transfer|Process>;
  inputOf?: Hash<Transfer|Process>;
  affects: Hash<EconomicResource>;
  receiver?: Hash<Agent>;
  provider?: Hash<Agent>;
  scope?: Hash<any>;
  affectedQuantity: QVlike;
  started: string;
  duration: string;
}

export class EconomicEvent<T = {}> extends VfObject<EeEntry & T & typeof VfObject.entryType> {
  // begin mandatory overrides
  static className = "EconomicEvent";
  readonly className = "EconomicEvent";
  static entryType: EeEntry & typeof VfObject.entryType;
  static entryDefaults = Object.assign({}, VfObject.entryDefaults, <EeEntry>{
    action: ``,
    affects: ``,
    affectedQuantity: { units: ``, quantity: 0},
    started: new Date().toString(),
    duration: new Date(0).toString()
  });
  static get(hash: Hash<EconomicEvent>): EconomicEvent {
    return <EconomicEvent> super.get(hash);
  }

  // TODO
}

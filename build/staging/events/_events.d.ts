type EconomicResource = resources.EconomicResource;
const Classifications: LinkRepo<events.Transfer | events.TransferClassification, events.Transfer | events.TransferClassification, "classifiedAs" | "classifies">;
const EventLinks: LinkRepo<events.EconomicEvent | events.Transfer | events.Process | events.Action, events.EconomicEvent | events.Transfer | events.Process | events.Action, "inputs" | "inputOf" | "outputs" | "outputOf" | "actionOf" | "action">;
interface ActEntry {
    name?: string;
    behavior: '+' | '-' | '0';
}
class Action<T = {}> extends VfObject<ActEntry & T & typeof VfObject.entryType> {
    className: string;
    static className: string;
    static entryType: ActEntry & typeof VfObject.entryType;
    static entryDefaults: VfEntry & object & ActEntry;
    static get(hash: Hash<Action>): Action;
    static create(entry: ActEntry & typeof VfObject.entryType): Action;
    constructor(entry?: T & ActEntry & typeof VfObject.entryType, hash?: Hash<Action>);
    isIncrement(): boolean;
    isDecrement(): boolean;
    isNoEffect(): boolean;
    behavior: typeof Action.entryType.behavior;
    readonly sign: number;
}
interface ProcEntry {
    name: string;
}
class Process<T = {}> extends VfObject<T & ProcEntry & typeof VfObject.entryType> {
    static className: string;
    className: string;
    static entryType: ProcEntry & typeof VfObject.entryType;
    static entryDefaults: VfEntry & object & ProcEntry;
    static get(hash: Hash<Process>): Process;
    static create(entry: ProcEntry & typeof VfObject.entryType): Process;
    constructor(entry?: T & ProcEntry & typeof VfObject.entryType, hash?: Hash<Process>);
}
interface XferClassEntry {
    name: string;
}
class TransferClassification<T = {}> extends VfObject<T & XferClassEntry & typeof VfObject.entryType> {
    static className: string;
    className: string;
    static entryType: XferClassEntry & typeof VfObject.entryType;
    static entryDefaults: VfEntry & object & XferClassEntry;
    static get(hash: Hash<TransferClassification>): TransferClassification;
    static create(entry: XferClassEntry & typeof VfObject.entryType): TransferClassification;
    constructor(entry?: T & XferClassEntry & typeof VfObject.entryType, hash?: Hash<TransferClassification>);
}
interface XferEntry {
    transferClassifiedAs: Hash<TransferClassification>;
    inputs: Hash<EconomicEvent | Process>;
    outputs: Hash<EconomicEvent | Process>;
}
class Transfer<T = {}> extends VfObject<T & typeof VfObject.entryType & XferEntry> {
    className: string;
    static className: string;
    static entryType: XferEntry & typeof VfObject.entryType;
    static entryDefaults: VfEntry & object & XferEntry;
    static get(hash: Hash<Transfer>): Transfer;
    static create(entry?: XferEntry & typeof VfObject.entryType): Transfer;
    constructor(entry?: T & XferEntry & typeof VfObject.entryType, hash?: Hash<Transfer>);
    input: EconomicEvent;
    output: EconomicEvent;
    classification: TransferClassification;
    remove(msg: string): this;
}
interface EeEntry {
    action: Hash<Action>;
    outputOf?: Hash<Transfer | Process>;
    inputOf?: Hash<Transfer | Process>;
    affects: Hash<EconomicResource>;
    receiver: string;
    provider: string;
    scope?: Hash<any>;
    affectedQuantity: QVlike;
    start?: number;
    duration?: number;
}
class EconomicEvent<T = {}> extends VfObject<EeEntry & T & typeof VfObject.entryType> {
    static className: string;
    className: string;
    static entryType: EeEntry & typeof VfObject.entryType;
    static entryDefaults: VfEntry & object & EeEntry;
    static get(hash: Hash<EconomicEvent>): EconomicEvent;
    static create(entry: EeEntry & typeof VfObject.entryType): EconomicEvent;
    constructor(entry?: EeEntry & T & typeof VfObject.entryType, hash?: Hash<EconomicEvent>);
    action: Action;
    inputOf: Transfer;
    readonly outputOf: Transfer;
    quantity: QuantityValue;
    readonly start: number;
    started(when: number | Date): this;
    readonly startDate: Date;
    readonly duration: number;
    readonly end: number;
    readonly endDate: Date;
    ended(when?: number | Date): this;
    instant(): this;
    readonly isComplete: boolean;
    readonly isOngoing: boolean;
    affects: HoloThing<EconomicResource>;
    private updateLinks;
    commit(): Hash<this>;
    update(): Hash<this>;
    remove(): this;
}
declare global {
    namespace events {
        type Action = typeof Action.entryType;
        type EconomicEvent = typeof EconomicEvent.entryType;
        type TransferClassification = typeof TransferClassification.entryType;
        type Transfer = typeof Transfer.entryType;
        type Process = typeof Process.entryType;
        type Classifications = typeof Classifications;
        type EventLinks = typeof EventLinks;
    }
}
//
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


declare type Hash<T> = string;

declare interface QuantityValue {
  units: string;
  quantity: number;
}

declare type IntDate = number;

declare type PhysicalLocation = string[];

declare interface VfObject {
  name?: string;
  note?: string;
  url?: string;
  primaryLocation?: PhysicalLocation;
}

declare type CrudResponse<T> = {
  error: {
    name: string;
    message: string;
    stack: string;
  }
  hash?: Hash<T>;
  entry?: T;
  type?: string
} | {
  error?: null;
  hash: Hash<T>;
  entry: T;
  type: string;
};

declare type Anything<T> = T | Hash<T> | CrudResponse<T>;

declare type ZomeFn<Arg, Ret> = (args: Arg) => Promise<Ret>;

declare namespace agents {
  export interface Agent extends VfObject {
    primaryLocation?: PhysicalLocation;
    name: string;
  }
  export type EconomicAgent = Agent;

  export function createAgent(props: Agent): Promise<CrudResponse<Agent>>;

  export function getOwnedResources(
    args: {
      agents: Hash<Agent>[],
      types: Hash<resources.ResourceClassification>[]
    }
  ): Promise<{
    [k:string]: {
      [l:string]: Hash<resources.EconomicResource>
    }
  }>;

  export function readAgents(which: Hash<Agent>[]):
    Promise<CrudResponse<Agent>[]>;

}

declare namespace resources {
  export interface ResourceClassification extends VfObject {
    defaultUnits: string;
  }

  export interface EconomicResource extends VfObject {
    currentQuantity: QuantityValue;
    resourceClassifiedAs: Hash<ResourceClassification>;
    underlyingResource?: Hash<EconomicResource>;
    contains?: Hash<EconomicResource>;
    trackingIdentifier: string;
    owner: Hash<agents.EconomicAgent>;
  }

  export function createResourceClassification(
    props: ResourceClassification
  ): Promise<CrudResponse<ResourceClassification>>;

  export function readResourceClasses(
    which: Hash<ResourceClassification>[]
  ): Promise<CrudResponse<ResourceClassification>[]>

  export function createResource(
    props: {
      resource: EconomicResource;
      event: {
        action: Hash<events.Action>;
        provider?: Hash<agents.Agent>;
        receiver?: Hash<agents.Agent>;
        scope?: any;
        start?: IntDate;
        duration?: IntDate;
      }
    }
  ): Promise<CrudResponse<EconomicResource>>

  export function readResources(
    which: Hash<EconomicResource>[]
  ): Promise<CrudResponse<EconomicResource>[]>

  export function getResourcesInClass(
    args: {classification: Hash<EconomicResource>}
  ): Promise<Hash<EconomicResource>[]>

  export function getAffectingEvents(
    args: {resource:Hash<EconomicResource>}
  ): Promise<Hash<events.EconomicEvent>[]>

  export function getFixtures(
    dontCare: object
  ): Promise<{
    ResourceClassification: {
      Thing: Hash<ResourceClassification>;
      Currency: Hash<ResourceClassification>;
      Work: Hash<ResourceClassification>;
    }
  }>
}

declare namespace events {
  export interface TransferClassification extends VfObject {
    name: string;
  }

  export interface Transfer extends VfObject {
    transferClassifiedAs: Hash<TransferClassification>;
    inputs: Hash<EconomicEvent>;
    outputs: Hash<EconomicEvent>;
  }

  export interface TransferInitializer extends VfObject {
    transferClassifiedAs: Hash<TransferClassification>;
    inputs: Hash<EconomicEvent> | EconomicEvent;
    outputs: Hash<EconomicEvent> | EconomicEvent;
  }

  export interface Action extends VfObject {
    name: string;
    behavior: '+'|'-'|'0';
  }

  export interface EconomicEvent extends VfObject {
    action: Hash<Action>;
    inputOf?: Hash<Transfer>;
    outputOf?: Hash<Transfer>;
    affects: Hash<resources.EconomicResource>;
    provider: Hash<agents.Agent>;
    receiver: Hash<agents.Agent>;
    affectedQuantity: QuantityValue;
    scope?: Hash<any>;
    start: IntDate;
    duration: IntDate;
  }

  export interface ProcessClassification extends VfObject {
    label: string;
  }

  export interface Process extends VfObject {
    processClassifiedAs: Hash<ProcessClassification>;
    isFinished: boolean;
    plannedStart: IntDate;
    plannedDuration: IntDate;
    inputs: Hash<EconomicEvent>[];
    outputs: Hash<EconomicEvent>[];
  }

  export interface Subtotals {
    totals: {
      [k: string]: QuantityValue;
    }
    events: {
      event: Hash<EconomicEvent>;
      subtotals: {
        [k: string]: QuantityValue;
      }
    }[]
    resources: Hash<resources.EconomicResource>[];
  }

  export interface TimeFilter {
    events: Hash<EconomicEvent>;
    when: IntDate;
  }

  export var createTransferClass: ZomeFn<
    TransferClassification,
    CrudResponse<TransferClassification>
  >

  export function readTransferClasses(
    which: Hash<TransferClassification>[]
  ): Promise<CrudResponse<TransferClassification>[]>

  export function createTransfer(
    props: Transfer | TransferInitializer
  ): Promise<CrudResponse<Transfer>>

  export function readTransfers(
    which: Hash<Transfer>[]
  ): Promise<CrudResponse<Transfer>[]>

  export function createProcessClass(
    props: ProcessClassification
  ): Promise<CrudResponse<ProcessClassification>>

  export function readProcessClasses(
    which: Hash<ProcessClassification>[]
  ): Promise<CrudResponse<ProcessClassification>[]>

  export function createProcess(
    props: Process
  ): Promise<CrudResponse<Process>>

  export function readProcesses(
    which: Hash<Process>[]
  ): Promise<CrudResponse<Process>[]>

  export function createAction(
    props: Action
  ): Promise<CrudResponse<Action>>

  export function readActions(
    which: Hash<Action>[]
  ): Promise<CrudResponse<Action>[]>

  export function createEvent(
    props: EconomicEvent
  ): Promise<CrudResponse<EconomicEvent>>

  export function readEvents(
    which: Hash<EconomicEvent>[]
  ): Promise<CrudResponse<EconomicEvent>[]>

  export function traceEvents(
    eventHashes: Hash<EconomicEvent>[]
  ): Promise<CrudResponse<Transfer>[]>

  export function trackEvents(
    eventHashes: Hash<EconomicEvent>[]
  ): Promise<CrudResponse<Transfer>[]>

  export function traceTransfers(
    hashes: Hash<Transfer>[]
  ): Promise<CrudResponse<EconomicEvent>[]>

  export function trackTransfers(
    hashes: Hash<Transfer>[]
  ): Promise<CrudResponse<EconomicEvent>[]>

  export function sortEvents(
    args: {
      events: Hash<EconomicEvent>[],
      by: "start"|"end",
      order: "up"|"down",
      start?: IntDate,
      end?: IntDate
    }
  ): Promise<CrudResponse<EconomicEvent>[]>

  export function eventsStartedBefore(
    when: TimeFilter
  ): Promise<CrudResponse<EconomicEvent>[]>

  export function eventsStartedAfter(
    when: TimeFilter
  ): Promise<CrudResponse<EconomicEvent>>

  export function eventsEndedBefore(
    when: TimeFilter
  ): Promise<CrudResponse<EconomicEvent>>

  export function eventsEndedAfter(
    when: TimeFilter
  ): Promise<CrudResponse<EconomicEvent>>

  export function eventSubtotals(
    events: Hash<EconomicEvent>[]
  ): Promise<Subtotals>

  export function resourceCreationEvent(
    args: {
      resource: resources.EconomicResource,
      dates?: {
        start: IntDate,
        end?: IntDate
      }
    }
  ): Promise<CrudResponse<EconomicEvent>>

  type Fixture<T, K extends string> = { [P in K]: Hash<T> };

  export function getFixtures(
    dontCare?: any
  ): Promise<{
    Action: Fixture<Action, "give"|"receive"|"adjust"|"produce"|"consume">;
    TransferClassification: Fixture<TransferClassification, "stub">;
    ProcessClassification: Fixture<ProcessClassification, "stub">;
  }>
}

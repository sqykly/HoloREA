
declare type Iterable<T extends string|number> = T[];

declare class Set<T extends string|number> {
  size: number;
  constructor(items?: Iterable<T>);
  add(item: T): this;
  has(item: T): boolean;
  delete(item: T): this;
  keys(): T[];
  values(): T[];
  forEach(cb: (t:T) => void, thisVal?: object): void;
}

declare class Map<K, T> {
  size: number;
  constructor(items?: [K, T][]);
  set(key: K, item: T): this;
  has(key: K): boolean;
  get(key: K): T;
  delete(key: K): this;
  keys(): K[];
  values(): T[];
  entries(): [K, T][];
  forEach(cb: (t:T, k:K) => void, thisVal?: object): void;
}

declare interface String {
  bold(): string;
  fixed(): string;
  italics(): string;
}

declare interface ObjectConstructor {
  assign<T,U>(t: T, u: U): T&U;
}

declare function shimmy(): void;

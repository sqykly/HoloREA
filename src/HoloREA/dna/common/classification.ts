
import { VfObject, Hash, deepAssign } from "common";
import { LinkRepo, Set } from "./LinkRepo";

const superClass: LinkRepo<
  Classification<VfObject>,
  Classification<VfObject>,
  "superClass"|"subClass"
> = new LinkRepo("ClassLinks");
const subClass = superClass;

superClass.linkBack(`superClass`, `subClass`);


interface ClassEntry {
  label: string;
  linkType: string;
}

class Classification<T extends VfObject, U = {}> extends VfObject<U & ClassEntry & typeof VfObject.entryType> {
  static className = "Classification";
  className = "Classification";
  static entryType: ClassEntry & typeof VfObject.entryType;
  static entryDefaults = deepAssign({}, VfObject.entryDefaults, <ClassEntry> {
      label: ``
    });

  classRepo: LinkRepo<T, Classification<T,U>, "classifies"|"classifiedAs">;
  private HASH: Hash<Classification<T,U>>;


  static get<T extends VfObject, U = {}>(hash: Hash<Classification<T,U>>): Classification<T, U> {
    return <Classification<T,U>> super.get(hash);
  }
  static create<T extends VfObject, U = {}>(entry: ClassEntry & typeof VfObject.entryType): Classification<T,U> {
    return <Classification<T,U>> super.create(entry);
  }
  protected constructor(entry?: U & ClassEntry & typeof VfObject.entryType, hash?: Hash<Classification<T,U>>) {
    super(entry, hash);
    this.initRepo();
  }
  private initRepo() {
    let cr = this.classRepo = new LinkRepo(this.myEntry.linkType);
    cr.linkBack(`classifiedAs`, `classifies`)
      .linkBack(`classifies`, `classifiedAs`);
  }

  classify(obj: T) {
    this.classRepo.put(obj.hash, this.hash, `classifiedAs`);
  }

  classifies(obj: T): boolean {
    let classes = this.classRepo.get(obj.hash, `classifiedAs`);
    let lineage = new Set(classes.hashes());
    let {myHash} = this;

    if (classes.some(({Hash: hash}) => hash === this.myHash)) {
      return true;
    } else {
      let subs = new Set<Hash<Classification<T,U>>>(classes.hashes());
      let sups = new Set<Hash<Classification<T,U>>>();

      do {
        for (let hash of subs.values()) {
          //*
          sups = sups.union(
            new Set(superClass.get(hash, `superClass`).hashes())
          ).disjunct(lineage);
          /*/
          superClass.get(hash, `superClass`).forEach(({Hash: hash}) => {
            if (!lineage.has(hash)) sups.add(hash);
            lineage.add(hash);
          });
          /**/
        }
        if (sups.has(myHash)) {
          return true;
        }
        subs = new Set(sups.values());
        sups.clear();
      } while (subs.size)
      return false;
    }
  }

  private _inherit(
    props: Partial<U & ClassEntry & typeof VfObject.entryType> = {},
    lock: Set<Hash<Classification<T,U>>> = new Set()
  ): [U & ClassEntry & typeof VfObject.entryType, Set<Hash<Classification<T,U>>>] {
    lock.add(this.myHash);
    let proto: typeof props = {};
    let sups =
      new Set<Hash<Classification<T,U>>>(
        superClass.get(this.myHash, `superClass`).hashes()
      ).disjunct(lock);

    lock = lock.union(sups);

    sups.forEach((hash) => {
      [proto, lock] = Classification.get<T,U>(hash)._inherit(proto, lock);
    });

    return [deepAssign(proto, this.myEntry, props), lock]
  }

  inherit(props: Partial<U & ClassEntry & typeof VfObject.entryType> = {}):
  U & ClassEntry & typeof VfObject.entryType {
    return this._inherit(props, new Set())[0];
  }

  private allClassHashes(lock: Set<Hash<Classification<T,U>>>):
  Set<Hash<Classification<T,U>>> {
    let all: typeof lock = new Set();
    lock.add(this.myHash);

    let sups: typeof lock = new Set(
      superClass.get(this.myHash, `superClass`).hashes()
    );

    sups = sups.disjunct(lock);
    lock = lock.union(sups);

    sups.forEach((hash) => {
      let supSup = Classification.get<T,U>(hash).allClassHashes(lock);
      all = all.union(supSup);
      lock = lock.union(supSup);
    });

    return all;
  }

  allSuperClasses(lock: Set<Hash<Classification<T,U>>> = new Set()):
  Classification<T,U>[] {
    return this.allClassHashes(lock).values().map(
      (hash) => Classification.get<T,U>(hash)
    );
  }

  private allSubClassHashes(lock: Set<Hash<Classification<T,U>>> = new Set()):
  typeof lock {
    let all: typeof lock = new Set();
    lock.add(this.myHash);

    let subs: typeof lock = new Set(subClass.get(this.myHash, `subClass`).hashes());
    subs = subs.disjunct(lock);
    all = all.union(subs);
    lock = lock.union(subs);

    subs.forEach((hash) => {
      let subSub: typeof lock = Classification.get<T,U>(hash).allSubClassHashes(lock);
      all = all.union(subSub);
      lock = lock.union(subSub);
    });

    return all;
  }

  allSubClasses(): Classification<T,U>[] {
    return this.allSubClassHashes().values().map(
      (hash) => Classification.get<T,U>(hash)
    );
  }

  directSuperClasses(): Classification<T,U>[] {
    return superClass.get(this.myHash, `superClass`).hashes().map(
      (hash) => Classification.get<T,U>(hash)
    );
  }

  directSubClasses(): Classification<T,U>[] {
    return subClass.get(this.myHash, `subClass`).hashes().map(
      (hash) => Classification.get<T,U>(hash)
    );
  }

  extend(sub: Classification<T,U>): void {
    sub.myEntry = deepAssign({}, this.myEntry, sub.myEntry);
    subClass.put(this.myHash, sub.myHash, `subClass`);
  }

  directInstances(): Set<Hash<T>> {
    return new Set(this.classRepo.get(this.myHash, `classifies`).hashes());
  }

  allInstances(): Set<Hash<T>> {
    let instances = this.directInstances();
    for (let sub of this.directSubClasses()) {
      instances = instances.union(sub.allInstances());
    }

    return instances;
  }

  remove(msg?: string): this {
    this.directSubClasses().forEach(sub => {
      subClass.remove(this.myHash, sub.hash, `subClass`);
    });
    this.directSuperClasses().forEach(sup => {
      superClass.remove(this.myHash, sup.hash, `superClass`);
    });
    this.directInstances().forEach(hash => {
      this.classRepo.remove(this.myHash, hash, `classifies`);
    });
    return super.remove();
  }
}

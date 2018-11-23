import * as path from "path";
import * as fs from "fs";
import * as console from "console";

type Key = string|number|symbol;

const PROJECT = path.resolve(`../..`);
const SRC_DNA = path.join(PROJECT, `/src/HoloREA/dna/`);
const BIN_DNA = path.join(PROJECT, `/bin/HoloREA/dna/`);
const STAGING = path.join(PROJECT, `/build/json/staging/`)

console.log(`Started ref inliner`);

type ArgTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

function p<T>(fn: (a:(err, ...args: T extends never ? never : [T])=>void)=>void, t?: T): Promise<[T]> {
  return new Promise<[T]>((resolve, reject) => {
    function a(err, ...more: [T]) {
      if (err) {
        reject(err);
      } else {
        resolve(more);
      }
    }
    try {
      fn(a);
    } catch (e) {
      console.log(`problem calling function ${fn}: ${e}`);
    }
  });
}

function fail(prefix:string) {
  return (e) => {
    let msg = `FAIL ${prefix}: ${e}`;
    console.log(msg);
    throw new Error(msg);
  }
}

// There should be 4 folders in here with all the schemas.  Collect them in a
// path-keyed map to the objects themselves

const pathToObj: Map<string, object> = new Map();


function main() {
  console.log(`running main`);

  p<string[]>((cb) => fs.readdir(SRC_DNA, `utf8`, cb))
  .then(([files]) => [SRC_DNA, ...files])
  .then( function gatherJson([base, ...files]) {
  //fs.readdir(SRC_DNA, {encoding: `utf8`}, function gatherJson(err,files) {
    let mine = [];
    console.log(`gathering JSON from [${files}] in ${base}`);

    for (let file of files) {
      let full = path.join(base, file);
      let objPath = path.parse(full);
      let {dir, name, ext} = objPath;

      console.log(`checking file ${name}, extension ${ext}`);

      if (!ext) {
        console.log(`reading subdirectory ${name}`);
        mine.push(p<string[]>(a => fs.readdir(path.join(dir, name), `utf8`, a))
        .then(([files]) => [path.join(dir, name), ...files])
        .then(gatherJson, fail(`Reading subdirectory ${name}`)));
      } else if (ext === `.json` && name !== `tsconfig` && name !== `package`) {
        let stageDir = path.relative(SRC_DNA, full);
        console.log(`found JSON ${name}, maps to ${stageDir}`);

        mine.push(p<never>((a) => fs.copyFile(full, path.join(STAGING, stageDir), a))
        .then(() => {
          console.log(`copied ${name} to ${path.join(STAGING, stageDir)}.  Reading data.`)

          return p<Buffer>((a) => fs.readFile(path.join(STAGING, stageDir), a))
            .then(([data]) => {

              console.log(`parsing ${name} as JSON`);
              const str = data.toString(`utf8`);
              const json = JSON.parse(str);
              pathToObj.set(stageDir, json);
            }, fail(`Reading & parsing JSON file`));

        }, fail(`Copying JSON file`)));
      }

    }

    return Promise.all(mine);
  }, fail(`Reading files from source`)).then(() => {

    function deepAssign<T extends object, U extends object>(dest: T, src: U, ...more: object[]): T & U {
      for (let p of Object.keys(src)) {
        let v: U[keyof U];
        if (typeof src[p] == `object`) {
          if (src[p] instanceof Array) {
            dest[p] = mergeArrays(dest[p] || [], src[p]);
            continue;
          } else {
            v = deepAssign(dest[p] || {}, src[p]);
          }
        } else {
          v = src[p];
        }
        dest[p] = v;
      }

      if (more.length) {
        let [u, ...rest] = more;
        return deepAssign(<T&U>dest, u, ...rest);
      } else {
        return <T&U>dest;
      }
    }

    function mergeArrays<T>(a1: T|T[], a2: T|T[]): T[] {
      if (!a1) return [...<T[]>a2];
      if (!a2) return [...<T[]>a1];

      if (!(a1 instanceof Array)) { a1 = [a1] }
      if (!(a2 instanceof Array)) { a2 = [a2] }
      return a1.concat(a2);
    }

    function deepExtend<T extends object, U extends object>(dest: T, src: U, ...more: object[]): T&U {

      for (let key of Object.keys(src)) {

        if (dest.hasOwnProperty(key)) {
          let t = dest[key];
          let u = src[key];
          if (
            (typeof t === `object` && t instanceof Array) ||
            (typeof u === `object` && u instanceof Array)
          ) {
            console.log(`merging array property ${key}`);

            dest[key] = mergeArrays(t, u);

          } else if (typeof t === `object` && typeof u === `object`) {
            console.log(`deep extending property ${key}`)
            let vt: object = t, vu: object = u;
            dest[key] = deepExtend(vt, vu);

          }
        } else if (typeof src[key] === `object`) {
          console.log(`deep cloning super property ${key}`);
          dest[key] = deepAssign({}, src[key]);
        } else {
          console.log(`adding super property ${key}`);
          dest[key] = src[key];
        }
      }

      return <T&U> dest;
    }

    function prop(fname:string, val: any, ...keys: Key[]): boolean {

      let change = false;

      if (val && typeof val === `object`) {

        if (val instanceof Array) {
          const len = val.length;
          for (let i = 0; i < len; i++) {
            change = prop(fname, val[i], ...keys, i) || change;
          }
        } else if (val.$ref) {
          console.log(`(${fname}).${keys.join('.')} has a $ref to ${val.$ref}`);
          change = true;
          let {$ref} = val;
          if (!path.extname($ref)) $ref = `${$ref}.json`;
          prop(fname, replace(fname, $ref, pathToObj.get(fname), ...keys), ...keys);
        } else if (val.$extends) {
          let {$extends} = val;
          if (!path.extname($extends)) $extends = `${$extends}.json`;
          console.log(`(${fname}).${keys.join('.')} extends ${$extends}`);
          extend(fname, $extends, val, ...keys);
          return prop(fname, val, ...keys) || true;
        } else {
          for (let key of Object.keys(val)) {
            change = prop(fname, val[key], ...keys, key) || change;
          }
        }
      }
      return change;
    }

    function stripForImport(mapName: string): object {
      let obj: object;
      if (done.has(mapName)) {
        console.log(`stripping cached copy of finished ${mapName}`);
        obj = deepAssign({}, done.get(mapName));
      } else {
        obj = deepAssign({}, pathToObj.get(mapName));
      }

      console.log(`Stripping ${mapName} of unnecessary metadata`);

      function strip(obj: object): boolean {
        let foundImport = false;
        for (let key of Object.keys(obj)) {
          if (key === `$ref` || key === `$extends`) {
            console.log(`leaving ${key} alone in ${mapName}`);
            foundImport = true;
          } else if (/^\$/.test(key)) {
            console.log(`stripping ${key} from ${mapName}`);
            delete obj[key];
          } else if (typeof obj[key] === `object`) {
            foundImport = strip(obj[key]) || foundImport;
          }
        }
        return foundImport;
      }

      if (!strip(obj)) {
        stripped.set(mapName, obj);
        console.log(`cached stripped ${mapName}`);
      }

      return obj;
    }

    let done: Map<string, object> = new Map();
    let stripped: Map<string, object> = new Map();
    let changed: Map<string, object> = new Map();

    function replace(inFile: string, fromFile: string, obj: object, ...keys: Key[]): object {

      const inDir = path.dirname(inFile);
      const fromDir = path.dirname(fromFile);
      const mapPath = path.join(inDir, fromFile);

      console.log(`Replacing $ref in (${inFile}).${keys.join('.')} with ${mapPath}`);

      let it: object;
      if (!stripped.has(mapPath)) {
        it = stripForImport(mapPath);
      } else {
        it = stripped.get(mapPath);
      }

      const lastKey = keys.pop();
      const target = keys.reduce(((obj, key) => obj[key]), obj);
      target[lastKey] = it;

      return it;
    }


    function extend(inFile: string, fromFile: string, obj: {$extends: string}, ...keys: Key[]): object {
      const mapKey = path.join(path.dirname(inFile), fromFile);
      console.log(`(${inFile}).${keys.join('.')} inherits from ${mapKey}`);

      delete obj.$extends;

      let src: object;
      if (!stripped.has(mapKey)) {
        src = stripForImport(mapKey);
      } else {
        console.log(`using cached ${mapKey}`);
        src = stripped.get(mapKey);
      }

      return deepExtend(obj, src);

    }

    pathToObj.forEach((json, fname) => {
      console.log(`working on ${fname}`);
      if (prop(fname, json)) {
        changed.set(fname, json);
      }
      done.set(fname, json);
    });

    let finished = [];

    changed.forEach((obj: object, fname: string) => {
      let json = JSON.stringify(obj);
      finished.push(p<never>((a) =>
        fs.writeFile(
          path.join(BIN_DNA, fname), json, {encoding: `utf8`}, a
        )
      ).catch((e) => {
        let msg = `problem writing files: ${e}`
        console.log(msg);
        throw new Error(msg);
      }));
    });

    return Promise.all(finished);
  }).then(() => {
    console.log(`inlining complete`);
  }, (e) => {
    console.log(`something went wrong: ${e}`);
  });
}

main();

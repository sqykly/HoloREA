"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const console = __importStar(require("console"));
const PROJECT = path.resolve(`../..`);
const SRC_DNA = path.join(PROJECT, `/src/HoloREA/dna/`);
const BIN_DNA = path.join(PROJECT, `/bin/HoloREA/dna/`);
const STAGING = path.join(PROJECT, `/build/json/staging/`);
console.log(`Started ref inliner`);
function p(fn, t) {
    return new Promise((resolve, reject) => {
        function a(err, ...more) {
            if (err) {
                reject(err);
            }
            else {
                resolve(more);
            }
        }
        try {
            fn(a);
        }
        catch (e) {
            console.log(`problem calling function ${fn}: ${e}`);
        }
    });
}
function fail(prefix) {
    return (e) => {
        let msg = `FAIL ${prefix}: ${e}`;
        console.log(msg);
        throw new Error(msg);
    };
}
// There should be 4 folders in here with all the schemas.  Collect them in a
// path-keyed map to the objects themselves
const pathToObj = new Map();
function main() {
    console.log(`running main`);
    p((cb) => fs.readdir(SRC_DNA, `utf8`, cb))
        .then(([files]) => [SRC_DNA, ...files])
        .then(function gatherJson([base, ...files]) {
        //fs.readdir(SRC_DNA, {encoding: `utf8`}, function gatherJson(err,files) {
        let mine = [];
        console.log(`gathering JSON from [${files}] in ${base}`);
        for (let file of files) {
            let full = path.join(base, file);
            let objPath = path.parse(full);
            let { dir, name, ext } = objPath;
            console.log(`checking file ${name}, extension ${ext}`);
            if (!ext) {
                console.log(`reading subdirectory ${name}`);
                mine.push(p(a => fs.readdir(path.join(dir, name), `utf8`, a))
                    .then(([files]) => [path.join(dir, name), ...files])
                    .then(gatherJson, fail(`Reading subdirectory ${name}`)));
            }
            else if (ext === `.json` && name !== `tsconfig` && name !== `package`) {
                let stageDir = path.relative(SRC_DNA, full);
                console.log(`found JSON ${name}, maps to ${stageDir}`);
                mine.push(p((a) => fs.copyFile(full, path.join(STAGING, stageDir), a))
                    .then(() => {
                    console.log(`copied ${name} to ${path.join(STAGING, stageDir)}.  Reading data.`);
                    return p((a) => fs.readFile(path.join(STAGING, stageDir), a))
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
        function deepAssign(dest, src, ...more) {
            for (let p of Object.keys(src)) {
                let v;
                if (typeof src[p] == `object`) {
                    v = deepAssign(dest[p] || {}, src[p]);
                }
                else {
                    v = src[p];
                }
                dest[p] = v;
            }
            if (more.length) {
                let [u, ...rest] = more;
                return deepAssign(dest, u, ...rest);
            }
            else {
                return dest;
            }
        }
        function prop(fname, val, ...keys) {
            let change = false;
            if (val && typeof val === `object`) {
                if (val instanceof Array) {
                    const len = val.length;
                    for (let i = 0; i < len; i++) {
                        change = prop(fname, val[i], ...keys, i) || change;
                    }
                }
                else if (val.$ref) {
                    console.log(`(${fname}).${keys.join('.')} has a $ref to ${val.$ref}`);
                    change = true;
                    let { $ref } = val;
                    if (!path.extname($ref))
                        $ref = `${$ref}.json`;
                    prop(fname, replace(fname, $ref, pathToObj.get(fname), ...keys), ...keys);
                }
                else {
                    for (let key of Object.keys(val)) {
                        change = prop(fname, val[key], ...keys, key) || change;
                    }
                }
            }
            return change;
        }
        function stripForImport(mapName) {
            let obj;
            if (done.has(mapName)) {
                obj = deepAssign({}, done.get(mapName));
            }
            else {
                obj = deepAssign({}, pathToObj.get(mapName));
            }
            console.log(`Stripping ${mapName} of unnecessary metadata`);
            function strip(obj) {
                let foundImport = false;
                for (let key of Object.keys(obj)) {
                    if (key === `$ref`) {
                        console.log(`leaving $ref alone in ${mapName}`);
                        foundImport = true;
                    }
                    else if (/^\$/.test(key)) {
                        console.log(`stripping ${key} from ${mapName}`);
                        delete obj[key];
                    }
                    else if (typeof obj[key] === `object`) {
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
        let done = new Map();
        let stripped = new Map();
        let changed = new Map();
        function replace(inFile, fromFile, obj, ...keys) {
            const inDir = path.dirname(inFile);
            const fromDir = path.dirname(fromFile);
            const mapPath = path.join(inDir, fromFile);
            console.log(`Replacing $ref in (${inFile}).${keys.join('.')} with ${mapPath}`);
            let it;
            if (!stripped.has(mapPath)) {
                it = stripForImport(mapPath);
            }
            else {
                it = stripped.get(mapPath);
            }
            const lastKey = keys.pop();
            const target = keys.reduce(((obj, key) => obj[key]), obj);
            target[lastKey] = it;
            return it;
        }
        pathToObj.forEach((json, fname) => {
            console.log(`working on ${fname}`);
            if (prop(fname, json)) {
                changed.set(fname, json);
            }
            done.set(fname, json);
        });
        let finished = [];
        changed.forEach((obj, fname) => {
            let json = JSON.stringify(obj);
            finished.push(p((a) => fs.writeFile(path.join(BIN_DNA, fname), json, { encoding: `utf8` }, a)).catch((e) => {
                let msg = `problem writing files: ${e}`;
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
exports.main = main;
main();

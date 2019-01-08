"use strict";
exports.__esModule = true;
var path = require("path");
var fs = require("fs");
var console = require("console");
var PROJECT = path.resolve("../..");
var SRC_DNA = path.join(PROJECT, "/src/HoloREA/dna/");
var BIN_DNA = path.join(PROJECT, "/bin/HoloREA/dna/");
var STAGING = path.join(PROJECT, "/build/json/staging/");
console.log("Started ref inliner");
function p(fn, t) {
    return new Promise(function (resolve, reject) {
        function a(err) {
            var more = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                more[_i - 1] = arguments[_i];
            }
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
            console.log("problem calling function " + fn + ": " + e);
        }
    });
}
function fail(prefix) {
    return function (e) {
        var msg = "FAIL " + prefix + ": " + e;
        console.log(msg);
        throw new Error(msg);
    };
}
// There should be 4 folders in here with all the schemas.  Collect them in a
// path-keyed map to the objects themselves
var pathToObj = new Map();
function main() {
    console.log("running main");
    p(function (cb) { return fs.readdir(SRC_DNA, "utf8", cb); })
        .then(function (_a) {
        var files = _a[0];
        return [SRC_DNA].concat(files);
    })
        .then(function gatherJson(_a) {
        var base = _a[0], files = _a.slice(1);
        //fs.readdir(SRC_DNA, {encoding: `utf8`}, function gatherJson(err,files) {
        var mine = [];
        console.log("gathering JSON from [" + files + "] in " + base);
        var _loop_1 = function (file) {
            var full = path.join(base, file);
            var objPath = path.parse(full);
            var dir = objPath.dir, name_1 = objPath.name, ext = objPath.ext;
            console.log("checking file " + name_1 + ", extension " + ext);
            if (!ext) {
                console.log("reading subdirectory " + name_1);
                mine.push(p(function (a) { return fs.readdir(path.join(dir, name_1), "utf8", a); })
                    .then(function (_a) {
                    var files = _a[0];
                    return [path.join(dir, name_1)].concat(files);
                })
                    .then(gatherJson, fail("Reading subdirectory " + name_1)));
            }
            else if (ext === ".json" && name_1 !== "tsconfig" && name_1 !== "package") {
                var stageDir_1 = path.relative(SRC_DNA, full);
                console.log("found JSON " + name_1 + ", maps to " + stageDir_1);
                mine.push(p(function (a) { return fs.copyFile(full, path.join(STAGING, stageDir_1), a); })
                    .then(function () {
                    console.log("copied " + name_1 + " to " + path.join(STAGING, stageDir_1) + ".  Reading data.");
                    return p(function (a) { return fs.readFile(path.join(STAGING, stageDir_1), a); })
                        .then(function (_a) {
                        var data = _a[0];
                        console.log("parsing " + name_1 + " as JSON");
                        var str = data.toString("utf8");
                        var json = JSON.parse(str);
                        pathToObj.set(stageDir_1, json);
                    }, fail("Reading & parsing JSON file"));
                }, fail("Copying JSON file")));
            }
        };
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            _loop_1(file);
        }
        return Promise.all(mine);
    }, fail("Reading files from source")).then(function () {
        function deepAssign(dest, src) {
            var more = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                more[_i - 2] = arguments[_i];
            }
            for (var _a = 0, _b = Object.keys(src); _a < _b.length; _a++) {
                var p_1 = _b[_a];
                var v = void 0;
                if (typeof src[p_1] == "object") {
                    if (src[p_1] instanceof Array) {
                        dest[p_1] = mergeArrays(dest[p_1] || [], src[p_1]);
                        continue;
                    }
                    else {
                        v = deepAssign(dest[p_1] || {}, src[p_1]);
                    }
                }
                else {
                    v = src[p_1];
                }
                dest[p_1] = v;
            }
            if (more.length) {
                var u = more[0], rest = more.slice(1);
                return deepAssign.apply(void 0, [dest, u].concat(rest));
            }
            else {
                return dest;
            }
        }
        function mergeArrays(a1, a2) {
            if (!a1)
                return a2.slice();
            if (!a2)
                return a1.slice();
            if (!(a1 instanceof Array)) {
                a1 = [a1];
            }
            if (!(a2 instanceof Array)) {
                a2 = [a2];
            }
            return a1.concat(a2);
        }
        function deepExtend(dest, src) {
            var more = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                more[_i - 2] = arguments[_i];
            }
            for (var _a = 0, _b = Object.keys(src); _a < _b.length; _a++) {
                var key = _b[_a];
                if (dest.hasOwnProperty(key)) {
                    var t = dest[key];
                    var u = src[key];
                    if ((typeof t === "object" && t instanceof Array) ||
                        (typeof u === "object" && u instanceof Array)) {
                        console.log("merging array property " + key);
                        dest[key] = mergeArrays(t, u);
                    }
                    else if (typeof t === "object" && typeof u === "object") {
                        console.log("deep extending property " + key);
                        var vt = t, vu = u;
                        dest[key] = deepExtend(vt, vu);
                    }
                }
                else if (typeof src[key] === "object") {
                    console.log("deep cloning super property " + key);
                    dest[key] = deepAssign({}, src[key]);
                }
                else {
                    console.log("adding super property " + key);
                    dest[key] = src[key];
                }
            }
            return dest;
        }
        function prop(fname, val) {
            var keys = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                keys[_i - 2] = arguments[_i];
            }
            var change = false;
            if (val && typeof val === "object") {
                if (val instanceof Array) {
                    var len = val.length;
                    for (var i = 0; i < len; i++) {
                        change = prop.apply(void 0, [fname, val[i]].concat(keys, [i])) || change;
                    }
                }
                else if (val.$ref) {
                    console.log("(" + fname + ")." + keys.join('.') + " has a $ref to " + val.$ref);
                    change = true;
                    var $ref = val.$ref;
                    if (!path.extname($ref))
                        $ref = $ref + ".json";
                    prop.apply(void 0, [fname, replace.apply(void 0, [fname, $ref, pathToObj.get(fname)].concat(keys))].concat(keys));
                }
                else if (val.$extends) {
                    var $extends = val.$extends;
                    if (!path.extname($extends))
                        $extends = $extends + ".json";
                    console.log("(" + fname + ")." + keys.join('.') + " extends " + $extends);
                    extend.apply(void 0, [fname, $extends, val].concat(keys));
                    return prop.apply(void 0, [fname, val].concat(keys)) || true;
                }
                else {
                    for (var _a = 0, _b = Object.keys(val); _a < _b.length; _a++) {
                        var key = _b[_a];
                        change = prop.apply(void 0, [fname, val[key]].concat(keys, [key])) || change;
                    }
                }
            }
            return change;
        }
        function stripForImport(mapName) {
            var obj;
            if (done.has(mapName)) {
                console.log("stripping cached copy of finished " + mapName);
                obj = deepAssign({}, done.get(mapName));
            }
            else {
                obj = deepAssign({}, pathToObj.get(mapName));
            }
            console.log("Stripping " + mapName + " of unnecessary metadata");
            function strip(obj) {
                var foundImport = false;
                for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
                    var key = _a[_i];
                    if (key === "$ref" || key === "$extends") {
                        console.log("leaving " + key + " alone in " + mapName);
                        foundImport = true;
                    }
                    else if (/^\$/.test(key)) {
                        console.log("stripping " + key + " from " + mapName);
                        delete obj[key];
                    }
                    else if (typeof obj[key] === "object") {
                        foundImport = strip(obj[key]) || foundImport;
                    }
                }
                return foundImport;
            }
            if (!strip(obj)) {
                stripped.set(mapName, obj);
                console.log("cached stripped " + mapName);
            }
            return obj;
        }
        var done = new Map();
        var stripped = new Map();
        var changed = new Map();
        function replace(inFile, fromFile, obj) {
            var keys = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                keys[_i - 3] = arguments[_i];
            }
            var inDir = path.dirname(inFile);
            var fromDir = path.dirname(fromFile);
            var mapPath = path.join(inDir, fromFile);
            console.log("Replacing $ref in (" + inFile + ")." + keys.join('.') + " with " + mapPath);
            var it;
            if (!stripped.has(mapPath)) {
                it = stripForImport(mapPath);
            }
            else {
                it = stripped.get(mapPath);
            }
            var lastKey = keys.pop();
            var target = keys.reduce((function (obj, key) { return obj[key]; }), obj);
            target[lastKey] = it;
            return it;
        }
        function extend(inFile, fromFile, obj) {
            var keys = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                keys[_i - 3] = arguments[_i];
            }
            var mapKey = path.join(path.dirname(inFile), fromFile);
            console.log("(" + inFile + ")." + keys.join('.') + " inherits from " + mapKey);
            delete obj.$extends;
            var src;
            if (!stripped.has(mapKey)) {
                src = stripForImport(mapKey);
            }
            else {
                console.log("using cached " + mapKey);
                src = stripped.get(mapKey);
            }
            return deepExtend(obj, src);
        }
        pathToObj.forEach(function (json, fname) {
            console.log("working on " + fname);
            if (prop(fname, json)) {
                changed.set(fname, json);
            }
            done.set(fname, json);
        });
        var finished = [];
        changed.forEach(function (obj, fname) {
            var json = JSON.stringify(obj);
            finished.push(p(function (a) {
                return fs.writeFile(path.join(BIN_DNA, fname), json, { encoding: "utf8" }, a);
            })["catch"](function (e) {
                var msg = "problem writing files: " + e;
                console.log(msg);
                throw new Error(msg);
            }));
        });
        return Promise.all(finished);
    }).then(function () {
        console.log("inlining complete");
    }, function (e) {
        console.log("something went wrong: " + e);
    });
}
main();
